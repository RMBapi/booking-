import { Logger, Module } from '@nestjs/common';
import { ConsoleAdapter } from './adapters/console.adapter';
import { ResendAdapter } from './adapters/resend.adapter';
import { MailDispatcher } from './mail.dispatcher';
import { MailService } from './mail.service';
import { MAIL_ADAPTER } from './mail.tokens';
import { MailAdapter } from './mail.types';

/**
 * Adapter selection rule:
 *   - MAIL_DRIVER=resend → ResendAdapter (requires RESEND_API_KEY)
 *   - MAIL_DRIVER=console → ConsoleAdapter
 *   - else, NODE_ENV !== 'production' → ConsoleAdapter
 *   - else (production, no driver set) → ConsoleAdapter (with warning)
 *
 * The ConsoleAdapter default in production is intentional — better to log
 * the email contents and a missing-driver warning than to crash a deploy
 * because someone forgot to set MAIL_DRIVER. Production deploys will see
 * the warning at boot and on every send.
 */
@Module({
  providers: [
    ConsoleAdapter,
    ResendAdapter,
    MailDispatcher,
    MailService,
    {
      provide: MAIL_ADAPTER,
      inject: [ConsoleAdapter, ResendAdapter],
      useFactory: (
        consoleAdapter: ConsoleAdapter,
        resendAdapter: ResendAdapter,
      ): MailAdapter => {
        const logger = new Logger('Mail');
        const driver = (process.env.MAIL_DRIVER ?? '').toLowerCase();
        const isProd = process.env.NODE_ENV === 'production';

        if (driver === 'resend') {
          if (!process.env.RESEND_API_KEY) {
            logger.warn(
              'MAIL_DRIVER=resend but RESEND_API_KEY is not set — falling back to console',
            );
            return consoleAdapter;
          }
          logger.log('Mail driver: resend');
          return resendAdapter;
        }
        if (driver === 'console') {
          logger.log('Mail driver: console (explicit)');
          return consoleAdapter;
        }
        if (isProd) {
          logger.warn(
            'NODE_ENV=production but MAIL_DRIVER not set — using console adapter (emails will not be delivered)',
          );
        } else {
          logger.log('Mail driver: console (dev default)');
        }
        return consoleAdapter;
      },
    },
  ],
  exports: [MailService],
})
export class MailModule {}
