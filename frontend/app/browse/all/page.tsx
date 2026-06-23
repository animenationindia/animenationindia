'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, ArrowUpDown, Loader2 } from 'lucide-react';
import AnimeCard from '../../../components/AnimeCard';

const ANILIST_API_URL = 'https://graphql.anilist.co';

function BrowseAllAnimeContent() {
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  const searchParams = useSearchParams();
  
  // Filters and Sorts
  const [sort, setSort] = useState('POPULARITY_DESC');
  const [format, setFormat] = useState('ALL');

  // Sync state from query parameters
  useEffect(() => {
    const f = searchParams.get('format') || 'ALL';
    const s = searchParams.get('sort') || 'POPULARITY_DESC';
    setFormat(f);
    setSort(s);
  }, [searchParams]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasNextPage]
  );

  const fetchAnime = async (pageNum: number, currentSort: string, currentFormat: string) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const query = `
        query ($page: Int, $sort: [MediaSort], $format: MediaFormat) {
          Page(page: $page, perPage: 20) {
            pageInfo {
              hasNextPage
            }
            media(type: ANIME, sort: $sort, format: $format, isAdult: false) {
              id
              idMal
              title {
                english
                romaji
              }
              coverImage {
                large
              }
              genres
              averageScore
              episodes
              status
            }
          }
        }
      `;

      const variables: any = {
        page: pageNum,
        sort: [currentSort],
      };

      if (currentFormat !== 'ALL') {
        variables.format = currentFormat;
      }

      const res = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      const data = await res.json();
      
      if (data?.data?.Page?.media) {
        if (pageNum === 1) {
          setAnimeList(data.data.Page.media);
        } else {
          setAnimeList((prev) => [...prev, ...data.data.Page.media]);
        }
        setHasNextPage(data.data.Page.pageInfo.hasNextPage);
      }
    } catch (error) {
      console.error('Error fetching anime:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch when filters change
  useEffect(() => {
    setPage(1);
    setAnimeList([]);
    setHasNextPage(true);
    fetchAnime(1, sort, format);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, format]);

  // Fetch next page
  useEffect(() => {
    if (page > 1) {
      fetchAnime(page, sort, format);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="w-full pb-20">
      
      {/* Filters & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#12131A] p-4 rounded-xl border border-[#2A2B30]">
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="text-[#ff4dd2] size-5" />
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value)}
            className="bg-[#121326] border border-[#2A2B30] text-white text-sm rounded-lg focus:ring-[#ff4dd2] focus:border-[#ff4dd2] block w-full p-2.5 outline-none cursor-pointer"
          >
            <option value="ALL">All Formats</option>
            <option value="TV">TV Series</option>
            <option value="MOVIE">Movies</option>
            <option value="OVA">OVA</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <ArrowUpDown className="text-[#ff4dd2] size-5" />
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#121326] border border-[#2A2B30] text-white text-sm rounded-lg focus:ring-[#ff4dd2] focus:border-[#ff4dd2] block w-full p-2.5 outline-none cursor-pointer"
          >
            <option value="POPULARITY_DESC">Most Popular</option>
            <option value="START_DATE_DESC">Newest Releases</option>
            <option value="SCORE_DESC">Highest Rated</option>
            <option value="TITLE_ENGLISH_DESC">Alphabetical (Z-A)</option>
            <option value="TRENDING_DESC">Trending Now</option>
          </select>
        </div>

      </div>

      {/* Grid */}
      {loading && page === 1 ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#ff4dd2] animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {animeList.map((anime, index) => {
              if (index === animeList.length - 1) {
                return (
                  <div ref={lastElementRef} key={`${anime.id}-${index}`}>
                    <AnimeCard anime={anime} />
                  </div>
                );
              }
              return <AnimeCard key={`${anime.id}-${index}`} anime={anime} />;
            })}
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-[#ff4dd2] animate-spin" />
            </div>
          )}

          {!hasNextPage && !loading && (
            <div className="text-center text-gray-500 py-8 font-medium">
              You have reached the end of the list.
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default function BrowseAllAnimePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 text-[#ff4dd2] animate-spin" /></div>}>
      <BrowseAllAnimeContent />
    </Suspense>
  );
}
