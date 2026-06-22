'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ScrollToResultsClient() {
  const searchParams = useSearchParams();
  const genreId = searchParams.get('genreId');

  useEffect(() => {
    if (genreId) {
      const timer = setTimeout(() => {
        const element = document.getElementById('results-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150); // slight delay to allow client-side hydration
      return () => clearTimeout(timer);
    }
  }, [genreId, searchParams]);

  return null;
}

export default function ScrollToResults() {
  return (
    <Suspense fallback={null}>
      <ScrollToResultsClient />
    </Suspense>
  );
}
