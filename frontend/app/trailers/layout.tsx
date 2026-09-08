import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Official Anime Trailers & Teasers HD | Anime Nation India',
  description: 'Watch the latest official anime trailers, seasonal teasers, and high-definition preview clips straight from Japan. Discover trending and upcoming anime with English subtitles.',
  keywords: [
    'anime trailers',
    'anime teasers',
    'official anime trailer',
    'upcoming anime trailers',
    'anime nation india trailers',
    'demon slayer trailer',
    'solo leveling trailer',
    'jujutsu kaisen trailer',
    'hd anime previews'
  ],
  alternates: {
    canonical: 'https://animenationindia.com/trailers',
  },
  openGraph: {
    title: 'Official Anime Trailers & Teasers HD | Anime Nation India',
    description: 'Watch the latest official anime trailers, seasonal teasers, and high-definition preview clips straight from Japan.',
    url: 'https://animenationindia.com/trailers',
    siteName: 'Anime Nation India',
    images: [
      {
        url: 'https://animenationindia.com/og-trailers.jpg',
        width: 1200,
        height: 630,
        alt: 'Anime Nation India Official Trailers',
      },
    ],
    locale: 'en_IN',
    type: 'video.other',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Official Anime Trailers & Teasers HD | Anime Nation India',
    description: 'Watch the latest official anime trailers, seasonal teasers, and preview clips in HD straight from Japan.',
    images: ['https://animenationindia.com/og-trailers.jpg'],
  },
};

export default function TrailersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
