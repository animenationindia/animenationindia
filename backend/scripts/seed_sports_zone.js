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
  { order: 1, anilistId: 20464, malId: 20583, name: 'Haikyuu!!' },
  { order: 2, anilistId: 137822, malId: 49596, name: 'Blue Lock' },
  { order: 3, anilistId: 11771, malId: 11771, name: "Kuroko's Basketball" },
  { order: 4, anilistId: 263, malId: 263, name: 'Hajime no Ippo' },
  { order: 5, anilistId: 170, malId: 170, name: 'Slam Dunk' },
  { order: 6, anilistId: 134732, malId: 49052, name: 'Aoashi' },
  { order: 7, anilistId: 100298, malId: 36563, name: 'Megalo Box' },
  { order: 8, anilistId: 18689, malId: 18689, name: 'Ace of Diamond' },
  { order: 9, anilistId: 101903, malId: 37965, name: 'Run with the Wind' },
  { order: 10, anilistId: 185, malId: 185, name: 'Initial D First Stage' },
  { order: 11, anilistId: 20607, malId: 22135, name: 'Ping Pong the Animation' },
  { order: 12, anilistId: 18507, malId: 18507, name: 'Free!' },
  { order: 13, anilistId: 21709, malId: 32995, name: 'Yuri!!! on Ice' },
  { order: 14, anilistId: 100402, malId: 36653, name: 'Tsurune' },
  { order: 15, anilistId: 124153, malId: 42923, name: 'SK8 the Infinity' },
  { order: 16, anilistId: 100745, malId: 36934, name: 'Captain Tsubasa (2018)' },
  { order: 17, anilistId: 97888, malId: 34443, name: 'Baki' },
  { order: 18, anilistId: 627, malId: 627, name: 'Major' },
  { order: 19, anilistId: 10800, malId: 10800, name: 'Chihayafuru' },
  { order: 20, anilistId: 5231, malId: 5231, name: 'Inazuma Eleven' },
  { order: 21, anilistId: 22, malId: 22, name: 'Prince of Tennis' },
  { order: 22, anilistId: 101239, malId: 37403, name: 'Ahiru no Sora' },
  { order: 23, anilistId: 21578, malId: 32494, name: 'Days' },
  { order: 24, anilistId: 18179, malId: 18179, name: 'Yowamushi Pedal' },
  { order: 25, anilistId: 388, malId: 388, name: 'Capeta' }
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
      section: 'sports',
      sectionName: 'Sports & Competition',
      order: item.order,
      updatedAt: new Date()
    };

    results.push(doc);
    console.log(`  -> ✅ [${doc.order}] ID ${doc.id} | "${doc.title.english}" | Cover: ${doc.coverImage.large}`);
  }

  console.log(`\nDeleting existing 'sports' records in MongoDB Atlas...`);
  await CuratedAnime.deleteMany({ section: 'sports' });

  console.log(`Inserting ${results.length} verified records into MongoDB Atlas...`);
  await CuratedAnime.insertMany(results);

  const count = await CuratedAnime.countDocuments({ section: 'sports' });
  console.log(`\n🎉 SUCCESS! Seeded ${count} anime for 'sports' section into MongoDB Atlas!`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
