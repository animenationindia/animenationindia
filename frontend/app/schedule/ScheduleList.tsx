'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type AiringSchedule } from '../../lib/api';
import { Clock, Play } from 'lucide-react';
import { motion } from 'framer-motion';

function ScheduleAnimeCard({ item }: { item: AiringSchedule }) {
  const title = item.media.title.english || item.media.title.romaji || 'Unknown';
  const linkId = item.media.idMal || item.media.id;
  const coverImage = item.media.coverImage?.extraLarge || item.media.coverImage?.large || '';
  const date = new Date(item.airingAt * 1000);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const year = item.media.seasonYear;
  const format = item.media.format ? item.media.format.replace('_', ' ') : 'TV';

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isAired, setIsAired] = useState<boolean>(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = item.airingAt * 1000 - now;

      if (distance < 0) {
        setIsAired(true);
        setTimeLeft('Aired');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        setTimeLeft(`${Math.floor(hours / 24)}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [item.airingAt]);

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative w-full mb-4 flex flex-col cursor-pointer bg-transparent"
    >
      <Link href={`/series/${linkId}`} className="block w-full h-full relative">
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#050716] rounded-xl border border-[#ff4dd2]/20 group-hover:border-[#ff4dd2]/50 group-hover:shadow-[0_0_25px_rgba(255, 77, 210,0.4)] transition-all duration-300">
          {coverImage && (
            <Image 
              src={coverImage} 
              alt={title} 
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}

          {/* Badges container */}
          <div className="absolute top-2 left-2 right-2 flex justify-between z-20 pointer-events-none">
             <div className="bg-[#ff4dd2]/90 backdrop-blur-md text-white text-[10px] md:text-xs font-black px-2.5 py-1 rounded-md shadow-lg border border-white/10">
                EP {item.episode}
             </div>
             <div className={`backdrop-blur-md text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 border border-white/10 transition-colors ${isAired ? 'bg-[#050716]/80 text-gray-400' : 'bg-gradient-to-r from-[#ff4dd2]/90 to-[#ff4dd2]/90 text-white'}`}>
                {isAired ? <Clock size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                {timeLeft}
             </div>
          </div>

          {/* Time floating badge bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-12">
            <p className="text-[#ff4dd2] text-xs font-black flex items-center gap-1.5">
              <Clock size={12} /> {timeStr}
            </p>
          </div>

          <div className="absolute inset-0 bg-[#121326]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center backdrop-blur-sm z-10">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 border-[#ff4dd2] bg-[#050716]/60 text-[#ff4dd2] hover:bg-[#ff4dd2] hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255, 77, 210,0.6)] group-hover:scale-110">
              <Play size={24} fill="currentColor" className="ml-1" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col px-1">
          <h3 className="text-white text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#ff4dd2] transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">
            {title}
          </h3>
          <div className="text-[12px] text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium capitalize">
            <span className="px-2 py-0.5 bg-white/5 rounded text-gray-300 border border-white/5">{format.toLowerCase()}</span>
            {year && <span className="opacity-60">• {year}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ScheduleList({ initialSchedule }: { initialSchedule: AiringSchedule[] }) {
  const [schedule, setSchedule] = useState<AiringSchedule[]>(initialSchedule);
  const [mounted, setMounted] = useState(false);
  
  // Use a state for today's index so it matches the client's current date
  const [todayIdx, setTodayIdx] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    const currentDay = new Date().getDay();
    setTodayIdx(currentDay);
    setSelectedDay(currentDay);
    setSchedule([...initialSchedule].sort((a, b) => a.airingAt - b.airingAt));
  }, [initialSchedule]);

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Skeleton Tabs */}
        <div className="flex gap-3 pb-4 overflow-hidden">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="w-24 h-10 bg-[#121326] rounded-full flex-shrink-0"></div>
          ))}
        </div>
        {/* Skeleton Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
            <div key={i} className="w-full aspect-[2/3] bg-[#121326] rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Group by day of week (0 = Sunday, 1 = Monday...)
  const groupedSchedule: Record<number, AiringSchedule[]> = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
  
  schedule.forEach(item => {
    const date = new Date(item.airingAt * 1000);
    const dayOfWeek = date.getDay();
    groupedSchedule[dayOfWeek].push(item);
  });

  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 0, name: 'Sunday' },
  ];

  return (
    <div className="space-y-8">
      {/* Scrollable Tabs */}
      <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar snap-x">
        {daysOfWeek.map(day => {
          const isSelected = selectedDay === day.id;
          const isToday = todayIdx === day.id;
          const label = isToday ? 'Today' : day.name;
          
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`snap-start px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 border ${
                isSelected && isToday
                  ? 'bg-[#ff4dd2] text-white border-[#ff4dd2] shadow-[0_0_20px_rgba(255, 77, 210,0.6)]'
                  : isSelected && !isToday
                  ? 'bg-[#121326]/80 text-[#ff4dd2] border-[#ff4dd2]/50 shadow-[0_0_15px_rgba(255, 77, 210,0.3)]'
                  : isToday
                  ? 'bg-[#ff4dd2]/10 text-[#ff4dd2] border-[#ff4dd2]/30 hover:bg-[#ff4dd2]/20'
                  : 'bg-[#121326]/50 text-[#a0a0a0] border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
        {groupedSchedule[selectedDay]?.map(item => (
           <ScheduleAnimeCard key={item.id} item={item} />
        ))}
      </div>
      
      {(!groupedSchedule[selectedDay] || groupedSchedule[selectedDay].length === 0) && (
        <div className="text-[#a0a0a0] italic py-8 text-center text-lg">
          No scheduled releases found for this day.
        </div>
      )}
    </div>
  );
}

