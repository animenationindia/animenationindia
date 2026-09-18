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
    const title = manga?.title_english || manga?.title?.english || manga?.title?.romaji || 'Japanese Manga';
    return {
      title: `${title} - Read Japanese Manga | Anime Nation India`,
      description: manga?.synopsis?.slice(0, 160) || 'Read official Japanese manga on Anime Nation India.',
    };
  } catch {
    return {
      title: 'Japanese Manga Details | Anime Nation India',
    };
  }
}

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReadDetailsContainer id={id} categoryHint="manga" />;
}
