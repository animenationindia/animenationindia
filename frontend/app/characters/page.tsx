import { getTopCharactersAniList } from '../../lib/api';
import PersonCard from '../../components/PersonCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchParams {
  page?: string;
}

export default async function CharactersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10);

  const characters = await getTopCharactersAniList(page);

  return (
    <main className="min-h-screen bg-[#070708] pt-32 lg:pt-36 lg:pt-36 pb-20 selection:bg-[#ff6400] selection:text-white">
      <div className="container mx-auto px-4 max-w-[1400px]">
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-widest uppercase">
            TOP CHARACTERS
          </h1>
          <p className="text-gray-400 mt-2 font-medium">
            The most favorited characters in the anime community.
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6 mb-16">
          {characters.map(person => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {page > 1 && (
            <Link href={`/characters?page=${page - 1}`} className="flex items-center gap-1 px-4 py-2 bg-[#121214] hover:bg-[#ff6400] text-white hover:text-white rounded-lg font-bold border border-white/5 transition-colors cursor-pointer">
              <ChevronLeft size={18} /> Prev
            </Link>
          )}
          
          <div className="w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all bg-[#ff6400] text-white shadow-[0_0_15px_rgba(255,100,0,0.4)]">
            {page}
          </div>

          <Link href={`/characters?page=${page + 1}`} className="flex items-center gap-1 px-4 py-2 bg-[#121214] hover:bg-[#ff6400] text-white hover:text-white rounded-lg font-bold border border-white/5 transition-colors cursor-pointer">
            Next <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}
