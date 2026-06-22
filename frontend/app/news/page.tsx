import { Metadata } from 'next';
import NewsContent from '../../components/NewsContent';

export const metadata: Metadata = {
  title: 'Anime News | Anime Nation India',
  description: 'Latest anime news, announcements, features, and updates from across the anime industry.',
};

export const revalidate = 1800;

export default async function NewsPage() {
  return (
    <div className="bg-[#000000] min-h-screen pt-32 lg:pt-36 lg:pt-36 pb-16 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] relative z-10">
        <NewsContent />
      </div>
    </div>
  );
}
