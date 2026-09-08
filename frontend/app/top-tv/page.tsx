import { redirect } from 'next/navigation';

export default function TopTvRedirect() {
  redirect('/browse/all?format=TV');
}
