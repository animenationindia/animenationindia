'use client';

import Image from 'next/image';
import { Orbitron } from 'next/font/google';
import { motion } from 'framer-motion';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['800', '900'] });

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] bg-[#050716] flex flex-col items-center justify-center overflow-hidden">
      {/* Background glowing effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#ff4dd2]/10 blur-[100px] rounded-full" />
      
      {/* Main Animation Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Sleek Professional Circular Spinner */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-6">
          <svg className="animate-spin w-full h-full text-white/10" viewBox="0 0 50 50">
            <circle
              className="path"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
              stroke="currentColor"
            />
          </svg>
          <svg className="animate-spin w-full h-full absolute top-0 left-0 text-[#ff4dd2]" viewBox="0 0 50 50" style={{ animationDuration: '1.5s', animationTimingFunction: 'ease-in-out' }}>
            <circle
              className="path"
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="4"
              strokeDasharray="90, 150"
              strokeDashoffset="0"
              strokeLinecap="round"
              stroke="currentColor"
            />
          </svg>
          
          {/* Pulsing Logo inside */}
          <div className="absolute inset-0 flex items-center justify-center">
             <Image src="/ani-logo.png" alt="Logo" width={32} height={32} priority className="object-contain animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* ANI Text */}
        <div className="flex flex-col items-center">
          <p className="text-gray-400 text-[10px] font-bold tracking-[0.4em] uppercase">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
