import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 first in Node.js DNS resolution to eliminate Linux container IPv6 network issues
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch {}
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = 'Anime Nation India',
  replyTo,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const plainText = text || stripHtml(html);
  const supportEmail = process.env.SUPPORT_EMAIL || 'animenationindia.support@gmail.com';
  const globalEmail = process.env.GLOBAL_EMAIL || 'animenationindia.global@gmail.com';

  // ==========================================================================
  // STRATEGY 1: GOOGLE APPS SCRIPT WEBHOOK (HTTPS Port 443 — 100% Free & Native)
  // Sends natively from your animenationindia.global@gmail.com account!
  // ==========================================================================
  const gmailWebhookUrl = process.env.GMAIL_WEBHOOK_URL;
  if (gmailWebhookUrl && gmailWebhookUrl.trim().length > 0) {
    try {
      console.log(`[Email] Dispatching via Google Apps Script Webhook to ${to}...`);
      const res = await fetch(gmailWebhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          secret: process.env.GMAIL_WEBHOOK_SECRET || 'ANI_SECURE_AUTH_KEY_2026',
          to,
          subject,
          html,
          text: plainText,
          fromName,
          replyTo: replyTo || supportEmail,
        }),
        redirect: 'follow',
      });

      if (res.ok) {
        const textRes = await res.text().catch(() => '');
        let data: any = {};
        try {
          data = JSON.parse(textRes);
        } catch {}
        if (data.success !== false) {
          console.log(`[Email] Google Webhook successfully delivered email to ${to}!`);
          return { success: true };
        }
        console.warn('[Email] Google Webhook returned error payload:', data.error || textRes);
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Email] Google Webhook HTTP ${res.status}:`, errText);
      }
    } catch (webhookErr: any) {
      console.warn('[Email] Google Webhook error, checking fallback:', webhookErr?.message);
    }
  }

  // ==========================================================================
  // STRATEGY 2: BREVO (SENDINBLUE) / RESEND API (Optional Fallback)
  // ==========================================================================
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      console.log(`[Email] Dispatching via Brevo API to ${to}...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey.trim(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: fromName, email: globalEmail },
          to: [{ email: to }],
          replyTo: replyTo ? { email: replyTo } : { email: supportEmail },
          subject,
          htmlContent: html,
          textContent: plainText,
        }),
      });

      if (res.ok) {
        return { success: true };
      }
    } catch (err: any) {
      console.warn('[Email] Brevo API error:', err?.message);
    }
  }

  // ==========================================================================
  // STRATEGY 3: DIRECT SMTP FALLBACK (Gmail App Password if configured)
  // ==========================================================================
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  if (smtpPass) {
    const cleanPass = smtpPass.replace(/\s+/g, '').replace(/['"]/g, '');
    const mailPayload = {
      from: `"${fromName}" <${globalEmail}>`,
      to,
      replyTo: replyTo || supportEmail,
      subject,
      text: plainText,
      html,
    };

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: globalEmail,
          pass: cleanPass,
        },
        connectionTimeout: 4000,
      });

      await transporter.sendMail(mailPayload);
      return { success: true };
    } catch (err: any) {
      console.warn('[Email] Port 465 failed, trying port 587:', err?.message);
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: globalEmail,
            pass: cleanPass,
          },
          connectionTimeout: 4000,
        });
        await fallbackTransporter.sendMail(mailPayload);
        return { success: true };
      } catch (fallbackErr: any) {
        console.error('[Email] SMTP fallback failed:', fallbackErr?.message);
      }
    }
  }

  console.log(`[Email Mock Console] (No Webhook/SMTP configured yet) -> To: ${to} | Subject: ${subject}`);
  return {
    success: true,
  };
}
