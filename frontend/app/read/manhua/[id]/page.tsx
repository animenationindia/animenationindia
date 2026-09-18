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
    const title = manga?.title_english || manga?.title?.english || manga?.title?.romaji || 'Chinese Manhua';
    return {
      title: `${title} - Read Chinese Manhua & Cultivation | Anime Nation India`,
      description: manga?.synopsis?.slice(0, 160) || 'Read legendary Chinese cultivation manhua on Anime Nation India.',
    };
  } catch {
    return {
      title: 'Chinese Manhua Details | Anime Nation India',
    };
  }
}

export default async function ManhuaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReadDetailsContainer id={id} categoryHint="manhua" />;
}
