
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

    const backendRes = await fetch(`${BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      throw new Error(data.message || 'Failed to send message via backend.');
    }

    return NextResponse.json(
      { message: 'Email sent successfully!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email. Please try again later.' },
      { status: 500 }
    );
  }
}
