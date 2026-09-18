import { Metadata } from 'next';
import ReadCategoryPage, { ReadCategoryConfig } from '@/components/ReadCategoryPage';

export const metadata: Metadata = {
  title: 'Korean Manhwa & Webtoons Sanctuary | Anime Nation India',
  description: 'Dive into thrilling Korean Manhwa, action webtoons, Hunter Dungeons, Murim, and Romance Fantasy on Anime Nation India.',
};

const MANHWA_CONFIG: ReadCategoryConfig = {
  key: 'manhwa',
  basePath: '/read/manhwa',
  title: 'Korean Manhwa & Webtoons',
  subtitle: 'Full-Color Vertical Webtoons',
  flag: '🇰🇷',
  badge: 'KOREAN MANHWA',
  badgeColor: 'text-emerald-400',
  description: 'Explore high-octane Korean webtoons featuring Hunter Gate systems, epic Regression, Murim martial arts, and Otome romance.',
  placeholder: 'Search Korean Manhwa & Webtoons (e.g. Solo Leveling, Omniscient Reader, Lookism)...',
  trending: ['Solo Leveling', 'Omniscient Reader', 'Lookism', 'Tower of God', 'Wind Breaker', 'Nano Machine', 'The Beginning After the End', 'Eleceed'],
};

export default async function ManhwaRoutePage({
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
  return <ReadCategoryPage config={MANHWA_CONFIG} searchParams={resolved} />;
}
