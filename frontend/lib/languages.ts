import { TMDBAnimeData } from './tmdb-api';

export interface LanguageItem {
  name: string;
  flag: string;
}

export interface AnimeLanguageInfo {
  originalAudio: string;
  originalFlag: string;
  hasDub: boolean;
  hasSub: boolean;
  dubLanguages: LanguageItem[];
  subLanguages: LanguageItem[];
  badgeLabel: string;
  badgeShort: string;
  tone: 'emerald' | 'cyan' | 'purple' | 'amber';
}

const LANGUAGE_FLAGS: Record<string, string> = {
  'Japanese': '🇯🇵',
  'English': '🇺🇸',
  'Hindi': '🇮🇳',
  'Bengali': '🇧🇩',
  'Spanish': '🇪🇸',
  'Spanish (Latin America)': '🇲🇽',
  'Spanish (Castilian)': '🇪🇸',
  'French': '🇫🇷',
  'German': '🇩🇪',
  'Italian': '🇮🇹',
  'Portuguese': '🇧🇷',
  'Portuguese (BR)': '🇧🇷',
  'Russian': '🇷🇺',
  'Arabic': '🇸🇦',
  'Korean': '🇰🇷',
  'Chinese': '🇨🇳',
  'Mandarin': '🇨🇳',
  'Cantonese': '🇭🇰',
  'Tagalog': '🇵🇭',
  'Filipino': '🇵🇭',
  'Indonesian': '🇮🇩',
  'Thai': '🇹🇭',
  'Vietnamese': '🇻🇳',
  'Turkish': '🇹🇷',
  'Polish': '🇵🇱',
  'Dutch': '🇳🇱',
  'Swedish': '🇸🇪',
  'Danish': '🇩🇰',
  'Finnish': '🇫🇮',
  'Norwegian': '🇳🇴',
  'Greek': '🇬🇷',
  'Hebrew': '🇮🇱',
  'Czech': '🇨🇿',
  'Hungarian': '🇭🇺',
  'Romanian': '🇷🇴',
  'Ukrainian': '🇺🇦',
  'Malay': '🇲🇾',
  'Tamil': '🇮🇳',
  'Telugu': '🇮🇳'
};

function getFlag(lang: string): string {
  if (LANGUAGE_FLAGS[lang]) return LANGUAGE_FLAGS[lang];
  for (const [k, v] of Object.entries(LANGUAGE_FLAGS)) {
    if (lang.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '🌐';
}

function normalizeLanguageName(raw: string): string {
  const trimmed = (raw || '').trim();
  const lower = trimmed.toLowerCase();
  
  if (lower.includes('japanese') || lower === 'ja') return 'Japanese';
  if (lower.includes('english') || lower === 'en') return 'English';
  if (lower.includes('hindi') || lower === 'hi') return 'Hindi';
  if (lower.includes('bengali') || lower === 'bn') return 'Bengali';
  if (lower.includes('latin') && lower.includes('spanish')) return 'Spanish (Latin America)';
  if (lower.includes('castilian') || (lower.includes('spanish') && !lower.includes('latin'))) return 'Spanish';
  if (lower.includes('french') || lower === 'fr') return 'French';
  if (lower.includes('german') || lower === 'de') return 'German';
  if (lower.includes('italian') || lower === 'it') return 'Italian';
  if (lower.includes('portuguese') || lower.includes('brazilian') || lower === 'pt') return 'Portuguese (BR)';
  if (lower.includes('russian') || lower === 'ru') return 'Russian';
  if (lower.includes('arabic') || lower === 'ar') return 'Arabic';
  if (lower.includes('korean') || lower === 'ko') return 'Korean';
  if (lower.includes('mandarin') || lower.includes('chinese') || lower === 'zh') return 'Chinese (Mandarin)';
  if (lower.includes('tagalog') || lower.includes('filipino')) return 'Tagalog';
  if (lower.includes('indonesian') || lower === 'id') return 'Indonesian';
  if (lower.includes('thai') || lower === 'th') return 'Thai';
  if (lower.includes('vietnamese') || lower === 'vi') return 'Vietnamese';
  if (lower.includes('turkish') || lower === 'tr') return 'Turkish';
  if (lower.includes('polish') || lower === 'pl') return 'Polish';
  if (lower.includes('tamil') || lower === 'ta') return 'Tamil';
  if (lower.includes('telugu') || lower === 'te') return 'Telugu';

  return trimmed;
}

/**
 * Intelligent Language & Dub/Sub Resolver
 * Combines TMDB (Spoken Audio & Translations), AniList (Country & Links), 
 * Jikan/MAL (Voice Actors) & Licensors to determine true worldwide availability.
 */
export function resolveAnimeLanguages(
  anime: any,
  extraInfo?: any,
  characters: any[] = [],
  tmdbData?: TMDBAnimeData | null
): AnimeLanguageInfo {
  // 1. Determine Original Audio
  const country = (extraInfo?.countryOfOrigin || '').toUpperCase();
  const tmdbLang = (tmdbData?.originalLanguage || '').toLowerCase();

  let originalAudio = 'Japanese';
  let originalFlag = '🇯🇵';

  if (country === 'CN' || tmdbLang === 'zh') {
    originalAudio = 'Chinese (Mandarin)';
    originalFlag = '🇨🇳';
  } else if (country === 'KR' || tmdbLang === 'ko') {
    originalAudio = 'Korean';
    originalFlag = '🇰🇷';
  } else if (country === 'US' || country === 'GB' || tmdbLang === 'en') {
    originalAudio = 'English';
    originalFlag = '🇺🇸';
  }

  // 2. Extract Dubbed Languages (Voice Actors + TMDB Spoken Audio + Streaming Links)
  const dubSet = new Set<string>();

  // A. From TMDB Spoken Languages
  if (tmdbData?.spokenLanguages && Array.isArray(tmdbData.spokenLanguages)) {
    for (const sp of tmdbData.spokenLanguages) {
      const norm = normalizeLanguageName(sp.name);
      if (norm && norm !== originalAudio) {
        dubSet.add(norm);
      }
    }
  }

  // B. From Voice Actors (Jikan / AniList)
  if (Array.isArray(characters)) {
    for (const char of characters) {
      if (Array.isArray(char.voice_actors)) {
        for (const va of char.voice_actors) {
          if (va.language) {
            const norm = normalizeLanguageName(va.language);
            if (norm && norm !== originalAudio) {
              dubSet.add(norm);
            }
          }
        }
      }
      if (Array.isArray(char.voiceActors)) {
        for (const va of char.voiceActors) {
          if (va.language) {
            const norm = normalizeLanguageName(va.language);
            if (norm && norm !== originalAudio) {
              dubSet.add(norm);
            }
          }
        }
      }
    }
  }

  // C. From AniList External Streaming Links (Notes & Languages)
  if (Array.isArray(extraInfo?.externalLinks)) {
    for (const link of extraInfo.externalLinks) {
      const notes = (link.notes || '').toLowerCase();
      const linkLang = (link.language || '').toLowerCase();

      if (notes.includes('en dub') || notes.includes('english dub') || linkLang === 'english') dubSet.add('English');
      if (notes.includes('fr dub') || notes.includes('french dub') || linkLang === 'french') dubSet.add('French');
      if (notes.includes('de dub') || notes.includes('german dub') || linkLang === 'german') dubSet.add('German');
      if (notes.includes('es dub') || notes.includes('spanish dub') || linkLang === 'spanish') dubSet.add('Spanish');
      if (notes.includes('hi dub') || notes.includes('hindi dub') || linkLang === 'hindi') dubSet.add('Hindi');
      if (notes.includes('pt dub') || notes.includes('portuguese dub') || linkLang === 'portuguese') dubSet.add('Portuguese (BR)');
      if (notes.includes('it dub') || notes.includes('italian dub') || linkLang === 'italian') dubSet.add('Italian');
      if (notes.includes('ru dub') || notes.includes('russian dub') || linkLang === 'russian') dubSet.add('Russian');
    }
  }

  // D. Licensor Check: If officially licensed by major Western distributors and has English title
  const licensors = Array.isArray(anime?.licensors) 
    ? anime.licensors.map((l: any) => (typeof l === 'string' ? l : l.name || '').toLowerCase())
    : [];
  
  const hasMajorLicensor = licensors.some((l: string) => 
    l.includes('funimation') || 
    l.includes('crunchyroll') || 
    l.includes('sentai') || 
    l.includes('viz media') || 
    l.includes('netflix') || 
    l.includes('aniplex of america') || 
    l.includes('disney')
  );

  const englishTitle = anime?.title_english || extraInfo?.title?.english;
  const mainTitle = anime?.title || extraInfo?.title?.romaji;
  
  if (hasMajorLicensor && englishTitle && englishTitle !== mainTitle && originalAudio !== 'English') {
    dubSet.add('English');
  }

  // Priority sorting for Dubs: English, Hindi, Spanish, French, German, Portuguese, Italian, others
  const priorityOrder = ['English', 'Hindi', 'Bengali', 'Spanish', 'French', 'German', 'Portuguese (BR)', 'Italian', 'Russian', 'Arabic', 'Tamil', 'Telugu'];
  const sortedDubs = Array.from(dubSet).sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const dubLanguages: LanguageItem[] = sortedDubs.map(name => ({
    name,
    flag: getFlag(name)
  }));

  // 3. Construct Available Subtitles (TMDB Translations + Standard Regional Translations)
  const subSet = new Set<string>(['English']);

  if (tmdbData?.subtitleLanguages && Array.isArray(tmdbData.subtitleLanguages)) {
    for (const sub of tmdbData.subtitleLanguages) {
      const norm = normalizeLanguageName(sub.name);
      if (norm && norm !== originalAudio) {
        subSet.add(norm);
      }
    }
  }

  if (dubSet.has('Spanish') || dubSet.has('Spanish (Latin America)')) subSet.add('Spanish');
  if (dubSet.has('French')) subSet.add('French');
  if (dubSet.has('German')) subSet.add('German');
  if (dubSet.has('Portuguese (BR)') || dubSet.has('Portuguese')) subSet.add('Portuguese (BR)');
  if (dubSet.has('Italian')) subSet.add('Italian');
  if (dubSet.has('Hindi')) subSet.add('Hindi');
  if (dubSet.has('Russian')) subSet.add('Russian');
  if (dubSet.has('Arabic')) subSet.add('Arabic');

  const sortedSubs = Array.from(subSet).sort((a, b) => {
    const idxA = priorityOrder.indexOf(a);
    const idxB = priorityOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const subLanguages: LanguageItem[] = sortedSubs.map(name => ({
    name,
    flag: getFlag(name)
  }));

  // 4. Generate Smart Badge Text & UI Tone
  let badgeLabel = '';
  let badgeShort = '';
  let tone: 'emerald' | 'cyan' | 'purple' | 'amber' = 'emerald';

  const hasDub = dubLanguages.length > 0;
  const hasSub = true;

  if (hasDub) {
    if (dubLanguages.length === 1 && dubLanguages[0].name === 'English') {
      badgeLabel = `${originalAudio} (Original) • English Dub & Sub`;
      badgeShort = 'Dub (EN) & Sub';
      tone = 'emerald';
    } else if (dubLanguages.length > 1) {
      badgeLabel = `${originalAudio} • Multi Dub (${dubLanguages.length} Languages) & Sub`;
      badgeShort = `Multi Dub (${dubLanguages.length}) & Sub`;
      tone = 'purple';
    } else {
      badgeLabel = `${originalAudio} • ${dubLanguages[0].name} Dub & Sub`;
      badgeShort = `Dub (${dubLanguages[0].name}) & Sub`;
      tone = 'cyan';
    }
  } else {
    badgeLabel = `${originalAudio} (Original) • Sub Only`;
    badgeShort = `${originalAudio} (Sub Only)`;
    tone = 'amber';
  }

  return {
    originalAudio,
    originalFlag,
    hasDub,
    hasSub,
    dubLanguages,
    subLanguages,
    badgeLabel,
    badgeShort,
    tone
  };
}
