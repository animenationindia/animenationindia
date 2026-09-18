'use server';

import { db } from '@/lib/db';
import { user, session as sessionTable, watchlist, catalogs, reactions, userReviews, userTwoFactor, account } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { sendOtpEmail, verifyOtpCode, resolveAuthUser, sendSecurityAlertEmail } from './auth';
import crypto from 'crypto';

export async function getUserProfileDetails() {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { authenticated: false };
    }

    const dbUsers = await db.select().from(user).where(eq(user.id, sessionUser.id)).limit(1);
    if (dbUsers.length === 0) return { authenticated: false };

    const currentUser = dbUsers[0];

    const [watchlistCountRes] = await db
      .select({ val: count() })
      .from(watchlist)
      .where(eq(watchlist.userId, sessionUser.id));

    const [reviewsCountRes] = await db
      .select({ val: count() })
      .from(userReviews)
      .where(eq(userReviews.userId, sessionUser.id));

    const [reactionsCountRes] = await db
      .select({ val: count() })
      .from(reactions)
      .where(eq(reactions.userId, sessionUser.id));

    return {
      authenticated: true,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        image: currentUser.image,
        role: currentUser.role || 'user',
        emailVerified: currentUser.emailVerified,
        createdAt: currentUser.createdAt.toISOString(),
      },
      stats: {
        savedWatchlist: Number(watchlistCountRes?.val || 0),
        reviewsCount: Number(reviewsCountRes?.val || 0),
        reactionsCount: Number(reactionsCountRes?.val || 0),
      },
    };
  } catch (err) {
    console.error('Error fetching profile details:', err);
    return { authenticated: false };
  }
}

export async function updateUserProfile({
  name,
  image,
}: {
  name?: string;
  image?: string;
}) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const updateData: any = { updatedAt: new Date() };
    if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
    if (typeof image === 'string') updateData.image = image.trim();

    await db.update(user).set(updateData).where(eq(user.id, sessionUser.id));

    return { success: true };
  } catch (err: any) {
    console.error('Error updating user profile:', err);
    return { success: false, error: err.message };
  }
}

export async function requestAccountDeletionOtp({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id || !sessionUser.email) {
      return { success: false, error: 'Unauthorized. Please sign in.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // ✅ Must match the account's login email EXACTLY
    if (cleanEmail !== sessionUser.email.trim().toLowerCase()) {
      return { success: false, error: 'Email does not match your account email. You must use your account login email.' };
    }

    // ✅ Verify password against DB
    const accs = await db.select().from(account).where(eq(account.userId, sessionUser.id)).limit(1);
    if (accs.length > 0 && accs[0].password) {
      const hashedInput = crypto.createHash('sha256').update(password).digest('hex');
      if (accs[0].password !== hashedInput) {
        return { success: false, error: 'Incorrect password. Account deletion requires your correct account password.' };
      }
    }

    // ✅ Send OTP to the account email only (no alternate email allowed)
    return await sendOtpEmail({
      email: sessionUser.email,
      type: 'delete',
      userName: sessionUser.name || 'Otaku',
    });
  } catch (err: any) {
    console.error('Error requesting deletion OTP:', err);
    return { success: false, error: err.message };
  }
}

export async function confirmDeleteUserAccountWithOtp(code: string) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id || !sessionUser.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const verificationRes = await verifyOtpCode({
      email: sessionUser.email,
      code,
      type: 'delete',
    });

    if (!verificationRes.success) {
      return verificationRes;
    }

    // Send account deleted alert email before wiping
    await sendSecurityAlertEmail({
      email: sessionUser.email,
      event: 'account_deleted',
      userName: sessionUser.name || 'Otaku',
    });

    // Delete user (Cascades to session, watchlist, catalogs, reactions, etc.)
    await db.delete(user).where(eq(user.id, sessionUser.id));

    // Also clear server-side session cookies
    const { logoutAction } = await import('./auth');
    await logoutAction().catch(() => {});

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting user account:', err);
    return { success: false, error: err.message };
  }
}

export async function changeUserPassword({
  currentPassword,
  newPassword,
}: {
  currentPassword?: string;
  newPassword: string;
}) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { success: false, error: 'Unauthorized. Please sign in.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const hashedNew = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Check existing account
    const accs = await db.select().from(account).where(eq(account.userId, sessionUser.id)).limit(1);
    if (accs.length > 0 && accs[0].password && currentPassword) {
      const hashedCurrent = crypto.createHash('sha256').update(currentPassword).digest('hex');
      if (accs[0].password !== hashedCurrent) {
        return { success: false, error: 'Current password does not match.' };
      }
      await db.update(account).set({ password: hashedNew, updatedAt: new Date() }).where(eq(account.id, accs[0].id));
    } else if (accs.length > 0) {
      await db.update(account).set({ password: hashedNew, updatedAt: new Date() }).where(eq(account.id, accs[0].id));
    } else {
      await db.insert(account).values({
        id: `acc_${Date.now()}`,
        accountId: sessionUser.email || 'user',
        providerId: 'credential',
        userId: sessionUser.id,
        password: hashedNew,
      });
    }

    // Send password update security alert
    if (sessionUser.email) {
      await sendSecurityAlertEmail({
        email: sessionUser.email,
        event: 'password_reset',
        userName: sessionUser.name || 'Otaku',
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error changing password:', err);
    return { success: false, error: err.message || 'Failed to update password' };
  }
}

export async function clearUserWatchlist() {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    await db.delete(watchlist).where(eq(watchlist.userId, sessionUser.id));
    return { success: true };
  } catch (err: any) {
    console.error('Error clearing watchlist:', err);
    return { success: false, error: err.message };
  }
}

// =========================================================================
// 🛡️ TWO-FACTOR AUTHENTICATION (2FA) ACTIONS
// =========================================================================

export async function getUserTwoFactorDetails() {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { success: false, enabled: false };
    }

    const records = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, sessionUser.id))
      .limit(1);

    if (records.length === 0) {
      return {
        success: true,
        enabled: false,
        deliveryEmail: sessionUser.email,
        backupCodes: [],
      };
    }

    const record = records[0];
    let parsedCodes: string[] = [];
    try {
      parsedCodes = JSON.parse(record.backupCodes || '[]');
    } catch {
      parsedCodes = [];
    }

    return {
      success: true,
      enabled: record.enabled,
      deliveryEmail: record.deliveryEmail || sessionUser.email,
      backupCodes: parsedCodes,
    };
  } catch (err: any) {
    console.error('Error fetching 2FA details:', err);
    return { success: false, enabled: false, error: err.message };
  }
}

export async function toggleUserTwoFactorStatus({ enabled }: { enabled: boolean }) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id || !sessionUser.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const records = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, sessionUser.id))
      .limit(1);

    if (enabled) {
      // Generate 8 fresh backup recovery codes
      const codes = Array.from({ length: 8 }, () => 
        `ANI-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      );
      const codesJson = JSON.stringify(codes);

      if (records.length > 0) {
        await db
          .update(userTwoFactor)
          .set({
            enabled: true,
            deliveryEmail: sessionUser.email,
            backupCodes: codesJson,
            updatedAt: new Date(),
          })
          .where(eq(userTwoFactor.id, records[0].id));
      } else {
        await db.insert(userTwoFactor).values({
          id: `2fa_${Date.now()}`,
          userId: sessionUser.id,
          enabled: true,
          deliveryEmail: sessionUser.email,
          backupCodes: codesJson,
        });
      }

      // Send 2FA Enabled Alert Email
      await sendSecurityAlertEmail({
        email: sessionUser.email,
        event: '2fa_enabled',
        userName: sessionUser.name || 'Otaku',
      });

      return { success: true, enabled: true, backupCodes: codes };
    } else {
      if (records.length > 0) {
        await db
          .update(userTwoFactor)
          .set({
            enabled: false,
            updatedAt: new Date(),
          })
          .where(eq(userTwoFactor.id, records[0].id));
      }

      // Send 2FA Disabled Alert Email
      await sendSecurityAlertEmail({
        email: sessionUser.email,
        event: '2fa_disabled',
        userName: sessionUser.name || 'Otaku',
      });

      return { success: true, enabled: false, backupCodes: [] };
    }
  } catch (err: any) {
    console.error('Error toggling 2FA:', err);
    return { success: false, error: err.message };
  }
}

export async function update2FADeliveryEmail(newEmail: string) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const records = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, sessionUser.id))
      .limit(1);

    if (records.length > 0) {
      await db
        .update(userTwoFactor)
        .set({ deliveryEmail: cleanEmail, updatedAt: new Date() })
        .where(eq(userTwoFactor.id, records[0].id));
    } else {
      await db.insert(userTwoFactor).values({
        id: `2fa_${Date.now()}`,
        userId: sessionUser.id,
        enabled: false,
        deliveryEmail: cleanEmail,
        backupCodes: '[]',
      });
    }

    return { success: true, deliveryEmail: cleanEmail };
  } catch (err: any) {
    console.error('Error updating 2FA delivery email:', err);
    return { success: false, error: err.message };
  }
}

export async function regenerateBackupCodes() {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id || !sessionUser.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const codes = Array.from({ length: 8 }, () => 
      `ANI-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
    );
    const codesJson = JSON.stringify(codes);

    const records = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, sessionUser.id))
      .limit(1);

    if (records.length > 0) {
      await db
        .update(userTwoFactor)
        .set({ backupCodes: codesJson, updatedAt: new Date() })
        .where(eq(userTwoFactor.id, records[0].id));
    } else {
      await db.insert(userTwoFactor).values({
        id: `2fa_${Date.now()}`,
        userId: sessionUser.id,
        enabled: true,
        deliveryEmail: sessionUser.email,
        backupCodes: codesJson,
      });
    }

    // Send backup codes regenerated alert email
    await sendSecurityAlertEmail({
      email: sessionUser.email,
      event: 'backup_codes_regenerated',
      userName: sessionUser.name || 'Otaku',
    });

    return { success: true, backupCodes: codes };
  } catch (err: any) {
    console.error('Error regenerating backup codes:', err);
    return { success: false, error: err.message };
  }
}

export async function requestPasswordReset(deliveryEmail: string) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    const cleanEmail = deliveryEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    return await sendOtpEmail({
      email: cleanEmail,
      type: 'reset',
      userName: sessionUser.name || 'Otaku',
    });
  } catch (err: any) {
    console.error('Error requesting password reset in profile:', err);
    return { success: false, error: err.message || 'Failed to send reset code.' };
  }
}

export async function resetPasswordWithCode({
  email,
  code,
  newPassword,
}: {
  email: string;
  code: string;
  newPassword: string;
}) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { success: false, error: 'Unauthorized. Please log in.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      return { success: false, error: 'Please enter a valid 6-digit code.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // 1. Verify OTP code against the delivery email where it was dispatched
    const otpRes = await verifyOtpCode({
      email: cleanEmail,
      code: cleanCode,
      type: 'reset',
    });

    if (!otpRes.success) {
      return otpRes;
    }

    // 2. Hash new password
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

    // 3. Update or insert account password for the logged-in user
    const existingAccounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, sessionUser.id))
      .limit(1);

    if (existingAccounts.length > 0) {
      await db
        .update(account)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(account.userId, sessionUser.id));
    } else {
      await db.insert(account).values({
        id: `acc_${Date.now()}`,
        accountId: sessionUser.email,
        providerId: 'credential',
        userId: sessionUser.id,
        password: hashedPassword,
      });
    }

    // 4. Send security alert email for password reset to user's registered account email
    await sendSecurityAlertEmail({
      email: sessionUser.email,
      event: 'password_reset',
      userName: sessionUser.name || 'Otaku',
    });

    // ⚠️ User is ALREADY logged in here.
    // We do NOT trigger 2FA check, do NOT send 2FA OTP, and do NOT create a new session.
    return { success: true };
  } catch (err: any) {
    console.error('Error resetting password with code in profile:', err);
    return { success: false, error: err.message || 'Failed to reset password.' };
  }
}

// =========================================================================
// 🔗 CONNECTED PROVIDERS HUB ACTIONS
// =========================================================================

export async function getUserConnectedProviders() {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id) {
      return { success: false, providers: [] };
    }

    const accounts = await db
      .select()
      .from(account)
      .where(eq(account.userId, sessionUser.id));

    const connectedProviderIds = new Set(accounts.map((a) => a.providerId));

    return {
      success: true,
      providers: [
        {
          id: 'credential',
          name: 'Email & Password',
          type: 'Credentials',
          connected: true, // Always connected as primary
          identifier: sessionUser.email,
          isPrimary: true,
        },
        {
          id: 'neon',
          name: 'Neon PostgreSQL Cloud DB',
          type: 'Cloud Database',
          connected: true,
          identifier: 'AWS ap-southeast-1 Pooler',
          isPrimary: false,
        },
        {
          id: 'google',
          name: 'Google Account',
          type: 'OAuth 2.0',
          connected: connectedProviderIds.has('google'),
          identifier: connectedProviderIds.has('google') ? (accounts.find(a => a.providerId === 'google')?.accountId || 'Linked') : 'Not connected',
          isPrimary: false,
        },
        {
          id: 'github',
          name: 'GitHub Account',
          type: 'OAuth 2.0',
          connected: connectedProviderIds.has('github'),
          identifier: connectedProviderIds.has('github') ? (accounts.find(a => a.providerId === 'github')?.accountId || 'Linked') : 'Not connected',
          isPrimary: false,
        },
        {
          id: 'discord',
          name: 'Discord Account',
          type: 'OAuth 2.0',
          connected: connectedProviderIds.has('discord'),
          identifier: connectedProviderIds.has('discord') ? (accounts.find(a => a.providerId === 'discord')?.accountId || 'Linked') : 'Not connected',
          isPrimary: false,
        },
      ],
    };
  } catch (err: any) {
    console.error('Error fetching connected providers:', err);
    return { success: false, providers: [] };
  }
}

// =========================================================================
// ✉️ EMAIL VERIFICATION ACTIONS
// =========================================================================

export async function requestEmailVerificationOtp() {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id || !sessionUser.email) {
      return { success: false, error: 'Unauthorized' };
    }

    return await sendOtpEmail({
      email: sessionUser.email,
      type: 'verification',
      userName: sessionUser.name || 'Otaku',
    });
  } catch (err: any) {
    console.error('Error requesting verification OTP:', err);
    return { success: false, error: err.message };
  }
}

export async function verifyUserEmailWithOtp(code: string) {
  try {
    const sessionUser = await resolveAuthUser();
    if (!sessionUser?.id || !sessionUser.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const verificationRes = await verifyOtpCode({
      email: sessionUser.email,
      code,
      type: 'verification',
    });

    if (!verificationRes.success) {
      return verificationRes;
    }

    await db.update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, sessionUser.id));
    return { success: true };
  } catch (err: any) {
    console.error('Error verifying email OTP:', err);
    return { success: false, error: err.message };
  }
}

