import { Metadata } from 'next';
import ReadCategoryPage, { ReadCategoryConfig } from '@/components/ReadCategoryPage';

export const metadata: Metadata = {
  title: 'Light Novels & Web Fiction Archive | Anime Nation India',
  description: 'Read official Japanese Light Novels, Korean Web Novels, and Isekai fantasy lore on Anime Nation India.',
};

const NOVELS_CONFIG: ReadCategoryConfig = {
  key: 'novel',
  basePath: '/read/novels',
  title: 'Light Novels & Web Fiction',
  subtitle: 'Official Bunkobon & Online Webnovels',
  flag: '📖',
  badge: 'LIGHT NOVELS & WN',
  badgeColor: 'text-purple-400',
  description: 'Explore deep worldbuilding, psychological depth, and original light novel epics that inspired your favorite anime.',
  placeholder: 'Search Light Novels & Web Novels (e.g. Classroom of the Elite, Re:Zero, Overlord)...',
  trending: ['Classroom of the Elite', 'Re:Zero', 'Overlord', 'Sword Art Online', 'No Game No Life', 'Mushoku Tensei', 'That Time I Got Reincarnated as a Slime', 'Monogatari Series'],
};

export default async function NovelsRoutePage({
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
  return <ReadCategoryPage config={NOVELS_CONFIG} searchParams={resolved} />;
}
