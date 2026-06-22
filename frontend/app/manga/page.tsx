import { redirect } from 'next/navigation';

export default function MangaRootRedirectPage() {
  redirect('/browse/manga');
}
