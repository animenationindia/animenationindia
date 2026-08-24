export interface WatchOrderStep {
  step: number;
  id: number;
  title: string;
  format: string;
  type: string;
  relationType: string;
  year: number | null;
  image: string;
  isCurrent: boolean;
}

interface AnimeNode {
  id: number;
  title: string;
  format: string;
  type?: string;
  startDate?: {
    year?: number | null;
    month?: number | null;
    day?: number | null;
  } | null;
  coverImage?: {
    extraLarge?: string;
    large?: string;
  };
  relationType?: string;
  relations?: {
    edges?: Array<{
      relationType: string;
      node: AnimeNode;
    }>;
  };
}

export function buildFranchiseWatchOrder(currentAnime: any, relations: any[] = []): WatchOrderStep[] {
  const currentId = Number(currentAnime.mal_id || currentAnime.id || 0);
  const currentTitle = currentAnime.title_english || currentAnime.title || 'Current Anime';
  const currentFormat = (currentAnime.type || 'TV').toUpperCase();
  const currentYear = currentAnime.year || (currentAnime.aired?.prop?.from?.year) || null;
  const currentImage = currentAnime.images?.webp?.large_image_url || currentAnime.images?.jpg?.large_image_url || '/placeholder-poster.png';

  const allNodesMap = new Map<number, {
    id: number;
    title: string;
    format: string;
    startDateScore: number;
    year: number | null;
    image: string;
    rawRelation: string;
  }>();

  // Helper to compute sortable release score
  const getReleaseScore = (year?: number | null, month?: number | null, day?: number | null) => {
    if (!year) return 99999999;
    return (year * 10000) + ((month || 1) * 100) + (day || 1);
  };

  // Add current active anime as base
  allNodesMap.set(currentId, {
    id: currentId,
    title: currentTitle,
    format: currentFormat,
    startDateScore: getReleaseScore(currentYear, currentAnime.aired?.prop?.from?.month, currentAnime.aired?.prop?.from?.day),
    year: currentYear,
    image: currentImage,
    rawRelation: 'CURRENT'
  });

  // Recursive collector for nested relations
  const visitedNodes = new Set<number>();
  visitedNodes.add(currentId);

  const traverseRelationEdges = (edges: any[]) => {
    if (!Array.isArray(edges)) return;

    for (const edge of edges) {
      if (!edge || !edge.node) continue;
      const node = edge.node;
      
      // Filter out non-anime (e.g. MANGA) or purely music videos
      const mediaType = (node.type || 'ANIME').toUpperCase();
      const nodeFormat = (node.format || 'TV').toUpperCase();
      if (mediaType !== 'ANIME' && node.type) continue;
      if (nodeFormat === 'MUSIC') continue;

      const nodeId = Number(node.idMal || node.id);
      if (!nodeId || isNaN(nodeId)) continue;

      if (!allNodesMap.has(nodeId)) {
        const nodeYear = node.startDate?.year || null;
        const score = getReleaseScore(nodeYear, node.startDate?.month, node.startDate?.day);
        const nodeImg = node.coverImage?.extraLarge || node.coverImage?.large || '/placeholder-poster.png';
        const nodeTitle = node.title?.english || node.title?.romaji || 'Related Anime';

        allNodesMap.set(nodeId, {
          id: nodeId,
          title: nodeTitle,
          format: nodeFormat,
          startDateScore: score,
          year: nodeYear,
          image: nodeImg,
          rawRelation: (edge.relationType || 'SIDE_STORY').toUpperCase()
        });
      }

      // Traverse deeper nested edges if available
      if (!visitedNodes.has(nodeId)) {
        visitedNodes.add(nodeId);
        if (node.relations?.edges) {
          traverseRelationEdges(node.relations.edges);
        }
      }
    }
  };

  traverseRelationEdges(relations);

  // If only current anime and no relations, return simple 1-step order
  if (allNodesMap.size <= 1) {
    return [{
      step: 1,
      id: currentId,
      title: currentTitle,
      format: currentFormat,
      type: 'ANIME',
      relationType: 'Main Storyline',
      year: currentYear,
      image: currentImage,
      isCurrent: true
    }];
  }

  // Sort all franchise releases chronologically by release date
  const sortedItems = Array.from(allNodesMap.values()).sort((a, b) => {
    if (a.startDateScore !== b.startDateScore) {
      return a.startDateScore - b.startDateScore;
    }
    return a.id - b.id;
  });

  // Count TV seasons to assign clean progressive tags (Season 1, Season 2, etc.)
  let tvSeasonCount = 0;
  let movieCount = 0;

  const steps: WatchOrderStep[] = sortedItems.map((item, index) => {
    let relBadge = 'Side Story';
    const fmt = item.format.toUpperCase();

    if (fmt === 'TV' || fmt === 'TV_SHORT') {
      tvSeasonCount++;
      if (tvSeasonCount === 1) {
        relBadge = 'Season 1 (Start Here)';
      } else {
        relBadge = `Season ${tvSeasonCount} / Sequel`;
      }
    } else if (fmt === 'MOVIE') {
      movieCount++;
      if (item.rawRelation === 'SEQUEL' || item.rawRelation === 'PREQUEL' || item.rawRelation === 'PARENT') {
        relBadge = `Movie (Canon Story)`;
      } else {
        relBadge = `Movie #${movieCount}`;
      }
    } else if (fmt === 'OVA') {
      relBadge = 'OVA / Side Story';
    } else if (fmt === 'ONA') {
      relBadge = 'Web Anime / ONA';
    } else if (fmt === 'SPECIAL') {
      relBadge = 'Special Episode';
    } else {
      relBadge = item.rawRelation.replace(/_/g, ' ');
    }

    return {
      step: index + 1,
      id: item.id,
      title: item.title,
      format: item.format,
      type: 'ANIME',
      relationType: relBadge,
      year: item.year,
      image: item.image,
      isCurrent: item.id === currentId
    };
  });

  return steps;
}
