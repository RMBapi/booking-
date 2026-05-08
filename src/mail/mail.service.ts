import { Injectable } from '@nestjs/common';
import { MailDispatcher } from './mail.dispatcher';
import {
  InvitationEmailProps,
  PasswordResetEmailProps,
  WelcomeEmailProps,
} from './mail.types';
import { renderInvitationEmail } from './templates/invitation.template';

/**
 * Public API consumed by feature modules (e.g. InvitationService).
 *
 * Each method renders the template, then hands the request to MailDispatcher
 * which fire-and-forgets with retry + dead-letter. Callers do NOT await
 * delivery — methods return synchronously after enqueueing.
 */
@Injectable()
export class MailService {
  constructor(private readonly dispatcher: MailDispatcher) {}

  sendInvitationEmail(to: string, props: InvitationEmailProps): void {
    const rendered = renderInvitationEmail(props);
    this.dispatcher.enqueue({
      to,
      template: 'invitation',
      payload: {
        businessName: props.businessName,
        inviterName: props.inviterName,
        acceptUrl: props.acceptUrl,
        expiresAt: props.expiresAt.toISOString(),
      },
      rendered,
    });
  }

  sendPasswordResetEmail(_to: string, _props: PasswordResetEmailProps): void {
    // Template not yet implemented; throw so callers can't silently no-op.
    throw new Error('password_reset template not yet implemented');
  }

  sendWelcomeEmail(_to: string, _props: WelcomeEmailProps): void {
    throw new Error('welcome template not yet implemented');
  }
}
