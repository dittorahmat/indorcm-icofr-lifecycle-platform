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
  const id = crypto.randomUUID();
  
  // 1. Insert database record
  await db.insert(notifications).values({
    id,
    organizationId: orgId,
    userId,
    message,
    type: type as any,
    link,
    readStatus: false,
    createdAt: new Date(),
  });

  // 2. Query target user's email
  const users = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
  if (users.length > 0 && users[0].email) {
    const targetEmail = users[0].email;
    
    // 3. Query organization settings for SMTP
    const orgs = await db.select().from(orgTable).where(eq(orgTable.id, orgId)).limit(1);
    const settings = orgs.length > 0 ? ((orgs[0].metadata as any) || {}) : {};

    // 4. Send email asynchronously
    const emailPromise = sendEmail({
      to: targetEmail,
      subject: `IndoGRC Pro - ${type.toUpperCase()}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="margin-bottom: 20px;">
            <span style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: bold; border-radius: 20px; background-color: ${
              type === 'warning' ? '#fef3c7' : type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#e0f2fe'
            }; color: ${
              type === 'warning' ? '#b45309' : type === 'error' ? '#b91c1c' : type === 'success' ? '#15803d' : '#0369a1'
            }; text-transform: uppercase;">
              ${type}
            </span>
          </div>
          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">${message}</p>
          ${link ? `
            <div style="margin: 24px 0;">
              <a href="${env.BETTER_AUTH_URL || 'http://localhost:3000'}${link}" style="display: inline-block; padding: 10px 20px; color: #ffffff; background-color: #10b981; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Lihat di Platform</a>
            </div>
          ` : ''}
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">Email ini dikirim secara otomatis oleh sistem IndoGRC Pro. Harap tidak membalas email ini.</p>
        </div>
      `,
      settings,
      env,
    }).catch((err) => {
      console.error('Failed to send notification email asynchronously:', err);
    });

    if (env.eventContext?.waitUntil) {
      env.eventContext.waitUntil(emailPromise);
    }
  }

  return id;
}

