'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WatchlistRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-list');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050716] text-white">
      <div className="w-10 h-10 border-4 border-[#ff4dd2]/30 border-t-[#ff4dd2] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(255,77,210,0.5)]" />
      <p className="text-xs font-bold text-gray-400">Opening My List &amp; Folders...</p>
    </div>
  );
}
