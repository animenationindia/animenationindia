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

export const revalidate = 1800; // 30-minute edge CDN cache to avoid CPU limits

export default async function SchedulePage() {
  const nowSec = Math.floor(Date.now() / 1000);
  // Fetch past 3 days (Yesterday, etc.) through next 8 days (Today + full week ahead)
  const start = nowSec - (3 * 86400);
  const end = nowSec + (8 * 86400);

  const rawSchedule = await getScheduleAniList(start, end);
  const schedule: AiringSchedule[] = rawSchedule || [];

  return (
    <main className="bg-[#050716] min-h-screen pt-28 sm:pt-32 lg:pt-36 pb-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff4dd2]/[0.03] blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-5%] w-[45%] h-[45%] bg-[#ff6400]/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1500px] relative z-10">
        <ScheduleList initialSchedule={schedule} />
      </div>
    </main>
  );
}

