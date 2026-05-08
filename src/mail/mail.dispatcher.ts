import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { MailAdapter, SendEmailRequest } from './mail.types';
import { MAIL_ADAPTER } from './mail.tokens';

/**
 * MailDispatcher — fire-and-forget queue with in-memory retry + DB dead-letter.
 *
 * Contract for callers (e.g. InvitationService):
 *   - `enqueue(req)` returns synchronously after scheduling. NEVER blocks the
 *     HTTP request on adapter latency.
 *   - The dispatcher retries up to 3 times with exponential backoff
 *     (1s → 4s → 16s). On final failure, the email is persisted to
 *     `failed_emails` for manual inspection / replay.
 *
 * Limitation vs. spec: the spec calls for BullMQ + Redis. We do not yet have
 * BullMQ/Redis infra, so this implementation is in-process only — emails
 * scheduled in flight are lost on process restart. The seam (this class) is
 * the single swap point: replace `enqueue` with a BullMQ producer when
 * Redis is available, and the rest of the app needs no changes.
 *
 * Metrics: emits `emailsSentTotal` counter via the `getMetrics()` method.
 * Hook this into prom-client (or whatever metrics surface exists) at boot.
 */
@Injectable()
export class MailDispatcher {
  private readonly logger = new Logger('Mail:Dispatcher');

  // Simple in-memory metric counters keyed by `${template}|${status}`.
  private readonly counters = new Map<string, number>();

  private static readonly MAX_ATTEMPTS = 3;
  private static readonly BACKOFF_MS = [1000, 4000, 16000];

  constructor(
    @Inject(MAIL_ADAPTER) private readonly adapter: MailAdapter,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Schedule a send. Resolves immediately; the actual delivery happens on
   * the next event-loop tick. Errors after exhausting retries are caught
   * and persisted to failed_emails (never thrown to the caller).
   */
  enqueue(req: SendEmailRequest): void {
    // Schedule on next tick so the HTTP request can return without waiting.
    setImmediate(() => {
      this.processWithRetry(req).catch((err) => {
        // processWithRetry is supposed to swallow all errors; this catch is
        // defense in depth.
        this.logger.error(
          `unexpected error from processWithRetry: ${err instanceof Error ? err.message : err}`,
        );
      });
    });
  }

  /**
   * Synchronous send (used in tests) — resolves once the adapter has been
   * called and either succeeded or persisted a failed_emails row. NOT for
   * use from request handlers.
   */
  async sendNow(req: SendEmailRequest): Promise<void> {
    await this.processWithRetry(req);
  }

  getMetrics(): Array<{ template: string; status: string; count: number }> {
    return Array.from(this.counters.entries()).map(([key, count]) => {
      const [template, status] = key.split('|');
      return { template, status, count };
    });
  }

  private bump(
    template: string,
    status: 'sent' | 'failed' | 'dead_letter',
  ): void {
    const key = `${template}|${status}`;
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  private async processWithRetry(req: SendEmailRequest): Promise<void> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MailDispatcher.MAX_ATTEMPTS; attempt++) {
      try {
        await this.adapter.send(req);
        this.bump(req.template, 'sent');
        return;
      } catch (err) {
        lastErr = err;
        this.bump(req.template, 'failed');
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[attempt ${attempt}/${MailDispatcher.MAX_ATTEMPTS}] ` +
            `send failed via ${this.adapter.name} for ${req.to}: ${msg}`,
        );
        if (attempt < MailDispatcher.MAX_ATTEMPTS) {
          await sleep(MailDispatcher.BACKOFF_MS[attempt - 1]);
        }
      }
    }

    // Exhausted retries — write to dead-letter table.
    await this.persistFailure(req, lastErr).catch((err) => {
      // If even the DB write fails, log loudly. The email is lost; this is
      // intentional — we don't want to crash the service over an email.
      this.logger.error(
        `dead-letter persist FAILED for ${req.to}: ${err instanceof Error ? err.message : err}`,
      );
    });
  }

  private async persistFailure(
    req: SendEmailRequest,
    err: unknown,
  ): Promise<void> {
    const errorMessage: string =
      err instanceof Error ? err.message : err ? String(err) : 'unknown';
    await this.prisma.failedEmail.create({
      data: {
        toEmail: req.to,
        template: req.template,
        payload: req.payload as never,
        error: errorMessage.slice(0, 1000),
        attempts: MailDispatcher.MAX_ATTEMPTS,
      },
    });
    this.bump(req.template, 'dead_letter');
    this.logger.error(
      `dead-letter row written for ${req.template} to=${req.to}: ${errorMessage}`,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
