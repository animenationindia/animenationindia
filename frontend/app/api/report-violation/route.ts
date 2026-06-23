import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, // Sends via the authenticated Google account
      replyTo: email, // Reply to the reporter
      to: process.env.EMAIL_TO || 'shouvikdaswork@gmail.com',
      subject: `[ANI Violation Report] ${violationCategory} - Target: ${targetUser || 'N/A'}`,
      text: `
You have received a new community violation report.

--- REPORTER DETAILS ---
Name: ${name}
Email: ${email}

--- VIOLATION DETAILS ---
Category: ${violationCategory}
Target Username/User: ${targetUser || 'Not Specified'}
Location URL/Episode: ${violationUrl || 'Not Specified'}

--- DESCRIPTION & EVIDENCE ---
${description}
      `,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0d21; color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #ef4444;">
          <h2 style="color: #ef4444; text-transform: uppercase; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-top: 0;">
            Community Violation Report
          </h2>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #a0a0a0; margin-bottom: 5px;">Reporter Details</h3>
            <p style="margin: 0; font-size: 14px;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #ff4dd2; text-decoration: none;">${email}</a></p>
          </div>

          <div style="margin: 20px 0; background-color: #121326; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
            <h3 style="color: #ffffff; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Violation Context</h3>
            <p style="margin: 5px 0; font-size: 14px; color: #d1d5db;"><strong>Category:</strong> ${violationCategory}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #d1d5db;"><strong>Target Username:</strong> ${targetUser || 'Not Specified'}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #d1d5db;"><strong>Location URL:</strong> ${violationUrl ? `<a href="${violationUrl}" style="color: #ff4dd2; text-decoration: none;" target="_blank">${violationUrl}</a>` : 'Not Specified'}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #a0a0a0; margin-bottom: 5px;">Description & Evidence</h3>
            <div style="background-color: #121326; padding: 15px; border-radius: 8px; font-size: 14px; color: #e5e7eb; line-height: 1.6; white-space: pre-wrap;">${description}</div>
          </div>
          
          <hr style="border: none; border-top: 1px solid #2a2b42; margin: 25px 0;" />
          <p style="font-size: 11px; color: #6b7280; text-align: center; margin: 0;">
            This report was submitted securely via the Anime Nation India Safety Hub.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Violation report submitted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending violation report email:', error);
    return NextResponse.json(
      { error: 'Failed to submit report. Please try again later.' },
      { status: 500 }
    );
  }
}
