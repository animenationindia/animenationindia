/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Metadata } from 'next';
import { getScheduleAniList, type AiringSchedule } from '../../lib/api';
import ScheduleList from './ScheduleList';

export const metadata: Metadata = {
  title: 'Release Schedule | Anime Nation India',
  description: 'Track upcoming anime episodes and simulcast release times.',
};

export default async function SchedulePage() {
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - distanceToMonday);
  startDate.setHours(0, 0, 0, 0);
  
  const start = Math.floor(startDate.getTime() / 1000);
  const end = start + 7 * 24 * 60 * 60 - 1;

  
  const rawSchedule = await getScheduleAniList(start, end);
  
  // Clean data structure
  const schedule: AiringSchedule[] = rawSchedule || [];

  return (
    <div className="bg-[#050716] min-h-screen pt-32 lg:pt-36 lg:pt-36 pb-12">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1200px]">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2">
            Release <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Schedule</span>
          </h1>
          <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base">
            Never miss a moment of your favorite stories. Track real-time episode releases, automatically synchronized to your local timezone.
          </p>
        </div>

        <ScheduleList initialSchedule={schedule} />
      </div>
    </div>
  );
}

