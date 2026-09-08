import { redirect } from 'next/navigation';
import { DEFAULT_GENRES_LIST } from '../../../lib/genres-data';

export default async function GenresDynamicPage({
  params,
  searchParams,
}: {
  params: Promise<{ genre: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { genre } = await params;
  const resolvedParams = await searchParams;
  const decodedName = decodeURIComponent(genre).toLowerCase();
  
  const matched = DEFAULT_GENRES_LIST.find(
    g => g.name.toLowerCase() === decodedName
  );

  const query = new URLSearchParams();
  if (matched) {
    query.set('genreId', String(matched.mal_id));
  } else {
    query.set('genre', genre);
  }

  for (const [k, v] of Object.entries(resolvedParams)) {
    if (k !== 'genreId' && k !== 'genre') {
      if (typeof v === 'string') query.set(k, v);
      else if (Array.isArray(v)) query.set(k, v.join(','));
    }
  }

  redirect(`/genres?${query.toString()}`);
}
