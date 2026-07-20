import type { Metadata } from 'next';
import SearchPageClient from '../../components/SearchPageClient';

export const metadata: Metadata = {
  title: 'Search Anime — Anime Nation India',
  description: 'Search thousands of anime by title, genre, format, year and more.',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; genres?: string; format?: string; status?: string; year?: string; sort?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  return (
    <SearchPageClient
      initialQuery={params.q || ''}
      initialGenres={params.genres || ''}
      initialFormat={params.format || ''}
      initialStatus={params.status || ''}
      initialYear={params.year || ''}
      initialSort={params.sort || 'POPULARITY_DESC'}
      initialPage={parseInt(params.page || '1', 10)}
    />
  );
}