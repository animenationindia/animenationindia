import { getFilteredAnimeAniList } from '../../lib/api';
import CategoryLayout from '../../components/CategoryLayout';
import type { Metadata } from 'next';

interface SearchParams {
  page?: string;
  season?: string;
  seasonYear?: string;
  format?: string;
  genres?: string;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const genreList = resolvedParams.genres ? resolvedParams.genres.split(',') : [];
  const genreName = genreList.length > 0 ? genreList.join(', ') : 'All';

  const title = `${genreName} Anime & Manga - Browse All | Anime Nation India`;
  const description = `Explore top ${genreName} anime series, movies, and light novels database on Anime Nation India.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: '/ani-logo.png', alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/ani-logo.png'],
    },
  };
}

export default async function GenrePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  
  const page = parseInt(resolvedParams.page || '1', 10);
  const season = resolvedParams.season;
  const seasonYear = resolvedParams.seasonYear ? parseInt(resolvedParams.seasonYear, 10) : undefined;
  const format = resolvedParams.format;
  const genres = resolvedParams.genres ? resolvedParams.genres.split(',') : undefined;

  const data = await getFilteredAnimeAniList({
    page,
    season,
    seasonYear,
    format,
    genres,
    sort: 'POPULARITY_DESC'
  });

  const params = new URLSearchParams();
  if (season) params.set('season', season);
  if (seasonYear) params.set('seasonYear', seasonYear.toString());
  if (format) params.set('format', format);
  if (resolvedParams.genres) params.set('genres', resolvedParams.genres);

  return (
    <CategoryLayout 
      title="EXPLORE BY GENRE"
      description="Filter anime by your favorite genres."
      results={data.media || []}
      pageInfo={data.pageInfo || { currentPage: 1, lastPage: 1, hasNextPage: false }}
      basePath="/genre"
      queryParams={params.toString()}
    />
  );
}
