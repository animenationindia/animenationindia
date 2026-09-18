/* eslint-disable @next/next/no-img-element */
// app/manga/[id]/page.tsx
import { cache } from 'react';
import { notFound } from 'next/navigation';
import {
  getMangaFullDetails,
  getMangaCharacters,
  getAniListMangaExtraInfo,
  getMangaRecommendations,
} from '../../../lib/api';
import { sanitizeDescription } from '../../../lib/sanitize';
import MangaHeroV2 from '../../../components/MangaHeroV2';
import MangaHUDStats from '../../../components/MangaHUDStats';
import MangaReadingTracker from '../../../components/MangaReadingTracker';
import MangaChapterGuide from '../../../components/MangaChapterGuide';
import MangaCharactersCast from '../../../components/MangaCharactersCast';
import MangaFranchiseUniverse from '../../../components/MangaFranchiseUniverse';
import AnimeRecommendations from '../../../components/AnimeRecommendations';
import type { Metadata } from 'next';

interface Params {
  id: string;
}

const getCachedMangaDetails = cache(async (id: string) => {
  return getMangaFullDetails(id);
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const manga = await getCachedMangaDetails(id);
    if (!manga) throw new Error('Manga not found');

    const rawTitle =
      manga.title_english ||
      (typeof manga.title === 'object' ? manga.title?.english || manga.title?.romaji : manga.title) ||
      'Manga Details';
    const title = typeof rawTitle === 'string' ? rawTitle : 'Manga Details';
    const rawDesc = manga.synopsis || 'Read full manga, manhwa, and light novel chapters on Anime Nation India.';
    const cleanDesc = sanitizeDescription(rawDesc).replace(/\s+/g, ' ').slice(0, 160);
    const cover =
      manga.images?.webp?.large_image_url ||
      manga.images?.jpg?.large_image_url ||
      manga.coverImage?.extraLarge ||
      '/placeholder-poster.png';

    const rawCountry = (manga.countryOfOrigin || '').toUpperCase();
    const rawType = (manga.type || '').toUpperCase();
    const origin = rawCountry === 'KR' || rawType.includes('MANHWA') 
      ? 'Manhwa' 
      : rawCountry === 'CN' || rawType.includes('MANHUA')
      ? 'Manhua'
      : rawType.includes('NOVEL')
      ? 'Light Novel'
      : 'Manga';

    return {
      title: `${title} - Read ${origin} Online | Anime Nation India`,
      description: cleanDesc,
      openGraph: {
        title: `${title} - ${origin} Chapters & Details | Anime Nation India`,
        description: cleanDesc,
        images: [{ url: cover, alt: title }],
        type: 'book',
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
      title: 'Manga & Novel Details - Anime Nation India',
      description: 'Explore popular manga, manhwa, and light novels on Anime Nation India.',
    };
  }
}

export default async function MangaDetailsPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const numId = Number(id);
  const isNumeric = !isNaN(numId) && numId > 0;

  // 1. Parallel Data Fetching
  const [manga, characters, extraInfo, recommendations] = await Promise.all([
    getCachedMangaDetails(id),
    isNumeric ? getMangaCharacters(id) : Promise.resolve([]),
    isNumeric ? getAniListMangaExtraInfo(numId) : Promise.resolve(null),
    isNumeric ? getMangaRecommendations(id) : Promise.resolve([]),
  ]);

  if (!manga && !extraInfo) {
    notFound();
  }

  const effectiveManga = manga || {
    mal_id: extraInfo?.idMal || id,
    title: extraInfo?.title?.romaji || 'Unknown Title',
    title_english: extraInfo?.title?.english || extraInfo?.title?.romaji || 'Unknown Title',
    title_japanese: extraInfo?.title?.native || '',
    synopsis: extraInfo?.description || '',
    images: {
      webp: { large_image_url: extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || '' },
      jpg: { large_image_url: extraInfo?.coverImage?.large || '' },
    },
    type: extraInfo?.format || 'MANGA',
    countryOfOrigin: extraInfo?.countryOfOrigin || 'JP',
    status: extraInfo?.status || 'Publishing',
    chapters: (extraInfo as any)?.chapters || null,
    volumes: (extraInfo as any)?.volumes || null,
    score: extraInfo?.averageScore ? extraInfo.averageScore / 10 : null,
  };

  const rawEng =
    effectiveManga.title_english ||
    extraInfo?.title?.english ||
    (typeof effectiveManga.title === 'object'
      ? effectiveManga.title?.english || effectiveManga.title?.romaji
      : effectiveManga.title) ||
    'Manga Title';
  const englishTitle = typeof rawEng === 'string' ? rawEng : 'Manga Title';

  const mangaId = effectiveManga.mal_id || id;
  const totalChapters = effectiveManga.chapters || (extraInfo as any)?.chapters || null;

  // 2. Relations (Anime Adaptations, Prequels, Sequels)
  const relationsList = (effectiveManga.relations || []).length > 0
    ? effectiveManga.relations
    : (extraInfo?.relations?.edges || []).map((e: any) => ({
        relationType: e.relationType,
        entry: [
          {
            id: e.node.idMal || e.node.id,
            mal_id: e.node.idMal || e.node.id,
            name: e.node.title?.english || e.node.title?.romaji || 'Related Title',
            type: e.node.type || 'anime',
            format: e.node.format,
            coverImage: { large: e.node.coverImage?.large || e.node.coverImage?.extraLarge },
          },
        ],
      }));

  // 3. Formatted Recommendations
  const safeRecommendations = (recommendations || []).map((rec: any) => {
    const titleEng = rec.entry?.title || (typeof rec.title === 'object' ? rec.title?.english || rec.title?.romaji : rec.title) || 'Title';
    const cover =
      rec.entry?.images?.webp?.large_image_url ||
      rec.entry?.images?.jpg?.large_image_url ||
      rec.coverImage?.extraLarge ||
      rec.coverImage?.large ||
      '/placeholder-poster.png';

    return {
      id: rec.entry?.mal_id || rec.id || 0,
      idMal: rec.entry?.mal_id || rec.id || 0,
      title: { english: titleEng, romaji: titleEng },
      coverImage: { large: cover, extraLarge: cover },
      format: rec.format || 'MANGA',
      type: 'MANGA',
      averageScore: null,
    };
  });

  return (
    <div className="min-h-screen bg-[#040405] text-white selection:bg-[#ff4dd2] selection:text-white pb-24">
      {/* 1. Cyber Manga Hero Banner */}
      <MangaHeroV2 manga={effectiveManga} extraInfo={extraInfo} />

      {/* 2. HUD Stats 6-Card Grid */}
      <MangaHUDStats manga={effectiveManga} extraInfo={extraInfo} />

      {/* 3. Interactive Reading Progress Tracker */}
      <MangaReadingTracker
        mangaId={mangaId}
        mangaTitle={englishTitle}
        totalChapters={totalChapters}
      />

      {/* 4. MangaDex Real Chapter Guide */}
      <MangaChapterGuide
        title={englishTitle}
        totalChapters={totalChapters}
        mangaId={mangaId}
      />

      {/* 5. Characters & Creators / Staff */}
      <MangaCharactersCast
        characters={characters}
        authors={effectiveManga.authors || []}
      />

      {/* 6. Franchise Universe & Anime Adaptations */}
      <MangaFranchiseUniverse relations={relationsList} />

      {/* 7. You May Also Like (Recommendations) */}
      <AnimeRecommendations
        recommendations={safeRecommendations}
        relations={relationsList}
      />
    </div>
  );
}
