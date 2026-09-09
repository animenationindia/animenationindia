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
  { order: 1, anilistId: 33, malId: 33, name: 'Berserk' },
  { order: 2, anilistId: 19, malId: 19, name: 'Monster' },
  { order: 3, anilistId: 101348, malId: 37521, name: 'Vinland Saga' },
  { order: 4, anilistId: 777, malId: 777, name: 'Hellsing Ultimate' },
  { order: 5, anilistId: 120377, malId: 42310, name: 'Cyberpunk: Edgerunners' },
  { order: 6, anilistId: 127230, malId: 44511, name: 'Chainsaw Man' },
  { order: 7, anilistId: 20605, malId: 22319, name: 'Tokyo Ghoul' },
  { order: 8, anilistId: 98460, malId: 35120, name: 'Devilman Crybaby' },
  { order: 9, anilistId: 226, malId: 226, name: 'Elfen Lied' },
  { order: 10, anilistId: 20632, malId: 22535, name: 'Parasyte -the maxim-' },
  { order: 11, anilistId: 16498, malId: 16498, name: 'Attack on Titan' },
  { order: 12, anilistId: 1818, malId: 1818, name: 'Claymore' },
  { order: 13, anilistId: 6880, malId: 6880, name: 'Deadman Wonderland' },
  { order: 14, anilistId: 889, malId: 889, name: 'Black Lagoon' },
  { order: 15, anilistId: 101347, malId: 37520, name: 'Dororo' },
  { order: 16, anilistId: 105228, malId: 38668, name: 'Dorohedoro' },
  { order: 17, anilistId: 384, malId: 384, name: 'Gantz' },
  { order: 18, anilistId: 11111, malId: 11111, name: 'Another' },
  { order: 19, anilistId: 7724, malId: 7724, name: 'Shiki' },
  { order: 20, anilistId: 1292, malId: 1292, name: 'Afro Samurai' },
  { order: 21, anilistId: 10087, malId: 10087, name: 'Fate/Zero' },
  { order: 22, anilistId: 97986, malId: 34599, name: 'Made in Abyss' },
  { order: 23, anilistId: 13601, malId: 13601, name: 'Psycho-Pass' },
  { order: 24, anilistId: 20613, malId: 22199, name: 'Akame ga Kill!' },
  { order: 25, anilistId: 113415, malId: 40748, name: 'Jujutsu Kaisen' }
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
      section: 'not_for_kids',
      sectionName: 'Anime Not For Kids',
      order: item.order,
      updatedAt: new Date()
    };

    results.push(doc);
    console.log(`  -> ✅ [${doc.order}] ID ${doc.id} | "${doc.title.english}" | Cover: ${doc.coverImage.large}`);
  }

  console.log(`\nDeleting existing 'not_for_kids' records in MongoDB Atlas...`);
  await CuratedAnime.deleteMany({ section: 'not_for_kids' });

  console.log(`Inserting ${results.length} verified records into MongoDB Atlas...`);
  await CuratedAnime.insertMany(results);

  const count = await CuratedAnime.countDocuments({ section: 'not_for_kids' });
  console.log(`\n🎉 SUCCESS! Seeded ${count} anime for 'not_for_kids' section into MongoDB Atlas!`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
