'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight, ShieldCheck, Sparkles, Lock, Mail } from 'lucide-react';
import { BACKEND_URL } from '@/lib/config';
import Image from 'next/image';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter(); 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password. Please try again.');
      }
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_name', data.user.username);
      localStorage.setItem('user_id', data.user.id || data.user._id);
      window.dispatchEvent(new Event('auth-change'));
      router.push('/home'); 
    } catch (error: any) {
      setErrorMsg(error.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Password reset link is not active for self-hosted accounts. Please contact site support.');
  };

  const inputVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: (custom: number) => ({
      opacity: 1, y: 0,
      transition: { delay: custom * 0.08, duration: 0.35, ease: 'easeOut' }
    })
  };

  return (
    <div className="min-h-screen flex bg-[#050716] selection:bg-[#00f0ff] selection:text-black">
      
      {/* 🌌 Left Side: Epic Shadow Monarch / Hunter Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#090a1a] items-center justify-center overflow-hidden border-r border-white/5">
        <Image 
          src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-6B1sLz8Wd5iS.jpg" 
          alt="Solo Leveling Hunter Wallpaper" 
          fill
          priority
          className="object-cover opacity-50 mix-blend-luminosity scale-105 hover:scale-110 transition-transform duration-[12s]"
        />
        
        {/* Deep ambient dark gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#050716]" />
        
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f0ff]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#a855f7]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 p-12 w-full max-w-lg mt-auto mb-16 text-left">
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
            
            <div className="inline-flex items-center gap-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <ShieldCheck size={14} /> Verified Otaku Hunter Access
            </div>

            <Link href="/" className="block font-orbitron text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-white to-[#ff4dd2] tracking-widest drop-shadow-[0_0_25px_rgba(0,240,255,0.4)]">
              ANI
            </Link>

            <h1 className="text-white text-3xl xl:text-4xl font-extrabold mt-4 leading-tight">
              Welcome Back, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff4dd2]">Hunter.</span>
            </h1>

            <p className="text-gray-400 mt-4 text-sm leading-relaxed font-medium">
              Resume your anime voyage across the deep space universe. Your personalized watchlist, 4K streaming links, and custom playlists are waiting.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 pt-6 border-t border-white/10 text-xs text-gray-300 font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" /> Realtime Syncing
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff4dd2] animate-pulse" /> Ask Ani AI Support
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" /> Custom Watchlists
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 100% Ad-Free UI
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* ✨ Right Side: Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative px-4 sm:px-8 lg:px-12 py-10 sm:py-16 pb-24 lg:pb-16">
        
        {/* Background Aura */}
        <div className="absolute top-12 right-12 w-96 h-96 bg-[#00f0ff]/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-12 left-12 w-96 h-96 bg-[#ff4dd2]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          
          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden inline-block mb-4">
              <Link href="/" className="font-orbitron text-4xl text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ff4dd2] tracking-widest">
                ANI
              </Link>
            </div>
            <h2 className="text-white text-3xl font-black mb-2 flex items-center justify-center lg:justify-start gap-2">
              Sign In <span className="text-[#00f0ff] text-2xl">⚡</span>
            </h2>
            <p className="text-gray-400 text-sm font-medium">
              Enter your credentials to enter the Anime Nation network.
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 text-red-400 p-4 rounded-2xl mb-6 text-sm flex items-start gap-3 font-medium border border-red-500/20 shadow-lg"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            
            {/* Email Field */}
            <motion.div custom={1} variants={inputVariants} initial="hidden" animate="visible">
              <label className="text-gray-200 text-xs font-bold mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Mail size={13} className="text-[#00f0ff]" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="hunter@animenation.in"
                className="w-full p-4 rounded-2xl border border-white/10 bg-[#0d0f24] text-white text-sm outline-none transition-all focus:border-[#00f0ff] focus:bg-[#070918] focus:shadow-[0_0_20px_rgba(0,240,255,0.2)] placeholder-gray-600"
              />
            </motion.div>

            {/* Password Field */}
            <motion.div custom={2} variants={inputVariants} initial="hidden" animate="visible" className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-200 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock size={13} className="text-[#ff4dd2]" /> Password
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="text-gray-400 hover:text-[#00f0ff] text-xs font-bold transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full py-4 pl-4 pr-12 rounded-2xl border border-white/10 bg-[#0d0f24] text-white text-sm outline-none transition-all focus:border-[#ff4dd2] focus:bg-[#070918] focus:shadow-[0_0_20px_rgba(255,77,210,0.2)] placeholder-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Remember Me */}
            <motion.div custom={2.5} variants={inputVariants} initial="hidden" animate="visible" className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-300 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-[#0d0f24] text-[#00f0ff] focus:ring-0 cursor-pointer"
                />
                Keep me signed in
              </label>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              custom={3} variants={inputVariants} initial="hidden" animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full p-4 mt-2 rounded-2xl font-black text-sm flex justify-center items-center gap-2 transition-all bg-gradient-to-r from-[#00f0ff] via-[#a855f7] to-[#ff4dd2] text-black hover:text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              {loading ? (
                 <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Switch to Sign Up */}
          <motion.div custom={4} variants={inputVariants} initial="hidden" animate="visible" className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="text-gray-400">New to Anime Nation India?</span>
            <Link
              href="/signup"
              className="font-extrabold text-[#00f0ff] hover:text-white transition-colors bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 px-4 py-2 rounded-xl border border-[#00f0ff]/30 shadow-md flex items-center gap-1.5"
            >
              <Sparkles size={14} /> Join Clan (Sign Up)
            </Link>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
