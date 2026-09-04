import { getFilteredAnimeAniList } from '../../lib/api';
import CategoryLayout from '../../components/CategoryLayout';

interface SearchParams {
  page?: string;
  season?: string;
  seasonYear?: string;
  format?: string;
  genres?: string;
}

export default async function TrendingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
    sort: 'TRENDING_DESC'
  });

  const params = new URLSearchParams();
  if (season) params.set('season', season);
  if (seasonYear) params.set('seasonYear', seasonYear.toString());
  if (format) params.set('format', format);
  if (resolvedParams.genres) params.set('genres', resolvedParams.genres);

  return (
    <CategoryLayout 
      title="TRENDING NOW"
      description="The most popular anime right now across the community."
      results={data.media || []}
      pageInfo={data.pageInfo || { currentPage: 1, lastPage: 1, hasNextPage: false }}
      basePath="/trending"
      queryParams={params.toString()}
      hideFilter={true}
    />
  );
}
