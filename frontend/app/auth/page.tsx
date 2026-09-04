import { redirect } from 'next/navigation';

interface AuthPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function AuthRedirectPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const mode = params?.mode;

  if (mode === 'signup' || mode === 'register') {
    redirect('/signup');
  } else {
    redirect('/signin');
  }
}
