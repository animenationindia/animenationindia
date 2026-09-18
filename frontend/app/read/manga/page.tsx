import { Metadata } from 'next';
import ReadCategoryPage, { ReadCategoryConfig } from '@/components/ReadCategoryPage';

export const metadata: Metadata = {
  title: 'Japanese Manga Vault | Anime Nation India',
  description: 'Explore the ultimate collection of Japanese Manga from Shonen Jump, Seinen, Romance, and timeless classics on Anime Nation India.',
};

const MANGA_CONFIG: ReadCategoryConfig = {
  key: 'manga',
  basePath: '/read/manga',
  title: 'Japanese Manga Vault',
  subtitle: 'Classic & Modern Tankobon',
  flag: '🇯🇵',
  badge: 'JAPANESE MANGA',
  badgeColor: 'text-sky-400',
  description: 'Immerse in legendary Japanese Shonen Jump, Seinen, and classic black-and-white manga masterpieces.',
  placeholder: 'Search Japanese Manga (e.g. One Piece, Berserk, Jujutsu Kaisen, Chainsaw Man)...',
  trending: ['One Piece', 'Berserk', 'Jujutsu Kaisen', 'Chainsaw Man', 'Bleach', 'Vagabond', 'Attack on Titan', 'Vinland Saga'],
};

export default async function MangaRoutePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    sort?: string;
    status?: string;
    year?: string;
    page?: string;
  }>;
}) {
  const resolved = await searchParams;
  return <ReadCategoryPage config={MANGA_CONFIG} searchParams={resolved} />;
}
