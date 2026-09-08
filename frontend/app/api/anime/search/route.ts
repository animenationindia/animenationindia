import { NextResponse } from 'next/server';
import { fetchJikan, isSafeContent, GLOBAL_CACHE_TIME } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const format = searchParams.get('format') || '';
  const genre = searchParams.get('genre') || '';

  // 1. Try Jikan API (Primary for MAL-indexed search)
  try {
    let endpoint = `/anime?page=${page}&limit=24&sfw=true`;
    if (q.trim()) endpoint += `&q=${encodeURIComponent(q.trim())}`;
    if (format) endpoint += `&type=${encodeURIComponent(format.toLowerCase())}`;
    if (genre) endpoint += `&genres=${encodeURIComponent(genre)}`;
    if (!q.trim()) endpoint += `&order_by=popularity&sort=asc`;

    const jikanRes = await fetchJikan(endpoint, GLOBAL_CACHE_TIME, 2500);
    if (jikanRes?.data && Array.isArray(jikanRes.data) && jikanRes.data.length > 0) {
      const safeData = jikanRes.data.filter((item: any) => isSafeContent(item));
      const media = safeData.map((anime: any) => ({
        id: anime.mal_id,
        idMal: anime.mal_id,
        idSystem: 'mal',
        title: {
          english: anime.title_english || anime.title,
          romaji: anime.title
        },
        coverImage: {
          large: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '/placeholder-poster.png',
          extraLarge: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '/placeholder-poster.png'
        },
        averageScore: anime.score ? Math.round(anime.score * 10) : null,
        format: anime.type || 'TV',
        status: anime.status === 'Currently Airing' ? 'RELEASING' : anime.status === 'Finished Airing' ? 'FINISHED' : 'NOT_YET_RELEASED',
        episodes: anime.episodes || null,
        seasonYear: anime.year || (anime.aired?.prop?.from?.year) || null,
        startDate: { year: anime.year || (anime.aired?.prop?.from?.year) || null },
        genres: (anime.genres || []).map((g: any) => g.name),
        description: anime.synopsis || ''
      }));

      return NextResponse.json({
        media,
        pageInfo: {
          total: jikanRes.pagination?.items?.total || media.length,
          currentPage: page,
          lastPage: jikanRes.pagination?.last_visible_page || 1,
          hasNextPage: jikanRes.pagination?.has_next_page || false
        }
      });
    }
  } catch (err: any) {
    console.warn('[Search API] Jikan search failed:', err?.message);
  }

  // 2. Resilient Fallback to Kitsu API with MAL mapping inclusion
  try {
    const offset = (page - 1) * 20;
    const kitsuUrl = q.trim()
      ? `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(q.trim())}&include=mappings&page[limit]=20&page[offset]=${offset}`
      : `https://kitsu.io/api/edge/anime?sort=-userCount&include=mappings&page[limit]=20&page[offset]=${offset}`;
    const res = await fetch(kitsuUrl, {
      headers: { 'Accept': 'application/vnd.api+json', 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 }
    });

      if (res.ok) {
        const json = await res.json();
        const items = json.data || [];
        const includedMappings = new Map<string, string>();
        
        if (json.included && Array.isArray(json.included)) {
          json.included.forEach((inc: any) => {
            if (inc.type === 'mappings' && inc.attributes?.externalSite === 'myanimelist/anime' && inc.attributes?.externalId) {
              includedMappings.set(inc.id, inc.attributes.externalId);
            }
          });
        }

        if (items.length > 0) {
          const media = items.map((item: any) => {
            const attr = item.attributes || {};
            const rawRating = attr.averageRating ? parseFloat(attr.averageRating) : null;
            
            // Resolve MAL ID if mapped
            let resolvedMalId: number | null = null;
            const mappingRelationships = item.relationships?.mappings?.data || [];
            for (const rel of mappingRelationships) {
              if (includedMappings.has(rel.id)) {
                resolvedMalId = Number(includedMappings.get(rel.id));
                break;
              }
            }

            const finalId = resolvedMalId || `kitsu-${item.id}`;
            const idSystem = resolvedMalId ? 'mal' : 'kitsu';

            return {
              id: finalId,
              idMal: resolvedMalId,
              idSystem,
              title: {
                english: attr.titles?.en || attr.titles?.en_us || attr.canonicalTitle || 'Unknown',
                romaji: attr.titles?.en_jp || attr.canonicalTitle || 'Unknown'
              },
              coverImage: {
                large: attr.posterImage?.large || attr.posterImage?.original || '/placeholder-poster.png',
                extraLarge: attr.posterImage?.original || attr.posterImage?.large || '/placeholder-poster.png'
              },
              averageScore: rawRating ? Math.round(rawRating) : null,
              format: (attr.subtype || 'TV').toUpperCase(),
              status: attr.status === 'current' ? 'RELEASING' : attr.status === 'finished' ? 'FINISHED' : 'NOT_YET_RELEASED',
              episodes: attr.episodeCount || null,
              seasonYear: attr.startDate ? parseInt(attr.startDate.slice(0, 4)) : null,
              startDate: { year: attr.startDate ? parseInt(attr.startDate.slice(0, 4)) : null },
              genres: [],
              description: attr.synopsis || ''
            };
          });

          return NextResponse.json({
            media,
            pageInfo: {
              total: json.meta?.count || media.length,
              currentPage: page,
              lastPage: Math.ceil((json.meta?.count || 20) / 20),
              hasNextPage: items.length === 20
            }
          });
        }
      }
    } catch (err: any) {
      console.warn('[Search API] Kitsu search failed:', err?.message);
    }

  return NextResponse.json({
    media: [],
    pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false }
  });
}