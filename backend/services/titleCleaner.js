// backend/services/titleCleaner.js
// Universal English Title Normalizer for Anime & Manga
// Replaces Romaji/Japanese transliterations with official, clean English titles.

const EXACT_TITLE_MAP = {
  // --- Mega Franchises ---
  'kimetsu no yaiba': 'Demon Slayer: Kimetsu no Yaiba',
  'shingeki no kyojin': 'Attack on Titan',
  'sousou no frieren': "Frieren: Beyond Journey's End",
  'ore dake level up na ken': 'Solo Leveling',
  'na honjaman rebeleop': 'Solo Leveling',
  'boku no hero academia': 'My Hero Academia',
  'kusuriya no hitorigoto': 'The Apothecary Diaries',
  'jujutsu kaisen': 'Jujutsu Kaisen',
  're:zero kara hajimeru isekai seikatsu': 'Re:ZERO -Starting Life in Another World-',
  're:zero': 'Re:ZERO -Starting Life in Another World-',
  'mushoku tensei: isekai ittara honki dasu': 'Mushoku Tensei: Jobless Reincarnation',
  'mushoku tensei': 'Mushoku Tensei: Jobless Reincarnation',
  'kono subarashii sekai ni shukufuku wo!': "KonoSuba: God's Blessing on This Wonderful World!",
  'konosuba': "KonoSuba: God's Blessing on This Wonderful World!",
  'tensei shitara slime datta ken': 'That Time I Got Reincarnated as a Slime',
  'tensura': 'That Time I Got Reincarnated as a Slime',
  'kage no jitsuryokusha ni naritakute!': 'The Eminence in Shadow',
  'boku no kokoro no yabai yatsu': 'The Dangers in My Heart',
  'sono bisque doll wa koi wo suru': 'My Dress-Up Darling',
  'dungeon meshi': 'Delicious in Dungeon',
  'kaijuu 8-gou': 'Kaiju No. 8',
  'kaiju no. 8': 'Kaiju No. 8',
  'jigokuraku': "Hell's Paradise",
  'chainsaw man': 'Chainsaw Man',
  'vinland saga': 'Vinland Saga',
  'youkoso jitsuryoku shijou shugi no kyoushitsu e': 'Classroom of the Elite',
  'tate no yuusha no nariagari': 'The Rising of the Shield Hero',
  'seishun buta yarou wa bunny girl senpai no yume wo minai': 'Rascal Does Not Dream of Bunny Girl Senpai',
  'kanojo, okarishimasu': 'Rent-a-Girlround / Rent-a-Girlfriend',
  'kiseijuu: sei no kakuritsu': 'Parasyte -the maxim-',
  'kiseijuu': 'Parasyte',
  'shigatsu wa kimi no uso': 'Your Lie in April',
  'koe no katachi': 'A Silent Voice',
  'kimi no na wa.': 'Your Name.',
  'tenki no ko': 'Weathering with You',
  'suzume no tojimari': 'Suzume',
  'yakusoku no neverland': 'The Promised Neverland',
  'enen no shouboutai': 'Fire Force',
  'hagane no renkinjutsushi': 'Fullmetal Alchemist',
  'hagane no renkinjutsushi: brotherhood': 'Fullmetal Alchemist: Brotherhood',
  'code geass: hangyaku no lelouch': 'Code Geass: Lelouch of the Rebellion',
  'boku dake ga inai machi': 'ERASED',
  'jojo no kimyou na bouken': "JoJo's Bizarre Adventure",
  'dungeon ni deai wo motomeru no wa machigatteiru darou ka': 'Is It Wrong to Try to Pick Up Girls in a Dungeon?',
  'danmachi': 'Is It Wrong to Try to Pick Up Girls in a Dungeon?',
  'ao no exorcist': 'Blue Exorcist',
  'ao no hako': 'Blue Box',
  'kami no tou': 'Tower of God',
  'shiguang dailiren': 'Link Click',
  'tian guan ci fu': "Heaven Official's Blessing",
  'mo dao zu shi': 'Grandmaster of Demonic Cultivation',
  'doupo cangqiong': 'Battle Through the Heavens',
  'wanmei shijie': 'Perfect World',
  'douluo dalu': 'Soul Land',
  'kikansha no mahou wa tokubetsu desu': "A Returner's Magic Should Be Special",
  'tsue to tsurugi no wistoria': 'Wistoria: Wand and Sword',
  'make heroine ga oosugiru!': 'Makeine: Too Many Losing Heroines!',
  'nige jouzu no wakagimi': 'The Elusive Samurai',
  'chi: chikyuu no undou ni tsuite': 'Orb: On the Movements of the Earth',
  'oyasumi punpun': 'Goodnight Punpun',
  'haikyuu!!': 'Haikyu!!',
  'wanpanman': 'One-Punch Man',
  'one punch man': 'One-Punch Man',
  'dr. stone': 'Dr. STONE',
  'spy x family': 'SPY x FAMILY',
  'dandadan': 'DAN DA DAN',
  'sakamoto days': 'SAKAMOTO DAYS',
  'wind breaker': 'WIND BREAKER',
  'shangri-la frontier': 'Shangri-La Frontier',

  // --- Attack on Titan Seasons ---
  'shingeki no kyojin season 2': 'Attack on Titan Season 2',
  'shingeki no kyojin season 3': 'Attack on Titan Season 3',
  'shingeki no kyojin season 3 part 2': 'Attack on Titan Season 3 Part 2',
  'shingeki no kyojin: the final season': 'Attack on Titan: The Final Season',
  'shingeki no kyojin: the final season part 2': 'Attack on Titan: The Final Season Part 2',
  'shingeki no kyojin: the final season - kanketsu-hen': 'Attack on Titan: The Final Season - The Final Chapters',

  // --- Demon Slayer Seasons ---
  'kimetsu no yaiba: yuukaku-hen': 'Demon Slayer: Kimetsu no Yaiba - Entertainment District Arc',
  'kimetsu no yaiba: mugen ressha-hen': 'Demon Slayer: Kimetsu no Yaiba - Mugen Train Arc',
  'kimetsu no yaiba: katanakaji no sato-hen': 'Demon Slayer: Kimetsu no Yaiba - Swordsmith Village Arc',
  'kimetsu no yaiba: hashira geiko-hen': 'Demon Slayer: Kimetsu no Yaiba - Hashira Training Arc',
  'kimetsu no yaiba movie: mugen ressha-hen': 'Demon Slayer: Kimetsu no Yaiba - The Movie: Mugen Train',

  // --- Jujutsu Kaisen Seasons ---
  'jujutsu kaisen 2nd season': 'Jujutsu Kaisen Season 2',
  'jujutsu kaisen: kaigyoku / gyokusetsu': 'Jujutsu Kaisen: Hidden Inventory / Premature Death',
  'jujutsu kaisen: shimetsu kaiyuu': 'Jujutsu Kaisen: Culling Game Arc',

  // --- Re:Zero Seasons ---
  're:zero kara hajimeru isekai seikatsu 2nd season': 'Re:ZERO -Starting Life in Another World- Season 2',
  're:zero kara hajimeru isekai seikatsu 2nd season part 2': 'Re:ZERO -Starting Life in Another World- Season 2 Part 2',
  're:zero kara hajimeru isekai seikatsu 3rd season': 'Re:ZERO -Starting Life in Another World- Season 3',
  're:zero kara hajimeru isekai seikatsu 4th season': 'Re:ZERO -Starting Life in Another World- Season 4',

  // --- Bleach Seasons ---
  'bleach: sennen kessen-hen': 'Bleach: Thousand-Year Blood War',
  'bleach: sennen kessen-hen - ketsubetsu-tan': 'Bleach: Thousand-Year Blood War - The Separation',
  'bleach: sennen kessen-hen - soukoku-tan': 'Bleach: Thousand-Year Blood War - The Conflict',

  // --- My Hero Academia Seasons ---
  'boku no hero academia 2nd season': 'My Hero Academia Season 2',
  'boku no hero academia 3rd season': 'My Hero Academia Season 3',
  'boku no hero academia 4th season': 'My Hero Academia Season 4',
  'boku no hero academia 5th season': 'My Hero Academia Season 5',
  'boku no hero academia 6th season': 'My Hero Academia Season 6',
  'boku no hero academia 7th season': 'My Hero Academia Season 7',
  'boku no hero academia: memories': 'My Hero Academia: Memories',

  // --- Kaguya-sama ---
  'kaguya-sama wa kokurasetai: tensai-tachi no renai zunousen': 'Kaguya-sama: Love is War',
  'kaguya-sama wa kokurasetai? tensai-tachi no renai zunousen': 'Kaguya-sama: Love is War Season 2',
  'kaguya-sama wa kokurasetai: ultra romantic': 'Kaguya-sama: Love is War - Ultra Romantic',
  'kaguya-sama wa kokurasetai: first kiss wa owaranai': 'Kaguya-sama: Love is War - The First Kiss That Never Ends'
};

const PREFIX_RULES = [
  { pattern: /^shingeki no kyojin/i, replacement: 'Attack on Titan' },
  { pattern: /^kimetsu no yaiba/i, replacement: 'Demon Slayer: Kimetsu no Yaiba' },
  { pattern: /^sousou no frieren/i, replacement: "Frieren: Beyond Journey's End" },
  { pattern: /^ore dake level up na ken/i, replacement: 'Solo Leveling' },
  { pattern: /^na honjaman rebeleop/i, replacement: 'Solo Leveling' },
  { pattern: /^boku no hero academia/i, replacement: 'My Hero Academia' },
  { pattern: /^kusuriya no hitorigoto/i, replacement: 'The Apothecary Diaries' },
  { pattern: /^re:zero kara hajimeru isekai seikatsu/i, replacement: 'Re:ZERO -Starting Life in Another World-' },
  { pattern: /^mushoku tensei/i, replacement: 'Mushoku Tensei: Jobless Reincarnation' },
  { pattern: /^kono subarashii sekai ni shukufuku wo!/i, replacement: "KonoSuba: God's Blessing on This Wonderful World!" },
  { pattern: /^tensei shitara slime datta ken/i, replacement: 'That Time I Got Reincarnated as a Slime' },
  { pattern: /^kage no jitsuryokusha ni naritakute!/i, replacement: 'The Eminence in Shadow' },
  { pattern: /^boku no kokoro no yabai yatsu/i, replacement: 'The Dangers in My Heart' },
  { pattern: /^sono bisque doll wa koi wo suru/i, replacement: 'My Dress-Up Darling' },
  { pattern: /^dungeon meshi/i, replacement: 'Delicious in Dungeon' },
  { pattern: /^kaijuu 8-gou/i, replacement: 'Kaiju No. 8' },
  { pattern: /^jigokuraku/i, replacement: "Hell's Paradise" },
  { pattern: /^youkoso jitsuryoku shijou shugi no kyoushitsu e/i, replacement: 'Classroom of the Elite' },
  { pattern: /^tate no yuusha no nariagari/i, replacement: 'The Rising of the Shield Hero' },
  { pattern: /^kanojo, okarishimasu/i, replacement: 'Rent-a-Girlfriend' },
  { pattern: /^enen no shouboutai/i, replacement: 'Fire Force' },
  { pattern: /^ao no exorcist/i, replacement: 'Blue Exorcist' },
  { pattern: /^ao no hako/i, replacement: 'Blue Box' },
  { pattern: /^kami no tou/i, replacement: 'Tower of God' },
  { pattern: /^shiguang dailiren/i, replacement: 'Link Click' },
  { pattern: /^tian guan ci fu/i, replacement: "Heaven Official's Blessing" },
  { pattern: /^mo dao zu shi/i, replacement: 'Grandmaster of Demonic Cultivation' },
  { pattern: /^doupo cangqiong/i, replacement: 'Battle Through the Heavens' },
  { pattern: /^wanmei shijie/i, replacement: 'Perfect World' },
  { pattern: /^douluo dalu/i, replacement: 'Soul Land' },
  { pattern: /^kikansha no mahou wa tokubetsu desu/i, replacement: "A Returner's Magic Should Be Special" },
  { pattern: /^tsue to tsurugi no wistoria/i, replacement: 'Wistoria: Wand and Sword' },
  { pattern: /^make heroine ga oosugiru!/i, replacement: 'Makeine: Too Many Losing Heroines!' },
  { pattern: /^nige jouzu no wakagimi/i, replacement: 'The Elusive Samurai' },
  { pattern: /^chi: chikyuu no undou ni tsuite/i, replacement: 'Orb: On the Movements of the Earth' },
  { pattern: /^dungeon ni deai wo motomeru no wa machigatteiru darou ka/i, replacement: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?' },
  { pattern: /^jojo no kimyou na bouken/i, replacement: "JoJo's Bizarre Adventure" },
  { pattern: /^kiseijuu/i, replacement: 'Parasyte' },
  { pattern: /^shigatsu wa kimi no uso/i, replacement: 'Your Lie in April' },
  { pattern: /^koe no katachi/i, replacement: 'A Silent Voice' },
  { pattern: /^kimi no na wa/i, replacement: 'Your Name.' },
  { pattern: /^tenki no ko/i, replacement: 'Weathering with You' },
  { pattern: /^suzume no tojimari/i, replacement: 'Suzume' },
  { pattern: /^yakusoku no neverland/i, replacement: 'The Promised Neverland' },
  { pattern: /^boku dake ga inai machi/i, replacement: 'ERASED' },
  { pattern: /^hagane no renkinjutsushi/i, replacement: 'Fullmetal Alchemist' },
  { pattern: /^haikyuu!!/i, replacement: 'Haikyu!!' },
  { pattern: /^wanpanman/i, replacement: 'One-Punch Man' }
];

function cleanJapaneseSuffixes(str) {
  if (!str) return '';
  return str
    .replace(/(\d+)(?:st|nd|rd|th)?\s*Season/i, 'Season $1')
    .replace(/2nd Season/gi, 'Season 2')
    .replace(/3rd Season/gi, 'Season 3')
    .replace(/4th Season/gi, 'Season 4')
    .replace(/5th Season/gi, 'Season 5')
    .replace(/6th Season/gi, 'Season 6')
    .replace(/7th Season/gi, 'Season 7')
    .replace(/8th Season/gi, 'Season 8')
    .replace(/Yuukaku-hen/gi, 'Entertainment District Arc')
    .replace(/Mugen Ressha-hen/gi, 'Mugen Train Arc')
    .replace(/Katanakaji no Sato-hen/gi, 'Swordsmith Village Arc')
    .replace(/Hashira Geiko-hen/gi, 'Hashira Training Arc')
    .replace(/Sennen Kessen-hen/gi, 'Thousand-Year Blood War')
    .replace(/Kanketsu-hen/gi, 'The Final Chapters')
    .replace(/Reze-hen/gi, 'Reze Arc')
    .replace(/Ni no Shou/gi, 'Season 2')
    .replace(/San no Shou/gi, 'Season 3')
    .trim();
}

function toEnglishTitle(raw, fallback = 'Anime') {
  if (!raw) return fallback;

  let titleStr = '';
  if (typeof raw === 'string') {
    titleStr = raw.trim();
  } else if (typeof raw === 'object') {
    titleStr = (raw.english || raw.title_english || raw.romaji || raw.title_japanese || raw.native || '').trim();
  }

  if (!titleStr) return fallback;

  const lower = titleStr.toLowerCase().trim();

  if (EXACT_TITLE_MAP[lower]) {
    return EXACT_TITLE_MAP[lower];
  }

  for (const rule of PREFIX_RULES) {
    if (rule.pattern.test(titleStr)) {
      const rest = titleStr.replace(rule.pattern, '').trim();
      if (!rest) {
        return rule.replacement;
      }
      let cleanRest = cleanJapaneseSuffixes(rest.replace(/^[:\-\s]+/, ''));
      if (!cleanRest) return rule.replacement;

      if (rule.replacement.toLowerCase().includes(cleanRest.toLowerCase())) {
        return rule.replacement;
      }

      // Strip repeated franchise subtitle if already present at start of cleanRest
      const parts = rule.replacement.split(':').map(p => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (part.length > 3 && cleanRest.toLowerCase().startsWith(part.toLowerCase())) {
          cleanRest = cleanRest.slice(part.length).replace(/^[:\-\s]+/, '').trim();
        }
      }

      if (!cleanRest) return rule.replacement;

      if (/^(Season|\d+|Part|Movie|The Movie|Episode)/i.test(cleanRest)) {
        return `${rule.replacement} ${cleanRest}`;
      }
      return `${rule.replacement}: ${cleanRest}`;
    }
  }

  const cleaned = cleanJapaneseSuffixes(titleStr);
  return cleaned || titleStr || fallback;
}

function normalizeTitleObject(rawTitle) {
  if (typeof rawTitle === 'string') {
    const clean = toEnglishTitle(rawTitle);
    return { english: clean, romaji: clean, native: '' };
  }
  const primaryEn = rawTitle?.english || rawTitle?.title_english;
  const primaryRo = rawTitle?.romaji || rawTitle?.title_japanese || rawTitle?.native;
  
  const cleanEn = toEnglishTitle(primaryEn || primaryRo);
  const cleanRo = primaryRo ? toEnglishTitle(primaryRo) : cleanEn;

  return {
    english: cleanEn,
    romaji: cleanRo,
    native: rawTitle?.native || ''
  };
}

module.exports = {
  toEnglishTitle,
  normalizeTitleObject
};
