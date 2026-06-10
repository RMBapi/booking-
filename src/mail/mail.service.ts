import { Injectable } from '@nestjs/common';
import { MailDispatcher } from './mail.dispatcher';
import {
  InvitationEmailProps,
  PasswordResetEmailProps,
  TicketReceivedEmailProps,
  TicketReplyEmailProps,
  WelcomeEmailProps,
} from './mail.types';
import { renderInvitationEmail } from './templates/invitation.template';
import { renderTicketReceivedEmail } from './templates/ticket-received.template';
import { renderTicketReplyEmail } from './templates/ticket-reply.template';

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

  /** Confirmation to the customer when a Contact-Us ticket is created. */
  sendTicketReceivedEmail(to: string, props: TicketReceivedEmailProps): void {
    const rendered = renderTicketReceivedEmail(props);
    this.dispatcher.enqueue({
      to,
      template: 'ticket_received',
      payload: {
        orgName: props.orgName,
        ticketNumber: props.ticketNumber,
        subject: props.subject,
      },
      rendered,
    });
  }

  /** Notify the customer that staff replied to their ticket. */
  sendTicketReplyEmail(to: string, props: TicketReplyEmailProps): void {
    const rendered = renderTicketReplyEmail(props);
    this.dispatcher.enqueue({
      to,
      template: 'ticket_reply',
      payload: {
        orgName: props.orgName,
        ticketNumber: props.ticketNumber,
        subject: props.subject,
        replierName: props.replierName,
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
