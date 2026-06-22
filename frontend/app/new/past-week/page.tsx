import { Metadata } from 'next';
import { getPastWeekReleasesAniList, type AiringSchedule } from '../../../lib/api';
import CategoryLayout from '../../../components/CategoryLayout';

export const metadata: Metadata = {
  title: 'Anime Released This Week | Anime Nation India',
  description: 'View all anime episodes that aired in the past 7 days.',
};

export default async function PastWeekPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageStr = searchParams.page as string;
  const page = pageStr ? parseInt(pageStr, 10) : 1;

  const data = await getPastWeekReleasesAniList(page);

  // Map API response to CategoryLayout expected format
  const mappedResults = data?.airingSchedules?.map((schedule: AiringSchedule) => ({
    ...schedule.media,
    airingEpisode: schedule.episode,
  })) || [];

  return (
    <CategoryLayout
      title="This Past Week"
      description="Episodes that dropped over the last 7 days."
      results={mappedResults}
      pageInfo={data?.pageInfo || { currentPage: page, lastPage: 1, hasNextPage: false }}
      basePath="/new/past-week"
      queryParams=""
      hideFilter={true}
    />
  );
}
