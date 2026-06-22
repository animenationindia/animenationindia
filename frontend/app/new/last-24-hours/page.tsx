import { Metadata } from 'next';
import { getTodayReleasesAniList, type AiringSchedule } from '../../../lib/api';
import CategoryLayout from '../../../components/CategoryLayout';

export const metadata: Metadata = {
  title: 'Anime Released in Last 24 Hours | Anime Nation India',
  description: 'View all anime episodes that aired in the last 24 hours.',
};

export default async function Last24HoursPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageStr = searchParams.page as string;
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  const data = await getTodayReleasesAniList(page);

  // Map API response to CategoryLayout expected format
  const mappedResults = data?.airingSchedules?.map((schedule: AiringSchedule) => ({
    ...schedule.media,
    airingEpisode: schedule.episode,
  })) || [];

  return (
    <CategoryLayout
      title="Last 24 Hours"
      description="All episodes that aired within the last 24 hours."
      results={mappedResults}
      pageInfo={data?.pageInfo || { currentPage: page, lastPage: 1, hasNextPage: false }}
      basePath="/new/last-24-hours"
      queryParams=""
      hideFilter={true}
    />
  );
}
