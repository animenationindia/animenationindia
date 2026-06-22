import GenresContent from '../../../components/GenresContent';

export default async function BrowseGenresPage({ searchParams }: { searchParams: Promise<{ genreId?: string; sort?: string; page?: string }> }) {
  const resolvedParams = await searchParams;
  
  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Anime Genres</h2>
        <p className="text-[#a0a0a0]">Explore thousands of anime categorized by your favorite genres and themes.</p>
      </div>
      <GenresContent searchParams={resolvedParams} basePath="/browse/genres" />
    </div>
  );
}
