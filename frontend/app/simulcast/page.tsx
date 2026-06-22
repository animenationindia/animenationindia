import { Metadata } from 'next';
import SimulcastClient from './SimulcastClient';

export const metadata: Metadata = {
  title: 'Simulcast Season | Anime Nation India',
  description: 'Time-travel through seasons and watch the latest currently airing anime directly from Japan.',
};

export default function SimulcastPage() {
  return <SimulcastClient />;
}

