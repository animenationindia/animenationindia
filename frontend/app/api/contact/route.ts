
import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

const ipMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now > record.resetTime) {
    ipMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter: retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const rateCheck = checkRateLimit(clientIp, 5, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many contact form submissions. Please try again after ${rateCheck.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid field types provided.' },
        { status: 400 }
      );
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const supportDestination = process.env.SUPPORT_EMAIL || 'animenationindia.support@gmail.com';
    const emailSubject = subject?.trim() ? `[Support Desk] ${subject.trim()}` : `[Support Desk] New message from ${name.trim()}`;
    
    const formattedHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d12; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #ff2a5f33;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <h2 style="color: #ff2a5f; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">ANIME NATION INDIA</h2>
          <span style="background: rgba(255,42,95,0.15); color: #ff2a5f; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">SUPPORT DESK</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">You received a new inquiry from the website contact/feedback portal:</p>
        <div style="background: #16161e; padding: 16px; border-radius: 8px; border-left: 4px solid #ff2a5f; margin-bottom: 20px;">
          <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #e2e8f0;">Sender Name:</strong> <span style="color: #38bdf8;">${name.trim()}</span></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #e2e8f0;">Sender Email:</strong> <a href="mailto:${email.trim()}" style="color: #38bdf8; text-decoration: none;">${email.trim()}</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #e2e8f0;">Subject:</strong> <span style="color: #f1f5f9;">${subject?.trim() || 'General Inquiry'}</span></p>
        </div>
        <div style="background: #1a1a24; padding: 18px; border-radius: 8px; margin-bottom: 20px; line-height: 1.6; color: #f8fafc; font-size: 15px; white-space: pre-wrap;">
${message.trim()}
        </div>
        <div style="border-top: 1px solid #27273a; padding-top: 14px; font-size: 12px; color: #64748b;">
          💡 <em>Tip: You can simply click <strong>"Reply"</strong> in your Gmail client to reply directly to ${name.trim()} (${email.trim()}).</em>
        </div>
      </div>
    `;

    const { sendEmail } = await import('@/lib/email');
    const result = await sendEmail({
      to: supportDestination,
      subject: emailSubject,
      html: formattedHtml,
      text: `From: ${name} (${email})\nSubject: ${subject || 'General'}\n\nMessage:\n${message}`,
      fromName: `${name.trim()} via Anime Nation India`,
      replyTo: email.trim(),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to dispatch email to support desk.');
    }

    return NextResponse.json(
      { message: 'Message sent successfully to Anime Nation India Support!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending support email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
