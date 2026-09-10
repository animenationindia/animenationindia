require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const compression = require('compression');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// 🔥 Unified BFF Services 🔥
const malService = require('./services/malService');
const anilistService = require('./services/anilistService');
const tmdbService = require('./services/tmdbService');
const newsService = require('./services/newsService');
const { toEnglishTitle, normalizeTitleObject } = require('./services/titleCleaner');

// 🔥 Email Pathanor Setup (Nodemailer) 🔥
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🔥 Strict Security Checks for Environment Variables 🔥
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  console.error(
    "CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing or too short (minimum 32 characters required).\n" +
    "Server will not start for security reasons."
  );
  process.exit(1);
}

// 🔥 Modules import kora holo
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// 🔥 RSS Parser for Custom News API 🔥
// ==========================================
const Parser = require('rss-parser');
const parser = new Parser();

// Global variables for News Cache (In-Memory)
let cachedNews = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Delay helper for rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
app.use(compression());
app.set('trust proxy', 1);
app.disable('x-powered-by');

// 🔒 Security Middleware: Helmet HTTP Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// Key generator helper for rate limiting (normalizes IPv4-mapped IPv6)
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded ? (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0]) : (req.ip || req.socket?.remoteAddress || '127.0.0.1');
  return String(rawIp).replace(/^::ffff:/, '');
};

// 🔒 Security Middleware: Rate Limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: false,
  message: { message: "Too many login attempts. Please try again after 15 minutes." }
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 registration attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: false,
  message: { message: "Too many account registration attempts. Please try again after 15 minutes." }
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 contact form submissions per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: false,
  message: { success: false, message: "Too many contact form submissions. Please try again after 15 minutes." }
});

// Validation Runner Middleware
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  };
};

// 🔥 Strict CORS Configuration 🔥
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://animenationindia.online',
  'https://www.animenationindia.online',
  'https://animenationindia.animenationindia-global.workers.dev',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (typeof origin === 'string' && (origin.endsWith('.animenationindia.online') || origin.endsWith('.workers.dev')))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Access from origin ${origin} blocked by security policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// 🚀 Health Check & Uptime Monitoring Endpoints (Zero-Load Keep-Alive for UptimeRobot)
app.get('/', (req, res) => res.json({ status: 'ok', service: 'AnimeNation India Backend', timestamp: new Date().toISOString() }));
app.get('/api/ping', (req, res) => res.json({ status: 'pong', uptime: Math.floor(process.uptime()), timestamp: Date.now() }));
app.get('/api/health', (req, res) => res.json({
  status: 'healthy',
  uptime: Math.floor(process.uptime()),
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  timestamp: new Date().toISOString()
}));

// ============================================================================
// 🔥 High-Speed GraphQL Proxy for AniList (10-Min In-Memory Cache) 🔥
// ============================================================================
const anilistProxyCache = new Map();
const ANILIST_PROXY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

app.post('/api/anilist/proxy', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { query, variables } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'GraphQL query is required' });
    }

    const cacheKey = JSON.stringify({ query, variables });
    const cached = anilistProxyCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < ANILIST_PROXY_CACHE_TTL)) {
      return res.json(cached.data);
    }

    const aniRes = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AnimeNationIndia/1.0 (https://www.animenationindia.online)'
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(8000)
    });

    const data = await aniRes.json();
    if (aniRes.ok && data?.data) {
      anilistProxyCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return res.status(aniRes.status).json(data);
  } catch (err) {
    console.error('AniList Proxy Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 🔥 Legacy Jikan Proxy Alias (Gracefully Handled / Empty Safe Fallback) 🔥
// ============================================================================
app.get('/api/jikan/proxy', (req, res) => {
  return res.json({ data: [], pagination: { has_next_page: false } });
});

// ============================================================================
// 🔥 High-Speed Official MyAnimeList (MAL) API Proxy (10-Min In-Memory Cache) 🔥
// ============================================================================
const malProxyCache = new Map();
const MAL_PROXY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID || 'f6cd787eb297c144b5cebd2ef50026c3';

app.get('/api/mal/proxy', async (req, res) => {
  try {
    let endpoint = req.query.endpoint || req.query.path;
    if (!endpoint) {
      const match = req.originalUrl.match(/\/api\/mal\/proxy\?(?:endpoint|path)=(.+)/);
      if (match && match[1]) {
        endpoint = decodeURIComponent(match[1]);
      }
    }

    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: 'Endpoint query parameter is required (e.g. /anime/5114?fields=...)' });
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cached = malProxyCache.get(cleanEndpoint);
    if (cached && (Date.now() - cached.timestamp < MAL_PROXY_CACHE_TTL)) {
      return res.json(cached.data);
    }

    const targetUrl = `https://api.myanimelist.net/v2${cleanEndpoint}`;
    const malRes = await fetch(targetUrl, {
      headers: {
        'X-MAL-CLIENT-ID': MAL_CLIENT_ID,
        'User-Agent': 'AnimeNationIndia/1.0 (https://www.animenationindia.online)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!malRes.ok) {
      if (cached) return res.json(cached.data);
      const errText = await malRes.text();
      return res.status(malRes.status).json({ error: errText || `MAL API Error: ${malRes.status}` });
    }

    const data = await malRes.json();
    if (data) {
      malProxyCache.set(cleanEndpoint, { data, timestamp: Date.now() });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('MAL Proxy Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('🔥 MongoDB Atlas Connected Successfully!');
    seedInitialArticles();
    syncScheduleData();
    setInterval(syncScheduleData, 30 * 60 * 1000);
  })
  .catch((err) => console.error('MongoDB Error: ', err));

// ==========================================
// MONGODB SCHEMAS
// ==========================================

const trendingSchema = new mongoose.Schema({
  mal_id: Number,
  title: String,
  title_english: String,
  images: Object,
  genres: Array,
  synopsis: String,
  score: Number,
  last_updated: { type: Date, default: Date.now }
});
const TrendingAnime = mongoose.model('TrendingAnime', trendingSchema);

const heroSchema = new mongoose.Schema({
  mal_id: Number,
  title: String,
  title_english: String,
  images: Object,
  genres: Array,
  synopsis: String,
  rating: String,
  last_updated: { type: Date, default: Date.now }
});
const HeroAnime = mongoose.model('HeroAnime', heroSchema);

// Watchlist Schema with User Reference
const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mal_id: { type: Number, required: true }, 
  animeData: { type: Object, required: true }, 
  addedAt: { type: Date, default: Date.now }
});
watchlistSchema.index({ userId: 1, mal_id: 1 }, { unique: true });
const Watchlist = mongoose.model('Watchlist', watchlistSchema);

// Rating Schema (1-10 Stars)
const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  animeId: { type: Number, required: true },
  score: { type: Number, required: true, min: 1, max: 10 },
  animeTitle: { type: String, default: '' },
  animeImage: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});
ratingSchema.index({ userId: 1, animeId: 1 }, { unique: true });
const Rating = mongoose.model('Rating', ratingSchema);

// Favorite Schema
const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  animeId: { type: Number, required: true },
  animeData: { type: Object, required: true },
  addedAt: { type: Date, default: Date.now }
});
favoriteSchema.index({ userId: 1, animeId: 1 }, { unique: true });
const Favorite = mongoose.model('Favorite', favoriteSchema);

// Custom Animenation List Schema
const customListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  isPrivate: { type: Boolean, default: false },
  items: [{
    mal_id: { type: Number, required: true },
    title: { type: String, required: true },
    image: { type: String, default: '' },
    format: { type: String, default: 'TV' },
    score: { type: Number, default: null },
    addedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const CustomList = mongoose.model('CustomList', customListSchema);

// Song Playlist Schema (For AnimeThemes OP/ED & Favorites)
const songPlaylistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  isFavorites: { type: Boolean, default: false },
  songs: [{
    songId: { type: String, required: true },
    type: { type: String, default: 'OP' },
    sequence: { type: Number, default: 1 },
    slug: { type: String, default: '' },
    songTitle: { type: String, required: true },
    artists: [{ type: String }],
    videoUrl: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    animeId: { type: Number },
    animeTitle: { type: String, default: '' },
    animeImage: { type: String, default: '' },
    addedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const SongPlaylist = mongoose.model('SongPlaylist', songPlaylistSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Contact Message Schema
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// ==========================================
// 📰 ARTICLE SCHEMA (Google News & Magazine Engine)
// ==========================================
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
  snippet: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  coverImage: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Anime', 'Manga', 'Movies', 'Reviews', 'Industry', 'Gaming'], 
    default: 'Anime',
    index: true 
  },
  tags: [{ type: String, trim: true }],
  author: { type: String, default: 'Anime Nation India Editorial' },
  authorAvatar: { type: String, default: 'https://www.animenationindia.online/ani-logo.png' },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});
const Article = mongoose.model('Article', articleSchema);

// ==========================================
// 🌟 PERMANENT CURATED ANIME SCHEMA
// ==========================================
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
  trailer: {
    id: String,
    site: String
  },
  section: { type: String, required: true, index: true },
  sectionName: String,
  order: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});
curatedAnimeSchema.index({ section: 1, order: 1 });
curatedAnimeSchema.index({ section: 1, id: 1 }, { unique: true });
const CuratedAnime = mongoose.model('CuratedAnime', curatedAnimeSchema);

// ==========================================
// 📅 LIVE AIRING SCHEDULE ENGINE & SCHEMA
// ==========================================
const DAYS_MAP = {
  sunday: 0, sundays: 0, sun: 0,
  monday: 1, mondays: 1, mon: 1,
  tuesday: 2, tuesdays: 2, tue: 2,
  wednesday: 3, wednesdays: 3, wed: 3,
  thursday: 4, thursdays: 4, thu: 4,
  friday: 5, fridays: 5, fri: 5,
  saturday: 6, saturdays: 6, sat: 6
};

const scheduleAnimeSchema = new mongoose.Schema({
  mal_id: { type: Number, required: true, unique: true, index: true },
  title: String,
  title_english: String,
  title_japanese: String,
  images: Object,
  broadcast: Object,
  dayOfWeek: { type: Number, default: 1, index: true }, // 0=Sun..6=Sat
  airingTime: { type: String, default: '18:00' },
  score: Number,
  episodes: Number,
  format: String,
  status: String,
  genres: [String],
  studios: [String],
  synopsis: String,
  airedFrom: String,
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});
const ScheduleAnime = mongoose.models.ScheduleAnime || mongoose.model('ScheduleAnime', scheduleAnimeSchema);

function parseBroadcast(broadcast, fallbackDay = 1) {
  let dayOfWeek = fallbackDay;
  let airingTime = '18:00';
  if (broadcast) {
    if (broadcast.day) {
      const d = broadcast.day.toLowerCase().trim();
      if (DAYS_MAP[d] !== undefined) dayOfWeek = DAYS_MAP[d];
    }
    if (broadcast.time) {
      airingTime = broadcast.time;
    }
  }
  return { dayOfWeek, airingTime };
}

function calculateScheduleForWeek(animeList, targetMondayEpoch) {
  const mondayDate = new Date(targetMondayEpoch * 1000);

  return animeList.map(item => {
    const dayOfWeek = item.dayOfWeek !== undefined ? item.dayOfWeek : 1;
    const timeParts = (item.airingTime || '18:00').split(':');
    const hour = parseInt(timeParts[0], 10) || 18;
    const minute = parseInt(timeParts[1], 10) || 0;

    const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const airingDate = new Date(Date.UTC(
      mondayDate.getUTCFullYear(),
      mondayDate.getUTCMonth(),
      mondayDate.getUTCDate() + dayOffset,
      hour - 9, // JST to UTC
      minute,
      0
    ));

    const airingAt = Math.floor(airingDate.getTime() / 1000);

    let calculatedEpisode = 1;
    if (item.airedFrom) {
      const fromEpoch = Math.floor(new Date(item.airedFrom).getTime() / 1000);
      if (airingAt >= fromEpoch) {
        const weeksElapsed = Math.floor((airingAt - fromEpoch) / (7 * 86400));
        calculatedEpisode = Math.max(1, weeksElapsed + 1);
      }
    }
    const episode = item.episodes ? Math.min(item.episodes, calculatedEpisode) : calculatedEpisode;

    return {
      id: item.mal_id,
      airingAt,
      episode,
      media: {
        id: item.mal_id,
        idMal: item.mal_id,
        title: {
          english: item.title_english || item.title,
          romaji: item.title_japanese || item.title
        },
        coverImage: {
          extraLarge: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
          large: item.images?.jpg?.large_image_url || item.images?.webp?.image_url
        },
        bannerImage: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
        averageScore: item.score ? Math.round(item.score * 10) : null,
        episodes: item.episodes || null,
        format: item.format || 'TV',
        status: item.status || 'Currently Airing',
        genres: item.genres || [],
        seasonYear: new Date(item.airedFrom || Date.now()).getFullYear(),
        studios: item.studios?.[0] ? { nodes: [{ name: item.studios[0] }] } : null,
        description: item.synopsis || ''
      }
    };
  });
}

// In-Memory cache for Schedule
let scheduleCache = {
  lastUpdated: 0,
  data: []
};

async function syncScheduleData() {
  try {
    const nowEpoch = Math.floor(Date.now() / 1000);
    const startOfWeek = nowEpoch - (7 * 86400);
    const endOfWeek = nowEpoch + (7 * 86400);

    const scheduleQuery = `
      query ($start: Int, $end: Int) {
        Page(page: 1, perPage: 50) {
          airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
            id
            airingAt
            episode
            media {
              id
              idMal
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
              }
              bannerImage
              genres
              averageScore
              episodes
              format
              status
              seasonYear
              studios(isMain: true) {
                nodes {
                  name
                }
              }
              description
            }
          }
        }
      }
    `;

    const anilistRes = await anilistService.fetchAniList(scheduleQuery, { start: startOfWeek, end: endOfWeek });
    const schedules = anilistRes?.data?.Page?.airingSchedules || anilistRes?.Page?.airingSchedules || [];

    if (schedules.length > 0) {
      for (const item of schedules) {
        const media = item.media;
        if (!media) continue;
        const airingDate = new Date(item.airingAt * 1000);
        const dayOfWeek = airingDate.getUTCDay(); // 0 is Sunday
        const hours = String(airingDate.getUTCHours()).padStart(2, '0');
        const mins = String(airingDate.getUTCMinutes()).padStart(2, '0');
        const airingTime = `${hours}:${mins}`;

        await ScheduleAnime.findOneAndUpdate(
          { mal_id: media.idMal || media.id },
          {
            mal_id: media.idMal || media.id,
            title: media.title?.romaji || media.title?.english || 'Anime',
            title_english: media.title?.english || media.title?.romaji,
            title_japanese: media.title?.native || media.title?.romaji,
            images: {
              jpg: {
                large_image_url: media.coverImage?.extraLarge || media.coverImage?.large,
                image_url: media.coverImage?.large
              },
              webp: {
                large_image_url: media.coverImage?.extraLarge || media.coverImage?.large
              }
            },
            dayOfWeek,
            airingTime,
            score: media.averageScore ? (media.averageScore / 10) : null,
            episodes: media.episodes || null,
            format: media.format || 'TV',
            status: media.status === 'RELEASING' ? 'Currently Airing' : (media.status || 'Currently Airing'),
            genres: media.genres || [],
            studios: (media.studios?.nodes || []).map(s => s.name),
            synopsis: media.description || '',
            airedFrom: airingDate.toISOString(),
            updatedAt: new Date()
          },
          { upsert: true, returnDocument: 'after' }
        );
      }
      scheduleCache.data = await ScheduleAnime.find().lean();
      scheduleCache.lastUpdated = Date.now();
      console.log(`✅ Schedule Synced via AniList: ${scheduleCache.data.length} anime in database.`);
    }
  } catch (error) {
    console.error('Schedule Sync Error:', error.message);
  }
}

// Auto-seed initial high-quality anime articles if collection is empty
async function seedInitialArticles() {
  try {
    const count = await Article.countDocuments();
    if (count === 0) {
      console.log('Seeding initial Anime News articles to MongoDB Atlas...');
      await Article.insertMany([
        {
          title: "Solo Leveling Season 2 -Arise from the Shadow- Global Premiere & Episode Guide",
          slug: "solo-leveling-season-2-arise-from-the-shadow-premiere-guide",
          snippet: "Sung Jinwoo returns with upgraded monarch powers. Here is everything you need to know about Solo Leveling Season 2 broadcast schedule and plot arcs.",
          content: `<p>The wait is finally over for millions of hunters worldwide. <strong>Solo Leveling Season 2 -Arise from the Shadow-</strong> has officially premiered, continuing the meteoric journey of Sung Jinwoo from the world's weakest E-rank hunter to the unassailable Shadow Monarch.</p><h2>The Stakes Have Never Been Higher</h2><p>Following the harrowing events of the Jeju Island raid arc and the awakening of supreme shadow soldiers like Igris and Beru, Season 2 plunges deeper into the overarching mystery of the Monarchs and the Rulers. Jinwoo faces international scrutiny as hunter associations across Japan, America, and Korea attempt to fathom his unprecedented growth.</p><h2>Where to Watch and Episode Schedule</h2><p>New episodes are simulcast every Saturday with English subtitles and dubs across global streaming services. With Studio A-1 Pictures bringing cinema-quality action choreography, fans can anticipate breathtaking battles, jaw-dropping necromancy sequences, and the iconic 'Arise' command brought to life with thundering sound design.</p>`,
          coverImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&q=80",
          category: "Anime",
          tags: ["Solo Leveling", "Action", "Fall Season", "Anime Nation India"],
          author: "Anime Nation India Editorial",
          views: 1420,
          featured: true,
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          title: "Demon Slayer: Kimetsu no Yaiba Infinity Castle Movie Trilogy — What We Know So Far",
          slug: "demon-slayer-infinity-castle-movie-trilogy-details",
          snippet: "Ufotable confirms the final battle against Muzan Kibutsuji will be an epic 3-part theatrical anime cinematic event.",
          content: `<p>Following the emotional culmination of the Hashira Training Arc, <strong>Demon Slayer: Kimetsu no Yaiba</strong> is embarking on its most ambitious chapter yet: the <em>Infinity Castle Arc</em>, adapted into an expansive theatrical movie trilogy by legendary animation powerhouse <strong>Ufotable</strong>.</p><h2>A War Beyond Dimensions</h2><p>The Infinity Castle serves as the grotesque, ever-shifting stronghold of Muzan Kibutsuji and his remaining Upper Rank demons, including Akaza, Doma, and the formidable Kokushibo. Every surviving Hashira, alongside Tanjiro, Nezuko, Zenitsu, and Inosuke, will be pushed beyond their biological limits.</p><h2>Cinematic Release Strategy</h2><p>Ufotable and Aniplex have teamed up with Sony Pictures and Crunchyroll to deliver a worldwide theatrical rollout. Each movie will be optimized for IMAX and premium large formats, ensuring viewers witness the transcendent swordplay and visual artistry with ground-shaking acoustics.</p>`,
          coverImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&q=80",
          category: "Movies",
          tags: ["Demon Slayer", "Movies", "Ufotable", "Kimetsu no Yaiba"],
          author: "Anime Nation India Editorial",
          views: 2850,
          featured: true,
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
        },
        {
          title: "Top 5 Most Anticipated Anime of 2026: The Ultimate Otaku Watchlist",
          slug: "top-5-most-anticipated-anime-2026-watchlist",
          snippet: "From epic returns to revolutionary new adaptations, here are the top 5 anime titles set to dominate screens this year.",
          content: `<p>2026 is shaping up to be one of the most unforgettable years for anime enthusiasts worldwide. Whether you are craving psychological suspense, supernatural shounen adrenaline, or heartwarming slice-of-life storytelling, the seasonal lineup is stacked with powerhouse productions.</p><h2>1. Chainsaw Man – The Reze Arc (Movie)</h2><p>MAPPA brings the fan-favorite bomb devil arc to the silver screen with mind-bending visuals and emotional turbulence for Denji.</p><h2>2. Jujutsu Kaisen: The Culling Game Arc</h2><p>Following the devastation of the Shibuya Incident, Kenjaku's deadly ritual commences, introducing deadly ancient sorcerers into the fray.</p><h2>3. One Piece – Elbaf Island Arc</h2><p>The Straw Hat Pirates finally reach the land of the giants, unraveling long-teased Void Century lore and legendary Norse-inspired conflicts.</p><h2>4. Bleach: Thousand-Year Blood War – The Conflict</h2><p>The climax of the Quincy blood war reaches peak intensity as the Royal Guard and Ichigo unlock their ultimate spiritual potentials.</p><h2>5. Spy x Family Season 3</h2><p>The Forger family returns with brand new covert espionage, school shenanigans at Eden Academy, and lovable Anya expressions.</p>`,
          coverImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&q=80",
          category: "Reviews",
          tags: ["Recommendations", "Top 5", "Jujutsu Kaisen", "One Piece"],
          author: "Anime Nation India Editorial",
          views: 3190,
          featured: false,
          publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
        }
      ]);
      console.log('Seeded initial Anime News articles successfully!');
    }
  } catch (err) {
    console.error('Error seeding initial articles:', err.message);
  }
}

// ==========================================
// 🔥 AUTHENTICATION ROUTES 🔥
// ==========================================

app.post(
  '/api/auth/register',
  registerLimiter,
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('username').trim().isLength({ min: 2, max: 30 }).withMessage('Username must be between 2 and 30 characters').escape()
  ]),
  async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email is already registered!" });

      // OWASP Recommendation 2026: 12 salt rounds
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();

      // PII removed from server log
      console.log('New User Registered Successfully');
      res.status(201).json({ message: "Account created successfully!" });
    } catch (error) {
      console.error('Signup Error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.post(
  '/api/auth/login',
  loginLimiter,
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Prevent NoSQL Injection: Ensure string types explicitly
      if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Invalid email or password payload format!" });
      }

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid Email or Password!" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid Email or Password!" });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: { id: user._id, username: user.username, email: user.email }
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ==========================================
// 🔥 JWT AUTH MIDDLEWARE 🔥
// ==========================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided, authorization denied!" });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id from login: { id: user._id }
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid!" });
  }
};

// ==========================================
// 🔥 PERSONAL WATCHLIST API ROUTES 🔥
// ==========================================

app.post('/api/watchlist', verifyToken, async (req, res) => {
  try {
    const { anime } = req.body;
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ message: "Please login to bookmark anime!" });

    if (!anime || !anime.mal_id) {
      return res.status(400).json({ message: "Invalid anime object" });
    }

    const watchlistItem = await Watchlist.findOneAndUpdate(
      { userId, mal_id: anime.mal_id },
      { userId, mal_id: anime.mal_id, animeData: anime },
      { upsert: true, returnDocument: 'after' }
    );
    res.status(201).json({ message: "Saved to your collection!" });
  } catch (error) {
    console.error('Watchlist Add Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/api/watchlist/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.id) return res.status(403).json({ message: "Unauthorized access!" });
    
    const list = await Watchlist.find({ userId }).sort({ addedAt: -1 });
    const formattedList = list.map(item => item.animeData);
    res.json(formattedList);
  } catch (error) {
    console.error('Watchlist Fetch Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete('/api/watchlist/:userId/:mal_id', verifyToken, async (req, res) => {
  try {
    const { userId, mal_id } = req.params;
    if (userId !== req.user.id) return res.status(403).json({ message: "Unauthorized access!" });

    await Watchlist.findOneAndDelete({ userId, mal_id });
    res.json({ message: "Removed from Watchlist!" });
  } catch (error) {
    console.error('Watchlist Delete Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================================
// 🔥 USER RATINGS API ROUTES (1-10 STARS) 🔥
// ==========================================

// Save or Update Rating
app.post('/api/ratings', verifyToken, async (req, res) => {
  try {
    const { animeId, score, animeTitle, animeImage } = req.body;
    const userId = req.user.id;

    if (!animeId || typeof score !== 'number' || score < 1 || score > 10) {
      return res.status(400).json({ message: "Score must be a number between 1 and 10" });
    }

    const rating = await Rating.findOneAndUpdate(
      { userId, animeId },
      { 
        userId, 
        animeId, 
        score, 
        animeTitle: animeTitle || '', 
        animeImage: animeImage || '', 
        updatedAt: new Date() 
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ success: true, message: `Rated ${score}/10!`, rating });
  } catch (error) {
    console.error('Rating Error:', error);
    res.status(500).json({ message: "Failed to save rating" });
  }
});

// Get User Rating for specific Anime & Community Score
app.get('/api/ratings/anime/:animeId', async (req, res) => {
  try {
    const animeId = Number(req.params.animeId);
    let userRating = null;

    // Optional auth token check
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const rating = await Rating.findOne({ userId: decoded.id, animeId });
        if (rating) userRating = rating.score;
      } catch {}
    }

    // Community aggregation
    const stats = await Rating.aggregate([
      { $match: { animeId } },
      { $group: { _id: null, avgScore: { $avg: '$score' }, totalRatings: { $sum: 1 } } }
    ]);

    const communityAvg = stats.length > 0 ? parseFloat(stats[0].avgScore.toFixed(2)) : null;
    const totalVotes = stats.length > 0 ? stats[0].totalRatings : 0;

    res.json({ userRating, communityAvg, totalVotes });
  } catch (error) {
    console.error('Get Rating Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all ratings by user
app.get('/api/ratings/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.id) return res.status(403).json({ message: "Unauthorized access!" });

    const ratings = await Rating.find({ userId }).sort({ updatedAt: -1 });
    res.json(ratings);
  } catch (error) {
    console.error('User Ratings Fetch Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete user rating
app.delete('/api/ratings/:animeId', verifyToken, async (req, res) => {
  try {
    const animeId = Number(req.params.animeId);
    const userId = req.user.id;

    await Rating.findOneAndDelete({ userId, animeId });
    res.json({ success: true, message: "Rating removed" });
  } catch (error) {
    console.error('Delete Rating Error:', error);
    res.status(500).json({ message: "Failed to remove rating" });
  }
});

// ==========================================
// 🔥 USER FAVORITES API ROUTES 🔥
// ==========================================

// Add or Toggle Favorite
app.post('/api/favorites', verifyToken, async (req, res) => {
  try {
    const { anime } = req.body;
    const userId = req.user.id;
    const animeId = anime?.mal_id || anime?.id;

    if (!animeId) {
      return res.status(400).json({ message: "Invalid anime object" });
    }

    const existing = await Favorite.findOne({ userId, animeId });
    if (existing) {
      await Favorite.findOneAndDelete({ userId, animeId });
      return res.json({ isFavorite: false, message: "Removed from Favorites" });
    } else {
      const fav = new Favorite({ userId, animeId, animeData: anime });
      await fav.save();
      return res.json({ isFavorite: true, message: "Added to Favorites!" });
    }
  } catch (error) {
    console.error('Favorite Toggle Error:', error);
    res.status(500).json({ message: "Failed to update favorites" });
  }
});

// Check if anime is favorited
app.get('/api/favorites/check/:animeId', verifyToken, async (req, res) => {
  try {
    const animeId = Number(req.params.animeId);
    const userId = req.user.id;

    const existing = await Favorite.findOne({ userId, animeId });
    res.json({ isFavorite: Boolean(existing) });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's favorites list
app.get('/api/favorites/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.id) return res.status(403).json({ message: "Unauthorized access!" });

    const list = await Favorite.find({ userId }).sort({ addedAt: -1 });
    const formattedList = list.map(item => item.animeData);
    res.json(formattedList);
  } catch (error) {
    console.error('Favorites Fetch Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Remove from favorites
app.delete('/api/favorites/:userId/:animeId', verifyToken, async (req, res) => {
  try {
    const { userId, animeId } = req.params;
    if (userId !== req.user.id) return res.status(403).json({ message: "Unauthorized access!" });

    await Favorite.findOneAndDelete({ userId, animeId: Number(animeId) });
    res.json({ message: "Removed from Favorites!" });
  } catch (error) {
    console.error('Favorite Delete Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================================
// 🔥 CUSTOM ANIMENATION LISTS API ROUTES 🔥
// ==========================================

// Create a new Custom List
app.post('/api/lists', verifyToken, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    const userId = req.user.id;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: "List name is required" });
    }

    const newList = new CustomList({
      userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      isPrivate: Boolean(isPrivate),
      items: []
    });

    await newList.save();
    res.status(201).json({ success: true, message: "List created successfully!", list: newList });
  } catch (error) {
    console.error('Create List Error:', error);
    res.status(500).json({ message: "Failed to create list" });
  }
});

// Get all custom lists for a user
app.get('/api/lists/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.id) return res.status(403).json({ message: "Unauthorized access!" });

    const lists = await CustomList.find({ userId }).sort({ updatedAt: -1 });
    res.json(lists);
  } catch (error) {
    console.error('Fetch Lists Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a specific custom list
app.get('/api/lists/:listId', verifyToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const list = await CustomList.findById(listId);
    if (!list) return res.status(404).json({ message: "List not found" });

    // Check privacy
    if (list.isPrivate && list.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "This list is private" });
    }

    res.json(list);
  } catch (error) {
    console.error('Fetch Single List Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add anime to a Custom List
app.post('/api/lists/:listId/items', verifyToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const { anime } = req.body;
    const userId = req.user.id;

    const list = await CustomList.findOne({ _id: listId, userId });
    if (!list) return res.status(404).json({ message: "List not found or unauthorized" });

    const malId = anime.mal_id || anime.id;
    if (!malId) return res.status(400).json({ message: "Invalid anime object" });

    // Check if already in list
    const alreadyExists = list.items.some(item => item.mal_id === Number(malId));
    if (alreadyExists) {
      return res.status(400).json({ message: "Anime is already in this list!" });
    }

    const title = anime.title_english || anime.title?.english || anime.title?.romaji || anime.title || 'Unknown Title';
    const image = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.coverImage?.large || anime.image || '';

    list.items.push({
      mal_id: Number(malId),
      title,
      image,
      format: anime.type || anime.format || 'TV',
      score: anime.score || (anime.averageScore ? anime.averageScore / 10 : null),
      addedAt: new Date()
    });
    list.updatedAt = new Date();
    await list.save();

    res.json({ success: true, message: `Added to ${list.name}!`, list });
  } catch (error) {
    console.error('Add to List Error:', error);
    res.status(500).json({ message: "Failed to add to list" });
  }
});

// Remove anime from a Custom List
app.delete('/api/lists/:listId/items/:animeId', verifyToken, async (req, res) => {
  try {
    const { listId, animeId } = req.params;
    const userId = req.user.id;

    const list = await CustomList.findOne({ _id: listId, userId });
    if (!list) return res.status(404).json({ message: "List not found or unauthorized" });

    list.items = list.items.filter(item => item.mal_id !== Number(animeId));
    list.updatedAt = new Date();
    await list.save();

    res.json({ success: true, message: "Removed from list", list });
  } catch (error) {
    console.error('Remove from List Error:', error);
    res.status(500).json({ message: "Failed to remove from list" });
  }
});

// Delete an entire Custom List
app.delete('/api/lists/:listId', verifyToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;

    const deleted = await CustomList.findOneAndDelete({ _id: listId, userId });
    if (!deleted) return res.status(404).json({ message: "List not found or unauthorized" });

    res.json({ success: true, message: "List deleted successfully" });
  } catch (error) {
    console.error('Delete List Error:', error);
    res.status(500).json({ message: "Failed to delete list" });
  }
});

// ==========================================
// 🎵 SONG PLAYLISTS & FAVORITES API ROUTES 🎵
// ==========================================

// Helper: Decodes common HTML entities before sanitizing to prevent entity-encoding bypasses
function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&');
}

// Robust XSS Sanitizer: Strict Plain Text only (allowedTags: []), strips all script tags and HTML injections
function sanitizePlainText(text) {
  if (!text || typeof text !== 'string') return '';
  // 1. Decode entities to reveal any hidden/encoded tags
  const decoded = decodeHtmlEntities(text);
  // 2. Discard all HTML tags, attributes, and scripts via sanitize-html
  const sanitized = sanitizeHtml(decoded, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });
  // 3. Post-processing: Clean leftover orphan entities (&lt;, &gt;) and stray brackets
  return sanitized
    .replace(/&lt;/gi, '')
    .replace(/&gt;/gi, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get all song playlists of authenticated user directly from token
app.get('/api/song-playlists/my-playlists', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let playlists = await SongPlaylist.find({ userId }).sort({ isFavorites: -1, updatedAt: -1 });

    let favPlaylist = playlists.find(p => p.isFavorites);
    if (!favPlaylist) {
      favPlaylist = new SongPlaylist({
        userId,
        name: 'Favorite Themes',
        description: 'Your favorite Anime Openings & Endings',
        isFavorites: true,
        songs: []
      });
      await favPlaylist.save();
      playlists.unshift(favPlaylist);
    }

    res.json(playlists);
  } catch (error) {
    console.error('Get My Song Playlists Error:', error);
    res.status(500).json({ message: "Failed to fetch song playlists" });
  }
});

// Get all song playlists of user (Token-based IDOR Safe)
app.get('/api/song-playlists/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Strict IDOR Protection: token user id MUST match requested userId
    if (req.user.id !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot access another user's playlists" });
    }

    let playlists = await SongPlaylist.find({ userId: req.user.id }).sort({ isFavorites: -1, updatedAt: -1 });

    // If user has no playlists at all, initialize a default "Favorite Themes" playlist
    let favPlaylist = playlists.find(p => p.isFavorites);
    if (!favPlaylist) {
      favPlaylist = new SongPlaylist({
        userId: req.user.id,
        name: 'Favorite Themes',
        description: 'Your favorite Anime Openings & Endings',
        isFavorites: true,
        songs: []
      });
      await favPlaylist.save();
      playlists.unshift(favPlaylist);
    }

    res.json(playlists);
  } catch (error) {
    console.error('Get Song Playlists Error:', error);
    res.status(500).json({ message: "Failed to fetch song playlists" });
  }
});

// Create a new custom song playlist with sanitize-html (Plain text only)
app.post('/api/song-playlists', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    const cleanName = sanitizePlainText(name).slice(0, 100);
    const cleanDesc = sanitizePlainText(description).slice(0, 500);

    if (!cleanName) {
      return res.status(400).json({ message: "Playlist name is required and must contain valid text" });
    }

    const newPlaylist = new SongPlaylist({
      userId,
      name: cleanName,
      description: cleanDesc,
      isFavorites: false,
      songs: []
    });

    await newPlaylist.save();
    res.status(201).json({ success: true, playlist: newPlaylist });
  } catch (error) {
    console.error('Create Song Playlist Error:', error);
    res.status(500).json({ message: "Failed to create playlist" });
  }
});

// Delete a custom song playlist (cannot delete isFavorites playlist)
app.delete('/api/song-playlists/:playlistId', verifyToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user.id;

    const playlist = await SongPlaylist.findOne({ _id: playlistId, userId });
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.isFavorites) return res.status(400).json({ message: "Cannot delete default Favorite Themes playlist" });

    await SongPlaylist.deleteOne({ _id: playlistId, userId });
    res.json({ success: true, message: "Playlist deleted successfully" });
  } catch (error) {
    console.error('Delete Song Playlist Error:', error);
    res.status(500).json({ message: "Failed to delete playlist" });
  }
});

// Add a song to a specific playlist
app.post('/api/song-playlists/:playlistId/songs', verifyToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { song } = req.body;
    const userId = req.user.id;

    if (!song || !song.songId || !song.songTitle) {
      return res.status(400).json({ message: "Song details are required" });
    }

    const playlist = await SongPlaylist.findOne({ _id: playlistId, userId });
    if (!playlist) return res.status(404).json({ message: "Playlist not found or unauthorized" });

    // Prevent duplicate song in same playlist
    const exists = playlist.songs.some(s => s.songId === String(song.songId));
    if (exists) {
      return res.status(400).json({ message: "Song already in playlist" });
    }

    playlist.songs.unshift({
      songId: String(song.songId),
      type: song.type || 'OP',
      sequence: song.sequence || 1,
      slug: song.slug || '',
      songTitle: song.songTitle,
      artists: song.artists || [],
      videoUrl: song.videoUrl || '',
      audioUrl: song.audioUrl || '',
      animeId: song.animeId,
      animeTitle: song.animeTitle || '',
      animeImage: song.animeImage || '',
      addedAt: new Date()
    });

    playlist.updatedAt = new Date();
    await playlist.save();

    res.json({ success: true, message: "Song added to playlist", playlist });
  } catch (error) {
    console.error('Add Song to Playlist Error:', error);
    res.status(500).json({ message: "Failed to add song to playlist" });
  }
});

// Remove a song from a playlist
app.delete('/api/song-playlists/:playlistId/songs/:songId', verifyToken, async (req, res) => {
  try {
    const { playlistId, songId } = req.params;
    const userId = req.user.id;

    const playlist = await SongPlaylist.findOne({ _id: playlistId, userId });
    if (!playlist) return res.status(404).json({ message: "Playlist not found or unauthorized" });

    playlist.songs = playlist.songs.filter(s => s.songId !== String(songId));
    playlist.updatedAt = new Date();
    await playlist.save();

    res.json({ success: true, message: "Song removed from playlist", playlist });
  } catch (error) {
    console.error('Remove Song from Playlist Error:', error);
    res.status(500).json({ message: "Failed to remove song from playlist" });
  }
});

// Quick 1-click Toggle Favorite Song
app.post('/api/song-playlists/toggle-favorite', verifyToken, async (req, res) => {
  try {
    const { song } = req.body;
    const userId = req.user.id;

    if (!song || !song.songId || !song.songTitle) {
      return res.status(400).json({ message: "Song details are required" });
    }

    let favPlaylist = await SongPlaylist.findOne({ userId, isFavorites: true });
    if (!favPlaylist) {
      favPlaylist = new SongPlaylist({
        userId,
        name: 'Favorite Themes',
        description: 'Your favorite Anime Openings & Endings',
        isFavorites: true,
        songs: []
      });
    }

    const songIdStr = String(song.songId);
    const existingIndex = favPlaylist.songs.findIndex(s => s.songId === songIdStr);

    let isFavorite = false;
    if (existingIndex > -1) {
      // Remove from favorites
      favPlaylist.songs.splice(existingIndex, 1);
      isFavorite = false;
    } else {
      // Add to favorites
      favPlaylist.songs.unshift({
        songId: songIdStr,
        type: song.type || 'OP',
        sequence: song.sequence || 1,
        slug: song.slug || '',
        songTitle: song.songTitle,
        artists: song.artists || [],
        videoUrl: song.videoUrl || '',
        audioUrl: song.audioUrl || '',
        animeId: song.animeId,
        animeTitle: song.animeTitle || '',
        animeImage: song.animeImage || '',
        addedAt: new Date()
      });
      isFavorite = true;
    }

    favPlaylist.updatedAt = new Date();
    await favPlaylist.save();

    res.json({ success: true, isFavorite, message: isFavorite ? "Added to Favorite Themes" : "Removed from Favorite Themes" });
  } catch (error) {
    console.error('Toggle Favorite Song Error:', error);
    res.status(500).json({ message: "Failed to toggle favorite song" });
  }
});

// Check if a song is favorited by user
app.get('/api/song-playlists/check-favorite/:songId', verifyToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const userId = req.user.id;

    const favPlaylist = await SongPlaylist.findOne({ userId, isFavorites: true });
    const isFavorite = favPlaylist ? favPlaylist.songs.some(s => s.songId === String(songId)) : false;

    res.json({ isFavorite });
  } catch (error) {
    res.json({ isFavorite: false });
  }
});

// ==========================================
// 🔥 CONTACT FORM API ROUTE (Database + Email) 🔥
// ==========================================
app.post(
  '/api/contact',
  contactLimiter,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('email').trim().isEmail().withMessage('Valid email address is required').normalizeEmail(),
    body('subject').trim().escape(),
    body('message').trim().notEmpty().withMessage('Message is required')
  ]),
  async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      const newMessage = new Message({ name, email, subject, message });
      await newMessage.save();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        replyTo: email,
        subject: `New Anime Nation India Message: ${subject || 'General Inquiry'}`,
        text: `You got a new message from ${name} (${email}):\n\n${message}`
      };

      await transporter.sendMail(mailOptions);

      res.status(201).json({ success: true, message: "Message sent successfully! We will get back to you soon." });
    } catch (error) {
      console.error("Contact Error:", error);
      res.status(500).json({ success: false, message: "Failed to send message." });
    }
  }
);

// ==========================================
// 🔥 OTHER DATA ROUTES 🔥
// ==========================================

app.get('/api/anime/season/:year/:season', async (req, res) => {
  const { year, season } = req.params;
  const page = Number(req.query.page) || 1;
  try {
    const data = await anilistService.browseFilter({
      year: Number(year),
      sort: 'POPULARITY_DESC',
      page,
      limit: 24
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(`❌ Seasonal Anime Fetch Error (${year}/${season}):`, error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// 🌟 Chinese Donghua Exclusion Helper (Ensures 100% Japanese Anime) 🌟
const CHINESE_STUDIOS = [
  'bilibili', 'tencent', 'sparkly key', 'foch film', 'haoliners', 
  'colored pencil', 'b.cmay', 'rooftop animation', 'paper plane', 
  'cg year', 'byment', 'l²studio', 'wonder cat', 'samsara', 'tianying',
  'shanghai', 'beijing', 'hangzhou', 'guangdong', 'b.c.may', 'sheng ying',
  'haoliners animation league', 'sparkly key animation studio', 'build dream',
  'motion magic', 'red dog culture house', 'original force', 'cmc media'
];

const KNOWN_DONGHUA_IDS = [
  61607, 55809, 60988, 51039, 56524, 58494, 57713, 58518, 58349, 54930, 49830, 39893, 40730, 37255, 33237, 59953, 51836, 63240, 47405, 51289
];

const CHINESE_TITLE_PATTERN = /^(Link Click|Renegade Immortal|Heaven Official|Battle Through The Heavens|Swallowed Star|Soul Land|Perfect World|A Will Eternal|Martial Universe|Throne of Seal|Immortal and Martial|A Record of Mortal|Grandmaster of Demonic|Daily Life of the Immortal King|The King's Avatar|Scissor Seven|Fog Hill|Tales of Demons|Against the Gods|Shrouding the Heavens|Peerless Battle|Legend of Xianwu|A Herbivorous Dragon|Big Brother|Island of Siliang|Stellar Transformation|Great Ruler|Martial God Asura|Wanmei Shijie|Doupo|Douluo|Shiguang Dailiren|Tian Guan Ci Fu|Mo Dao Zu Shi|Tunshi Xingkong|Tales of Herding)/i;

function isChineseDonghua(node, alt = {}, studios = []) {
  if (KNOWN_DONGHUA_IDS.includes(node?.id)) return true;
  if (Array.isArray(studios) && studios.some(s => CHINESE_STUDIOS.some(cs => String(s).toLowerCase().includes(cs)))) return true;
  if (CHINESE_TITLE_PATTERN.test(node?.title || '') || CHINESE_TITLE_PATTERN.test(alt?.en || '') || CHINESE_TITLE_PATTERN.test(alt?.english || '')) return true;
  if (Array.isArray(alt?.synonyms) && alt.synonyms.some(syn => CHINESE_TITLE_PATTERN.test(syn))) return true;
  return false;
}

app.get('/api/trending', async (req, res) => {
  try {
    const fields = 'id,title,alternative_titles,main_picture,mean,rank,popularity,genres,media_type,num_episodes,start_season,synopsis,status,broadcast,studios';
    const malRes = await malService.fetchMAL(`/anime/ranking?ranking_type=airing&limit=45&fields=${encodeURIComponent(fields)}`, 30 * 60 * 1000);
    if (malRes && Array.isArray(malRes.data)) {
      const filteredJapanese = malRes.data.filter(entry => {
        const node = entry.node || {};
        const alt = node.alternative_titles || {};
        const studios = (node.studios || []).map(s => s.name || '');
        return !isChineseDonghua(node, alt, studios);
      });

      const list = filteredJapanese.slice(0, 20).map((entry) => {
        const node = entry.node || {};
        const cover = node.main_picture?.large || node.main_picture?.medium || '/placeholder-poster.png';
        const alt = node.alternative_titles || {};
        const titles = normalizeTitleObject({ english: alt.en, romaji: node.title, native: alt.ja });
        return {
          id: node.id,
          idMal: node.id,
          title: titles,
          coverImage: { large: cover, extraLarge: cover },
          bannerImage: cover,
          format: (node.media_type || 'TV').toUpperCase(),
          averageScore: typeof node.mean === 'number' ? Math.round(node.mean * 10) : 85,
          seasonYear: node.start_season?.year || new Date().getFullYear(),
          genres: (node.genres || []).map(g => g.name),
          episodes: node.num_episodes || null,
          isDubbed: true
        };
      });

      if (list.length > 0) return res.json({ data: list });
    }

    const anilistList = await anilistService.getTrending(20);
    return res.json({ data: anilistList });
  } catch (error) { 
    console.error('Trending Fetch Error:', error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

// 🌟 Crunchyroll-Style Japanese Spotlight & Airing Hero API 🌟
// Primary: AniList GraphQL | Fallback: MyAnimeList v2 (5-Key Pool) | Tertiary: Atlas Curated
const heroMemoryCache = { data: null, timestamp: 0 };

app.get('/api/hero', async (req, res) => {
  try {
    if (heroMemoryCache.data && (Date.now() - heroMemoryCache.timestamp < 15 * 60 * 1000)) {
      return res.json(heroMemoryCache.data);
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = days[new Date().getDay()];

    // ─── 1. PRIMARY SOURCE: AniList GraphQL ───
    try {
      const anilistQuery = `
        query {
          Page(page: 1, perPage: 35) {
            media(type: ANIME, status: RELEASING, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) {
              id
              idMal
              title { english romaji native }
              coverImage { extraLarge large medium color }
              bannerImage
              description
              averageScore
              episodes
              format
              status
              seasonYear
              genres
              countryOfOrigin
              nextAiringEpisode { airingAt episode timeUntilAiring }
              studios(isMain: true) { nodes { name } }
            }
          }
        }
      `;
      const anilistRes = await anilistService.fetchAniList(anilistQuery, {}, 15 * 60 * 1000, 3500);
      const mediaList = anilistRes?.data?.Page?.media;
      if (mediaList && Array.isArray(mediaList) && mediaList.length > 0) {
        const filteredJapanese = mediaList.filter(m => {
          if (m.countryOfOrigin && m.countryOfOrigin !== 'JP') return false;
          const studioNames = (m.studios?.nodes || []).map(s => s.name);
          return !isChineseDonghua({ id: m.idMal || m.id, title: m.title?.romaji || m.title?.english }, m.title, studioNames);
        });

        if (filteredJapanese.length > 0) {
          const items = filteredJapanese.slice(0, 15).map((m, idx) => {
            let isAiringToday = false;
            let airingDay = null;
            let airingTime = null;
            if (m.nextAiringEpisode?.airingAt) {
              const airingDate = new Date(m.nextAiringEpisode.airingAt * 1000);
              airingDay = days[airingDate.getDay()];
              isAiringToday = airingDate.toDateString() === new Date().toDateString();
              airingTime = airingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            }

            return {
              id: m.idMal || m.id,
              idMal: m.idMal || m.id,
              anilistId: m.id,
              title: normalizeTitleObject(m.title),
              coverImage: {
                extraLarge: m.coverImage?.extraLarge || m.coverImage?.large,
                large: m.coverImage?.large || m.coverImage?.extraLarge,
                medium: m.coverImage?.medium
              },
              bannerImage: m.bannerImage || m.coverImage?.extraLarge || m.coverImage?.large || '/placeholder-poster.png',
              description: m.description ? m.description.replace(/<[^>]*>/g, '').trim() : '',
              format: (m.format || 'TV').toUpperCase(),
              status: m.status || 'Currently Airing',
              averageScore: typeof m.averageScore === 'number' ? m.averageScore : 85,
              seasonYear: m.seasonYear || new Date().getFullYear(),
              genres: m.genres || [],
              episodes: m.episodes || null,
              isAiringToday,
              airingEpisode: m.nextAiringEpisode?.episode || null,
              airingDay,
              airingTime,
              isDubbed: true,
              order: idx + 1
            };
          });

          if (items.length > 0) {
            heroMemoryCache.data = items;
            heroMemoryCache.timestamp = Date.now();
            return res.json(items);
          }
        }
      }
    } catch (aniErr) {
      console.warn('⚠️ /api/hero AniList Primary failed, activating MAL v2 Fallback:', aniErr.message);
    }

    // ─── 2. FALLBACK SOURCE: Official MAL v2 (5-Key Rotating Pool) ───
    try {
      const fields = 'id,title,alternative_titles,main_picture,mean,rank,popularity,genres,media_type,num_episodes,start_season,synopsis,status,broadcast,studios';
      const malRes = await malService.fetchMAL(`/anime/ranking?ranking_type=airing&limit=45&fields=${encodeURIComponent(fields)}`, 15 * 60 * 1000);
      
      if (malRes && Array.isArray(malRes.data)) {
        const filteredJapanese = malRes.data.filter(entry => {
          const node = entry.node || {};
          const alt = node.alternative_titles || {};
          const studios = (node.studios || []).map(s => s.name || '');
          return !isChineseDonghua(node, alt, studios);
        });

        const items = filteredJapanese.slice(0, 15).map((entry, index) => {
          const node = entry.node || {};
          const cover = node.main_picture?.large || node.main_picture?.medium || '/placeholder-poster.png';
          const alt = node.alternative_titles || {};
          const titles = normalizeTitleObject({ english: alt.en, romaji: node.title, native: alt.ja });
          const broadcastDay = node.broadcast?.day_of_the_week?.toLowerCase();
          const isAiringToday = broadcastDay === todayDay;

          return {
            id: node.id,
            idMal: node.id,
            title: titles,
            coverImage: { extraLarge: cover, large: cover },
            bannerImage: cover,
            description: node.synopsis || '',
            format: (node.media_type || 'TV').toUpperCase(),
            status: node.status || 'Currently Airing',
            averageScore: typeof node.mean === 'number' ? Math.round(node.mean * 10) : 85,
            seasonYear: node.start_season?.year || new Date().getFullYear(),
            genres: (node.genres || []).map(g => g.name),
            episodes: node.num_episodes || null,
            broadcast: node.broadcast || null,
            isAiringToday,
            airingDay: node.broadcast?.day_of_the_week || null,
            airingTime: node.broadcast?.start_time || null,
            isDubbed: true,
            order: index + 1
          };
        });

        if (items.length > 0) {
          heroMemoryCache.data = items;
          heroMemoryCache.timestamp = Date.now();
          return res.json(items);
        }
      }
    } catch (malErr) {
      console.warn('⚠️ /api/hero MAL Fallback failed:', malErr.message);
    }

    // ─── 3. TERTIARY SOURCE: MongoDB Atlas Curated Collection ───
    const fallbackCurated = await CuratedAnime.find({ section: 'shounen' }).sort({ order: 1 }).limit(10).lean();
    if (fallbackCurated && fallbackCurated.length > 0) {
      return res.json(fallbackCurated);
    }

    return res.json([]);
  } catch (error) {
    console.error('Error fetching /api/hero:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 💖 Featured / Seasonal Romance Spotlight API 💖
const romanceMemoryCache = { data: null, timestamp: 0 };
const FEATURED_ROMANCE_MAL_IDS = [
  52578, // The Dangers in My Heart
  43608, // Kaguya-sama: Love Is War -Ultra Romantic-
  57181, // Blue Box
  48736, // My Dress-Up Darling
  42897, // Horimiya
  55866, // A Sign of Affection
  37450, // Rascal Does Not Dream of Bunny Girl Senpai
  23273, // Your Lie in April
  39547, // My Teen Romantic Comedy SNAFU Climax!
  42938, // Fruits Basket: The Final
  4224,  // Toradora!
  50796, // Insomniacs After School
  52305, // Tomo-chan Is a Girl!
  50739, // The Angel Next Door Spoils Me Rotten
  56038  // Kimi ni Todoke: From Me to You Season 3
];

app.get('/api/romance/featured', async (req, res) => {
  try {
    if (romanceMemoryCache.data && (Date.now() - romanceMemoryCache.timestamp < 30 * 60 * 1000)) {
      return res.json({ success: true, count: romanceMemoryCache.data.length, data: romanceMemoryCache.data });
    }

    const items = await Promise.all(
      FEATURED_ROMANCE_MAL_IDS.map(async (malId) => {
        try {
          const detail = await malService.getAnimeDetails(malId);
          if (!detail) return null;
          const cover = detail.images?.webp?.large_image_url || detail.images?.jpg?.large_image_url || '/placeholder-poster.png';
          const cleanTitle = toEnglishTitle(detail.title_english || detail.title);
          return {
            id: detail.id,
            idMal: detail.id,
            title: {
              english: cleanTitle,
              romaji: cleanTitle
            },
            coverImage: {
              large: cover,
              extraLarge: cover
            },
            bannerImage: cover,
            description: detail.synopsis || '',
            format: (detail.type || 'TV').toUpperCase(),
            status: detail.status || 'Finished Airing',
            averageScore: typeof detail.score === 'number' ? Math.round(detail.score * 10) : 85,
            seasonYear: detail.year || (detail.aired?.from ? new Date(detail.aired.from).getFullYear() : 2024),
            genres: (detail.genres || []).map(g => g.name || g),
            episodes: detail.episodes || null,
            isDubbed: true
          };
        } catch {
          return null;
        }
      })
    );

    const validItems = items.filter(Boolean);
    if (validItems.length > 0) {
      romanceMemoryCache.data = validItems;
      romanceMemoryCache.timestamp = Date.now();
      return res.json({ success: true, count: validItems.length, data: validItems });
    }

    return res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    console.error('Error fetching featured romance:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 🔥 High-Speed Curated Sections API (Loaded from Atlas with In-Memory Cache) 🔥
const curatedMemoryCache = new Map();

app.get('/api/curated/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;
    if (!sectionKey) return res.status(400).json({ success: false, message: 'Section key required' });

    const cached = curatedMemoryCache.get(sectionKey);
    if (cached && (Date.now() - cached.timestamp < 3600000)) {
      return res.json({ success: true, count: cached.data.length, data: cached.data });
    }

    const normalizedKey = sectionKey.replace(/_zone$/, '').replace(/_cyberpunk$/, '').replace(/^similar_/, 'similar_');

    const animes = await CuratedAnime.find({
      $or: [
        { section: sectionKey },
        { section: normalizedKey },
        { section: sectionKey.replace('sports_zone', 'sports') },
        { section: sectionKey.replace('fantasy_zone', 'fantasy') },
        { section: sectionKey.replace('scifi_cyberpunk', 'scifi') }
      ]
    }).sort({ order: 1, _id: 1 }).lean();

    if (animes && animes.length > 0) {
      curatedMemoryCache.set(sectionKey, { data: animes, timestamp: Date.now() });
      return res.json({ success: true, count: animes.length, data: animes });
    }

    return res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    console.error(`Error fetching curated section ${req.params.sectionKey}:`, error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/anime/search', async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string') return res.status(400).json({ message: "Search query required" });
  try {
    const data = await malService.searchAnime(query, 10);
    res.json(data || []);
  } catch (error) {
    console.error('Anime Search Error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ==========================================
// 📰 CUSTOM ANIME NEWS & ARTICLES API
// ==========================================

// 1. GET /api/articles - List articles with pagination, category filter & search
app.get('/api/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const category = req.query.category;
    const search = req.query.search;
    const featured = req.query.featured;

    const filter = {};
    if (category && category !== 'All') {
      filter.category = new RegExp(`^${category}$`, 'i');
    }
    if (featured === 'true') {
      filter.featured = true;
    }
    if (search && typeof search === 'string') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { snippet: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const total = await Article.countDocuments(filter);
    const articles = await Article.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: articles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Articles Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch articles' });
  }
});

// 2. GET /api/articles/:slug - Single article reader + increment view counter
app.get('/api/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await Article.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    ).lean();

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Fetch related articles from same category
    const related = await Article.find({
      category: article.category,
      _id: { $ne: article._id }
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .select('title slug coverImage category publishedAt views snippet')
      .lean();

    res.json({
      success: true,
      data: article,
      related
    });
  } catch (error) {
    console.error('Single Article Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch article' });
  }
});

// 3. POST /api/articles - Create/Publish new article (Admin protected)
app.post('/api/articles', async (req, res) => {
  try {
    const adminPasscode = req.headers['x-admin-passcode'] || req.body.adminPasscode;
    const expectedPasscode = process.env.ADMIN_PASSCODE || 'ani2026admin';

    if (adminPasscode !== expectedPasscode) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Invalid Admin Passcode' });
    }

    let { title, slug, snippet, content, coverImage, category, tags, author, featured } = req.body;

    if (!title || !content || !coverImage) {
      return res.status(400).json({ success: false, message: 'Title, content, and coverImage are required' });
    }

    if (!slug) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
    } else {
      slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (!snippet) {
      snippet = content.replace(/<[^>]*>?/gm, '').slice(0, 180) + '...';
    }

    const newArticle = new Article({
      title,
      slug,
      snippet,
      content,
      coverImage,
      category: category || 'Anime',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      author: author || 'Anime Nation India Editorial',
      featured: Boolean(featured),
      publishedAt: new Date()
    });

    await newArticle.save();
    res.status(201).json({ success: true, data: newArticle, message: 'Article published successfully!' });
  } catch (error) {
    console.error('Article Create Error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An article with this slug/title already exists.' });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to create article' });
  }
});

// ==========================================
// 🌟 PERMANENT CURATED ANIME ROUTES
// ==========================================

// 1. GET /api/curated - Get all curated sections grouped by section
app.get('/api/curated', async (req, res) => {
  try {
    const animeList = await CuratedAnime.find({}).sort({ section: 1, order: 1 }).lean();
    res.json({ success: true, data: animeList });
  } catch (error) {
    console.error('Curated Anime Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch curated anime' });
  }
});

// ==========================================
// 📅 AIRING SCHEDULE API ROUTES
// ==========================================

// 1. GET /api/schedule - Get real airing schedule for a given week epoch
app.get('/api/schedule', async (req, res) => {
  try {
    const { start, end } = req.query;
    let targetMondayEpoch;

    if (start) {
      targetMondayEpoch = parseInt(start, 10);
    } else {
      const now = new Date();
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const mondayDate = new Date(now);
      mondayDate.setDate(now.getDate() - distanceToMonday);
      mondayDate.setHours(0, 0, 0, 0);
      targetMondayEpoch = Math.floor(mondayDate.getTime() / 1000);
    }

    if (!scheduleCache.data || scheduleCache.data.length === 0 || Date.now() - scheduleCache.lastUpdated > 30 * 60 * 1000) {
      scheduleCache.data = await ScheduleAnime.find().lean();
      scheduleCache.lastUpdated = Date.now();
    }

    if (!scheduleCache.data || scheduleCache.data.length === 0) {
      syncScheduleData();
    }

    const calculated = calculateScheduleForWeek(scheduleCache.data || [], targetMondayEpoch);
    res.json({ success: true, count: calculated.length, data: calculated });
  } catch (error) {
    console.error('API /api/schedule Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 2. POST /api/schedule/sync - Trigger live sync in background
app.post('/api/schedule/sync', async (req, res) => {
  syncScheduleData();
  res.json({ success: true, message: 'Live schedule sync started' });
});

// 3. GET /api/reviews - Get recent community anime reviews (Cached via AniList)
let cachedReviews = [];
let lastReviewsFetch = 0;
const REVIEWS_CACHE_TTL = 30 * 60 * 1000; // 30 mins

app.get('/api/reviews', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const now = Date.now();

    if (cachedReviews.length > 0 && (now - lastReviewsFetch < REVIEWS_CACHE_TTL)) {
      return res.json({ success: true, data: cachedReviews.slice(0, limit) });
    }

    const reviewsQuery = `
      query ($perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          reviews(sort: ID_DESC) {
            id
            summary
            body
            rating
            score
            createdAt
            user {
              id
              name
              avatar {
                large
              }
            }
            media {
              id
              idMal
              title {
                romaji
                english
              }
              coverImage {
                large
              }
            }
          }
        }
      }
    `;

    const anilistRes = await anilistService.fetchAniList(reviewsQuery, { perPage: 25 });
    const rawReviews = anilistRes?.data?.Page?.reviews || anilistRes?.Page?.reviews || [];

    if (rawReviews.length > 0) {
      cachedReviews = rawReviews.map(r => ({
        mal_id: r.media?.idMal || r.id,
        id: r.id,
        score: r.score ? Math.round(r.score / 10) : (r.rating || 8),
        review: r.summary ? `${r.summary}\n\n${r.body}` : r.body,
        summary: r.summary || '',
        date: new Date(r.createdAt * 1000).toISOString(),
        user: {
          username: r.user?.name || 'Otaku Critic',
          images: {
            jpg: {
              image_url: r.user?.avatar?.large || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user?.name || 'Reviewer'}`
            }
          }
        },
        entry: {
          mal_id: r.media?.idMal || r.media?.id || 1,
          title: r.media?.title?.english || r.media?.title?.romaji || 'Anime',
          images: {
            jpg: {
              image_url: r.media?.coverImage?.large || ''
            }
          }
        }
      }));
      lastReviewsFetch = now;
      return res.json({ success: true, data: cachedReviews.slice(0, limit) });
    }

    if (cachedReviews.length > 0) {
      return res.json({ success: true, data: cachedReviews.slice(0, limit) });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Reviews Fetch Error:', error.message);
    if (cachedReviews.length > 0) {
      return res.json({ success: true, data: cachedReviews.slice(0, 10) });
    }
    return res.json({ success: true, data: [] });
  }
});

// GET /api/recommendations - Get community recommendations (Cached via AniList)
let cachedRecs = [];
let lastRecsFetch = 0;
const RECS_CACHE_TTL = 30 * 60 * 1000; // 30 mins

app.get('/api/recommendations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const now = Date.now();

    if (cachedRecs.length > 0 && (now - lastRecsFetch < RECS_CACHE_TTL)) {
      return res.json({ success: true, data: cachedRecs.slice(0, limit) });
    }

    const recsQuery = `
      query ($perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          recommendations(sort: ID_DESC) {
            id
            rating
            user {
              id
              name
              avatar {
                large
              }
            }
            media {
              id
              idMal
              title {
                romaji
                english
              }
              coverImage {
                large
              }
            }
            mediaRecommendation {
              id
              idMal
              title {
                romaji
                english
              }
              coverImage {
                large
              }
            }
          }
        }
      }
    `;

    const anilistRes = await anilistService.fetchAniList(recsQuery, { perPage: 25 });
    const rawRecs = anilistRes?.data?.Page?.recommendations || anilistRes?.Page?.recommendations || [];

    if (rawRecs.length > 0) {
      cachedRecs = rawRecs.filter(r => r.media && r.mediaRecommendation).map(r => ({
        mal_id: String(r.id),
        id: r.id,
        content: `If you loved ${r.media?.title?.english || r.media?.title?.romaji}, you must watch ${r.mediaRecommendation?.title?.english || r.mediaRecommendation?.title?.romaji}! Both share phenomenal world-building, emotional storytelling, and intense character arcs.`,
        user: {
          username: r.user?.name || 'Otaku Recommendation'
        },
        entry: [
          {
            mal_id: r.media?.idMal || r.media?.id,
            title: r.media?.title?.english || r.media?.title?.romaji,
            url: `/anime/${r.media?.id}`,
            images: {
              jpg: {
                image_url: r.media?.coverImage?.large
              }
            }
          },
          {
            mal_id: r.mediaRecommendation?.idMal || r.mediaRecommendation?.id,
            title: r.mediaRecommendation?.title?.english || r.mediaRecommendation?.title?.romaji,
            url: `/anime/${r.mediaRecommendation?.id}`,
            images: {
              jpg: {
                image_url: r.mediaRecommendation?.coverImage?.large
              }
            }
          }
        ]
      }));
      lastRecsFetch = now;
      return res.json({ success: true, data: cachedRecs.slice(0, limit) });
    }

    if (cachedRecs.length > 0) {
      return res.json({ success: true, data: cachedRecs.slice(0, limit) });
    }

    return res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Recommendations Fetch Error:', error.message);
    if (cachedRecs.length > 0) {
      return res.json({ success: true, data: cachedRecs.slice(0, 10) });
    }
    return res.json({ success: true, data: [] });
  }
});

// 4. DELETE /api/articles/:id - Delete an article (Admin protected)
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const adminPasscode = req.headers['x-admin-passcode'] || req.query.adminPasscode;
    const expectedPasscode = process.env.ADMIN_PASSCODE || 'ani2026admin';

    if (adminPasscode !== expectedPasscode) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Invalid Admin Passcode' });
    }

    const deleted = await Article.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Article not found' });

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. GET /api/news/feed.xml or /feed.xml - Google News Compliant RSS 2.0 XML Feed
app.get(['/api/news/feed.xml', '/feed.xml'], async (req, res) => {
  try {
    const articles = await Article.find().sort({ publishedAt: -1 }).limit(30).lean();
    const siteUrl = 'https://www.animenationindia.online';
    const now = new Date().toUTCString();

    const itemsXml = articles.map(art => `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${siteUrl}/news/${art.slug}</link>
      <guid isPermaLink="true">${siteUrl}/news/${art.slug}</guid>
      <pubDate>${new Date(art.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${art.snippet}]]></description>
      <category>${art.category}</category>
      <author><![CDATA[${art.author}]]></author>
      <enclosure url="${art.coverImage}" type="image/jpeg" length="150000" />
      <media:content url="${art.coverImage}" medium="image">
        <media:title><![CDATA[${art.title}]]></media:title>
      </media:content>
    </item>`).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Anime Nation India - Latest News &amp; Articles</title>
    <link>${siteUrl}/news</link>
    <description>Latest anime, manga, and gaming news, official trailer breakdowns, and in-depth reviews from Anime Nation India.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/api/news/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/ani-logo.png</url>
      <title>Anime Nation India</title>
      <link>${siteUrl}</link>
    </image>${itemsXml}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=600, s-maxage=600');
    res.send(rssXml);
  } catch (error) {
    console.error('RSS Feed Error:', error);
    res.status(500).send('Error generating RSS feed');
  }
});

// ==========================================
// 🔥 CUSTOM NEWS API ROUTE (MAL) 🔥
// ==========================================
app.get('/api/news', async (req, res) => {
    try {
        const now = Date.now();
        
        if (cachedNews.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
            return res.json({ success: true, data: cachedNews });
        }

        const feed = await parser.parseURL('https://myanimelist.net/rss/news.xml');
        
        const formattedNews = feed.items.map(item => {
            const htmlContent = item.content || item.description || "";
            return {
                id: item.guid || item.link,
                title: item.title,
                link: item.link,
                description: htmlContent, 
                pubDate: item.pubDate,
                category: item.categories ? item.categories[0] : 'MAL News Update'
            };
        });

        cachedNews = formattedNews;
        lastFetchTime = now;

        res.json({ success: true, data: cachedNews });
    } catch (error) {
        console.error("News Fetch Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ==========================================
// 📰 CUSTOM ANIME NEWS & ARTICLES API
// ==========================================

// ============================================================================
// 🔥 UNIFIED BACKEND-FOR-FRONTEND (BFF) ENDPOINTS 🔥
// ============================================================================

// 1. Composite Home Feed (Hero, Trending, Popular, Upcoming, Top Rated, News)
app.get('/api/home', async (req, res) => {
  try {
    const [trending, popular, upcoming, topRated, news] = await Promise.all([
      anilistService.getTrending(12).catch(() => []),
      anilistService.getPopular(12).catch(() => []),
      malService.getRankings('upcoming', 12).catch(() => []),
      malService.getRankings('all', 12).catch(() => []),
      newsService.getLatestNews(6).catch(() => [])
    ]);

    res.json({
      success: true,
      data: {
        trending,
        popular,
        upcoming,
        topRated,
        news
      }
    });
  } catch (err) {
    console.error("❌ Home Feed Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Full Anime Details (Tier 1: Official MAL v2 -> Tier 2: AniList GraphQL)
app.get('/api/anime/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const malData = await malService.getAnimeDetails(id);
    if (malData) {
      return res.json({ success: true, data: malData, source: 'mal_official_v2' });
    }

    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title { romaji english native }
          coverImage { extraLarge large medium }
          bannerImage
          description
          averageScore
          episodes
          format
          status
          seasonYear
          genres
          studios(isMain: true) { nodes { name } }
        }
      }
    `;
    const anilistRes = await anilistService.fetchAniList(query, { id: Number(id) });
    if (anilistRes?.data?.Media) {
      return res.json({ success: true, data: anilistRes.data.Media, source: 'anilist_proxy' });
    }

    res.status(404).json({ success: false, message: "Anime not found" });
  } catch (error) { 
    console.error("❌ Anime Details Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" }); 
  }
});

// 3. Anime Recommendations (Tier 1: Official MAL -> Tier 2: AniList GraphQL)
app.get('/api/anime/:id/recommendations', async (req, res) => {
  try {
    const id = req.params.id;
    const malRecs = await malService.getRecommendations(id);
    if (malRecs && malRecs.length > 0) {
      return res.json({ success: true, data: malRecs, source: 'mal_official_v2' });
    }

    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          recommendations(perPage: 10, sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                id
                idMal
                title { romaji english }
                coverImage { large }
              }
            }
          }
        }
      }
    `;
    const anilistRes = await anilistService.fetchAniList(query, { id: Number(id) });
    const recNodes = anilistRes?.data?.Media?.recommendations?.nodes || [];
    const formatted = recNodes.filter(n => n.mediaRecommendation).map(n => ({
      entry: {
        mal_id: n.mediaRecommendation.idMal || n.mediaRecommendation.id,
        title: n.mediaRecommendation.title?.english || n.mediaRecommendation.title?.romaji,
        images: { jpg: { image_url: n.mediaRecommendation.coverImage?.large } }
      }
    }));
    res.json({ success: true, data: formatted, source: 'anilist_proxy' });
  } catch (error) { 
    console.error("❌ Anime Recommendations Error:", error);
    res.json({ success: true, data: [] }); 
  }
});

// 4. Anime Characters & Voice Actors (AniList GraphQL Proxy)
app.get('/api/anime/:id/characters', async (req, res) => {
  try {
    const id = req.params.id;
    const chars = await anilistService.getAnimeCharacters(id);
    res.json({ success: true, data: chars || [] });
  } catch (error) { 
    console.error("❌ Anime Characters Error:", error);
    res.json({ success: true, data: [] }); 
  }
});

// 5. Anime Opening & Ending Songs (AnimeThemes API)
app.get('/api/anime/:id/themes', async (req, res) => {
  try {
    const themes = await themesService.getAnimeThemes(req.query.title, req.params.id);
    res.json({ success: true, data: themes });
  } catch (error) {
    console.error("❌ Anime Themes Error:", error);
    res.json({ success: true, data: [] });
  }
});

// 6. TMDB Hero Backdrops & 4K Logos
app.get('/api/tmdb/hero', async (req, res) => {
  try {
    const data = await tmdbService.getHeroBackdrop(req.query.title);
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ TMDB Hero Error:", error);
    res.json({ success: false, data: null });
  }
});

// 7. Rankings Endpoint (Official MAL v2)
app.get('/api/anime/ranking/:type', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 24;
    const offset = Number(req.query.offset) || 0;
    const data = await malService.getRankings(req.params.type, limit, offset);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Search Endpoint (Official MAL v2)
app.get('/api/anime/search/query', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = Number(req.query.limit) || 20;
    const data = await malService.searchAnime(query, limit);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Instant Search Suggestions (Auto-complete for search bar)
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = Number(req.query.limit) || 5;
    const data = await malService.getSearchSuggestions(query, limit);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// 10. Advanced Browse Multi-Filter Endpoint
app.get('/api/browse/filter', async (req, res) => {
  try {
    const { genre, status, format, year, sort, page = 1, limit = 24 } = req.query;
    const data = await anilistService.browseFilter({
      genre,
      status,
      format,
      year,
      sort,
      page: Number(page),
      limit: Number(limit)
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 🚀 UNIFIED BFF PROXY ROUTES 🚀
// ==========================================

// 1. High-Performance AniList GraphQL Proxy with In-Memory Caching & Retries
app.post('/api/anilist/proxy', async (req, res) => {
  try {
    const { query, variables } = req.body;
    if (!query) {
      return res.status(400).json({ errors: [{ message: 'GraphQL query is required' }] });
    }

    const data = await anilistService.fetchAniList(query, variables || {});
    return res.json(data);
  } catch (err) {
    return res.status(502).json({
      errors: [{ message: err.message || 'AniList Proxy Error' }],
      data: null
    });
  }
});

// 2. Official MAL v2 Multi-Key Pool Proxy
app.get('/api/mal/proxy', async (req, res) => {
  try {
    const endpoint = req.query.endpoint;
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }

    const data = await malService.fetchMAL(endpoint);
    return res.json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message || 'MAL Proxy Error' });
  }
});

// 11. Anime Episodes List
app.get('/api/anime/:id/episodes', async (req, res) => {
  try {
    const episodes = await tmdbService.getEpisodes(req.params.id);
    res.json({ success: true, data: episodes || [] });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// 12. Anime Reviews Endpoint
app.get('/api/anime/:id/reviews', async (req, res) => {
  try {
    const reviews = await anilistService.getAnimeReviews?.(req.params.id) || [];
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// 13. Top Characters Catalog
app.get('/api/characters/top', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const characters = await anilistService.getTopCharacters(page, limit);
    res.json({ success: true, data: characters });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// 14. Single Character Details
app.get('/api/character/:id', async (req, res) => {
  try {
    const character = await anilistService.getCharacterDetails(req.params.id);
    if (character) return res.json({ success: true, data: character });
    res.status(404).json({ success: false, message: "Character not found" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. Single Staff / Voice Actor Details
app.get('/api/staff/:id', async (req, res) => {
  try {
    const staff = await anilistService.getStaffDetails(req.params.id);
    if (staff) return res.json({ success: true, data: staff });
    res.status(404).json({ success: false, message: "Staff not found" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. Manga Top Catalog
app.get('/api/manga/top', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const manga = await anilistService.getTopManga(page, limit);
    res.json({ success: true, data: manga });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// 17. Manga Search
app.get('/api/manga/search', async (req, res) => {
  try {
    const query = req.query.q || req.query.search || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const manga = await anilistService.searchManga(query, page, limit);
    res.json({ success: true, data: manga });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// 18. Manga Single Details
app.get('/api/manga/:id', async (req, res) => {
  try {
    const manga = await anilistService.getMangaDetails(req.params.id);
    if (manga) return res.json({ success: true, data: manga });
    res.status(404).json({ success: false, message: "Manga not found" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 19. Latest Trailers Endpoint
app.get('/api/trailers', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 24;
    const trailers = await anilistService.getTrailers(limit);
    res.json({ success: true, data: trailers });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// 20. Curated Dubbed Anime Endpoint
app.get('/api/dubbed', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const dubbed = await anilistService.browseFilter({ sort: 'POPULARITY_DESC', page, limit });
    res.json({ success: true, data: dubbed });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// 21. Standard Genres Catalog Endpoint
app.get('/api/genres', (req, res) => {
  const genres = [
    { id: 1, name: 'Action', slug: 'action', icon: '⚔️' },
    { id: 2, name: 'Adventure', slug: 'adventure', icon: '🗺️' },
    { id: 4, name: 'Comedy', slug: 'comedy', icon: '😂' },
    { id: 8, name: 'Drama', slug: 'drama', icon: '🎭' },
    { id: 10, name: 'Fantasy', slug: 'fantasy', icon: '🧙' },
    { id: 14, name: 'Horror', slug: 'horror', icon: '👻' },
    { id: 22, name: 'Romance', slug: 'romance', icon: '💖' },
    { id: 24, name: 'Sci-Fi', slug: 'sci-fi', icon: '🚀' },
    { id: 30, name: 'Sports', slug: 'sports', icon: '⚽' },
    { id: 36, name: 'Slice of Life', slug: 'slice-of-life', icon: '☕' },
    { id: 37, name: 'Supernatural', slug: 'supernatural', icon: '🔮' },
    { id: 41, name: 'Suspense', slug: 'suspense', icon: '🕵️' },
    { id: 62, name: 'Isekai', slug: 'isekai', icon: '🌀' }
  ];
  res.json({ success: true, data: genres });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
