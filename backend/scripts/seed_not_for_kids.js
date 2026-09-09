const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

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

const NOT_FOR_KIDS_DATA = [
  {
    id: 33,
    idMal: 33,
    title: { english: 'Berserk', romaji: 'Kenpuu Denki Berserk', native: '剣風伝奇ベルセルク' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1544/121856.jpg', large: 'https://cdn.myanimelist.net/images/anime/1544/121856.jpg' },
    format: 'TV',
    seasonYear: 1997,
    averageScore: 87,
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy', 'Horror', 'Supernatural'],
    order: 1
  },
  {
    id: 19,
    idMal: 19,
    title: { english: 'Monster', romaji: 'Monster', native: 'MONSTER' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/10/67333.jpg', large: 'https://cdn.myanimelist.net/images/anime/10/67333.jpg' },
    format: 'TV',
    seasonYear: 2004,
    averageScore: 91,
    genres: ['Drama', 'Mystery', 'Psychological', 'Suspense'],
    order: 2
  },
  {
    id: 37521,
    idMal: 37521,
    title: { english: 'Vinland Saga', romaji: 'Vinland Saga', native: 'ヴィンランド・サガ' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1500/103006.jpg', large: 'https://cdn.myanimelist.net/images/anime/1500/103006.jpg' },
    format: 'TV',
    seasonYear: 2019,
    averageScore: 87,
    genres: ['Action', 'Adventure', 'Drama', 'Historical'],
    order: 3
  },
  {
    id: 777,
    idMal: 777,
    title: { english: 'Hellsing Ultimate', romaji: 'Hellsing Ultimate', native: 'HELLSING OVA' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg', large: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' },
    format: 'OVA',
    seasonYear: 2006,
    averageScore: 84,
    genres: ['Action', 'Horror', 'Supernatural', 'Vampire'],
    order: 4
  },
  {
    id: 42310,
    idMal: 42310,
    title: { english: 'Cyberpunk: Edgerunners', romaji: 'Cyberpunk: Edgerunners', native: 'サイバーパンク エッジランナーズ' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1817/127464.jpg', large: 'https://cdn.myanimelist.net/images/anime/1817/127464.jpg' },
    format: 'ONA',
    seasonYear: 2022,
    averageScore: 86,
    genres: ['Action', 'Sci-Fi', 'Psychological'],
    order: 5
  },
  {
    id: 44511,
    idMal: 44511,
    title: { english: 'Chainsaw Man', romaji: 'Chainsaw Man', native: 'チェンソーマン' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', large: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg' },
    format: 'TV',
    seasonYear: 2022,
    averageScore: 85,
    genres: ['Action', 'Horror', 'Supernatural'],
    order: 6
  },
  {
    id: 22319,
    idMal: 22319,
    title: { english: 'Tokyo Ghoul', romaji: 'Tokyo Ghoul', native: '東京喰種トーキョーグール' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1498/134443.jpg', large: 'https://cdn.myanimelist.net/images/anime/1498/134443.jpg' },
    format: 'TV',
    seasonYear: 2014,
    averageScore: 78,
    genres: ['Action', 'Drama', 'Horror', 'Mystery', 'Supernatural'],
    order: 7
  },
  {
    id: 35120,
    idMal: 35120,
    title: { english: 'Devilman Crybaby', romaji: 'DEVILMAN crybaby', native: 'DEVILMAN crybaby' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1574/91444.jpg', large: 'https://cdn.myanimelist.net/images/anime/1574/91444.jpg' },
    format: 'ONA',
    seasonYear: 2018,
    averageScore: 78,
    genres: ['Action', 'Horror', 'Supernatural', 'Avant Garde'],
    order: 8
  },
  {
    id: 226,
    idMal: 226,
    title: { english: 'Elfen Lied', romaji: 'Elfen Lied', native: 'エルフェンリート' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/10/73601.jpg', large: 'https://cdn.myanimelist.net/images/anime/10/73601.jpg' },
    format: 'TV',
    seasonYear: 2004,
    averageScore: 75,
    genres: ['Action', 'Drama', 'Horror', 'Psychological', 'Sci-Fi'],
    order: 9
  },
  {
    id: 22535,
    idMal: 22535,
    title: { english: 'Parasyte -the maxim-', romaji: 'Kiseijuu: Sei no Kakuritsu', native: '寄生獣 セイの格率' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/4/67115.jpg', large: 'https://cdn.myanimelist.net/images/anime/4/67115.jpg' },
    format: 'TV',
    seasonYear: 2014,
    averageScore: 83,
    genres: ['Action', 'Horror', 'Sci-Fi', 'Suspense'],
    order: 10
  },
  {
    id: 16498,
    idMal: 16498,
    title: { english: 'Attack on Titan', romaji: 'Shingeki no Kyojin', native: '進撃の巨人' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', large: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg' },
    format: 'TV',
    seasonYear: 2013,
    averageScore: 85,
    genres: ['Action', 'Drama', 'Suspense'],
    order: 11
  },
  {
    id: 1818,
    idMal: 1818,
    title: { english: 'Claymore', romaji: 'Claymore', native: 'CLAYMORE' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/3/21834.jpg', large: 'https://cdn.myanimelist.net/images/anime/3/21834.jpg' },
    format: 'TV',
    seasonYear: 2007,
    averageScore: 78,
    genres: ['Action', 'Adventure', 'Fantasy', 'Supernatural'],
    order: 12
  },
  {
    id: 6880,
    idMal: 6880,
    title: { english: 'Deadman Wonderland', romaji: 'Deadman Wonderland', native: 'デッドマン・ワンダーランド' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1567/115167.jpg', large: 'https://cdn.myanimelist.net/images/anime/1567/115167.jpg' },
    format: 'TV',
    seasonYear: 2011,
    averageScore: 72,
    genres: ['Action', 'Horror', 'Sci-Fi', 'Suspense'],
    order: 13
  },
  {
    id: 889,
    idMal: 889,
    title: { english: 'Black Lagoon', romaji: 'Black Lagoon', native: 'BLACK LAGOON' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1912/93788.jpg', large: 'https://cdn.myanimelist.net/images/anime/1912/93788.jpg' },
    format: 'TV',
    seasonYear: 2006,
    averageScore: 80,
    genres: ['Action', 'Drama'],
    order: 14
  },
  {
    id: 37520,
    idMal: 37520,
    title: { english: 'Dororo', romaji: 'Dororo', native: 'どろろ' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1879/100467.jpg', large: 'https://cdn.myanimelist.net/images/anime/1879/100467.jpg' },
    format: 'TV',
    seasonYear: 2019,
    averageScore: 82,
    genres: ['Action', 'Adventure', 'Supernatural'],
    order: 15
  },
  {
    id: 38668,
    idMal: 38668,
    title: { english: 'Dorohedoro', romaji: 'Dorohedoro', native: 'ドロヘドロ' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1500/103986.jpg', large: 'https://cdn.myanimelist.net/images/anime/1500/103986.jpg' },
    format: 'TV',
    seasonYear: 2020,
    averageScore: 81,
    genres: ['Action', 'Comedy', 'Fantasy', 'Horror'],
    order: 16
  },
  {
    id: 384,
    idMal: 384,
    title: { english: 'Gantz', romaji: 'Gantz', native: 'GANTZ' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/4/22295.jpg', large: 'https://cdn.myanimelist.net/images/anime/4/22295.jpg' },
    format: 'TV',
    seasonYear: 2004,
    averageScore: 70,
    genres: ['Action', 'Drama', 'Horror', 'Sci-Fi', 'Supernatural'],
    order: 17
  },
  {
    id: 11111,
    idMal: 11111,
    title: { english: 'Another', romaji: 'Another', native: 'Another' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/4/75509.jpg', large: 'https://cdn.myanimelist.net/images/anime/4/75509.jpg' },
    format: 'TV',
    seasonYear: 2012,
    averageScore: 75,
    genres: ['Horror', 'Mystery', 'Supernatural', 'Suspense'],
    order: 18
  },
  {
    id: 7724,
    idMal: 7724,
    title: { english: 'Shiki', romaji: 'Shiki', native: '屍鬼' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1100/117978.jpg', large: 'https://cdn.myanimelist.net/images/anime/1100/117978.jpg' },
    format: 'TV',
    seasonYear: 2010,
    averageScore: 78,
    genres: ['Horror', 'Mystery', 'Supernatural', 'Suspense'],
    order: 19
  },
  {
    id: 1292,
    idMal: 1292,
    title: { english: 'Afro Samurai', romaji: 'Afro Samurai', native: 'アフロサムライ' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/5/11995.jpg', large: 'https://cdn.myanimelist.net/images/anime/5/11995.jpg' },
    format: 'TV',
    seasonYear: 2007,
    averageScore: 74,
    genres: ['Action', 'Adventure'],
    order: 20
  },
  {
    id: 10087,
    idMal: 10087,
    title: { english: 'Fate/Zero', romaji: 'Fate/Zero', native: 'Fate/Zero' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/2/73249.jpg', large: 'https://cdn.myanimelist.net/images/anime/2/73249.jpg' },
    format: 'TV',
    seasonYear: 2011,
    averageScore: 83,
    genres: ['Action', 'Fantasy', 'Supernatural'],
    order: 21
  },
  {
    id: 34599,
    idMal: 34599,
    title: { english: 'Made in Abyss', romaji: 'Made in Abyss', native: 'メイドインアビス' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/6/86733.jpg', large: 'https://cdn.myanimelist.net/images/anime/6/86733.jpg' },
    format: 'TV',
    seasonYear: 2017,
    averageScore: 87,
    genres: ['Adventure', 'Drama', 'Fantasy', 'Mystery', 'Sci-Fi'],
    order: 22
  },
  {
    id: 13601,
    idMal: 13601,
    title: { english: 'Psycho-Pass', romaji: 'Psycho-Pass', native: 'PSYCHO-PASS サイコパス' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/5/43399.jpg', large: 'https://cdn.myanimelist.net/images/anime/5/43399.jpg' },
    format: 'TV',
    seasonYear: 2012,
    averageScore: 83,
    genres: ['Action', 'Sci-Fi', 'Suspense'],
    order: 23
  },
  {
    id: 22199,
    idMal: 22199,
    title: { english: 'Akame ga Kill!', romaji: 'Akame ga Kill!', native: 'アカメが斬る！' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1429/95946.jpg', large: 'https://cdn.myanimelist.net/images/anime/1429/95946.jpg' },
    format: 'TV',
    seasonYear: 2014,
    averageScore: 75,
    genres: ['Action', 'Fantasy'],
    order: 24
  },
  {
    id: 40748,
    idMal: 40748,
    title: { english: 'Jujutsu Kaisen', romaji: 'Jujutsu Kaisen', native: '呪術廻戦' },
    coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', large: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg' },
    format: 'TV',
    seasonYear: 2020,
    averageScore: 86,
    genres: ['Action', 'Fantasy', 'Supernatural'],
    order: 25
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected.');

  console.log('Deleting existing not_for_kids records...');
  await CuratedAnime.deleteMany({ section: 'not_for_kids' });

  const docs = NOT_FOR_KIDS_DATA.map(item => ({
    ...item,
    section: 'not_for_kids',
    sectionName: 'Anime Not For Kids',
    updatedAt: new Date()
  }));

  console.log(`Inserting ${docs.length} anime into CuratedAnime collection...`);
  await CuratedAnime.insertMany(docs);

  const count = await CuratedAnime.countDocuments({ section: 'not_for_kids' });
  console.log(`✅ Successfully seeded ${count} anime for 'not_for_kids' section into MongoDB Atlas!`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
