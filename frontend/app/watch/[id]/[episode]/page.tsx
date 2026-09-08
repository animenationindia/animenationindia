import { redirect } from 'next/navigation';

export default async function WatchEpisodePage({
  params,
}: {
  params: Promise<{ id: string; episode: string }>;
}) {
  const { id, episode } = await params;
  redirect(`/watch/${id}?ep=${episode}`);
}
