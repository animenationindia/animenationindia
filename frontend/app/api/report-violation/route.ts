
import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, violationCategory, targetUser, violationUrl, description } = body;

    if (!name || !email || !violationCategory || !description) {
      return NextResponse.json(
        { error: 'Name, email, category, and description are required.' },
        { status: 400 }
      );
    }

    const subject = `[Violation Report] ${violationCategory} - ${targetUser || 'User'}`;
    const message = `Category: ${violationCategory}\nTarget: ${targetUser || 'N/A'}\nLocation: ${violationUrl || 'N/A'}\n\nDetails:\n${description}`;

    // 1. Try forwarding to backend for MongoDB persistence & notification
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
        signal: AbortSignal.timeout(4000),
      });

      if (backendRes.ok) {
        return NextResponse.json(
          { message: 'Violation report submitted successfully.' },
          { status: 200 }
        );
      }
    } catch (backendErr) {
      console.warn('[Report] Backend unreachable, falling back to direct email dispatch:', backendErr);
    }

    // 2. Direct fallback using sendEmail (Google Webhook / SMTPS)
    const { sendEmail } = await import('@/lib/email');
    const supportDestination = process.env.SUPPORT_EMAIL || 'animenationindia.support@gmail.com';
    const formattedHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d12; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #ef444433;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <h2 style="color: #ef4444; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px;">ANIME NATION INDIA</h2>
          <span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">VIOLATION DESK</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 16px;">A user has submitted an official violation or compliance report:</p>
        <div style="background: #16161e; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
          <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #e2e8f0;">Reporter:</strong> <span style="color: #38bdf8;">${name.trim()}</span></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #e2e8f0;">Reporter Email:</strong> <a href="mailto:${email.trim()}" style="color: #38bdf8; text-decoration: none;">${email.trim()}</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #e2e8f0;">Category:</strong> <span style="color: #f1f5f9;">${violationCategory}</span></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #e2e8f0;">Target User:</strong> <span style="color: #f1f5f9;">${targetUser || 'N/A'}</span></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong style="color: #e2e8f0;">Violation URL:</strong> <a href="${violationUrl || '#'}" style="color: #38bdf8; text-decoration: none;">${violationUrl || 'N/A'}</a></p>
        </div>
        <div style="background: #1a1a24; padding: 18px; border-radius: 8px; margin-bottom: 20px; line-height: 1.6; color: #f8fafc; font-size: 15px; white-space: pre-wrap;">
${description.trim()}
        </div>
        <div style="border-top: 1px solid #27273a; padding-top: 14px; font-size: 12px; color: #64748b;">
          💡 <em>Tip: Click <strong>"Reply"</strong> to communicate directly with the reporter (${email.trim()}).</em>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: supportDestination,
      subject,
      html: formattedHtml,
      text: `From: ${name} (${email})\n${message}`,
      fromName: `${name.trim()} via Violation Desk`,
      replyTo: email.trim(),
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to dispatch violation report.');
    }

    return NextResponse.json(
      { message: 'Violation report submitted successfully.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit report. Please try again later.' },
      { status: 500 }
    );
  }
}
