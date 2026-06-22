import ScheduleList from '../../schedule/ScheduleList';
import { getScheduleAniList, type AiringSchedule } from '../../../lib/api';

export default async function BrowseCalendarPage() {
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - distanceToMonday);
  startDate.setHours(0, 0, 0, 0);
  
  const start = Math.floor(startDate.getTime() / 1000);
  const end = start + 7 * 24 * 60 * 60 - 1;

  const rawSchedule = await getScheduleAniList(start, end);
  const schedule: AiringSchedule[] = rawSchedule || [];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Simulcast Schedule</h2>
        <p className="text-[#a0a0a0]">Stay up-to-date with the latest episode releases airing this week in Japan.</p>
      </div>
      <ScheduleList initialSchedule={schedule} />
    </div>
  );
}
