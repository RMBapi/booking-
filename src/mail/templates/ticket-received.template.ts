import { TicketReceivedEmailProps, RenderedEmail } from '../mail.types';

/**
 * Confirmation email sent to the customer the moment a Contact-Us ticket is
 * created. Mirrors the plain-HTML approach of invitation.template.ts.
 */
export function renderTicketReceivedEmail(
  props: TicketReceivedEmailProps,
): RenderedEmail {
  const { orgName, ticketNumber, subject, message } = props;
  const ref = `#${ticketNumber}`;

  const emailSubject = `[${ref}] We received your message: ${subject}`;

  const text =
    `Thanks for contacting ${orgName}.\n\n` +
    `We've created ticket ${ref} for your message and our team will get back ` +
    `to you soon.\n\n` +
    `Subject: ${subject}\n\n` +
    `Your message:\n${message}\n\n` +
    `Please keep ${ref} in the subject line when replying.\n`;

  const html = `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;color:#222;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 16px">Thanks for contacting ${escape(orgName)}</h1>
  <p>We've created ticket <strong>${escape(ref)}</strong> for your message. Our team will get back to you soon.</p>
  <p style="margin:16px 0 4px;font-size:13px;color:#666">Subject</p>
  <p style="margin:0 0 16px"><strong>${escape(subject)}</strong></p>
  <p style="margin:16px 0 4px;font-size:13px;color:#666">Your message</p>
  <blockquote style="margin:0;padding:12px 16px;background:#f5f5f5;border-radius:6px;white-space:pre-wrap">${escape(message)}</blockquote>
  <p style="font-size:13px;color:#666;margin-top:24px">Please keep <strong>${escape(ref)}</strong> in the subject line when replying so we can match your message to this ticket.</p>
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
