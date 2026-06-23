'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { BACKEND_URL } from '../../lib/config';
import { Orbitron } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['800', '900'] });

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  
  const router = useRouter(); 

  // Force scroll to top on page mount/load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Login failed!');
        }
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_name', data.user.username);
        localStorage.setItem('user_id', data.user.id || data.user._id);
        window.dispatchEvent(new Event('auth-change'));
        router.push('/home'); 
      } else {
        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username: username || email.split('@')[0] })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Registration failed!');
        }
        
        // Log in automatically after registration
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
        alert("Account created successfully! 🎉");
        router.push('/home');
      }
    } catch (error: any) {
      setErrorMsg(error.message || "An unexpected auth error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Password reset is not configured for self-hosted database accounts. Please contact the administrator.");
  };

  const inputVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: (custom: number) => ({
      opacity: 1, y: 0,
      transition: { delay: custom * 0.1, duration: 0.4, ease: "easeOut" }
    })
  };

  return (
    <div className="min-h-screen flex bg-[#050716] selection:bg-[#ff4dd2] selection:text-white">
      
      {/* 🌌 Left Side: Anime Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#121326] items-center justify-center overflow-hidden">
        {/* Dynamic Anime Wallpaper (Using high-res placeholder) */}
        <Image 
          src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-6B1sLz8Wd5iS.jpg" 
          alt="Anime Wallpaper" 
          fill
          className="object-cover opacity-60 mix-blend-screen transition-transform duration-[10s] hover:scale-110"
        />
        
        {/* Gradients to fade into the right panel */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-transparent to-[#050716]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#050716]" />
        
        <div className="relative z-10 p-12 w-full max-w-lg mt-auto mb-20 text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link href="/" className={`${orbitron.className} text-5xl text-[#ff4dd2] tracking-widest drop-shadow-[0_0_15px_rgba(255, 77, 210,0.5)]`}>
              ANI
            </Link>
            <p className="text-white text-3xl font-bold mt-4 leading-tight">
              Unlock the Ultimate <br/>
              <span className="text-[#ff4dd2]">Anime Experience.</span>
            </p>
            <p className="text-[#a0a0a0] mt-4 text-sm font-medium">
              Join thousands of otakus in the deep space network. Stream, track, and discover the best of anime seamlessly.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ✨ Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative px-6 sm:px-12 py-12">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#ff4dd2] opacity-10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#ff4dd2] opacity-5 blur-[150px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-white text-3xl font-black mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[#a0a0a0] text-sm font-medium">
              {isLogin ? 'Enter your details to access your account.' : 'Sign up to start building your watchlist.'}
            </p>
          </div>

          <AnimatePresence mode="popLayout">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-start gap-3 font-medium border border-red-500/20"
              >
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            
            <motion.div custom={1} variants={inputVariants} initial="hidden" animate="visible">
              <label className="text-white text-xs font-bold mb-2 block tracking-wide">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full p-4 rounded-xl border border-white/10 bg-[#121326] text-white text-sm outline-none transition-all focus:border-[#ff4dd2] focus:bg-[#111116] focus:shadow-[0_0_20px_rgba(255, 77, 210,0.15)] placeholder-gray-600"
              />
            </motion.div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  custom={1.5} variants={inputVariants} initial="hidden" animate="visible" exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-white text-xs font-bold mb-2 block tracking-wide mt-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={!isLogin}
                    placeholder="SpaceVoyager99"
                    className="w-full p-4 rounded-xl border border-white/10 bg-[#121326] text-white text-sm outline-none transition-all focus:border-[#ff4dd2] focus:bg-[#111116] focus:shadow-[0_0_20px_rgba(255, 77, 210,0.15)] placeholder-gray-600"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div custom={2} variants={inputVariants} initial="hidden" animate="visible" className="relative">
              <label className="text-white text-xs font-bold mb-2 block tracking-wide">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full py-4 pl-4 pr-12 rounded-xl border border-white/10 bg-[#121326] text-white text-sm outline-none transition-all focus:border-[#ff4dd2] focus:bg-[#111116] focus:shadow-[0_0_20px_rgba(255, 77, 210,0.15)] placeholder-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <AnimatePresence>
                {isLogin && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={loading}
                      className="text-[#a0a0a0] hover:text-[#ff4dd2] text-xs font-bold transition-colors hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.button
              custom={3} variants={inputVariants} initial="hidden" animate="visible"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full p-4 mt-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-lg cursor-pointer ${
                loading ? 'bg-[#ff4dd2]/50 text-white/70 cursor-not-allowed' : 'bg-[#ff4dd2] text-white hover:bg-[#ff4dd2] hover:shadow-[0_0_20px_rgba(255, 77, 210,0.4)]'
              }`}
            >
              {loading ? (
                 <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <motion.div custom={4} variants={inputVariants} initial="hidden" animate="visible" className="flex items-center justify-center lg:justify-start mt-8 gap-2 text-sm text-gray-400">
            <span>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} 
              className="text-white hover:text-[#ff4dd2] font-bold transition-colors cursor-pointer"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}