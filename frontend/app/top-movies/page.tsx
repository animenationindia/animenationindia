import { redirect } from 'next/navigation';

export default function TopMoviesRedirect() {
  redirect('/browse/all?format=MOVIE');
}
