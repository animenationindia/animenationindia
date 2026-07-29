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
    <main className="bg-[#050716] min-h-screen pt-28 lg:pt-32 pb-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff4dd2]/[0.03] blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-5%] w-[45%] h-[45%] bg-[#ff6400]/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1500px] relative z-10">
        <ScheduleList initialSchedule={schedule} />
      </div>
    </main>
  );
}

