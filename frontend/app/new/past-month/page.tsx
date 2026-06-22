import { Metadata } from 'next';
import { getPastMonthReleasesAniList, type AiringSchedule } from '../../../lib/api';
import CategoryLayout from '../../../components/CategoryLayout';

export const metadata: Metadata = {
  title: 'Anime Released Past Month | Anime Nation India',
  description: 'View all anime episodes that aired in the past 30 days.',
};

export default async function PastMonthPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageStr = searchParams.page as string;
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  const data = await getPastMonthReleasesAniList(page);

  // Map API response to CategoryLayout expected format
  const mappedResults = data?.airingSchedules?.map((schedule: AiringSchedule) => ({
    ...schedule.media,
    airingEpisode: schedule.episode,
  })) || [];

  return (
    <CategoryLayout
      title="Past Month"
      description="All episodes that aired within the last 30 days."
      results={mappedResults}
      pageInfo={data?.pageInfo || { currentPage: page, lastPage: 1, hasNextPage: false }}
      basePath="/new/past-month"
      queryParams=""
      hideFilter={true}
    />
  );
}
