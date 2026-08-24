'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Sparkles, User, Mail, Lock, CheckCircle2, Award } from 'lucide-react';
import { BACKEND_URL } from '@/lib/config';
import Image from 'next/image';
import Link from 'next/link';

const AVATAR_OPTIONS = [
  { id: 'hunter', name: 'Hunter', emoji: '⚔️', bg: 'from-amber-500 to-orange-600' },
  { id: 'shinobi', name: 'Shinobi', emoji: '⚡', bg: 'from-blue-500 to-cyan-400' },
  { id: 'pirate', name: 'Pirate', emoji: '👒', bg: 'from-red-500 to-rose-600' },
  { id: 'mage', name: 'Mage', emoji: '🪄', bg: 'from-purple-500 to-indigo-600' },
  { id: 'monarch', name: 'Monarch', emoji: '👑', bg: 'from-fuchsia-500 to-pink-600' }
];

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].id);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter(); 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    return { score: 3, label: 'Super Strong 🛡️', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(password);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMsg('Please accept the Terms of Service to create an account.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username: username.trim() || email.split('@')[0]
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed. Please try a different email or username.');
      }
      
      // Auto login immediately
      const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem('user_token', loginData.token);
        localStorage.setItem('user_name', loginData.user.username);
        localStorage.setItem('user_id', loginData.user.id || loginData.user._id);
        window.dispatchEvent(new Event('auth-change'));
      }
      
      router.push('/home');
    } catch (error: any) {
      setErrorMsg(error.message || 'An unexpected error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  const inputVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: (custom: number) => ({
      opacity: 1, y: 0,
      transition: { delay: custom * 0.08, duration: 0.35, ease: 'easeOut' }
    })
  };

  return (
    <div className="min-h-screen flex bg-[#050716] selection:bg-[#ff4dd2] selection:text-white">
      
      {/* 🔮 Left Side: Vibrant Otaku Clan Awakening Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#100d28] items-center justify-center overflow-hidden border-r border-white/5">
        <Image 
          src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-n14tlv4bkBzs.jpg" 
          alt="Otaku Clan Adventure Wallpaper" 
          fill
          priority
          className="object-cover opacity-55 scale-105 hover:scale-110 transition-transform duration-[12s]"
        />
        
        {/* Atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#050716]" />
        
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff4dd2]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#a855f7]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 p-12 w-full max-w-lg mt-auto mb-16 text-left">
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
            
            <div className="inline-flex items-center gap-2 bg-[#ff4dd2]/15 border border-[#ff4dd2]/40 text-[#ff4dd2] px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(255,77,210,0.3)]">
              <Award size={14} /> Official Otaku Registration
            </div>

            <Link href="/" className="block font-orbitron text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] via-white to-[#00f0ff] tracking-widest drop-shadow-[0_0_25px_rgba(255,77,210,0.4)]">
              ANI
            </Link>

            <h1 className="text-white text-3xl xl:text-4xl font-extrabold mt-4 leading-tight">
              Join the Ultimate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] via-[#a855f7] to-[#00f0ff]">Indian Otaku Clan.</span>
            </h1>

            <p className="text-gray-400 mt-4 text-sm leading-relaxed font-medium">
              Create your free account today. Track everything you watch, chat with Ask Ani AI, and unlock HD anime episode streaming with zero hassles.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 pt-6 border-t border-white/10 text-xs text-gray-300 font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#ff4dd2]" /> 100% Free Forever
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#ff4dd2]" /> Ask Ani AI Assistant
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#ff4dd2]" /> Unlimited Watchlists
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#ff4dd2]" /> Clean Cyberpunk UI
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* ✨ Right Side: Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative px-4 sm:px-8 lg:px-12 py-8 sm:py-14 pb-24 lg:pb-14">
        
        {/* Background Aura */}
        <div className="absolute top-12 right-12 w-96 h-96 bg-[#ff4dd2]/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-12 left-12 w-96 h-96 bg-[#a855f7]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          
          <div className="mb-7 text-center lg:text-left">
            <div className="lg:hidden inline-block mb-4">
              <Link href="/" className="font-orbitron text-4xl text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] to-[#00f0ff] tracking-widest">
                ANI
              </Link>
            </div>
            <h2 className="text-white text-3xl font-black mb-2 flex items-center justify-center lg:justify-start gap-2">
              Create Account <span className="text-[#ff4dd2] text-2xl">✨</span>
            </h2>
            <p className="text-gray-400 text-sm font-medium">
              Join thousands of otakus in India&apos;s premier anime portal.
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 text-red-400 p-4 rounded-2xl mb-5 text-sm flex items-start gap-3 font-medium border border-red-500/20 shadow-lg"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            
            {/* Starter Avatar Picker */}
            <motion.div custom={0.5} variants={inputVariants} initial="hidden" animate="visible">
              <label className="text-gray-200 text-xs font-bold mb-2 flex items-center justify-between uppercase tracking-wider">
                <span>Choose Starter Badge</span>
                <span className="text-[11px] text-[#ff4dd2] font-semibold">Avatar Badge</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`flex-1 py-2.5 rounded-xl border text-base flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      selectedAvatar === av.id
                        ? 'border-[#ff4dd2] bg-[#ff4dd2]/20 shadow-[0_0_15px_rgba(255,77,210,0.35)] scale-105'
                        : 'border-white/10 bg-[#0d0f24] hover:border-white/30 text-gray-400'
                    }`}
                  >
                    <span>{av.emoji}</span>
                    <span className="text-[10px] font-bold text-gray-300">{av.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Username Field */}
            <motion.div custom={1} variants={inputVariants} initial="hidden" animate="visible">
              <label className="text-gray-200 text-xs font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <User size={13} className="text-[#ff4dd2]" /> Otaku Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="ShadowKnight07"
                className="w-full p-3.5 rounded-2xl border border-white/10 bg-[#0d0f24] text-white text-sm outline-none transition-all focus:border-[#ff4dd2] focus:bg-[#070918] focus:shadow-[0_0_20px_rgba(255,77,210,0.2)] placeholder-gray-600"
              />
            </motion.div>

            {/* Email Field */}
            <motion.div custom={1.5} variants={inputVariants} initial="hidden" animate="visible">
              <label className="text-gray-200 text-xs font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Mail size={13} className="text-[#00f0ff]" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="otaku@animenation.in"
                className="w-full p-3.5 rounded-2xl border border-white/10 bg-[#0d0f24] text-white text-sm outline-none transition-all focus:border-[#00f0ff] focus:bg-[#070918] focus:shadow-[0_0_20px_rgba(0,240,255,0.2)] placeholder-gray-600"
              />
            </motion.div>

            {/* Password Field */}
            <motion.div custom={2} variants={inputVariants} initial="hidden" animate="visible" className="relative">
              <label className="text-gray-200 text-xs font-bold mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Lock size={13} className="text-[#a855f7]" /> Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min 6 characters"
                  className="w-full py-3.5 pl-4 pr-12 rounded-2xl border border-white/10 bg-[#0d0f24] text-white text-sm outline-none transition-all focus:border-[#a855f7] focus:bg-[#070918] focus:shadow-[0_0_20px_rgba(168,85,247,0.2)] placeholder-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                  </div>
                  <span className="text-[11px] font-bold text-gray-300">{strength.label}</span>
                </div>
              )}
            </motion.div>

            {/* Terms Checkbox */}
            <motion.div custom={2.5} variants={inputVariants} initial="hidden" animate="visible" className="pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-300 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="rounded border-white/20 bg-[#0d0f24] text-[#ff4dd2] focus:ring-0 cursor-pointer"
                />
                <span>
                  I agree to the <Link href="/guidelines" className="text-[#ff4dd2] hover:underline">Guidelines</Link> & <Link href="/privacy" className="text-[#00f0ff] hover:underline">Privacy Policy</Link>
                </span>
              </label>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              custom={3} variants={inputVariants} initial="hidden" animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full p-4 mt-2 rounded-2xl font-black text-sm flex justify-center items-center gap-2 transition-all bg-gradient-to-r from-[#ff4dd2] via-[#a855f7] to-[#00f0ff] text-black hover:text-white hover:shadow-[0_0_30px_rgba(255,77,210,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              {loading ? (
                 <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <>
                  <span>Join Otaku Clan (Sign Up)</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch to Sign In */}
          <motion.div custom={4} variants={inputVariants} initial="hidden" animate="visible" className="mt-7 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="text-gray-400">Already a clan member?</span>
            <Link
              href="/signin"
              className="font-extrabold text-[#ff4dd2] hover:text-white transition-colors bg-[#ff4dd2]/10 hover:bg-[#ff4dd2]/20 px-4 py-2 rounded-xl border border-[#ff4dd2]/30 shadow-md flex items-center gap-1.5"
            >
              <Sparkles size={14} /> Sign In Here
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
