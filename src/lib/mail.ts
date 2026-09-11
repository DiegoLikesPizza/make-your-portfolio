import { appOrigin } from "@/lib/hosts";

/**
 * Outgoing mail: sign-in links and contact form notifications.
 *
 * Both are optional infrastructure. Without EMAIL_SERVER_HOST, sign-in links are
 * printed to the log in development (auth.config.ts) and contact messages are
 * only kept in the dashboard, which is where they are delivered either way.
 */

export const hasSmtp = Boolean(process.env.EMAIL_SERVER_HOST);

export const smtpServer = {
  host: process.env.EMAIL_SERVER_HOST ?? "localhost",
  port: Number(process.env.EMAIL_SERVER_PORT ?? 1025),
  auth: process.env.EMAIL_SERVER_USER
    ? { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD }
    : undefined,
};

export const mailFrom = process.env.EMAIL_FROM ?? "hello@example.localhost";

export async function sendMail(mail: { to: string; subject: string; text: string; replyTo?: string }) {
  const { createTransport } = await import("nodemailer");
  await createTransport(smtpServer).sendMail({ from: mailFrom, ...mail });
}

/**
 * Tell a site's owner a message arrived. Reply-To is the visitor, so answering
 * is just pressing Reply. Does nothing without SMTP.
 */
export async function notifyOwner({
  to, siteId, handle, name, email, message,
}: { to: string; siteId: string; handle: string; name: string; email: string; message: string }) {
  if (!hasSmtp) return;

  const inbox = `${appOrigin() ?? ""}/dashboard/${siteId}/messages`;
  await sendMail({
    to,
    replyTo: email,
    subject: `New message from ${name || email}`,
    text:
      `${name || "Someone"} (${email}) wrote through your portfolio, /u/${handle}:\n\n` +
      `${message}\n\n` +
      `Reply to this email to answer them. All your messages: ${inbox}`,
  });
}
