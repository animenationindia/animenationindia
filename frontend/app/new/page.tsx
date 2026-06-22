/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Metadata } from 'next';
import { 
  getTodayReleasesAniList, 
  getPastWeekReleasesAniList, 
  getPastMonthReleasesAniList,
  type AiringSchedule
} from '../../lib/api';
import SectionSlider from '../../components/SectionSlider';

export const metadata: Metadata = {
  title: 'New Anime | Anime Nation India',
  description: 'Discover the latest anime episodes and new releases.',
};

export default async function NewAnimePage() {
  const [todayData, pastWeekData, pastMonthData] = await Promise.all([
    getTodayReleasesAniList(1),
    getPastWeekReleasesAniList(1),
    getPastMonthReleasesAniList(1),
  ]);

  const mapToMedia = (data: any) => {
    return data?.airingSchedules?.map((schedule: AiringSchedule) => ({
      ...schedule.media,
      airingEpisode: schedule.episode 
    })) || [];
  };

  const todayReleases = mapToMedia(todayData);
  const pastWeekReleases = mapToMedia(pastWeekData);
  const pastMonthReleases = mapToMedia(pastMonthData);

  return (
    <div className="bg-[#050716] min-h-screen pt-32 lg:pt-36 lg:pt-36 pb-12">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px]">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2">
            New & <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Recently Added</span>
          </h1>
          <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base">
            Stay up to date with the latest additions to the anime universe. Explore newly released episodes from the last 24 hours, the past week, and this month.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          <SectionSlider 
            title="Last 24 Hours" 
            data={todayReleases as any}
            type="anime" 
            viewAllLink="/new/last-24-hours" 
          />

          <SectionSlider 
            title="This Past Week" 
            data={pastWeekReleases as any}
            type="anime" 
            viewAllLink="/new/past-week" 
          />

          <SectionSlider 
            title="Past Month" 
            data={pastMonthReleases as any}
            type="anime" 
            viewAllLink="/new/past-month" 
          />
        </div>
      </div>
    </div>
  );
}



