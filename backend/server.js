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

// 🔥 Resilient CORS Configuration 🔥
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://animenationindia.online',
  'https://www.animenationindia.online',
  'https://animenationindia.vercel.app',
  'https://animenationindia.animenationindia-global.workers.dev',
  'https://anilist.co',
  'https://myanimelist.net',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      origin === 'null' ||
      allowedOrigins.includes(origin) ||
      (typeof origin === 'string' && (
        origin.endsWith('.animenationindia.online') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.workers.dev') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('anilist.co')
      ))
    ) {
      callback(null, true);
    } else {
      callback(null, true); // Allow gracefully without 500 error
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-passcode', 'Origin', 'Accept', 'Referer'],
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
// 🔥 High-Speed GraphQL Proxy for AniList (Integrated with Resilience Engine) 🔥
// ============================================================================
app.post('/api/anilist/proxy', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { query, variables } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'GraphQL query is required' });
    }

    const data = await anilistService.fetchAniList(query, variables);
    if (data) {
      return res.json(data);
    }
    return res.status(502).json({ error: 'AniList Proxy upstream failed' });
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
// 🔥 High-Speed Official MyAnimeList (MAL) API Proxy (5-Key Pool & Deduplication) 🔥
// ============================================================================
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

    const data = await malService.fetchMAL(endpoint);
    if (data) {
      return res.status(200).json(data);
    }
    return res.status(502).json({ error: 'Failed to retrieve data from MyAnimeList' });
  } catch (err) {
    return res.status(502).json({ error: err.message || 'MAL Proxy Error' });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('🔥 MongoDB Atlas Connected Successfully!');
    seedInitialArticles();
    syncInitialSchedule();
    setInterval(syncInitialSchedule, 60 * 60 * 1000); // Hourly schedule refresh
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

// Contact Message Schema
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
// ==========================================
// 🚀 PERSISTENT DETAILS CACHE (48-Hour TTL Index)
// ==========================================
const animeCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  source: { type: String, default: 'mal_official_pool' },
  createdAt: { type: Date, default: Date.now, expires: 48 * 3600 } // Auto-purged after 48 hours
});
const AnimeCache = mongoose.models.AnimeCache || mongoose.model('AnimeCache', animeCacheSchema);

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
// ==========================================
// 📅 ACCURATE AIRING SCHEDULE ENGINE & SCHEMA
// ==========================================
const scheduleItemSchema = new mongoose.Schema({
  airingId: { type: Number, required: true, unique: true, index: true },
  airingAt: { type: Number, required: true, index: true }, // exact Unix timestamp (seconds)
  episode: { type: Number, default: 1 },
  media: {
    id: { type: Number, required: true },
    idMal: Number,
    title: {
      romaji: String,
      english: String,
      native: String
    },
    coverImage: {
      extraLarge: String,
      large: String,
      medium: String
    },
    bannerImage: String,
    format: String,
    status: String,
    averageScore: Number,
    episodes: Number,
    seasonYear: Number,
    genres: [String],
    studios: {
      nodes: [{ name: String }]
    },
    description: String
  },
  updatedAt: { type: Date, default: Date.now, expires: 14 * 86400 } // 14 days auto-cleanup
}, {
  timestamps: true
});

const ScheduleItem = mongoose.models.ScheduleItem || mongoose.model('ScheduleItem', scheduleItemSchema);

function formatScheduleOutput(item) {
  return {
    id: item.airingId,
    airingAt: item.airingAt,
    episode: item.episode,
    media: item.media
  };
}

async function fetchScheduleFromAniList(startEpoch, endEpoch) {
  const query = `
    query ($page: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo {
          hasNextPage
        }
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

  const allItems = [];
  for (let page = 1; page <= 4; page++) {
    try {
      const res = await anilistService.fetchAniList(query, { page, start: startEpoch, end: endEpoch });
      const schedules = res?.data?.Page?.airingSchedules || res?.Page?.airingSchedules || [];
      if (schedules.length > 0) {
        allItems.push(...schedules);
      }
      const hasNextPage = res?.data?.Page?.pageInfo?.hasNextPage || res?.Page?.pageInfo?.hasNextPage;
      if (!hasNextPage || schedules.length < 50) break;
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.warn(`[Schedule Sync] Page ${page} fetch notice:`, err.message);
      break;
    }
  }
  return allItems;
}

async function syncScheduleRange(startEpoch, endEpoch) {
  try {
    const schedules = await fetchScheduleFromAniList(startEpoch, endEpoch);
    if (schedules.length > 0) {
      let savedCount = 0;
      for (const item of schedules) {
        if (!item || !item.id || !item.airingAt || !item.media) continue;
        await ScheduleItem.findOneAndUpdate(
          { airingId: item.id },
          {
            airingId: item.id,
            airingAt: item.airingAt,
            episode: item.episode || 1,
            media: {
              id: item.media.id,
              idMal: item.media.idMal || item.media.id,
              title: {
                romaji: item.media.title?.romaji || 'Anime',
                english: item.media.title?.english || item.media.title?.romaji || 'Anime',
                native: item.media.title?.native || ''
              },
              coverImage: {
                extraLarge: item.media.coverImage?.extraLarge || item.media.coverImage?.large,
                large: item.media.coverImage?.large
              },
              bannerImage: item.media.bannerImage || '',
              format: item.media.format || 'TV',
              status: item.media.status || 'RELEASING',
              averageScore: item.media.averageScore || null,
              episodes: item.media.episodes || null,
              seasonYear: item.media.seasonYear || null,
              genres: item.media.genres || [],
              studios: item.media.studios || { nodes: [] },
              description: item.media.description || ''
            },
            updatedAt: new Date()
          },
          { upsert: true }
        );
        savedCount++;
      }
      console.log(`✅ Schedule Synced via AniList: ${savedCount} broadcasts updated in MongoDB Atlas.`);
    }
  } catch (error) {
    console.error('[Schedule Sync Error]:', error.message);
  }
}

async function syncInitialSchedule() {
  const nowSec = Math.floor(Date.now() / 1000);
  const start = nowSec - (3 * 86400); // Past 3 days (Yesterday, etc.)
  const end = nowSec + (8 * 86400);   // Next 8 days (Tomorrow, upcoming)
  await syncScheduleRange(start, end);
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
// 🛡️ MIGRATED USER & AUTH ROUTES NOTICE
// ==========================================
// All authentication, user watchlists, ratings, catalogs, and playlists have been
// migrated to Neon Serverless PostgreSQL with Next.js Server Actions.
app.use([
  '/api/auth/register',
  '/api/auth/login',
  '/api/watchlist',
  '/api/ratings',
  '/api/favorites',
  '/api/lists',
  '/api/song-playlists'
], (req, res) => {
  return res.status(410).json({
    error: 'This endpoint has been permanently migrated to Neon PostgreSQL Server Actions.',
    migration: 'Use Next.js Server Actions (@/app/actions/*) directly.'
  });
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

// 2. POST /api/curated - Add or update a curated anime (Admin protected)
app.post('/api/curated', async (req, res) => {
  try {
    const adminPasscode = req.headers['x-admin-passcode'] || req.body.adminPasscode;
    const expectedPasscode = process.env.ADMIN_PASSCODE || 'ani2026admin';
    if (adminPasscode !== expectedPasscode) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Invalid Admin Passcode' });
    }

    const { id, title, coverImage, section, sectionName, format, averageScore, seasonYear, genres, order } = req.body;
    if (!id || !section) {
      return res.status(400).json({ success: false, message: 'Anime id and section are required' });
    }

    const updated = await CuratedAnime.findOneAndUpdate(
      { section, id },
      {
        id,
        idMal: req.body.idMal || id,
        title: title || { english: 'Anime', romaji: 'Anime' },
        coverImage: coverImage || {},
        bannerImage: req.body.bannerImage || '',
        description: req.body.description || '',
        episodes: req.body.episodes || null,
        format: format || 'TV',
        status: req.body.status || 'FINISHED',
        averageScore: averageScore || null,
        genres: Array.isArray(genres) ? genres : [],
        seasonYear: seasonYear || null,
        section,
        sectionName: sectionName || section,
        order: Number(order) || 0,
        updatedAt: new Date()
      },
      { upsert: true, returnDocument: 'after' }
    );

    curatedMemoryCache.clear();
    res.json({ success: true, data: updated, message: 'Curated anime saved successfully' });
  } catch (error) {
    console.error('Curated Anime Save Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save curated anime' });
  }
});

// 3. DELETE /api/curated/:id - Delete a curated anime (Admin protected)
app.delete('/api/curated/:id', async (req, res) => {
  try {
    const adminPasscode = req.headers['x-admin-passcode'] || req.query.adminPasscode;
    const expectedPasscode = process.env.ADMIN_PASSCODE || 'ani2026admin';
    if (adminPasscode !== expectedPasscode) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Invalid Admin Passcode' });
    }

    const { id } = req.params;
    const section = req.query.section;
    const filter = section ? { id: Number(id), section } : { _id: id };

    let deleted = await CuratedAnime.findOneAndDelete(filter);
    if (!deleted) {
      deleted = await CuratedAnime.findByIdAndDelete(id);
    }

    curatedMemoryCache.clear();
    res.json({ success: true, message: 'Curated anime removed successfully' });
  } catch (error) {
    console.error('Curated Anime Delete Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete curated anime' });
  }
});

// ==========================================
// 📅 AIRING SCHEDULE API ROUTES
// ==========================================

// 1. GET /api/schedule - Get real airing schedule for a given date range (Supports Past, Today & Future)
app.get('/api/schedule', async (req, res) => {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const start = req.query.start ? parseInt(req.query.start, 10) : (nowSec - 3 * 86400);
    const end = req.query.end ? parseInt(req.query.end, 10) : (nowSec + 8 * 86400);
    const forceFresh = req.query.fresh === 'true';

    // 1. Check MongoDB for cached schedule items in this range
    let cached = [];
    if (!forceFresh) {
      cached = await ScheduleItem.find({
        airingAt: { $gte: start, $lte: end }
      }).sort({ airingAt: 1 }).lean();
    }

    const minThreshold = (end - start > 2 * 86400) ? 10 : 1;
    if (cached.length >= minThreshold && !forceFresh) {
      return res.json({
        success: true,
        source: 'mongodb',
        count: cached.length,
        data: cached.map(formatScheduleOutput)
      });
    }

    // 2. Fetch fresh items from AniList
    const freshItems = await fetchScheduleFromAniList(start, end);

    if (freshItems && freshItems.length > 0) {
      // Upsert into MongoDB in background
      (async () => {
        for (const item of freshItems) {
          if (!item || !item.id || !item.airingAt || !item.media) continue;
          await ScheduleItem.findOneAndUpdate(
            { airingId: item.id },
            {
              airingId: item.id,
              airingAt: item.airingAt,
              episode: item.episode || 1,
              media: {
                id: item.media.id,
                idMal: item.media.idMal || item.media.id,
                title: {
                  romaji: item.media.title?.romaji || 'Anime',
                  english: item.media.title?.english || item.media.title?.romaji || 'Anime',
                  native: item.media.title?.native || ''
                },
                coverImage: {
                  extraLarge: item.media.coverImage?.extraLarge || item.media.coverImage?.large,
                  large: item.media.coverImage?.large
                },
                bannerImage: item.media.bannerImage || '',
                format: item.media.format || 'TV',
                status: item.media.status || 'RELEASING',
                averageScore: item.media.averageScore || null,
                episodes: item.media.episodes || null,
                seasonYear: item.media.seasonYear || null,
                genres: item.media.genres || [],
                studios: item.media.studios || { nodes: [] },
                description: item.media.description || ''
              },
              updatedAt: new Date()
            },
            { upsert: true }
          ).catch(() => {});
        }
      })();

      return res.json({
        success: true,
        source: 'anilist_live',
        count: freshItems.length,
        data: freshItems
      });
    }

    // Fallback to whatever is in MongoDB
    if (cached.length > 0) {
      return res.json({
        success: true,
        source: 'mongodb_fallback',
        count: cached.length,
        data: cached.map(formatScheduleOutput)
      });
    }

    return res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    console.error('API /api/schedule Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 2. POST /api/schedule/refresh & POST /api/schedule/sync - Trigger live sync
app.post(['/api/schedule/refresh', '/api/schedule/sync'], async (req, res) => {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const start = nowSec - 3 * 86400; // Past 3 days
    const end = nowSec + 8 * 86400;   // Future 8 days
    syncScheduleRange(start, end).catch(err => console.error('[Schedule Sync Error]:', err.message));
    res.json({ success: true, message: 'Live schedule refresh started in background' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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

// 2. Full Anime Details (Tier 0: MongoDB 48h Cache -> Tier 1: Official MAL v2 5-Key Pool -> Tier 2: AniList GraphQL)
app.get('/api/anime/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const numId = Number(id);
    if (!numId || isNaN(numId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    // ─── TIER 0 [ZERO COLD-START DROP]: MongoDB Persistent Cache ───
    try {
      const cachedDoc = await AnimeCache.findOne({ cacheKey: `anime:${numId}` }).lean();
      if (cachedDoc && cachedDoc.data) {
        return res.json({ success: true, data: cachedDoc.data, source: cachedDoc.source || 'mongo_cache' });
      }
    } catch {}

    // ─── TIER 1 [PRIMARY]: Official MyAnimeList v2 5-Key Pool ───
    if (numId <= 65000) {
      try {
        const malData = await malService.getAnimeDetails(numId);
        if (malData && malData.id) {
          AnimeCache.updateOne(
            { cacheKey: `anime:${numId}` },
            { data: malData, source: 'mal_official_pool', createdAt: new Date() },
            { upsert: true }
          ).catch(() => {});
          return res.json({ success: true, data: malData, source: 'mal_official_pool' });
        }
      } catch (malErr) {
        console.warn(`[MAL Tier 1 Primary] Fetch failed for ID ${numId}, switching to AniList Backup:`, malErr.message);
      }
    }

    // ─── TIER 2 [BACKUP / ANILIST ID]: AniList GraphQL Resilience Engine ───
    const isMalId = numId <= 65000;
    const query = isMalId
      ? `query ($id: Int) {
          Media(idMal: $id, type: ANIME, isAdult: false) {
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
        }`
      : `query ($id: Int) {
          Media(id: $id, type: ANIME, isAdult: false) {
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
        }`;

    try {
      const anilistRes = await anilistService.fetchAniList(query, { id: numId });
      const media = anilistRes?.data?.Media;
      if (media) {
        AnimeCache.updateOne(
          { cacheKey: `anime:${numId}` },
          { data: media, source: 'anilist_fallback', createdAt: new Date() },
          { upsert: true }
        ).catch(() => {});
        return res.json({ success: true, data: media, source: 'anilist_fallback' });
      }
    } catch {}

    // ─── FINAL FALLBACK: If ID was > 65000 and AniList failed, try MAL as last resort ───
    if (numId > 65000) {
      try {
        const malData = await malService.getAnimeDetails(numId);
        if (malData && malData.id) {
          AnimeCache.updateOne(
            { cacheKey: `anime:${numId}` },
            { data: malData, source: 'mal_final_resort', createdAt: new Date() },
            { upsert: true }
          ).catch(() => {});
          return res.json({ success: true, data: malData, source: 'mal_final_resort' });
        }
      } catch {}
    }

    return res.status(404).json({ success: false, message: "Anime not found" });
  } catch (error) { 
    console.error("❌ Anime Details Error:", error.message || error);
    return res.status(500).json({ success: false, message: "Internal server error" }); 
  }
});

// 3. Anime Recommendations (Tier 0: MongoDB Cache -> Tier 1: Official MAL -> Tier 2: AniList GraphQL)
app.get('/api/anime/:id/recommendations', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      const cachedDoc = await AnimeCache.findOne({ cacheKey: `recs:${id}` }).lean();
      if (cachedDoc && cachedDoc.data) {
        return res.json({ success: true, data: cachedDoc.data, source: 'mongo_cache' });
      }
    } catch {}

    const malRecs = await malService.getRecommendations(id);
    if (malRecs && malRecs.length > 0) {
      AnimeCache.updateOne({ cacheKey: `recs:${id}` }, { data: malRecs, source: 'mal_official_v2', createdAt: new Date() }, { upsert: true }).catch(() => {});
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
    if (formatted.length > 0) {
      AnimeCache.updateOne({ cacheKey: `recs:${id}` }, { data: formatted, source: 'anilist_proxy', createdAt: new Date() }, { upsert: true }).catch(() => {});
    }
    res.json({ success: true, data: formatted, source: 'anilist_proxy' });
  } catch (error) { 
    console.error("❌ Anime Recommendations Error:", error);
    res.json({ success: true, data: [] }); 
  }
});

// 4. Anime Characters & Voice Actors (Tier 0: MongoDB Cache -> Tier 1: AniList GraphQL)
app.get('/api/anime/:id/characters', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      const cachedDoc = await AnimeCache.findOne({ cacheKey: `chars:${id}` }).lean();
      if (cachedDoc && cachedDoc.data) {
        return res.json({ success: true, data: cachedDoc.data, source: 'mongo_cache' });
      }
    } catch {}

    const chars = await anilistService.getAnimeCharacters(id);
    if (chars && chars.length > 0) {
      AnimeCache.updateOne({ cacheKey: `chars:${id}` }, { data: chars, source: 'anilist_proxy', createdAt: new Date() }, { upsert: true }).catch(() => {});
    }
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
