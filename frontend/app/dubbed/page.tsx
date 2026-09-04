import { getFilteredAnimeAniList } from '../../lib/api';
import CategoryLayout from '../../components/CategoryLayout';

interface SearchParams {
  page?: string;
  season?: string;
  seasonYear?: string;
  format?: string;
  genres?: string;
}

export default async function DubbedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  
  const page = parseInt(resolvedParams.page || '1', 10);
  const season = resolvedParams.season;
  const seasonYear = resolvedParams.seasonYear ? parseInt(resolvedParams.seasonYear, 10) : undefined;
  const format = resolvedParams.format;
  const genres = resolvedParams.genres ? resolvedParams.genres.split(',') : undefined;

  // We rely on TV format and generic popularity as a proxy since AniList doesn't natively filter "dubbed" easily
  const data = await getFilteredAnimeAniList({
    page,
    season,
    seasonYear,
    format: format || 'TV',
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
      title="POPULAR DUBBED"
      description="The most popular TV anime available."
      results={data.media || []}
      pageInfo={data.pageInfo || { currentPage: 1, lastPage: 1, hasNextPage: false }}
      basePath="/dubbed"
      queryParams={params.toString()}
    />
  );
}
