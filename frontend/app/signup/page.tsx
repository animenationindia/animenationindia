'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { requestSignupOtp, verifySignupOtpAndCreateUser } from '@/app/actions/auth';
import SocialAuthButtons from '@/components/SocialAuthButtons';

export default function SignUpPage() {
  const router = useRouter();

  // Steps: 'form' | 'otp'
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Resend Countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-400' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(password);

  // Step 1: Request 6-digit OTP
  const handleRequestSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name or nickname.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      setError('Please accept the Guidelines & Privacy Policy.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await requestSignupOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to dispatch verification email.');
      }

      setStep('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification dispatch.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Create Account
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await verifySignupOtpAndCreateUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        code: otpCode.trim(),
      });

      if (!res.success || !res.token || !res.user) {
        throw new Error(res.error || 'Verification failed. Please try again.');
      }

      // Save user session
      localStorage.setItem('user_token', res.token);
      localStorage.setItem('user_id', res.user.id);
      localStorage.setItem('user_name', res.user.name);
      localStorage.setItem('user_email', res.user.email);
      localStorage.setItem('user_role', res.user.role || 'user');
      window.dispatchEvent(new Event('auth-change'));

      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
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
              {step === 'form' ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              {step === 'form'
                ? 'Join to sync your watchlist, ratings & custom vaults.'
                : `A 6-digit code has been sent to ${email}`}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-300 mb-4 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: REGISTRATION FORM */}
          {step === 'form' ? (
            <form onSubmit={handleRequestSignupOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Full Name / Username
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3.5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-[#121327] text-white text-xs outline-none focus:border-[#ff4dd2] focus:bg-[#161730] transition placeholder-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
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

                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className={`w-full h-11 pl-10 pr-10 rounded-xl border bg-[#121327] text-white text-xs outline-none transition placeholder-gray-600 ${
                      confirmPassword === ''
                        ? 'border-white/10 focus:border-[#ff4dd2] focus:bg-[#161730]'
                        : confirmPassword === password
                        ? 'border-emerald-500/60 focus:border-emerald-400 bg-emerald-500/5'
                        : 'border-rose-500/60 focus:border-rose-400 bg-rose-500/5'
                    }`}
                  />
                  {confirmPassword !== '' && (
                    <div className="absolute right-3.5">
                      {confirmPassword === password ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : (
                        <AlertCircle size={15} className="text-rose-400" />
                      )}
                    </div>
                  )}
                </div>
                {confirmPassword !== '' && (
                  <p className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1 ${
                    confirmPassword === password ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {confirmPassword === password ? (
                      <><CheckCircle2 size={11} /> Passwords match</>
                    ) : (
                      <><AlertCircle size={11} /> Passwords do not match</>
                    )}
                  </p>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="rounded border-white/20 bg-[#121327] text-[#ff4dd2] focus:ring-0 cursor-pointer"
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="/guidelines" className="text-[#ff4dd2] hover:underline">
                      Guidelines
                    </Link>{' '}
                    &amp;{' '}
                    <Link href="/privacy" className="text-gray-300 hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-indigo-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-[#ff4dd2]/20 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with Email OTP</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT EMAIL OTP VERIFICATION */
            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Code sent to:</p>
                  <p className="text-[11px] text-gray-300">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-xs text-[#ff4dd2] hover:underline font-bold"
                >
                  Edit Info
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
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full h-12 rounded-xl border border-white/15 bg-[#121327] text-center font-orbitron text-xl font-bold tracking-[0.4em] text-white outline-none focus:border-[#ff4dd2]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Didn't get code?</span>
                {resendCooldown > 0 ? (
                  <span className="text-gray-500 font-semibold">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestSignupOtp}
                    className="text-[#ff4dd2] hover:underline font-bold"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-emerald-500 text-black font-extrabold text-xs tracking-wider uppercase shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Create Account</span>
                    <CheckCircle2 size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social Registrations */}
          <SocialAuthButtons mode="signup" />

          {/* Switch to Sign In */}
          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link href="/signin" className="font-bold text-[#ff4dd2] hover:underline">
                Sign in
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
    </div>
  );
}
