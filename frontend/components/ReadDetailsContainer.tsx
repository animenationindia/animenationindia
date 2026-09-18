/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation';
import {
  getMangaFullDetails,
  getMangaCharacters,
  getAniListMangaExtraInfo,
  getMangaRecommendations,
} from '../lib/api';
import MangaHeroV2 from './MangaHeroV2';
import MangaHUDStats from './MangaHUDStats';
import MangaReadingTracker from './MangaReadingTracker';
import MangaChapterGuide from './MangaChapterGuide';
import MangaCharactersCast from './MangaCharactersCast';
import MangaFranchiseUniverse from './MangaFranchiseUniverse';
import AnimeRecommendations from './AnimeRecommendations';
import ReadHubNavigation from './ReadHubNavigation';

export interface ReadDetailsContainerProps {
  id: string;
  categoryHint?: 'manhwa' | 'manga' | 'manhua' | 'novel';
}

export default async function ReadDetailsContainer({
  id,
  categoryHint,
}: ReadDetailsContainerProps) {
  const numId = Number(id);
  const isNumeric = !isNaN(numId) && numId > 0;

  // 1. Parallel Data Fetching across MAL & AniList
  const [manga, characters, extraInfo, recommendations] = await Promise.all([
    getMangaFullDetails(id).catch(() => null),
    isNumeric ? getMangaCharacters(id).catch(() => []) : Promise.resolve([]),
    isNumeric ? getAniListMangaExtraInfo(numId).catch(() => null) : Promise.resolve(null),
    isNumeric ? getMangaRecommendations(id).catch(() => []) : Promise.resolve([]),
  ]);

  if (!manga && !extraInfo) {
    notFound();
  }

  // Determine origin and medium
  const rawCountry = (extraInfo?.countryOfOrigin || manga?.countryOfOrigin || '').toUpperCase();
  const rawFormat = (extraInfo?.format || manga?.format || manga?.type || '').toUpperCase();

  let detectedCategory: 'manhwa' | 'manga' | 'manhua' | 'novel' = categoryHint || 'manga';
  if (rawCountry === 'KR' || rawFormat === 'MANHWA' || rawFormat.includes('MANHWA')) {
    detectedCategory = 'manhwa';
  } else if (rawCountry === 'CN' || rawFormat === 'MANHUA' || rawFormat.includes('MANHUA')) {
    detectedCategory = 'manhua';
  } else if (rawFormat === 'NOVEL' || rawFormat === 'LIGHT NOVEL' || rawFormat.includes('NOVEL')) {
    detectedCategory = 'novel';
  } else if (categoryHint) {
    detectedCategory = categoryHint;
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
    type: extraInfo?.format || (detectedCategory === 'manhwa' ? 'MANHWA' : detectedCategory === 'manhua' ? 'MANHUA' : detectedCategory === 'novel' ? 'NOVEL' : 'MANGA'),
    countryOfOrigin: extraInfo?.countryOfOrigin || (detectedCategory === 'manhwa' ? 'KR' : detectedCategory === 'manhua' ? 'CN' : 'JP'),
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

  // 3. Recommendations
  const safeRecommendations = (recommendations || []).map((rec: any) => {
    const titleEng = rec.entry?.title || (typeof rec.title === 'object' ? rec.title?.english || rec.title?.romaji : rec.title) || 'Title';
    const cover =
      rec.entry?.images?.webp?.large_image_url ||
      rec.entry?.images?.jpg?.large_image_url ||
      rec.coverImage?.extraLarge ||
      rec.coverImage?.large ||
      '/placeholder-poster.png';

    let recFormat = rec.format || 'MANGA';
    if (rec.countryOfOrigin === 'KR' || rec.format === 'MANHWA') recFormat = 'MANHWA';
    else if (rec.countryOfOrigin === 'CN' || rec.format === 'MANHUA') recFormat = 'MANHUA';
    else if (rec.format === 'NOVEL') recFormat = 'LIGHT NOVEL';

    return {
      id: rec.entry?.mal_id || rec.id || 0,
      idMal: rec.entry?.mal_id || rec.id || 0,
      title: { english: titleEng, romaji: titleEng },
      coverImage: { large: cover, extraLarge: cover },
      format: recFormat,
      type: recFormat,
      countryOfOrigin: rec.countryOfOrigin || (detectedCategory === 'manhwa' ? 'KR' : detectedCategory === 'manhua' ? 'CN' : 'JP'),
      averageScore: null,
    };
  });

  return (
    <div className="min-h-screen bg-[#040405] text-white selection:bg-[#ff4dd2] selection:text-white pb-28">
      {/* 1. Global Read Sticky Navigation */}
      <ReadHubNavigation />

      {/* 2. Cyber Reading Hero Banner */}
      <MangaHeroV2 manga={effectiveManga} extraInfo={extraInfo} />

      {/* 3. HUD Stats 6-Card Grid */}
      <MangaHUDStats manga={effectiveManga} extraInfo={extraInfo} />

      {/* 4. Interactive Reading Progress Tracker */}
      <MangaReadingTracker
        mangaId={mangaId}
        mangaTitle={englishTitle}
        totalChapters={totalChapters}
      />

      {/* 5. MangaDex Real Chapter Guide & Online Readers */}
      <MangaChapterGuide
        title={englishTitle}
        totalChapters={totalChapters}
        mangaId={mangaId}
      />

      {/* 6. Characters & Creators / Staff */}
      <MangaCharactersCast
        characters={characters}
        authors={effectiveManga.authors || []}
      />

      {/* 7. Franchise Universe & Anime Adaptations */}
      <MangaFranchiseUniverse relations={relationsList} />

      {/* 8. You May Also Like (Recommendations) */}
      <AnimeRecommendations
        recommendations={safeRecommendations}
        relations={relationsList}
      />
    </div>
  );
}
