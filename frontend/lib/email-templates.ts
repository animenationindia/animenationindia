export function getOtpEmailTemplate({
  otp,
  type = 'verification',
  userName = 'Otaku',
}: {
  otp: string;
  type?: 'verification' | 'reset' | '2fa' | 'delete';
  userName?: string;
}): { subject: string; html: string } {
  const currentYear = new Date().getFullYear();

  // Category Configuration & Signature Colorway
  let subject = `[Anime Nation India] Email Verification Code: ${otp}`;
  let badgeText = 'ACCOUNT VERIFICATION';
  let badgeColor = '#ff4dd2';
  let badgeBorder = 'rgba(255, 77, 210, 0.4)';
  let accentGradient = 'linear-gradient(90deg, #00f2fe 0%, #ff4dd2 100%)';
  let glowColor = 'rgba(255, 77, 210, 0.35)';
  let heading = 'Verify Your Email Address';
  let primaryLead = 'Here is your 6-digit single-use authorization code to complete your verification:';
  let detailedBody =
    'Thank you for joining Anime Nation India — the premier digital destination for anime streaming, manga reading, and community discussions. By validating your email address, you activate your personalized Otaku Vault, custom folder libraries, community review privileges, and synchronized cross-device watchlists.';
  let securityAdvice =
    'This code is time-sensitive and will strictly expire in 10 minutes. For your protection, never share this code or your account credentials with anyone. Anime Nation India staff will never ask for your verification code.';

  if (type === 'reset') {
    subject = `[Anime Nation India] Password Reset OTP Code: ${otp}`;
    badgeText = 'PASSWORD RECOVERY';
    badgeColor = '#f59e0b';
    badgeBorder = 'rgba(245, 158, 11, 0.4)';
    accentGradient = 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)';
    glowColor = 'rgba(245, 158, 11, 0.35)';
    heading = 'Reset Your Account Password';
    primaryLead = 'We received an official request to reset your Anime Nation India account password. Your 6-digit recovery code is:';
    detailedBody =
      'You are receiving this security transmission because a password reset procedure was initiated for your registered account. Once verified with this code, you will be prompted to establish a new cryptographic password. If you did not request this reset, your account credentials remain unchanged, but we strongly recommend auditing your active sessions.';
    securityAdvice =
      'This single-use reset code is valid for exactly 10 minutes. If you did not initiate this request, please change your password immediately or report the incident to our security desk.';
  } else if (type === '2fa') {
    subject = `[Anime Nation India] 2FA Security Code: ${otp}`;
    badgeText = 'TWO-FACTOR AUTHENTICATION';
    badgeColor = '#38bdf8';
    badgeBorder = 'rgba(56, 189, 248, 0.4)';
    accentGradient = 'linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)';
    glowColor = 'rgba(56, 189, 248, 0.35)';
    heading = 'Two-Factor Security Shield';
    primaryLead = 'A sign-in or two-factor authorization sequence was triggered. Your 6-digit security code is:';
    detailedBody =
      'Anime Nation India enforces advanced multi-factor authentication to protect your Otaku Identity, custom playlists, and profile data from unauthorized access. To complete this authentication handshake and access your account, enter the one-time code displayed below into the verification prompt.';
    securityAdvice =
      'This code is valid for 10 minutes and can only be used once. If you did not attempt to sign in or modify your two-factor security parameters, someone may be attempting to access your account.';
  } else if (type === 'delete') {
    subject = `[Security Alert] Urgent: Account Deletion Authorization: ${otp}`;
    badgeText = 'ACCOUNT TERMINATION';
    badgeColor = '#ef4444';
    badgeBorder = 'rgba(239, 68, 68, 0.5)';
    accentGradient = 'linear-gradient(90deg, #ef4444 0%, #7f1d1d 100%)';
    glowColor = 'rgba(239, 68, 68, 0.4)';
    heading = 'Confirm Permanent Account Deletion';
    primaryLead = 'URGENT: A permanent account termination request has been submitted. Your final authorization code is:';
    detailedBody =
      'You are receiving this high-priority security transmission because an account deletion sequence was triggered from your Danger Zone profile settings. Entering this code will irrevocably purge your user profile, saved watchlists, custom folders, ratings, reviews, and community reactions from our database. This action is permanent and cannot be reversed by Anime Nation India Support.';
    securityAdvice =
      'If you did not authorize this deletion, immediately cancel the prompt, change your password, and alert our support desk at animenationindia.support@gmail.com.';
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${heading}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060710;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #e4e4e7;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #060710;
      padding: 30px 10px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #0d0e1f;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
    }
    .accent-bar {
      height: 4px;
      width: 100%;
      background: ${accentGradient};
    }
    .header {
      padding: 36px 32px 24px 32px;
      text-align: center;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.22em;
      color: #ffffff;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #71717a;
      text-transform: uppercase;
      margin: 0 0 16px 0;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid ${badgeBorder};
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: ${badgeColor};
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .heading {
      font-size: 22px;
      font-weight: 900;
      color: #ffffff;
      margin: 0;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 14px 0;
    }
    .lead-text {
      font-size: 14px;
      color: #d4d4d8;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .otp-vault {
      background: linear-gradient(180deg, #121328 0%, #090a16 100%);
      border: 1px solid ${badgeBorder};
      border-radius: 20px;
      padding: 26px 20px;
      text-align: center;
      margin: 24px 0;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6), 0 0 25px ${glowColor};
    }
    .otp-tag {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.18em;
      color: #a1a1aa;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .otp-digits {
      font-family: 'Consolas', 'Courier New', Courier, monospace;
      font-size: 40px;
      font-weight: 900;
      letter-spacing: 12px;
      color: ${badgeColor};
      text-shadow: 0 0 20px ${glowColor};
      padding-left: 12px;
      margin: 8px 0;
    }
    .otp-meta {
      font-size: 11px;
      font-weight: 600;
      color: #71717a;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .body-detail {
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.65;
      margin: 0 0 22px 0;
    }
    .security-callout {
      background: rgba(255, 255, 255, 0.03);
      border-left: 3px solid ${badgeColor};
      border-radius: 12px;
      padding: 14px 16px;
      margin-top: 24px;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.55;
    }
    .footer {
      background-color: #080914;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .footer-links {
      font-size: 12px;
      font-weight: 600;
      color: #71717a;
      margin-bottom: 14px;
    }
    .footer-links a {
      color: #a1a1aa;
      text-decoration: none;
      margin: 0 8px;
    }
    .footer-links a:hover {
      color: #ffffff;
    }
    .footer-copy {
      font-size: 11px;
      color: #52525b;
      line-height: 1.6;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="accent-bar"></div>
      <div class="header">
        <p class="brand-title">ANIME NATION INDIA</p>
        <p class="brand-sub">OFFICIAL SECURITY &amp; AUTHENTICATION DESK</p>
        <div class="badge">${badgeText}</div>
        <h1 class="heading">${heading}</h1>
      </div>
      <div class="content">
        <p class="greeting">Hello ${userName},</p>
        <p class="lead-text"><strong>${primaryLead}</strong></p>
        
        <div class="otp-vault">
          <div class="otp-tag">One-Time Verification Code</div>
          <div class="otp-digits">${otp}</div>
          <div class="otp-meta">&bull; Single Use Only &bull; Valid for 10 Minutes &bull;</div>
        </div>

        <p class="body-detail">${detailedBody}</p>

        <div class="security-callout">
          <strong style="color: #ffffff; display: block; margin-bottom: 4px;">Security Notice &amp; Protection Advice:</strong>
          ${securityAdvice}
        </div>
      </div>
      <div class="footer">
        <div class="footer-links">
          <a href="https://www.animenationindia.online" target="_blank">Portal Home</a> &bull;
          <a href="https://www.animenationindia.online/my-list" target="_blank">My Watchlist</a> &bull;
          <a href="https://www.animenationindia.online/profile" target="_blank">Security Settings</a> &bull;
          <a href="mailto:animenationindia.support@gmail.com">Help Desk</a>
        </div>
        <p class="footer-copy">
          This is an automated transmission dispatched by Anime Nation India Auth Guard.<br>
          To safeguard your identity and custom libraries, never forward this message to third parties.<br>
          &copy; ${currentYear} Anime Nation India. All rights reserved. Registered Anime Community &amp; Media Platform.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

// =========================================================================
// 🔔 SECURITY ALERT EMAILS (DISCORD / STEAM HIGH-END CARD AESTHETIC)
// =========================================================================

export function getSecurityAlertEmailTemplate({
  userName = 'Otaku',
  event,
  details = {},
}: {
  userName?: string;
  event:
    | 'login'
    | 'password_reset'
    | '2fa_enabled'
    | '2fa_disabled'
    | 'backup_codes_regenerated'
    | 'account_deleted';
  details?: {
    ip?: string;
    device?: string;
    time?: string;
    email?: string;
  };
}): { subject: string; html: string } {
  const currentYear = new Date().getFullYear();
  const timestamp = details.time || new Date().toUTCString();

  let subject = '[Security Alert] Account Activity Notice';
  let badgeText = 'SECURITY AUDIT';
  let badgeColor = '#38bdf8';
  let badgeBorder = 'rgba(56, 189, 248, 0.4)';
  let accentGradient = 'linear-gradient(90deg, #38bdf8 0%, #6366f1 100%)';
  let title = 'Account Activity Detected';
  let primaryLead = 'A new security event was registered for your Anime Nation India account.';
  let detailedBody =
    'Anime Nation India Security Desk continuously tracks active sessions, device handshakes, and credential changes across our serverless cluster. Below is the technical audit report of this security event for your records:';
  let isDanger = false;

  switch (event) {
    case 'login':
      subject = '[Security Alert] New Sign-in to Your Account';
      badgeText = 'NEW SIGN-IN DETECTED';
      badgeColor = '#38bdf8';
      badgeBorder = 'rgba(56, 189, 248, 0.4)';
      accentGradient = 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)';
      title = 'New Sign-in to Your Account';
      primaryLead = 'A successful login was just registered on your Anime Nation India account.';
      detailedBody =
        'Your account credentials or multi-factor token were authenticated through our secure authentication layer. If you recently initiated this session, no further action is required and you may safely disregard this message.';
      break;

    case 'password_reset':
      subject = '[Security Alert] Password Changed Successfully';
      badgeText = 'CREDENTIALS UPDATED';
      badgeColor = '#a855f7';
      badgeBorder = 'rgba(168, 85, 247, 0.4)';
      accentGradient = 'linear-gradient(90deg, #a855f7 0%, #ec4899 100%)';
      title = 'Password Successfully Updated';
      primaryLead = 'The password for your Anime Nation India account was recently modified and updated.';
      detailedBody =
        'Your password has been re-hashed using SHA-256 with individualized salt keys across our Neon PostgreSQL database cluster. All existing session tokens have been synchronized. You can now use your updated password for all future sign-ins.';
      break;

    case '2fa_enabled':
      subject = '[Security Alert] Two-Factor Authentication Enabled';
      badgeText = 'TWO-FACTOR ACTIVE';
      badgeColor = '#10b981';
      badgeBorder = 'rgba(16, 185, 129, 0.4)';
      accentGradient = 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)';
      title = 'Two-Factor Authentication Enabled';
      primaryLead = 'Two-Factor Authentication (2FA) protection is now fully activated on your account.';
      detailedBody =
        'Congratulations! Your Anime Nation India profile is now shielded by multi-factor authentication. From this point forward, every sign-in attempt will require both your password and an authentic 6-digit one-time code dispatched to your verified delivery email. 8 emergency recovery backup codes were also issued.';
      break;

    case '2fa_disabled':
      subject = '[Security Alert] Warning: Two-Factor Authentication Disabled';
      badgeText = '2FA DEACTIVATED';
      badgeColor = '#f43f5e';
      badgeBorder = 'rgba(244, 63, 94, 0.5)';
      accentGradient = 'linear-gradient(90deg, #f43f5e 0%, #b91c1c 100%)';
      title = 'Two-Factor Authentication Disabled';
      primaryLead = 'WARNING: Two-Factor Authentication (2FA) was deactivated on your account.';
      detailedBody =
        'The multi-factor security layer guarding your Otaku Identity has been removed. Your account can now be accessed with a standard password alone. Because multi-factor protection is the primary barrier against credential attacks, we strongly recommend re-enabling 2FA from your Profile Security tab.';
      isDanger = true;
      break;

    case 'backup_codes_regenerated':
      subject = '[Security Alert] Emergency Backup Codes Regenerated';
      badgeText = 'RECOVERY CODES UPDATED';
      badgeColor = '#f59e0b';
      badgeBorder = 'rgba(245, 158, 11, 0.4)';
      accentGradient = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
      title = '8 Emergency Backup Codes Regenerated';
      primaryLead = 'A new set of 8 emergency recovery backup codes has been generated for your account.';
      detailedBody =
        'Your previously saved recovery codes have been revoked and invalidated in our database. The 8 newly generated backup codes are now active and can be used to bypass two-factor email verification in case you lose access to your delivery mailbox. Please store your new codes in a secure location.';
      break;

    case 'account_deleted':
      subject = '[Security Alert] Account Permanently Deleted';
      badgeText = 'ACCOUNT TERMINATED';
      badgeColor = '#ef4444';
      badgeBorder = 'rgba(239, 68, 68, 0.5)';
      accentGradient = 'linear-gradient(90deg, #ef4444 0%, #7f1d1d 100%)';
      title = 'Account Permanently Deleted';
      primaryLead = 'Your Anime Nation India account and personal data have been completely erased.';
      detailedBody =
        'Following your authorized deletion request, your account record, custom playlists, watchlists, ratings, reviews, and community reactions have been permanently removed from our Neon PostgreSQL cluster and session cookies revoked. We are sorry to see you go, and you are always welcome to return to Anime Nation India at any time.';
      isDanger = true;
      break;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060710;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #e4e4e7;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #060710;
      padding: 30px 10px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #0d0e1f;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
    }
    .accent-bar {
      height: 4px;
      width: 100%;
      background: ${accentGradient};
    }
    .header {
      padding: 36px 32px 24px 32px;
      text-align: center;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.22em;
      color: #ffffff;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #71717a;
      text-transform: uppercase;
      margin: 0 0 16px 0;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid ${badgeBorder};
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: ${badgeColor};
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .heading {
      font-size: 22px;
      font-weight: 900;
      color: #ffffff;
      margin: 0;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 14px 0;
    }
    .lead-text {
      font-size: 14px;
      color: #d4d4d8;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }
    .body-detail {
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.65;
      margin: 0 0 24px 0;
    }
    .audit-card {
      background: #111224;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 8px 18px;
      margin: 20px 0;
    }
    .audit-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      font-size: 13px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .audit-row:last-child {
      border-bottom: none;
    }
    .audit-label {
      color: #71717a;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.08em;
    }
    .audit-val {
      color: #ffffff;
      font-weight: 700;
      font-family: 'Consolas', 'Courier New', Courier, monospace;
      text-align: right;
    }
    .warning-card {
      background: ${
        isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 77, 210, 0.06)'
      };
      border: 1px solid ${
        isDanger ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 77, 210, 0.3)'
      };
      border-radius: 16px;
      padding: 18px 20px;
      margin-top: 26px;
      font-size: 12px;
      line-height: 1.6;
      color: ${isDanger ? '#fca5a5' : '#f472b6'};
    }
    .warning-card a {
      color: #ffffff;
      font-weight: 700;
      text-decoration: underline;
    }
    .footer {
      background-color: #080914;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .footer-links {
      font-size: 12px;
      font-weight: 600;
      color: #71717a;
      margin-bottom: 14px;
    }
    .footer-links a {
      color: #a1a1aa;
      text-decoration: none;
      margin: 0 8px;
    }
    .footer-links a:hover {
      color: #ffffff;
    }
    .footer-copy {
      font-size: 11px;
      color: #52525b;
      line-height: 1.6;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="accent-bar"></div>
      <div class="header">
        <p class="brand-title">ANIME NATION INDIA</p>
        <p class="brand-sub">OFFICIAL SECURITY &amp; AUDIT MONITOR</p>
        <div class="badge">${badgeText}</div>
        <h1 class="heading">${title}</h1>
      </div>
      <div class="content">
        <p class="greeting">Hello ${userName},</p>
        <p class="lead-text"><strong>${primaryLead}</strong></p>
        <p class="body-detail">${detailedBody}</p>

        <div class="audit-card">
          <div class="audit-row">
            <span class="audit-label">Security Event</span>
            <span class="audit-val" style="color: ${badgeColor};">${title}</span>
          </div>
          <div class="audit-row">
            <span class="audit-label">Timestamp</span>
            <span class="audit-val">${timestamp}</span>
          </div>
          ${
            details.email
              ? `
          <div class="audit-row">
            <span class="audit-label">Target Account</span>
            <span class="audit-val">${details.email}</span>
          </div>`
              : ''
          }
          <div class="audit-row">
            <span class="audit-label">Session Status</span>
            <span class="audit-val" style="color: #10b981;">Authorized &bull; Synchronized</span>
          </div>
        </div>

        <div class="warning-card">
          <strong style="color: #ffffff; font-size: 13px; display: block; margin-bottom: 4px;">
            Was this not you? (Unauthorized Activity Check)
          </strong>
          If you did not perform or authorize this action, your credentials may be compromised. Please immediately reset your account password via the <a href="https://www.animenationindia.online/signin" target="_blank">Sign-in Portal</a> and alert our security desk at <a href="mailto:animenationindia.support@gmail.com">animenationindia.support@gmail.com</a>.
        </div>
      </div>
      <div class="footer">
        <div class="footer-links">
          <a href="https://www.animenationindia.online" target="_blank">Portal Home</a> &bull;
          <a href="https://www.animenationindia.online/my-list" target="_blank">My Watchlist</a> &bull;
          <a href="https://www.animenationindia.online/profile" target="_blank">Security Settings</a> &bull;
          <a href="mailto:animenationindia.support@gmail.com">Help Desk</a>
        </div>
        <p class="footer-copy">
          This is an automated transmission dispatched by Anime Nation India Auth Guard.<br>
          To safeguard your identity and custom libraries, never forward this message to third parties.<br>
          &copy; ${currentYear} Anime Nation India. All rights reserved. Registered Anime Community &amp; Media Platform.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

// =========================================================================
// 💬 OFFICIAL SUPPORT DESK DISPATCH TEMPLATE
// =========================================================================

export function getAdminReplyEmailTemplate({
  userName,
  subject,
  message,
  replyText,
}: {
  userName: string;
  subject: string;
  message: string;
  replyText: string;
}): { subject: string; html: string } {
  const currentYear = new Date().getFullYear();
  const emailSubject = `[Support Desk] Re: ${subject}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${emailSubject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #060710;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #e4e4e7;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #060710;
      padding: 30px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0d0e1f;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
    }
    .accent-bar {
      height: 4px;
      width: 100%;
      background: linear-gradient(90deg, #ff4dd2 0%, #8b5cf6 100%);
    }
    .header {
      padding: 36px 32px 24px 32px;
      text-align: center;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0) 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.22em;
      color: #ffffff;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #71717a;
      text-transform: uppercase;
      margin: 0 0 16px 0;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(255, 77, 210, 0.08);
      border: 1px solid rgba(255, 77, 210, 0.4);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: #ff4dd2;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .heading {
      font-size: 22px;
      font-weight: 900;
      color: #ffffff;
      margin: 0;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 14px 0;
    }
    .lead-text {
      font-size: 14px;
      color: #d4d4d8;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .reply-card {
      background: linear-gradient(180deg, #131428 0%, #0d0e1f 100%);
      border-left: 4px solid #ff4dd2;
      border-radius: 16px;
      padding: 22px 24px;
      margin: 20px 0;
      color: #ffffff;
      font-size: 14px;
      line-height: 1.7;
      white-space: pre-line;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .orig-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      padding: 16px 20px;
      margin-top: 24px;
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.6;
    }
    .footer {
      background-color: #080914;
      padding: 28px 32px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .footer-links {
      font-size: 12px;
      font-weight: 600;
      color: #71717a;
      margin-bottom: 14px;
    }
    .footer-links a {
      color: #a1a1aa;
      text-decoration: none;
      margin: 0 8px;
    }
    .footer-links a:hover {
      color: #ffffff;
    }
    .footer-copy {
      font-size: 11px;
      color: #52525b;
      line-height: 1.6;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="accent-bar"></div>
      <div class="header">
        <p class="brand-title">ANIME NATION INDIA</p>
        <p class="brand-sub">CUSTOMER RELATIONS &amp; SUPPORT DESK</p>
        <div class="badge">OFFICIAL SUPPORT DISPATCH</div>
        <h1 class="heading">Support Desk Response</h1>
      </div>
      <div class="content">
        <p class="greeting">Hello ${userName},</p>
        <p class="lead-text">
          Thank you for contacting the Anime Nation India Help Desk. A member of our community operations team has reviewed your inquiry and provided the following official response:
        </p>

        <div class="reply-card">${replyText}</div>

        <div class="orig-card">
          <strong style="color: #ffffff; display: block; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;">
            Your Original Inquiry (${subject}):
          </strong>
          <span style="color: #71717a;">${message}</span>
        </div>
      </div>
      <div class="footer">
        <div class="footer-links">
          <a href="https://www.animenationindia.online" target="_blank">Portal Home</a> &bull;
          <a href="https://www.animenationindia.online/my-list" target="_blank">My Watchlist</a> &bull;
          <a href="https://www.animenationindia.online/profile" target="_blank">Security Settings</a> &bull;
          <a href="mailto:animenationindia.support@gmail.com">Help Desk</a>
        </div>
        <p class="footer-copy">
          Anime Nation India Support Desk &bull; Official Community Portal: <a href="https://www.animenationindia.online" style="color: #ff4dd2; text-decoration: none;">animenationindia.online</a><br>
          &copy; ${currentYear} Anime Nation India. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return { subject: emailSubject, html };
}
