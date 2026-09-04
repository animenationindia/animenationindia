import { getFilteredAnimeAniList } from '../../lib/api';
import CategoryLayout from '../../components/CategoryLayout';

interface SearchParams {
  page?: string;
  season?: string;
  seasonYear?: string;
  format?: string;
  genres?: string;
}

export default async function NewestPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  
  const page = parseInt(resolvedParams.page || '1', 10);
  const season = resolvedParams.season;
  const seasonYear = resolvedParams.seasonYear ? parseInt(resolvedParams.seasonYear, 10) : undefined;
  const format = resolvedParams.format;
  const genres = resolvedParams.genres ? resolvedParams.genres.split(',') : undefined;

  // Filter params for Newest
  const data = await getFilteredAnimeAniList({
    page,
    season,
    seasonYear: seasonYear || new Date().getFullYear(),
    format,
    genres,
    sort: 'START_DATE_DESC'
  });

  const params = new URLSearchParams();
  if (season) params.set('season', season);
  if (seasonYear) params.set('seasonYear', seasonYear.toString());
  if (format) params.set('format', format);
  if (resolvedParams.genres) params.set('genres', resolvedParams.genres);

  return (
    <CategoryLayout 
      title="NEW RELEASES"
      description="The newest anime added to the catalog."
      results={data.media || []}
      pageInfo={data.pageInfo || { currentPage: 1, lastPage: 1, hasNextPage: false }}
      basePath="/newest"
      queryParams={params.toString()}
      hideFilter={true}
    />
  );
}
