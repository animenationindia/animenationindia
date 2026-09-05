import { redirect } from 'next/navigation';

export default async function GenreRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      params.set(key, value.join(','));
    }
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  redirect(`/genres${qs}`);
}
