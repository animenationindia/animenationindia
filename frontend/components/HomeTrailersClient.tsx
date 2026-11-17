'use client';

import { useState, useEffect } from 'react';
import TrailerSlider from './TrailerSlider';
import { SliderSkeleton } from './SkeletonLoaders';

interface HomeTrailersClientProps {
  heroAnimeList?: any[];
}

export default function HomeTrailersClient({ heroAnimeList = [] }: HomeTrailersClientProps) {
  // Extract fallback trailers from hero list if available
  const fallbackTrailers = (heroAnimeList || [])
    .filter((a: any) => a.trailer && a.trailer.id)
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      trailer: { id: a.trailer.id, site: 'youtube', thumbnail: a.coverImage?.large || a.coverImage?.extraLarge },
      status: a.status,
      coverImage: a.coverImage,
      genres: a.genres,
    }));

  const [trailers, setTrailers] = useState<any[]>(fallbackTrailers);
  const [loading, setLoading] = useState(fallbackTrailers.length === 0);

  useEffect(() => {
    let isMounted = true;

    async function loadTrailers() {
      try {
        const res = await fetch('/api/trailers?limit=16&filter=all');
        if (!res.ok) throw new Error('Failed to fetch trailers');
        const json = await res.json();
        if (isMounted && json?.trailers && Array.isArray(json.trailers) && json.trailers.length > 0) {
          setTrailers(json.trailers);
        }
      } catch (err) {
        console.warn('[HomeTrailersClient] Using fallback trailers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTrailers();

    return () => {
      isMounted = false;
    };
  }, []);

  if (trailers.length === 0) {
    if (loading) return <SliderSkeleton title="Loading Official Trailers..." />;
    return null;
  }

  return <TrailerSlider trailers={trailers} />;
}
