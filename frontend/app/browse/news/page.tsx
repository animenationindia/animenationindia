import { redirect } from 'next/navigation';

export default function BrowseNewsRedirect() {
  redirect('/news');
}
