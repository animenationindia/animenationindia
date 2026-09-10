/* eslint-disable @next/next/no-img-element */
// app/series/[id]/page.tsx
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { 
  getAnimeFullDetails, 
  getAnimeCharacters, 
  getAniListExtraInfo, 
  getAnimeRecommendations,
  getAnimeEpisodes,
  getAnimeReviews
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
  const isAnilistDirect = id.startsWith('al-') || (!isNaN(numId) && numId > 65000);
  const anilistId = isAnilistDirect ? (id.startsWith('al-') ? Number(id.replace('al-', '')) : numId) : null;

  try {
    const jikanAnime = await getCachedAnimeDetails(id);
    let extraInfo = null;
    if (!jikanAnime) {
      if (anilistId) {
        extraInfo = await getCachedAniListExtraInfo(anilistId);
      } else if (!isNaN(numId) && numId > 0) {
        extraInfo = await getCachedAniListExtraInfo(numId);
      }
    }

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
  const isAnilistDirect = id.startsWith('al-') || (!isNaN(numId) && numId > 65000);
  const anilistId = isAnilistDirect ? (id.startsWith('al-') ? Number(id.replace('al-', '')) : numId) : null;
  const malQueryId = !isNaN(numId) && numId > 0 && numId <= 65000 ? numId : null;

  // 1. Fetch anime full details first
  const jikanAnime = await getCachedAnimeDetails(id);

  // Determine effective MAL ID and AniList ID
  const effectiveMalId = (jikanAnime?.mal_id && typeof jikanAnime.mal_id === 'number' && jikanAnime.mal_id <= 65000)
    ? jikanAnime.mal_id
    : malQueryId;

  const effectiveAniListId = anilistId || (effectiveMalId ? effectiveMalId : null);

  // 2. Fetch extra info, episodes, characters, recommendations, themes & reviews in parallel
  const [
    extraInfoRes, 
    episodesRes,
    charactersRes, 
    recommendationsRes, 
    themesRes,
    reviewsRes
  ] = await Promise.allSettled([
    effectiveAniListId ? getCachedAniListExtraInfo(effectiveAniListId) : Promise.resolve(null),
    effectiveMalId ? getAnimeEpisodes(String(effectiveMalId)) : Promise.resolve([]),
    effectiveMalId ? getAnimeCharacters(effectiveMalId, effectiveAniListId || undefined) : (effectiveAniListId ? getAnimeCharacters(effectiveAniListId, effectiveAniListId) : Promise.resolve([])),
    effectiveMalId ? getAnimeRecommendations(effectiveMalId, effectiveAniListId || undefined) : (effectiveAniListId ? getAnimeRecommendations(effectiveAniListId, effectiveAniListId) : Promise.resolve([])),
    effectiveMalId ? fetchAnimeThemes(effectiveMalId) : Promise.resolve([]),
    effectiveMalId ? getAnimeReviews(effectiveMalId) : Promise.resolve([])
  ]);

  const extraInfo = extraInfoRes.status === 'fulfilled' ? extraInfoRes.value : null;
  const episodesData = episodesRes.status === 'fulfilled' ? episodesRes.value : [];
  const episodes = Array.isArray(episodesData) ? episodesData : ((episodesData as any)?.data || []);
  const characters = charactersRes.status === 'fulfilled' ? charactersRes.value : [];
  const recommendations = recommendationsRes.status === 'fulfilled' ? recommendationsRes.value : [];
  const themes = themesRes.status === 'fulfilled' ? themesRes.value : [];
  const reviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value : [];

  // Primary data resolution: Prefer Jikan, fallback to AniList extraInfo
  let anime = jikanAnime;

  if (!anime && extraInfo) {
    const fallbackId = extraInfo.idMal || (anilistId ? `al-${anilistId}` : id);
    anime = {
      mal_id: fallbackId,
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

  let sortedRelations: any[] = extraInfo?.relations?.edges 
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

  // Fallback: If AniList relations are empty (e.g. AniList 403), map Jikan relations
  if (sortedRelations.length === 0 && jikanAnime?.relations && Array.isArray(jikanAnime.relations)) {
    const jikanEdges: any[] = [];
    jikanAnime.relations.forEach((relGroup: any) => {
      const relType = (relGroup.relation || 'RELATED').toUpperCase().replace(/\s+/g, '_');
      if (Array.isArray(relGroup.entry)) {
        relGroup.entry.forEach((entry: any) => {
          const isManga = entry.type === 'manga';
          jikanEdges.push({
            relationType: relType,
            node: {
              id: entry.mal_id,
              idMal: entry.mal_id,
              title: { english: entry.name, romaji: entry.name },
              type: isManga ? 'MANGA' : 'ANIME',
              format: isManga ? 'MANGA' : 'TV',
              coverImage: {
                large: `https://api-cdn.myanimelist.net/images/anime/${entry.mal_id}.jpg`,
              },
              startDate: null
            }
          });
        });
      }
    });
    sortedRelations = jikanEdges;
  }

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
      reviews={reviews}
    />
  );
}
