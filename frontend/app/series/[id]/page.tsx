export const runtime = 'edge';
/* eslint-disable @next/next/no-img-element */
// app/series/[id]/page.tsx
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { 
  getAnimeFullDetails, 
  getAnimeCharacters, 
  getAniListExtraInfo, 
  getAnimeRecommendations,
  getAnimeEpisodes 
} from '../../../lib/api';
import { fetchAnimeThemes } from '../../../lib/animethemes-api';
import { getTMDBAnimeData } from '../../../lib/tmdb-api';
import { sanitizeDescription } from '../../../lib/sanitize';
import AnimeDetailsContainer from '../../../components/AnimeDetailsContainer';
import type { Metadata } from 'next';

interface Params {
  id: string;
}

// React cache() wrappers to deduplicate fetches between generateMetadata and AnimeDetails page component
const getCachedAnimeDetails = cache(async (id: string) => {
  return getAnimeFullDetails(id);
});

const getCachedAniListExtraInfo = cache(async (numId: number) => {
  return getAniListExtraInfo(numId);
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);

  try {
    const [jikanRes, extraInfoRes] = await Promise.allSettled([
      getCachedAnimeDetails(id),
      getCachedAniListExtraInfo(numId)
    ]);
    
    const jikanAnime = jikanRes.status === 'fulfilled' ? jikanRes.value : null;
    const extraInfo = extraInfoRes.status === 'fulfilled' ? extraInfoRes.value : null;

    if (!jikanAnime && !extraInfo) {
      return {
        title: 'Anime Not Found - Anime Nation India',
        description: 'The requested anime series could not be found.',
      };
    }

    const title = jikanAnime?.title_english || jikanAnime?.title || extraInfo?.title?.english || extraInfo?.title?.romaji || 'Anime Details';
    const rawDesc = jikanAnime?.synopsis || extraInfo?.description || 'View full anime details, episodes, and trailers on Anime Nation India.';
    const cleanDesc = sanitizeDescription(rawDesc).replace(/\s+/g, ' ').slice(0, 160);
    const cover = jikanAnime?.images?.jpg?.large_image_url || extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || '/placeholder-poster.png';

    return {
      title: `${title} - Watch & Details | Anime Nation India`,
      description: cleanDesc,
      openGraph: {
        title: `${title} - Watch & Full Details | Anime Nation India`,
        description: cleanDesc,
        images: [{ url: cover, alt: title }],
        type: 'video.other',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} - Anime Nation India`,
        description: cleanDesc,
        images: [cover],
      },
    };
  } catch {
    return {
      title: 'Anime Details - Anime Nation India',
      description: 'Explore full anime details, episodes, reviews, and release schedules on Anime Nation India.',
    };
  }
}

export default async function AnimeDetails({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const numId = Number(id);

  // 1. Fetch all anime details, characters, episodes, recommendations & AnimeThemes in parallel (~1s)
  const [
    jikanRes, 
    extraInfoRes, 
    episodesRes,
    charactersRes, 
    recommendationsRes, 
    themesRes
  ] = await Promise.allSettled([
    getCachedAnimeDetails(id),
    getCachedAniListExtraInfo(numId),
    getAnimeEpisodes(id),
    getAnimeCharacters(numId),
    getAnimeRecommendations(numId),
    fetchAnimeThemes(numId)
  ]);

  const jikanAnime = jikanRes.status === 'fulfilled' ? jikanRes.value : null;
  const extraInfo = extraInfoRes.status === 'fulfilled' ? extraInfoRes.value : null;
  const episodesData = episodesRes.status === 'fulfilled' ? episodesRes.value : [];
  const episodes = Array.isArray(episodesData) ? episodesData : (episodesData?.data || []);
  const characters = charactersRes.status === 'fulfilled' ? charactersRes.value : [];
  const recommendations = recommendationsRes.status === 'fulfilled' ? recommendationsRes.value : [];
  const themes = themesRes.status === 'fulfilled' ? themesRes.value : [];

  // Primary data resolution: Prefer Jikan, fallback to AniList extraInfo
  let anime = jikanAnime;

  if (!anime && extraInfo) {
    anime = {
      mal_id: numId,
      title: extraInfo.title?.romaji || 'Unknown Title',
      title_english: extraInfo.title?.english || extraInfo.title?.romaji || 'Unknown Title',
      title_japanese: extraInfo.title?.native || '',
      synopsis: extraInfo.description || 'No synopsis available for this title.',
      images: {
        webp: { large_image_url: extraInfo.coverImage?.extraLarge || extraInfo.coverImage?.large || '' },
        jpg: { large_image_url: extraInfo.coverImage?.large || '' }
      },
      genres: extraInfo.genres ? extraInfo.genres.map((g: string, idx: number) => ({ mal_id: idx, name: g })) : [],
      score: typeof extraInfo.averageScore === 'number' && !isNaN(extraInfo.averageScore) ? extraInfo.averageScore / 10 : null,
      type: extraInfo.format || 'TV',
      season: extraInfo.seasonYear ? String(extraInfo.seasonYear) : '',
      year: extraInfo.seasonYear || null,
      trailer: extraInfo.trailer?.id && extraInfo.trailer?.site === 'youtube'
        ? { youtube_id: extraInfo.trailer.id, embed_url: `https://www.youtube.com/embed/${extraInfo.trailer.id}` }
        : null
    };
  }

  // Call notFound ONLY when neither Jikan nor AniList provides anime data
  if (!anime) {
    notFound();
  }

  const sortedRelations = extraInfo?.relations?.edges 
    ? [...extraInfo.relations.edges]
        .filter((edge: any) => edge && edge.node)
        .sort((a: any, b: any) => {
          const getScore = (node: any) => {
            if (!node || !node.startDate) return 0;
            return (node.startDate.year || 0) * 10000 + (node.startDate.month || 0) * 100 + (node.startDate.day || 0);
          };
          return getScore(b.node) - getScore(a.node);
        })
    : [];

  // Fetch TMDB data (Audio languages, Worldwide translations, Transparent ClearArt Logo, Watch Providers)
  const searchTitle = anime.title_english || anime.title || extraInfo?.title?.english || extraInfo?.title?.romaji || '';
  const animeYear = anime.year || extraInfo?.seasonYear;
  const tmdbData = await getTMDBAnimeData(searchTitle, animeYear);

  return (
    <AnimeDetailsContainer
      anime={anime}
      extraInfo={extraInfo}
      characters={characters}
      episodes={episodes}
      recommendations={recommendations}
      relations={sortedRelations}
      themes={themes}
      tmdbData={tmdbData}
    />
  );
}
