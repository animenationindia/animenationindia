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
  { order: 1, anilistId: 21, malId: 21, name: 'One Piece' },
  { order: 2, anilistId: 1735, malId: 1735, name: 'Naruto: Shippuden' },
  { order: 3, anilistId: 269, malId: 269, name: 'Bleach' },
  { order: 4, anilistId: 113415, malId: 40748, name: 'Jujutsu Kaisen' },
  { order: 5, anilistId: 108465, malId: 38000, name: 'Demon Slayer: Kimetsu no Yaiba' },
  { order: 6, anilistId: 11061, malId: 11061, name: 'Hunter x Hunter (2011)' },
  { order: 7, anilistId: 21459, malId: 31964, name: 'My Hero Academia' },
  { order: 8, anilistId: 97940, malId: 34572, name: 'Black Clover' },
  { order: 9, anilistId: 21175, malId: 30694, name: 'Dragon Ball Super' },
  { order: 10, anilistId: 105333, malId: 38691, name: 'Dr. Stone' },
  { order: 11, anilistId: 20464, malId: 20583, name: 'Haikyuu!!' },
  { order: 12, anilistId: 6702, malId: 6702, name: 'Fairy Tail' },
  { order: 13, anilistId: 105310, malId: 38671, name: 'Fire Force' },
  { order: 14, anilistId: 3588, malId: 3588, name: 'Soul Eater' },
  { order: 15, anilistId: 9919, malId: 9919, name: 'Blue Exorcist' },
  { order: 16, anilistId: 20789, malId: 23755, name: 'The Seven Deadly Sins' },
  { order: 17, anilistId: 127230, malId: 44511, name: 'Chainsaw Man' },
  { order: 18, anilistId: 5114, malId: 5114, name: 'Fullmetal Alchemist: Brotherhood' },
  { order: 19, anilistId: 14719, malId: 14719, name: "JoJo's Bizarre Adventure" },
  { order: 20, anilistId: 21519, malId: 32182, name: 'Mob Psycho 100' },
  { order: 21, anilistId: 16498, malId: 16498, name: 'Attack on Titan' },
  { order: 22, anilistId: 918, malId: 918, name: 'Gintama' },
  { order: 23, anilistId: 392, malId: 392, name: 'Yu Yu Hakusho' },
  { order: 24, anilistId: 142877, malId: 50613, name: 'Rurouni Kenshin' },
  { order: 25, anilistId: 154587, malId: 52299, name: 'Solo Leveling' }
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
      section: 'shounen',
      sectionName: 'The Shounen Zone',
      order: item.order,
      updatedAt: new Date()
    };

    results.push(doc);
    console.log(`  -> ✅ [${doc.order}] ID ${doc.id} | "${doc.title.english}" | Cover: ${doc.coverImage.large}`);
  }

  console.log(`\nDeleting existing 'shounen' records in MongoDB Atlas...`);
  await CuratedAnime.deleteMany({ section: 'shounen' });

  console.log(`Inserting ${results.length} verified records into MongoDB Atlas...`);
  await CuratedAnime.insertMany(results);

  const count = await CuratedAnime.countDocuments({ section: 'shounen' });
  console.log(`\n🎉 SUCCESS! Seeded ${count} anime for 'shounen' section into MongoDB Atlas!`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
