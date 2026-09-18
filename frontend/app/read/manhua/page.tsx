import { Metadata } from 'next';
import ReadCategoryPage, { ReadCategoryConfig } from '@/components/ReadCategoryPage';

export const metadata: Metadata = {
  title: 'Chinese Manhua & Cultivation Hub | Anime Nation India',
  description: 'Embark on immortal cultivation, Xianxia dragons, and ancient martial arts journeys with Chinese Manhua on Anime Nation India.',
};

const MANHUA_CONFIG: ReadCategoryConfig = {
  key: 'manhua',
  basePath: '/read/manhua',
  title: 'Chinese Manhua & Cultivation',
  subtitle: 'Xianxia, Wuxia & Mythical Realms',
  flag: '🇨🇳',
  badge: 'CHINESE MANHUA',
  badgeColor: 'text-amber-400',
  description: 'Step into celestial dao, heavenly tribulations, alchemy, and legendary ancient martial arts sagas.',
  placeholder: 'Search Chinese Manhua (e.g. Martial Peak, Soul Land, Tales of Demons and Gods)...',
  trending: ['Martial Peak', 'Soul Land', 'Tales of Demons and Gods', 'Battle Through the Heavens', 'Apotheosis', 'Magic Emperor', 'Star Martial God Technique'],
};

export default async function ManhuaRoutePage({
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
  return <ReadCategoryPage config={MANHUA_CONFIG} searchParams={resolved} />;
}
