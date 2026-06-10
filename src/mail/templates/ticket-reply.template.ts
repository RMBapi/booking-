import { TicketReplyEmailProps, RenderedEmail } from '../mail.types';

/**
 * Email sent to the customer when CRM staff (or a super admin) replies to a
 * support ticket. The customer can reply to continue the conversation.
 */
export function renderTicketReplyEmail(
  props: TicketReplyEmailProps,
): RenderedEmail {
  const { orgName, ticketNumber, subject, replierName, message } = props;
  const ref = `#${ticketNumber}`;

  const emailSubject = `[${ref}] Re: ${subject}`;

  const text =
    `${replierName} from ${orgName} replied to your ticket ${ref}.\n\n` +
    `${message}\n\n` +
    `Reply to this email to continue the conversation. ` +
    `Please keep ${ref} in the subject line.\n`;

  const html = `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;color:#222;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 16px">New reply to ticket ${escape(ref)}</h1>
  <p><strong>${escape(replierName)}</strong> from ${escape(orgName)} replied regarding <em>${escape(subject)}</em>:</p>
  <blockquote style="margin:16px 0;padding:12px 16px;background:#f5f5f5;border-radius:6px;white-space:pre-wrap">${escape(message)}</blockquote>
  <p style="font-size:13px;color:#666">Reply to this email to continue the conversation. Please keep <strong>${escape(ref)}</strong> in the subject line.</p>
</body></html>`;

  return { subject: emailSubject, html, text };
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
