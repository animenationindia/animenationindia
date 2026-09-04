export const runtime = 'edge';
import { getTopStaffAniList } from '../../lib/api';
import PersonCard from '../../components/PersonCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchParams {
  page?: string;
}

export default async function StaffPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10);

  const staff = await getTopStaffAniList(page);

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 selection:bg-[#ff4dd2] selection:text-black">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Top Staff & Voice Actors
          </h1>
          <p className="text-gray-400 mt-2 font-medium text-sm md:text-base">
            The most favorited voice actors, directors, and creators in the anime community.
          </p>
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-5 mb-16">
          {staff.map(person => (
            <PersonCard key={person.id} person={person} linkType="staff" />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {page > 1 && (
            <Link href={`/staff?page=${page - 1}`} className="flex items-center gap-1 px-4 py-2 bg-[#121326] hover:bg-[#ff4dd2] text-white hover:text-black rounded-xl font-bold border border-white/10 transition-all cursor-pointer text-sm">
              <ChevronLeft size={18} /> Prev
            </Link>
          )}
          
          <div className="w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all bg-[#ff4dd2] text-black shadow-[0_0_15px_rgba(255,77,210,0.4)] text-sm">
            {page}
          </div>

          <Link href={`/staff?page=${page + 1}`} className="flex items-center gap-1 px-4 py-2 bg-[#121326] hover:bg-[#ff4dd2] text-white hover:text-black rounded-xl font-bold border border-white/10 transition-all cursor-pointer text-sm">
            Next <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}
