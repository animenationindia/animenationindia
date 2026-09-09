const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { getAnimeDetails } = require('../services/malService');
const { toEnglishTitle } = require('../services/titleCleaner');

const curatedAnimeSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  idMal: { type: Number },
  title: {
    english: String,
    romaji: String,
    native: String
  },
  coverImage: {
    extraLarge: String,
    large: String,
    medium: String,
    color: String
  },
  bannerImage: String,
  description: String,
  episodes: Number,
  format: String,
  status: String,
  averageScore: Number,
  genres: [String],
  seasonYear: Number,
  season: String,
  studio: String,
  section: { type: String, required: true, index: true },
  sectionName: String,
  order: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});
curatedAnimeSchema.index({ section: 1, order: 1 });
curatedAnimeSchema.index({ section: 1, id: 1 }, { unique: true });

const CuratedAnime = mongoose.models.CuratedAnime || mongoose.model('CuratedAnime', curatedAnimeSchema);

const TARGET_ANIME = [
  { order: 1, anilistId: 154587, malId: 52299, name: 'Solo Leveling' },
  { order: 2, anilistId: 5114, malId: 5114, name: 'Fullmetal Alchemist: Brotherhood' },
  { order: 3, anilistId: 16498, malId: 16498, name: 'Attack on Titan' },
  { order: 4, anilistId: 1535, malId: 1535, name: 'Death Note' },
  { order: 5, anilistId: 108465, malId: 38000, name: 'Demon Slayer: Kimetsu no Yaiba' },
  { order: 6, anilistId: 113415, malId: 40748, name: 'Jujutsu Kaisen' },
  { order: 7, anilistId: 11061, malId: 11061, name: 'Hunter x Hunter (2011)' },
  { order: 8, anilistId: 21087, malId: 30276, name: 'One Punch Man' },
  { order: 9, anilistId: 9253, malId: 9253, name: 'Steins;Gate' },
  { order: 10, anilistId: 21519, malId: 32182, name: 'Mob Psycho 100' },
  { order: 11, anilistId: 199, malId: 199, name: 'Spirited Away' },
  { order: 12, anilistId: 127230, malId: 44511, name: 'Chainsaw Man' },
  { order: 13, anilistId: 101348, malId: 37521, name: 'Vinland Saga' },
  { order: 14, anilistId: 21459, malId: 31964, name: 'My Hero Academia' },
  { order: 15, anilistId: 20464, malId: 20583, name: 'Haikyuu!!' },
  { order: 16, anilistId: 20605, malId: 22319, name: 'Tokyo Ghoul' },
  { order: 17, anilistId: 1575, malId: 1575, name: 'Code Geass: Lelouch of the Rebellion' },
  { order: 18, anilistId: 19, malId: 19, name: 'Monster' },
  { order: 19, anilistId: 1, malId: 1, name: 'Cowboy Bebop' },
  { order: 20, anilistId: 21234, malId: 31043, name: 'Erased' },
  { order: 21, anilistId: 6682, malId: 32281, name: 'Your Name.' },
  { order: 22, anilistId: 20954, malId: 28851, name: 'A Silent Voice' },
  { order: 23, anilistId: 131573, malId: 48561, name: 'Jujutsu Kaisen 0' },
  { order: 24, anilistId: 140960, malId: 50265, name: 'Spy x Family' },
  { order: 25, anilistId: 120377, malId: 42310, name: 'Cyberpunk: Edgerunners' }
];

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas.');

  const results = [];

  for (const item of TARGET_ANIME) {
    console.log(`Fetching [${item.order}/25]: ${item.name} (MAL ID: ${item.malId})...`);
    let data = await getAnimeDetails(item.malId);
    
    if (!data) {
      console.warn(`⚠️ Could not fetch data for ${item.name} (MAL ID ${item.malId})`);
      continue;
    }

    const cleanTitle = toEnglishTitle(data.title_english || data.title || item.name);
    const coverUrl = data.images?.jpg?.large_image_url || data.images?.webp?.large_image_url || data.images?.jpg?.image_url;

    const doc = {
      id: item.anilistId || item.malId,
      idMal: item.malId,
      title: {
        english: cleanTitle,
        romaji: cleanTitle,
        native: data.title_japanese || ''
      },
      coverImage: {
        extraLarge: coverUrl,
        large: coverUrl,
        medium: data.images?.jpg?.small_image_url || coverUrl,
        color: '#e50914'
      },
      bannerImage: coverUrl,
      description: data.synopsis || '',
      episodes: data.episodes || 0,
      format: data.type || 'TV',
      status: data.status || 'Finished Airing',
      averageScore: data.score ? Math.round(data.score * 10) : 80,
      genres: (data.genres || []).map(g => g.name || g),
      seasonYear: data.year || 2020,
      section: 'kickstart',
      sectionName: 'Kickstart Your Anime Journey',
      order: item.order,
      updatedAt: new Date()
    };

    results.push(doc);
    console.log(`  -> ✅ [${doc.order}] ID ${doc.id} | "${doc.title.english}" | Cover: ${doc.coverImage.large}`);
  }

  console.log(`\nDeleting existing 'kickstart' records in MongoDB Atlas...`);
  await CuratedAnime.deleteMany({ section: 'kickstart' });

  console.log(`Inserting ${results.length} verified records into MongoDB Atlas...`);
  await CuratedAnime.insertMany(results);

  const count = await CuratedAnime.countDocuments({ section: 'kickstart' });
  console.log(`\n🎉 SUCCESS! Seeded ${count} anime for 'kickstart' section into MongoDB Atlas!`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
