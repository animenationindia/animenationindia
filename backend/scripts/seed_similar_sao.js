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
  { order: 1, anilistId: 17265, malId: 17265, name: 'Log Horizon' },
  { order: 2, anilistId: 20832, malId: 29803, name: 'Overlord' },
  { order: 3, anilistId: 19815, malId: 19815, name: 'No Game No Life' },
  { order: 4, anilistId: 99263, malId: 35790, name: 'The Rising of the Shield Hero' },
  { order: 5, anilistId: 101280, malId: 37430, name: 'That Time I Got Reincarnated as a Slime' },
  { order: 6, anilistId: 11759, malId: 11759, name: 'Accel World' },
  { order: 7, anilistId: 151970, malId: 52347, name: 'Shangri-La Frontier' },
  { order: 8, anilistId: 154587, malId: 52299, name: 'Solo Leveling' },
  { order: 9, anilistId: 100183, malId: 36475, name: 'Sword Art Online Alternative: Gun Gale Online' },
  { order: 10, anilistId: 20920, malId: 28121, name: 'Is It Wrong to Try to Pick Up Girls in a Dungeon?' },
  { order: 11, anilistId: 14345, malId: 14345, name: 'Btooom!' },
  { order: 12, anilistId: 21355, malId: 31240, name: 'Re:ZERO -Starting Life in Another World-' },
  { order: 13, anilistId: 108465, malId: 39535, name: 'Mushoku Tensei: Jobless Reincarnation' },
  { order: 14, anilistId: 21202, malId: 30831, name: "KonoSuba: God's Blessing on this Wonderful World!" },
  { order: 15, anilistId: 130298, malId: 48316, name: 'The Eminence in Shadow' },
  { order: 16, anilistId: 21428, malId: 31859, name: 'Grimgar, Ashes and Illusions' },
  { order: 17, anilistId: 106479, malId: 38790, name: "BOFURI: I Don't Want to Get Hurt, so I'll Max Out My Defense" },
  { order: 18, anilistId: 100668, malId: 36882, name: 'Arifureta: From Commonplace to World\'s Strongest' },
  { order: 19, anilistId: 105164, malId: 38659, name: 'Cautious Hero: The Hero Is Overpowered but Overly Cautious' },
  { order: 20, anilistId: 20594, malId: 21881, name: 'Sword Art Online II' },
  { order: 21, anilistId: 100182, malId: 36474, name: 'Sword Art Online: Alicization' },
  { order: 22, anilistId: 98861, malId: 33926, name: "The King's Avatar" },
  { order: 23, anilistId: 105190, malId: 38656, name: "Darwin's Game" },
  { order: 24, anilistId: 130166, malId: 48239, name: 'In the Land of Leadale' },
  { order: 25, anilistId: 141014, malId: 50461, name: 'Trapped in a Dating Sim: The World of Otome Games is Tough for Mobs' }
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
      section: 'similar_sao',
      sectionName: 'If You Liked Sword Art Online',
      order: item.order,
      updatedAt: new Date()
    };

    results.push(doc);
    console.log(`  -> ✅ [${doc.order}] ID ${doc.id} | "${doc.title.english}" | Cover: ${doc.coverImage.large}`);
  }

  console.log(`\nDeleting existing 'similar_sao' records in MongoDB Atlas...`);
  await CuratedAnime.deleteMany({ section: 'similar_sao' });

  console.log(`Inserting ${results.length} verified records into MongoDB Atlas...`);
  await CuratedAnime.insertMany(results);

  const count = await CuratedAnime.countDocuments({ section: 'similar_sao' });
  console.log(`\n🎉 SUCCESS! Seeded ${count} anime for 'similar_sao' section into MongoDB Atlas!`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
