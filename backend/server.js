require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

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

// Jikan headers for 403 prevention
const jikanHeaders = {
  'User-Agent': 'AnimeNationIndia/1.0 (https://www.animenationindia.online)',
  'Accept': 'application/json',
};

const app = express();
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
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🔥 MongoDB Atlas Connected Successfully!'))
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
      { upsert: true, new: true }
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
      { upsert: true, new: true }
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
  const page = req.query.page || 1;
  try {
    await delay(300);
    const response = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}?page=${page}`, { headers: jikanHeaders });
    if (!response.ok) {
      throw new Error(`Jikan API Error: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`❌ Seasonal Anime Fetch Error (${year}/${season}):`, error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get('/api/hero', async (req, res) => {
  try {
    const savedHero = await HeroAnime.find();
    const now = new Date();
    
    if (savedHero.length > 0 && savedHero[0].last_updated) {
      const diffHours = (now - savedHero[0].last_updated) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return res.json({ data: savedHero });
      }
    }
    
    const response = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10&type=tv', { headers: jikanHeaders });
    if (!response.ok) {
        if (savedHero.length > 0) return res.json({ data: savedHero });
        return res.status(502).json({ message: "Jikan API Error" });
    }
    
    const data = await response.json();
    if (data && data.data) {
       const updatedData = data.data.map(item => ({...item, last_updated: now}));
       await HeroAnime.deleteMany({}); 
       await HeroAnime.insertMany(updatedData); 
       return res.json({ data: updatedData });
    }
    
    if (savedHero.length > 0) return res.json({ data: savedHero });
    return res.status(500).json({ message: "Failed to fetch hero anime" });
  } catch (error) { 
    console.error('Hero Fetch Error:', error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    const savedTrending = await TrendingAnime.find();
    const now = new Date();
    
    if (savedTrending.length > 0 && savedTrending[0].last_updated) {
      const diffHours = (now - savedTrending[0].last_updated) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return res.json({ data: savedTrending });
      }
    }

    const response = await fetch('https://api.jikan.moe/v4/seasons/now?limit=15&type=tv', { headers: jikanHeaders });
    if (!response.ok) {
        if (savedTrending.length > 0) return res.json({ data: savedTrending });
        return res.status(502).json({ message: "Jikan API Error" });
    }
    
    const data = await response.json();
    if (data && data.data) {
       const updatedData = data.data.map(item => ({...item, last_updated: now}));
       await TrendingAnime.deleteMany({}); 
       await TrendingAnime.insertMany(updatedData);
       return res.json({ data: updatedData });
    }
    
    if (savedTrending.length > 0) return res.json({ data: savedTrending });
    return res.status(500).json({ message: "Failed to fetch trending anime" });
  } catch (error) { 
    console.error('Trending Fetch Error:', error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

app.get('/api/anime/search', async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string') return res.status(400).json({ message: "Search query required" });
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`, { headers: jikanHeaders });
    const data = await response.json();
    res.json(data.data || []);
  } catch (error) {
    console.error('Anime Search Error:', error);
    res.status(500).json({ message: "Internal server error" });
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
// 🔥 TRAILERS ROUTES 🔥
// ==========================================

app.get('/api/trailers', async (req, res) => {
  try {
    await delay(300);
    const [r1, r2] = await Promise.all([
      fetch('https://api.jikan.moe/v4/seasons/upcoming?limit=25', { headers: jikanHeaders }),
      fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=25&type=tv', { headers: jikanHeaders })
    ]);
    if (!r1.ok || !r2.ok) throw new Error(`Jikan API Error: ${r1.status} / ${r2.status}`);
    const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
    const all = [...(d1.data || []), ...(d2.data || [])];
    const withTrailers = all.filter(a => a.trailer?.youtube_id);
    const unique = Array.from(new Map(withTrailers.map(a => [a.mal_id, a])).values());
    res.json({ success: true, data: unique });
  } catch (error) {
    console.error("❌ Trailers Fetch Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get('/api/trailers/search', async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string') return res.status(400).json({ message: "Query required" });
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    const data = await response.json();
    const withTrailers = (data.data || []).filter(a => a.trailer?.youtube_id);
    res.json({ success: true, data: withTrailers });
  } catch (error) {
    console.error("❌ Trailer Search Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ==========================================
// 🔥 ADVANCED MANGA & ANIME ROUTES 🔥
// ==========================================

app.get('/api/manga/top', async (req, res) => {
  try {
    await delay(300); 
    const response = await fetch('https://api.jikan.moe/v4/top/manga?limit=3&type=manga', { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Top Manga Fetch Error:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

app.get('/api/manga/all', async (req, res) => {
  const page = req.query.page || 1;
  try {
    await delay(600); 
    const response = await fetch(`https://api.jikan.moe/v4/top/manga?page=${page}&limit=24&type=manga`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ All Manga Fetch Error:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

app.get('/api/manga/search', async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string') return res.status(400).json({ message: "Search query required" });
  try {
    const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=5`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Manga Search Error:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

app.get('/api/manga/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/manga/${req.params.id}`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Manga Details Error:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

app.get('/api/anime/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${req.params.id}/full`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Anime Details Error:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

app.get('/api/anime/:id/recommendations', async (req, res) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${req.params.id}/recommendations`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Anime Recommendations Error:", error);
    res.status(500).json({ message: "Internal server error" }); 
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
