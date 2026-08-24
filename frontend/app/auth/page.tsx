'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AuthRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup' || mode === 'register') {
      router.replace('/signup');
    } else {
      router.replace('/signin');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#050716] flex flex-col items-center justify-center text-white gap-3">
      <Loader2 className="w-10 h-10 text-[#ff4dd2] animate-spin" />
      <p className="text-xs text-gray-400 font-semibold tracking-widest uppercase">Connecting to Anime Nation...</p>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050716] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-[#ff4dd2] animate-spin" />
      </div>
    }>
      <AuthRedirectContent />
    </Suspense>
  );
}
