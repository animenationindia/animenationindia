import { Metadata } from 'next';
import { getNews } from '../../../lib/getNews';
import NewsCategoryLayout from '../../../components/NewsCategoryLayout';

export const metadata: Metadata = {
  title: 'Latest News | Anime Nation India',
  description: 'The latest anime news and updates.',
};

export const revalidate = 1800;

export default async function LatestNewsPage() {
  const allNews = await getNews();
  // Latest news is the top 30 recent items
  const news = allNews.slice(0, 30);

  return (
    <NewsCategoryLayout
      title="Latest News"
      description="Stay up to date with the newest headlines across the anime industry."
      news={news}
    />
  );
}
