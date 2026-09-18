'use server';

import { db } from '@/lib/db';
import { verification, user, account, session, catalogs, userTwoFactor } from '@/lib/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { getOtpEmailTemplate, getSecurityAlertEmailTemplate } from '@/lib/email-templates';
import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { auth } from '@/lib/auth';

async function setSessionCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set('better-auth.session_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    cookieStore.set('ani_session_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  } catch (e) {
    // Ignore if called outside request context
  }
}

export async function resolveAuthUser() {
  try {
    const sessionRes = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    if (sessionRes?.user?.id) {
      return sessionRes.user;
    }
  } catch (e) {}

  try {
    const cookieStore = await cookies();
    const rawCookie =
      cookieStore.get('better-auth.session_token')?.value ||
      cookieStore.get('ani_session_token')?.value;

    if (rawCookie) {
      const token = rawCookie.split('.')[0];
      const sess = await db
        .select()
        .from(session)
        .where(
          and(
            eq(session.token, token),
            gt(session.expiresAt, new Date())
          )
        )
        .limit(1);

      if (sess.length > 0) {
        const u = await db.select().from(user).where(eq(user.id, sess[0].userId)).limit(1);
        if (u.length > 0) {
          return {
            id: u[0].id,
            name: u[0].name,
            email: u[0].email,
            image: u[0].image,
            role: u[0].role || 'user',
            emailVerified: u[0].emailVerified,
            createdAt: u[0].createdAt,
          };
        }
      }
    }
  } catch (e) {}

  return null;
}

const ADMIN_EMAILS = [
  'shouvikdaswork@gmail.com',
  'animenationindia.global@gmail.com',
  'animenationindia.support@gmail.com',
];

function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function sendOtpEmail({
  email,
  type = 'verification',
  userName = 'Otaku',
}: {
  email: string;
  type?: 'verification' | 'reset' | '2fa' | 'delete';
  userName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
    const identifier = `${type}:${cleanEmail}`;

    // Clean any previous OTP for this identifier & auto-purge expired tokens
    await db.delete(verification).where(eq(verification.identifier, identifier));
    await db.delete(verification).where(lt(verification.expiresAt, new Date()));

    // Store new OTP in verification table
    await db.insert(verification).values({
      id: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      identifier,
      value: otp,
      expiresAt,
    });

    // Prepare email HTML template
    const tmpl = getOtpEmailTemplate({
      otp,
      type,
      userName,
    });

    // Dispatch email via Google Apps Script Webhook
    const res = await sendEmail({
      to: cleanEmail,
      subject: tmpl.subject,
      html: tmpl.html,
      fromName: 'Anime Nation India',
      replyTo: 'animenationindia.support@gmail.com',
    });

    return { success: res.success, error: res.error };
  } catch (err: any) {
    console.error('Error sending OTP:', err);
    return { success: false, error: err.message };
  }
}

export async function verifyOtpCode({
  email,
  code,
  type = 'verification',
}: {
  email: string;
  code: string;
  type?: 'verification' | 'reset' | '2fa' | 'delete';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const identifier = `${type}:${cleanEmail}`;

    const records = await db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.identifier, identifier),
          eq(verification.value, cleanCode),
          gt(verification.expiresAt, new Date())
        )
      )
      .limit(1);

    if (records.length === 0) {
      return { success: false, error: 'Invalid or expired OTP code. Please request a new one.' };
    }

    // Delete used OTP
    await db.delete(verification).where(eq(verification.id, records[0].id));

    // If type is verification, mark emailVerified as true
    if (type === 'verification') {
      await db
        .update(user)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(user.email, cleanEmail));
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error verifying OTP code:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 🚀 SIGN UP FLOW: 1. Request OTP -> 2. Verify OTP & Create Account
// =========================================================================

export async function requestSignupOtp({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      return { success: false, error: 'An account with this email already exists. Please Sign In.' };
    }

    return await sendOtpEmail({
      email: cleanEmail,
      type: 'verification',
      userName: name.trim() || 'Otaku',
    });
  } catch (err: any) {
    console.error('Error requesting signup OTP:', err);
    return { success: false, error: err.message };
  }
}

export async function verifySignupOtpAndCreateUser({
  name,
  email,
  password,
  avatar,
  code,
}: {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  code: string;
}): Promise<{ success: boolean; error?: string; user?: any; token?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    // 1. Verify OTP code
    const otpRes = await verifyOtpCode({
      email: cleanEmail,
      code,
      type: 'verification',
    });

    if (!otpRes.success) {
      return otpRes;
    }

    // 2. Check if user already exists
    const existing = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      return { success: false, error: 'Account already created. Please sign in.' };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const role = ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'user';

    // 3. Create User in Neon DB
    await db.insert(user).values({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      emailVerified: true,
      image: avatar || null,
      role,
    });

    // 4. Create Account record with hashed password if provided
    if (password) {
      await db.insert(account).values({
        id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        accountId: cleanEmail,
        providerId: 'credential',
        userId,
        password: hashPassword(password),
      });
    }

    // 5. Create default Otaku Catalogs / Folders for user
    const defaultFolders = [
      { catalogId: 'watchlist', name: 'Main Watchlist', color: 'pink', thumbnail: 'Folder' },
      { catalogId: 'anime_vault', name: 'Anime Vault', color: 'purple', thumbnail: 'Sparkles' },
      { catalogId: 'manga_list', name: 'Manga Reading List', color: 'emerald', thumbnail: 'BookOpen' },
      { catalogId: 'masterpieces', name: 'All-Time Masterpieces', color: 'amber', thumbnail: 'Star' },
    ];

    for (const f of defaultFolders) {
      await db.insert(catalogs).values({
        userId,
        catalogId: f.catalogId,
        name: f.name,
        color: f.color,
        thumbnail: f.thumbnail,
        itemIds: '[]',
      });
    }

    // 6. Generate Session Token
    const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    await db.insert(session).values({
      id: `sess_${Date.now()}`,
      token: sessionToken,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await setSessionCookie(sessionToken);

    // Send login alert email on registration
    await sendSecurityAlertEmail({
      email: cleanEmail,
      event: 'login',
      userName: cleanName,
      details: { email: 'New Registration & First Sign-in' },
    });

    return {
      success: true,
      token: sessionToken,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role,
        avatar: avatar || null,
      },
    };
  } catch (err: any) {
    console.error('Error creating user after OTP:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 🔑 PASSWORD LOGIN & PASSWORDLESS OTP LOGIN
// =========================================================================

export async function passwordLogin({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; user?: any; token?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user in Neon DB
    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return { success: false, error: 'No account found with this email. Please Sign Up first.' };
    }

    const u = users[0];

    // 2. Verify Password
    const accounts = await db.select().from(account).where(eq(account.userId, u.id)).limit(1);
    if (accounts.length > 0 && accounts[0].password) {
      const hashed = hashPassword(password);
      if (accounts[0].password !== hashed) {
        return { success: false, error: 'Invalid password. Please check and try again or reset password.' };
      }
    }

    // 3. Issue Session Token
    const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    await db.insert(session).values({
      id: `sess_${Date.now()}`,
      token: sessionToken,
      userId: u.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await setSessionCookie(sessionToken);

    const isMasterAdmin = ADMIN_EMAILS.includes(cleanEmail) || u.role === 'admin';

    return {
      success: true,
      token: sessionToken,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: isMasterAdmin ? 'admin' : (u.role || 'user'),
        avatar: u.image || null,
      },
    };
  } catch (err: any) {
    console.error('Error during password login:', err);
    return { success: false, error: err.message };
  }
}

export async function requestLoginOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // ⚡ Fast DB check: Verify if account exists with this email
    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return {
        success: false,
        error: 'No account found with this email. Please check your email or Sign Up for free.',
      };
    }

    const userName = users[0].name || 'Otaku';

    return await sendOtpEmail({
      email: cleanEmail,
      type: '2fa',
      userName,
    });
  } catch (err: any) {
    console.error('Error requesting login OTP:', err);
    return { success: false, error: err.message || 'Failed to send login code.' };
  }
}

// Resend 2FA OTP explicitly to configured delivery email
export async function resendTwoFactorOtp(accountEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = accountEmail.trim().toLowerCase();
    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return { success: false, error: 'No account found with this email.' };
    }
    const tfaCheck = await checkUserTwoFactor(cleanEmail);
    const delivery = tfaCheck.deliveryEmail || cleanEmail;
    return await sendOtpEmail({
      email: delivery,
      type: '2fa',
      userName: users[0].name || 'Otaku',
    });
  } catch (err: any) {
    console.error('Error resending 2FA OTP:', err);
    return { success: false, error: err.message || 'Failed to resend 2FA code.' };
  }
}

export async function verifyLoginOtpAndAuthenticate({
  email,
  code,
}: {
  email: string;
  code: string;
}): Promise<{ success: boolean; error?: string; user?: any; token?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP
    const otpRes = await verifyOtpCode({
      email: cleanEmail,
      code,
      type: '2fa',
    });

    if (!otpRes.success) {
      return otpRes;
    }

    // Retrieve user from DB
    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return { success: false, error: 'No account found with this email. Please check your email or Sign Up for free.' };
    }

    const u = users[0];

    // Create session token
    const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    await db.insert(session).values({
      id: `sess_${Date.now()}`,
      token: sessionToken,
      userId: u.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await setSessionCookie(sessionToken);

    const isMasterAdmin = ADMIN_EMAILS.includes(cleanEmail) || u.role === 'admin';

    return {
      success: true,
      token: sessionToken,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: isMasterAdmin ? 'admin' : (u.role || 'user'),
        avatar: u.image || null,
      },
    };
  } catch (err: any) {
    console.error('Error during OTP login:', err);
    return { success: false, error: err.message };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('better-auth.session_token')?.value ||
      cookieStore.get('ani_session_token')?.value;

    if (token) {
      const rawToken = token.split('.')[0];
      await db.delete(session).where(eq(session.token, rawToken)).catch(() => {});
    }
    cookieStore.delete('better-auth.session_token');
    cookieStore.delete('ani_session_token');
    return { success: true };
  } catch {
    return { success: true };
  }
}

// =========================================================================
// 🔄 FORGOT PASSWORD FLOW
// =========================================================================

export async function requestPasswordResetOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return { success: false, error: 'No account registered with this email address.' };
    }

    return await sendOtpEmail({
      email: cleanEmail,
      type: 'reset',
      userName: users[0].name,
    });
  } catch (err: any) {
    console.error('Error requesting password reset OTP:', err);
    return { success: false, error: err.message };
  }
}

export async function verifyOtpAndResetPassword({
  email,
  code,
  newPassword,
  isLoginFlow = true,
}: {
  email: string;
  code: string;
  newPassword: string;
  isLoginFlow?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  requires2fa?: boolean;
  twoFactorEmail?: string;
  user?: any;
  token?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP code
    const otpRes = await verifyOtpCode({
      email: cleanEmail,
      code,
      type: 'reset',
    });

    if (!otpRes.success) {
      return otpRes;
    }

    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return { success: false, error: 'User not found.' };
    }

    const u = users[0];
    const hashedPassword = hashPassword(newPassword);

    // Update or insert account password
    const existingAccounts = await db.select().from(account).where(eq(account.userId, u.id)).limit(1);
    if (existingAccounts.length > 0) {
      await db
        .update(account)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(account.userId, u.id));
    } else {
      await db.insert(account).values({
        id: `acc_${Date.now()}`,
        accountId: cleanEmail,
        providerId: 'credential',
        userId: u.id,
        password: hashedPassword,
      });
    }

    // Send security alert email for password reset
    await sendSecurityAlertEmail({
      email: u.email,
      event: 'password_reset',
      userName: u.name || 'Otaku',
    });

    // If NOT login flow (e.g. user already logged in), return success immediately
    if (!isLoginFlow) {
      return { success: true };
    }

    // Check if user has 2FA enabled
    const tfaCheck = await checkUserTwoFactor(cleanEmail);
    if (tfaCheck.enabled) {
      await sendOtpEmail({
        email: tfaCheck.deliveryEmail || cleanEmail,
        type: '2fa',
        userName: u.name || 'Otaku',
      });
      return {
        success: true,
        requires2fa: true,
        twoFactorEmail: tfaCheck.deliveryEmail || cleanEmail,
      };
    }

    // Direct Login (No 2FA active on account)
    const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    await db.insert(session).values({
      id: `sess_${Date.now()}`,
      token: sessionToken,
      userId: u.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await setSessionCookie(sessionToken);

    // Send login alert email
    await sendSecurityAlertEmail({
      email: u.email,
      event: 'login',
      userName: u.name || 'Otaku',
      details: { email: 'Logged in after Password Reset' },
    });

    const isMasterAdmin = ADMIN_EMAILS.includes(cleanEmail) || u.role === 'admin';
    return {
      success: true,
      requires2fa: false,
      token: sessionToken,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: isMasterAdmin ? 'admin' : (u.role || 'user'),
        avatar: u.image || null,
      },
    };
  } catch (err: any) {
    console.error('Error resetting password:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 🔔 SECURITY ALERT EMAILS DISPATCHER
// =========================================================================

export async function sendSecurityAlertEmail({
  email,
  event,
  userName,
  details = {},
}: {
  email: string;
  event:
    | 'login'
    | 'password_reset'
    | '2fa_enabled'
    | '2fa_disabled'
    | 'backup_codes_regenerated'
    | 'account_deleted';
  userName?: string;
  details?: { ip?: string; device?: string; time?: string; email?: string };
}) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    const { subject, html } = getSecurityAlertEmailTemplate({
      userName: userName || 'Otaku',
      event,
      details,
    });

    await sendEmail({
      to: cleanEmail,
      subject,
      html,
    }).catch((err) => {
      console.warn(`[Security Alert] Failed to dispatch ${event} alert email:`, err?.message);
    });
  } catch (e) {
    console.error('[Security Alert Error]:', e);
  }
}

// =========================================================================
// 🛡️ TWO-FACTOR AUTHENTICATION — LOGIN FLOW
// =========================================================================

// Check if user has 2FA enabled and return delivery email
export async function checkUserTwoFactor(email: string): Promise<{
  enabled: boolean;
  deliveryEmail?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) return { enabled: false };

    const tfaRecords = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, users[0].id))
      .limit(1);

    if (tfaRecords.length === 0 || !tfaRecords[0].enabled) {
      return { enabled: false };
    }
    return { enabled: true, deliveryEmail: tfaRecords[0].deliveryEmail || cleanEmail };
  } catch {
    return { enabled: false };
  }
}

// Step 1: Verify password — if 2FA on, send 2FA OTP and return requires2fa flag
export async function passwordLoginStep1({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  error?: string;
  requires2fa?: boolean;
  twoFactorEmail?: string;
  user?: any;
  token?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return { success: false, error: 'No account found with this email. Please Sign Up first.' };
    }
    const u = users[0];

    // Verify password
    const accounts = await db.select().from(account).where(eq(account.userId, u.id)).limit(1);
    if (accounts.length > 0 && accounts[0].password) {
      const hashed = hashPassword(password);
      if (accounts[0].password !== hashed) {
        return { success: false, error: 'Invalid password. Please check and try again or reset password.' };
      }
    }

    // Check 2FA
    const tfaCheck = await checkUserTwoFactor(cleanEmail);
    if (tfaCheck.enabled) {
      await sendOtpEmail({
        email: tfaCheck.deliveryEmail || cleanEmail,
        type: '2fa',
        userName: u.name || 'Otaku',
      });
      return { success: true, requires2fa: true, twoFactorEmail: tfaCheck.deliveryEmail || cleanEmail };
    }

    // No 2FA — create session directly
    const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    await db.insert(session).values({
      id: `sess_${Date.now()}`,
      token: sessionToken,
      userId: u.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await setSessionCookie(sessionToken);

    // Send login alert email
    await sendSecurityAlertEmail({
      email: u.email,
      event: 'login',
      userName: u.name || 'Otaku',
    });

    const isMasterAdmin = ADMIN_EMAILS.includes(cleanEmail) || u.role === 'admin';
    return {
      success: true,
      requires2fa: false,
      token: sessionToken,
      user: { id: u.id, name: u.name, email: u.email, role: isMasterAdmin ? 'admin' : (u.role || 'user'), avatar: u.image || null },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Step 2: Verify 2FA OTP code and create session
export async function verifyTwoFactorAndLogin({
  email,
  code,
  twoFactorEmail,
}: {
  email: string;
  code: string;
  twoFactorEmail?: string;
}): Promise<{ success: boolean; error?: string; user?: any; token?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const clean2FA = twoFactorEmail?.trim().toLowerCase();

    // 1. Locate User by account email or 2FA delivery email
    let users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0 && clean2FA) {
      users = await db.select().from(user).where(eq(user.email, clean2FA)).limit(1);
    }
    if (users.length === 0) {
      const allTfa = await db.select().from(userTwoFactor).where(eq(userTwoFactor.deliveryEmail, clean2FA || cleanEmail)).limit(1);
      if (allTfa.length > 0) {
        users = await db.select().from(user).where(eq(user.id, allTfa[0].userId)).limit(1);
      }
    }
    if (users.length === 0) return { success: false, error: 'User account not found.' };

    const u = users[0];

    // Determine the delivery email where the OTP was sent
    let otpTargetEmail = clean2FA || cleanEmail;
    const tfaRecords = await db.select().from(userTwoFactor).where(eq(userTwoFactor.userId, u.id)).limit(1);
    if (tfaRecords.length > 0 && tfaRecords[0].deliveryEmail) {
      otpTargetEmail = tfaRecords[0].deliveryEmail.toLowerCase();
    }

    // Verify OTP code
    let otpRes = await verifyOtpCode({ email: otpTargetEmail, code, type: '2fa' });
    if (!otpRes.success && otpTargetEmail !== cleanEmail) {
      otpRes = await verifyOtpCode({ email: cleanEmail, code, type: '2fa' });
    }
    if (!otpRes.success) return otpRes;

    const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    await db.insert(session).values({
      id: `sess_${Date.now()}`,
      token: sessionToken,
      userId: u.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await setSessionCookie(sessionToken);

    // Send login alert email
    await sendSecurityAlertEmail({
      email: u.email,
      event: 'login',
      userName: u.name || 'Otaku',
    });

    const isMasterAdmin = ADMIN_EMAILS.includes(u.email) || u.role === 'admin';
    return {
      success: true,
      token: sessionToken,
      user: { id: u.id, name: u.name, email: u.email, role: isMasterAdmin ? 'admin' : (u.role || 'user'), avatar: u.image || null },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Verify backup code and create session (replaces used code with new one)
export async function verifyBackupCodeAndLogin({
  email,
  backupCode,
}: {
  email: string;
  backupCode: string;
}): Promise<{ success: boolean; error?: string; user?: any; token?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) return { success: false, error: 'No account found.' };
    const u = users[0];

    const tfaRecords = await db.select().from(userTwoFactor).where(eq(userTwoFactor.userId, u.id)).limit(1);
    if (tfaRecords.length === 0 || !tfaRecords[0].enabled) {
      return { success: false, error: '2FA is not enabled on this account.' };
    }

    let codes: string[] = [];
    try { codes = JSON.parse(tfaRecords[0].backupCodes || '[]'); } catch {}

    const cleanCode = backupCode.trim().toUpperCase();
    const codeIndex = codes.findIndex(c => c.toUpperCase() === cleanCode);
    if (codeIndex === -1) {
      return { success: false, error: 'Invalid backup code. Please verify the code or use another one.' };
    }

    // Replace used code with a new one (out of 8)
    const newCode = `ANI-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    codes[codeIndex] = newCode;
    await db.update(userTwoFactor)
      .set({ backupCodes: JSON.stringify(codes), updatedAt: new Date() })
      .where(eq(userTwoFactor.id, tfaRecords[0].id));

    const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    await db.insert(session).values({
      id: `sess_${Date.now()}`,
      token: sessionToken,
      userId: u.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await setSessionCookie(sessionToken);

    // Send login alert email with note that backup code was used
    await sendSecurityAlertEmail({
      email: u.email,
      event: 'login',
      userName: u.name || 'Otaku',
      details: { email: 'Signed in using Emergency Backup Code' },
    });

    const isMasterAdmin = ADMIN_EMAILS.includes(u.email) || u.role === 'admin';
    return {
      success: true,
      token: sessionToken,
      user: { id: u.id, name: u.name, email: u.email, role: isMasterAdmin ? 'admin' : (u.role || 'user'), avatar: u.image || null },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// OTP Login Step 1 — send OTP to registered account email only
export async function otpLoginStep1(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return { success: false, error: 'No account found with this email.' };
    }
    return await sendOtpEmail({ email: cleanEmail, type: '2fa', userName: users[0].name || 'Otaku' });
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// OTP Login Step 2 — verify OTP, check 2FA, create session
export async function otpLoginVerifyAndAuthenticate({
  email,
  code,
}: {
  email: string;
  code: string;
}): Promise<{
  success: boolean;
  error?: string;
  requires2fa?: boolean;
  twoFactorEmail?: string;
  user?: any;
  token?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const otpRes = await verifyOtpCode({ email: cleanEmail, code, type: '2fa' });
    if (!otpRes.success) return otpRes;

    const users = await db.select().from(user).where(eq(user.email, cleanEmail)).limit(1);
    if (users.length === 0) {
      return { success: false, error: 'No account found with this email. Please check your email or Sign Up for free.' };
    }

    const u = users[0];

    // Check 2FA
    const tfaCheck = await checkUserTwoFactor(cleanEmail);
    if (tfaCheck.enabled) {
      await sendOtpEmail({ email: tfaCheck.deliveryEmail || cleanEmail, type: '2fa', userName: u.name || 'Otaku' });
      return { success: true, requires2fa: true, twoFactorEmail: tfaCheck.deliveryEmail || cleanEmail };
    }

    const sessionToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    await db.insert(session).values({
      id: `sess_${Date.now()}`,
      token: sessionToken,
      userId: u.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await setSessionCookie(sessionToken);

    // Send login alert email
    await sendSecurityAlertEmail({
      email: u.email,
      event: 'login',
      userName: u.name || 'Otaku',
    });

    const isMasterAdmin = ADMIN_EMAILS.includes(cleanEmail) || u.role === 'admin';
    return {
      success: true,
      requires2fa: false,
      token: sessionToken,
      user: { id: u.id, name: u.name, email: u.email, role: isMasterAdmin ? 'admin' : (u.role || 'user'), avatar: u.image || null },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
