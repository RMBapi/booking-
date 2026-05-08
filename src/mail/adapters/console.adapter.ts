import { Injectable, Logger } from '@nestjs/common';
import { MailAdapter, SendEmailRequest } from '../mail.types';

/**
 * Dev adapter — logs the rendered email to stdout, sends nothing.
 * Selected when NODE_ENV !== 'production' OR MAIL_DRIVER=console.
 */
@Injectable()
export class ConsoleAdapter implements MailAdapter {
  readonly name = 'console';
  private readonly logger = new Logger('Mail:Console');

  async send(req: SendEmailRequest): Promise<void> {
    const acceptUrl = (req.payload as any).acceptUrl;
    this.logger.log(
      `[${req.template}] to=${req.to} subject="${req.rendered.subject}"` +
        (acceptUrl ? ` acceptUrl=${acceptUrl}` : ''),
    );
    // Verbose body dump on debug level so it doesn't drown normal logs.
    this.logger.debug?.(`Body:\n${req.rendered.text}`);
  }
}
