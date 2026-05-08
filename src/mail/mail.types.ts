/**
 * Mail subsystem types — kept in a side-effect-free file so any module can
 * import them without pulling the full mail module wiring.
 */

export interface InvitationEmailProps {
  businessName: string;
  inviterName: string;
  acceptUrl: string;
  expiresAt: Date;
}

export interface PasswordResetEmailProps {
  resetUrl: string;
  expiresAt: Date;
}

export interface WelcomeEmailProps {
  firstName: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export type MailTemplate = 'invitation' | 'password_reset' | 'welcome';

export interface SendEmailRequest {
  to: string;
  template: MailTemplate;
  /** Template-specific render context. Stored verbatim in failed_emails on dead-letter. */
  payload: Record<string, unknown>;
  rendered: RenderedEmail;
}

/**
 * Adapter contract — implemented by ResendAdapter (production) and
 * ConsoleAdapter (dev). Selected via MAIL_DRIVER env or NODE_ENV.
 */
export interface MailAdapter {
  readonly name: string;
  send(req: SendEmailRequest): Promise<void>;
}
