import { redirect } from 'next/navigation';

export default function BrowseCalendarRedirect() {
  redirect('/schedule');
}
