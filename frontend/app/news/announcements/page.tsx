import { Metadata } from 'next';
import { getNews, getNewsByCategory } from '../../../lib/getNews';
import NewsCategoryLayout from '../../../components/NewsCategoryLayout';

export const metadata: Metadata = {
  title: 'Anime Announcements | Anime Nation India',
  description: 'Official announcements, cast reveals, and new anime adaptations.',
};

export const revalidate = 1800;

export default async function AnnouncementsNewsPage() {
  const allNews = await getNews();
  const news = getNewsByCategory(allNews, 'Announcements');

  return (
    <NewsCategoryLayout
      title="Announcements"
      description="Official reveals, staff and cast updates, and brand new anime announcements."
      news={news}
    />
  );
}
