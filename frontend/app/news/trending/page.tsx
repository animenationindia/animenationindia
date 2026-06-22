import { Metadata } from 'next';
import { getNews } from '../../../lib/getNews';
import NewsCategoryLayout from '../../../components/NewsCategoryLayout';

export const metadata: Metadata = {
  title: 'Trending News | Anime Nation India',
  description: 'Trending and top stories in the anime world.',
};

export const revalidate = 1800;

export default async function TrendingNewsPage() {
  const allNews = await getNews();
  // Trending news can be items from slice 3 to 20 for example
  const news = allNews.slice(2, 22);

  return (
    <NewsCategoryLayout
      title="Trending"
      description="The hottest and most talked-about topics in anime."
      news={news}
    />
  );
}
