import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Simple in-memory rate-limiter for Next.js API route
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

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_TO || 'shouvikdaswork@gmail.com',
      subject: `[ANI Contact Form] ${subject || 'New Message'}`,
      text: `
You have received a new message from the Anime Nation India Contact Form.

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #ff4dd2;">New Message via Anime Nation India</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <h3 style="color: #333;">Message:</h3>
          <p style="white-space: pre-wrap; color: #555; line-height: 1.6;">${message}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Email sent successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    );
  }
}
