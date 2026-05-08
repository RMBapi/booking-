import { InvitationEmailProps, RenderedEmail } from '../mail.types';

/**
 * Plain HTML invitation email.
 *
 * NOTE: spec calls for React Email components in src/mail/templates/. We're
 * shipping plain HTML for now to avoid the React Email build pipeline
 * (@react-email/components + tsx render setup). The render() function below
 * is a drop-in seam — when React Email is added later, only this file
 * changes. The MailService contract stays identical.
 */
export function renderInvitationEmail(
  props: InvitationEmailProps,
): RenderedEmail {
  const { businessName, inviterName, acceptUrl, expiresAt } = props;
  const expiresHuman = expiresAt.toUTCString();

  const subject = `${inviterName} invited you to join ${businessName}`;

  const text =
    `${inviterName} has invited you to join ${businessName} on Cuebites.\n\n` +
    `Accept the invitation: ${acceptUrl}\n\n` +
    `This invitation expires on ${expiresHuman}.\n` +
    `If you weren't expecting this, you can safely ignore the email.\n`;

  const html = `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;color:#222;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 16px">You've been invited to ${escape(businessName)}</h1>
  <p>${escape(inviterName)} invited you to join <strong>${escape(businessName)}</strong> on Cuebites.</p>
  <p style="margin:24px 0">
    <a href="${escape(acceptUrl)}"
       style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px">
      Accept invitation
    </a>
  </p>
  <p style="font-size:13px;color:#666">
    Or paste this link into your browser:<br>
    <code style="word-break:break-all">${escape(acceptUrl)}</code>
  </p>
  <p style="font-size:13px;color:#666">This invitation expires on ${escape(expiresHuman)}.</p>
  <p style="font-size:13px;color:#666">If you weren't expecting this, you can safely ignore the email.</p>
</body></html>`;

  return { subject, html, text };
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
