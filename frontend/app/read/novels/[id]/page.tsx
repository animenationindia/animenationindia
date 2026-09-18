import { Metadata } from 'next';
import ReadDetailsContainer from '@/components/ReadDetailsContainer';
import { getMangaFullDetails } from '@/lib/api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const manga = await getMangaFullDetails(id);
    const title = manga?.title_english || manga?.title?.english || manga?.title?.romaji || 'Light Novel';
    return {
      title: `${title} - Read Light Novels & Web Fiction | Anime Nation India`,
      description: manga?.synopsis?.slice(0, 160) || 'Explore deep psychological lore and light novels on Anime Nation India.',
    };
  } catch {
    return {
      title: 'Light Novels & Web Fiction Details | Anime Nation India',
    };
  }
}

export default async function NovelsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReadDetailsContainer id={id} categoryHint="novel" />;
}
