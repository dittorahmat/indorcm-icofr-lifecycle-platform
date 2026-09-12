import type { Settings } from '../../shared/types';
import { notifications, user as userTable, organization as orgTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function sendEmail({
  to,
  subject,
  html,
  settings,
  env,
}: {
  to: string;
  subject: string;
  html: string;
  settings?: Partial<Settings>;
  env: any;
}) {
  let transporter;

  const isCustomSmtp = settings?.emailProvider === 'smtp' && settings.smtpHost;

  if (isCustomSmtp) {
    console.log(`Sending email using custom SMTP for: ${to}`);
    const nodemailer = (await import('nodemailer')).default;
    transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: Number(settings.smtpPort) || 587,
      secure: Number(settings.smtpPort) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });
  } else {
    // Fallback: Check system env variables
    const systemHost = env.SYSTEM_SMTP_HOST;
    const systemPort = Number(env.SYSTEM_SMTP_PORT || 587);
    const systemUser = env.SYSTEM_SMTP_USER;
    const systemPass = env.SYSTEM_SMTP_PASS;

    if (systemHost && systemUser && systemPass) {
      console.log(`Sending email using system fallback SMTP for: ${to}`);
      const nodemailer = (await import('nodemailer')).default;
      transporter = nodemailer.createTransport({
        host: systemHost,
        port: systemPort,
        secure: systemPort === 465,
        auth: {
          user: systemUser,
          pass: systemPass,
        },
      });
    } else {
      // If no SMTP configured, log it (useful for local dev and testing)
      console.log('--- Mock Email Dispatch ---');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html}`);
      console.log('---------------------------');
      return { success: true, mock: true };
    }
  }

  const senderEmail = isCustomSmtp ? settings.senderEmail : (env.SYSTEM_SENDER_EMAIL || 'no-reply@indogrc.com');
  const senderName = isCustomSmtp ? settings.senderName : (env.SYSTEM_SENDER_NAME || 'IndoGRC Pro');

  const info = await transporter.sendMail({
    from: `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    html,
  });

  return { success: true, messageId: info.messageId };
}

export async function createNotificationAndSendEmail({
  db,
  orgId,
  userId,
  message,
  type = 'info',
  link,
  env,
}: {
  db: any;
  orgId: string;
  userId: string;
  message: string;
  type?: string;
  link?: string;
  env: any;
}) {
  const { notifyMultiChannel } = await import('./notifications');
  await notifyMultiChannel({
    db,
    orgId,
    userId,
    message,
    type,
    link,
    env,
  });

  return crypto.randomUUID();
}

