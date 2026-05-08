import { Injectable, Logger } from '@nestjs/common';
import { MailAdapter, SendEmailRequest } from '../mail.types';

/**
 * Resend adapter — calls the Resend HTTP API directly via fetch (no SDK
 * required). Selected when MAIL_DRIVER=resend AND RESEND_API_KEY is set.
 *
 * Free tier covers 3,000/month, sufficient for current scale.
 *
 * Throws on non-2xx; the caller (MailDispatcher) is responsible for retry
 * and dead-letter handling.
 */
@Injectable()
export class ResendAdapter implements MailAdapter {
  readonly name = 'resend';
  private readonly logger = new Logger('Mail:Resend');

  async send(req: SendEmailRequest): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required when MAIL_DRIVER=resend');
    }

    const from =
      process.env.MAIL_FROM ??
      'Cuebites <noreply@notifications.cuebites.com.au>';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [req.to],
        subject: req.rendered.subject,
        html: req.rendered.html,
        text: req.rendered.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '<unreadable>');
      throw new Error(
        `Resend returned ${res.status} ${res.statusText}: ${body.slice(0, 500)}`,
      );
    }

    this.logger.log(`Sent ${req.template} to ${req.to} via Resend`);
  }
}
