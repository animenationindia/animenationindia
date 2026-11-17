'use client';

import { useState, useEffect } from 'react';
import HomeNewsSection from './HomeNewsSection';
import type { NewsItem } from '../lib/getNews';

export default function HomeNewsClient() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadNews() {
      try {
        const res = await fetch('/api/news');
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json?.news && Array.isArray(json.news)) {
          setNews(json.news);
        }
      } catch (err) {
        console.warn('[HomeNewsClient] Could not load news:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNews();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || news.length === 0) return null;

  return (
    <div className="flex flex-col gap-14">
      <HomeNewsSection news={news} />
    </div>
  );
}
