/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import SectionSlider from './SectionSlider';
import { SliderSkeleton } from './SkeletonLoaders';
import { getTopCharactersAniList, getTopStaffAniList, fetchInBatches } from '../lib/api';

const dedupe = (arr: any[]) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter((item) => {
    const id = item?.id || item?.idMal || item?.media?.id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export default function TopCharactersClient() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCharacters() {
      try {
        const results = await fetchInBatches(
          [() => getTopCharactersAniList(1), () => getTopStaffAniList(1)],
          2,
          100
        );
        if (!isMounted) return;
        setCharacters(dedupe(results[0] || []));
        setPeople(dedupe(results[1] || []));
      } catch (err) {
        console.warn('[TopCharactersClient] Error loading characters:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCharacters();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <SliderSkeleton title="Top Characters & Creators" />;
  }

  if (characters.length === 0 && people.length === 0) return null;

  return (
    <div className="flex flex-col gap-14">
      {characters.length > 0 && (
        <SectionSlider title="Most Popular Anime Characters" data={characters} type="person" viewAllLink="/staff" />
      )}
      {people.length > 0 && (
        <SectionSlider title="Top Anime Voice Actors & Creators" data={people} type="person" viewAllLink="/staff" />
      )}
    </div>
  );
}
