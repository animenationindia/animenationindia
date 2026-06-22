import { Metadata } from 'next';
import { getNews, getNewsByCategory } from '../../../lib/getNews';
import NewsCategoryLayout from '../../../components/NewsCategoryLayout';

export const metadata: Metadata = {
  title: 'Anime Features & Articles | Anime Nation India',
  description: 'In-depth anime articles, reviews, interviews, and features.',
};

export const revalidate = 1800;

export default async function FeaturesNewsPage() {
  const allNews = await getNews();
  const news = getNewsByCategory(allNews, 'Features');

  return (
    <NewsCategoryLayout
      title="Features & Reviews"
      description="Deep dives, reviews, interviews, and editorial articles about your favorite series."
      news={news}
    />
  );
}
