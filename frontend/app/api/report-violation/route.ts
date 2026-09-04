export const runtime = 'edge';

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

    const backendRes = await fetch(`${BACKEND_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message }),
    });

    const data = await backendRes.json().catch(() => ({}));

    if (!backendRes.ok) {
      throw new Error(data.message || 'Failed to submit report via backend.');
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
