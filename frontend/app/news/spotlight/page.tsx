import { Metadata } from 'next';
import { getNews } from '../../../lib/getNews';
import NewsCategoryLayout from '../../../components/NewsCategoryLayout';

export const metadata: Metadata = {
  title: 'Spotlight News | Anime Nation India',
  description: 'Top anime news spotlight.',
};

export const revalidate = 1800;

export default async function SpotlightNewsPage() {
  const allNews = await getNews();
  // Spotlight is the first 2 items by default, but for a "View All" page we can show top 8 or so.
  // Actually, we can show the top 12 as "Spotlight".
  const news = allNews.slice(0, 12);

  return (
    <NewsCategoryLayout
      title="Spotlight"
      description="The most important breaking anime news right now."
      news={news}
    />
  );
}
