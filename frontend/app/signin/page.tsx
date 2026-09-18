'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Zap,
  CheckCircle2,
  X,
  RefreshCw,
  AlertCircle,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import {
  passwordLoginStep1,
  verifyTwoFactorAndLogin,
  verifyBackupCodeAndLogin,
  otpLoginVerifyAndAuthenticate,
  requestLoginOtp,
  resendTwoFactorOtp,
  requestPasswordResetOtp,
  verifyOtpAndResetPassword,
} from '@/app/actions/auth';
import SocialAuthButtons from '@/components/SocialAuthButtons';

export default function SignInPage() {
  const router = useRouter();

  // Mode: 'password' | 'otp'
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Login State
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // 2FA Verification Step State
  const [twoFAStep, setTwoFAStep] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAMode, setTwoFAMode] = useState<'otp' | 'backup'>('otp');
  const [backupCode, setBackupCode] = useState('');
  const [twoFAResendCooldown, setTwoFAResendCooldown] = useState(60);

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'code'>('email');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Countdown timer for regular OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Countdown timer for 2FA OTP resend
  useEffect(() => {
    if (twoFAResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setTwoFAResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [twoFAResendCooldown]);

  const saveSessionAndRedirect = (data: { token: string; user: any }) => {
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_id', data.user.id);
    localStorage.setItem('user_name', data.user.name);
    localStorage.setItem('user_email', data.user.email);
    localStorage.setItem('user_role', data.user.role || 'user');
    if (data.user.avatar) {
      localStorage.setItem('user_avatar', data.user.avatar);
    }
    window.dispatchEvent(new Event('auth-change'));
    router.push('/home');
  };

  // 1. Password Login (with 2FA intercept)
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await passwordLoginStep1({ email, password });
      if (!res.success) {
        throw new Error(res.error || 'Invalid email or password. Please try again.');
      }

      if (res.requires2fa) {
        // User has 2FA enabled! Switch to 2FA verification step
        setTwoFAEmail(res.twoFactorEmail || email);
        setTwoFAStep(true);
        setTwoFAResendCooldown(60);
        return;
      }

      if (!res.token || !res.user) {
        throw new Error('Authentication succeeded but session could not be established.');
      }

      saveSessionAndRedirect({ token: res.token, user: res.user });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Request OTP Code for Passwordless Login
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await requestLoginOtp(email);
      if (!res.success) {
        throw new Error(res.error || 'Failed to send login code.');
      }
      setOtpStep('verify');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch 6-digit OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify Passwordless OTP Code (with 2FA intercept)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtpCode.trim() || loginOtpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const res = await otpLoginVerifyAndAuthenticate({
        email,
        code: loginOtpCode.trim(),
      });
      if (!res.success) {
        throw new Error(res.error || 'Invalid or expired OTP code.');
      }

      if (res.requires2fa) {
        // User has 2FA enabled! Switch to 2FA verification step
        setTwoFAEmail(res.twoFactorEmail || email);
        setTwoFAStep(true);
        setTwoFAResendCooldown(60);
        return;
      }

      if (!res.token || !res.user) {
        throw new Error('Authentication succeeded but session could not be established.');
      }

      saveSessionAndRedirect({ token: res.token, user: res.user });
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Verify 2FA (OTP or Backup Recovery Code)
  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (twoFAMode === 'otp') {
        if (!twoFACode.trim() || twoFACode.trim().length !== 6) {
          throw new Error('Please enter the full 6-digit 2FA code.');
        }
        const res = await verifyTwoFactorAndLogin({
          email,
          code: twoFACode.trim(),
          twoFactorEmail: twoFAEmail,
        });
        if (!res.success || !res.token || !res.user) {
          throw new Error(res.error || 'Invalid or expired 2FA code.');
        }
        saveSessionAndRedirect({ token: res.token, user: res.user });
      } else {
        // Backup recovery code
        if (!backupCode.trim()) {
          throw new Error('Please enter an emergency backup recovery code.');
        }
        const res = await verifyBackupCodeAndLogin({
          email,
          backupCode: backupCode.trim(),
        });
        if (!res.success || !res.token || !res.user) {
          throw new Error(res.error || 'Invalid emergency backup code.');
        }
        saveSessionAndRedirect({ token: res.token, user: res.user });
      }
    } catch (err: any) {
      setError(err.message || '2FA verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend 2FA OTP
  const handleResendTwoFactor = async () => {
    if (twoFAResendCooldown > 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await resendTwoFactorOtp(email);
      if (res.success) {
        setTwoFAResendCooldown(60);
      } else {
        setError(res.error || 'Failed to resend 2FA code.');
      }
    } catch {
      setError('Network error resending 2FA code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Request Password Reset Code
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await requestPasswordResetOtp(forgotEmail);
      if (!res.success) {
        throw new Error(res.error || 'No account found with this email.');
      }
      setForgotStep('code');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // 5. Confirm Password Reset
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotCode.length !== 6 || !forgotNewPass) {
      setForgotError('Please enter the 6-digit code and a new password.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);

    try {
      const res = await verifyOtpAndResetPassword({
        email: forgotEmail,
        code: forgotCode.trim(),
        newPassword: forgotNewPass,
        isLoginFlow: true,
      });
      if (!res.success) {
        throw new Error(res.error || 'Password reset failed.');
      }
      setForgotSuccess('Password updated successfully!');
      setTimeout(() => {
        setForgotOpen(false);
        setForgotStep('email');
        setForgotSuccess(null);
        setForgotCode('');
        setForgotNewPass('');

        if (res.requires2fa) {
          // If 2FA is on, immediately show 2FA verification step
          setEmail(forgotEmail);
          setTwoFAEmail(res.twoFactorEmail || forgotEmail);
          setTwoFAStep(true);
          setTwoFAResendCooldown(60);
          return;
        }

        if (res.token && res.user) {
          // Direct Login if 2FA is off
          saveSessionAndRedirect({ token: res.token, user: res.user });
        }
      }, 1000);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050716] px-4 py-20 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#ff4dd2]/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card Container */}
        <div className="rounded-3xl border border-white/10 bg-[#0c0d1e]/90 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,77,210,0.5)] border border-[#ff4dd2]/30 bg-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Image src="/ani-logo.png" alt="Logo" fill sizes="40px" priority className="object-contain" />
              </div>
              <span className="font-orbitron text-lg font-black text-white tracking-wide">
                ANIME NATION
              </span>
            </Link>

            <h1 className="text-2xl font-black text-white font-orbitron uppercase tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Sign in to access your custom folders, watchlist, and reviews.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300 mb-4 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {twoFAStep ? (
            /* ========================================================================= */
            /* 🛡️ TWO-FACTOR AUTHENTICATION (2FA) STEP                                   */
            /* ========================================================================= */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs">
                <ShieldCheck className="shrink-0 text-cyan-400" size={24} />
                <div className="leading-snug">
                  <strong className="block text-white font-bold uppercase tracking-wider">Two-Factor Security Shield</strong>
                  <span className="text-[11px] text-zinc-300">
                    Dispatched to <span className="font-mono text-cyan-300 font-semibold">{twoFAEmail}</span>
                  </span>
                </div>
              </div>

              {/* Mode Switcher inside 2FA: 6-Digit OTP vs Emergency Backup Code */}
              <div className="flex p-1 rounded-2xl bg-[#121327] border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setTwoFAMode('otp');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    twoFAMode === 'otp'
                      ? 'bg-cyan-500 text-black font-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Zap size={13} /> 6-Digit Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFAMode('backup');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    twoFAMode === 'backup'
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <KeyRound size={13} /> Backup Code
                </button>
              </div>

              <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                {twoFAMode === 'otp' ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 text-center">
                      Enter 6-Digit Security Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full h-12 rounded-xl border border-cyan-500/40 bg-[#121327] text-center font-orbitron text-xl font-bold tracking-[0.4em] text-white outline-none focus:border-cyan-400 shadow-inner"
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                      <span>Didn&apos;t receive code?</span>
                      {twoFAResendCooldown > 0 ? (
                        <span className="text-gray-500 font-semibold">Resend in {twoFAResendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendTwoFactor}
                          className="text-cyan-400 hover:underline font-bold"
                        >
                          Resend 2FA Code
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Emergency Recovery Code (8-Codes Format)
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value)}
                      placeholder="ANI-XXXX-XXXX"
                      className="w-full h-11 px-4 rounded-xl border border-amber-500/40 bg-[#121327] text-white font-mono text-sm tracking-wider outline-none focus:border-amber-400"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                      Enter any of your 8 backup codes. Once used, the code will be automatically renewed with a fresh one.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (twoFAMode === 'otp' ? twoFACode.length !== 6 : !backupCode.trim())}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-black font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-cyan-500/20 hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying 2FA...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate &amp; Sign In</span>
                      <ShieldCheck size={16} />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFAStep(false);
                      setTwoFACode('');
                      setBackupCode('');
                      setError(null);
                    }}
                    className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                  >
                    ← Cancel and return to sign in
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Mode Switcher Tabs */}
              <div className="flex p-1 rounded-2xl bg-[#121327] border border-white/5 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('password');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    loginMode === 'password'
                      ? 'bg-[#ff4dd2] text-black shadow-md font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Lock size={13} /> Password
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('otp');
                    setError(null);
                    setOtpStep('request');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    loginMode === 'otp'
                      ? 'bg-gradient-to-r from-indigo-600 to-[#ff4dd2] text-white shadow-md font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Zap size={13} /> 6-Digit Email OTP
                </button>
              </div>

              {/* Form Content */}
              {loginMode === 'password' ? (
                <form onSubmit={handlePasswordSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={16} className="absolute left-3.5 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-[#121327] text-white text-xs outline-none focus:border-[#ff4dd2] focus:bg-[#161730] transition placeholder-gray-600"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotOpen(true);
                          setForgotEmail(email);
                        }}
                        className="text-xs text-[#ff4dd2] hover:underline font-semibold cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <Lock size={16} className="absolute left-3.5 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-11 pl-10 pr-10 rounded-xl border border-white/10 bg-[#121327] text-white text-xs outline-none focus:border-[#ff4dd2] focus:bg-[#161730] transition placeholder-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-gray-500 hover:text-white transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-indigo-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-[#ff4dd2]/20 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {otpStep === 'request' ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                          Enter Email for 6-Digit Login Code
                        </label>
                        <div className="relative flex items-center">
                          <Mail size={16} className="absolute left-3.5 text-gray-500" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-[#121327] text-white text-xs outline-none focus:border-indigo-400 focus:bg-[#161730] transition placeholder-gray-600"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        A 6-digit security code will be sent to your email from Anime Nation India.
                      </p>

                      <button
                        type="submit"
                        disabled={isLoading || !email.trim()}
                        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-md transition disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Sending Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Send 6-Digit Code</span>
                            <Zap size={15} />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex items-center justify-between">
                        <span className="text-gray-300 truncate max-w-[240px]">{email}</span>
                        <button
                          type="button"
                          onClick={() => setOtpStep('request')}
                          className="text-xs text-[#ff4dd2] hover:underline font-bold"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5 text-center">
                          Enter 6-Digit Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          autoFocus
                          value={loginOtpCode}
                          onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full h-12 rounded-xl border border-white/15 bg-[#121327] text-center font-orbitron text-xl font-bold tracking-[0.4em] text-white outline-none focus:border-[#ff4dd2]"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Didn&apos;t get code?</span>
                        {resendCooldown > 0 ? (
                          <span className="text-gray-500 font-semibold">Resend in {resendCooldown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRequestOtp}
                            className="text-[#ff4dd2] hover:underline font-bold"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || loginOtpCode.length !== 6}
                        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-indigo-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg transition disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify &amp; Sign In</span>
                            <CheckCircle2 size={16} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {/* Social Logins */}
          <SocialAuthButtons mode="signin" />

          {/* Switch to Sign Up */}
          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <p className="text-xs text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-bold text-[#ff4dd2] hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to home / Continue as guest</span>
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0c0d1e] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-[#ff4dd2]" />
                <h3 className="text-xs font-black font-orbitron uppercase text-white">
                  Reset Password
                </h3>
              </div>
              <button
                onClick={() => setForgotOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {forgotError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 'email' ? (
              <form onSubmit={handleRequestForgotOtp} className="space-y-3.5">
                <p className="text-xs text-gray-400">
                  Enter your email to receive a 6-digit password reset code.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#121327] text-white text-xs outline-none focus:border-[#ff4dd2]"
                />
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-indigo-600 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmResetPassword} className="space-y-3">
                <p className="text-xs text-gray-400">
                  Enter the 6-digit code sent to <strong className="text-white">{forgotEmail}</strong> and your new password.
                </p>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#121327] text-white text-center font-orbitron text-base font-bold tracking-widest outline-none focus:border-[#ff4dd2]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full h-10 px-3.5 rounded-xl border border-white/10 bg-[#121327] text-white text-xs outline-none focus:border-[#ff4dd2]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || forgotCode.length !== 6 || !forgotNewPass}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-[#ff4dd2] text-white font-bold text-xs cursor-pointer disabled:opacity-50 mt-1"
                >
                  {forgotLoading ? 'Saving...' : 'Confirm & Save Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
