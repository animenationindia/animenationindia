import { Metadata } from 'next';
import GenresContent from '../../../components/GenresContent';
import { getJikanGenres } from '../../../lib/api';

interface SearchParams {
  genreId?: string;
  sort?: string;
  page?: string;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const genreId = resolvedParams.genreId;

  let genreName = '';
  if (genreId) {
    try {
      const allGenres = await getJikanGenres();
      const matched = allGenres.find((g: any) => g.mal_id.toString() === genreId);
      if (matched) {
        genreName = matched.name;
      }
    } catch (err) {
      console.error('Error fetching browse genre metadata:', err);
    }
  }

  const title = genreName 
    ? `${genreName} Anime - Browse | Anime Nation India`
    : 'Browse Anime Genres | Anime Nation India';
    
  const description = genreName
    ? `Browse top ${genreName} anime series and recommendations on Anime Nation India.`
    : 'Browse thousands of anime categorized by your favorite genres on Anime Nation India.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: '/ani-logo.png', alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/ani-logo.png'],
    },
  };
}

export default async function BrowseGenresPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
