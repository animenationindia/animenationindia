require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 🔥 Modules import kora holo
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // 🔥 ADDED NODEMAILER HERE

// ==========================================
// 🔥 RSS Parser for Custom News API 🔥
// ==========================================
const Parser = require('rss-parser');
const parser = new Parser();

// Global variables for News Cache (In-Memory)
let cachedNews = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// 🔥 FIX: Jikan rate limit se bachne ke liye delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🔥 FIX: Jikan 403 se bachne ke liye — User-Agent header zaroori hai
const jikanHeaders = {
  'User-Agent': 'AnimeNationIndia/1.0 (https://animenationindia.vercel.app)',
  'Accept': 'application/json',
};

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🔥 MongoDB Atlas Connected Successfully!'))
  .catch((err) => console.log('MongoDB Error: ', err));

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

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// 🔥 NEW: Contact Message Schema 🔥
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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email is already registered!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    console.log(`New User Registered: ${username}`);
    res.status(201).json({ message: "Account created successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server Error during Signup" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Email or Password!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Email or Password!" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret_123", { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error during Login" });
  }
});

// ==========================================
// 🔥 PERSONAL WATCHLIST API ROUTES 🔥
// ==========================================

app.post('/api/watchlist', async (req, res) => {
  try {
    const { anime, userId } = req.body;
    if (!userId) return res.status(401).json({ message: "Please login to bookmark anime!" });

    const existingAnime = await Watchlist.findOne({ userId, mal_id: anime.mal_id });
    if (existingAnime) return res.status(400).json({ message: "Already in your Watchlist!" });

    const newWatchlistItem = new Watchlist({ userId, mal_id: anime.mal_id, animeData: anime });
    await newWatchlistItem.save();
    res.status(201).json({ message: "Added to your collection!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/watchlist/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await Watchlist.find({ userId }).sort({ addedAt: -1 });
    const formattedList = list.map(item => item.animeData);
    res.json(formattedList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/watchlist/:userId/:mal_id', async (req, res) => {
  try {
    const { userId, mal_id } = req.params;
    await Watchlist.findOneAndDelete({ userId, mal_id });
    res.json({ message: "Removed from Watchlist!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 🔥 UPDATED: CONTACT FORM API ROUTE (NODEMAILER ADDED) 🔥
// ==========================================
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Please fill all required fields!" });
    }
    
    // 1. Database-e save kora holo (Future record-er jonno)
    const newMessage = new Message({ name, email, subject, message });
    await newMessage.save();

    // 2. Transporter toiri kora (RENDER FREE TIER BYPASS)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // 587 port-er jonno eta false rakhte hoy
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Eita cloud server-e block atkay
      }
    });
    
    // 3. Mail er format
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'animenationindia.global@gmail.com',     // 🔥 Inbox jekhane mail asbe
      subject: `Anime Nation India: ${subject}`,
      text: `
      🎉 You got a new message from Anime Nation India!
      
      👤 Name: ${name}
      ✉️ Email: ${email}
      📌 Subject: ${subject}
      
      📝 Message:
      ${message}
      `
    };

    // 4. Mail pathano
    await transporter.sendMail(mailOptions);
    
    res.status(201).json({ success: true, message: "Message sent successfully! We will get back to you soon." });
  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ success: false, message: "Failed to send message." });
  }
});


// ==========================================
// 🔥 OTHER DATA ROUTES 🔥
// ==========================================

app.get('/api/hero', async (req, res) => {
  try {
    const savedHero = await HeroAnime.find();
    if (savedHero.length > 0) return res.json({ data: savedHero });
    const response = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10&type=tv', { headers: jikanHeaders });
    const data = await response.json();
    if(data.data) {
       await HeroAnime.deleteMany({}); 
       await HeroAnime.insertMany(data.data); 
       res.json({ data: data.data });
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/trending', async (req, res) => {
  try {
    const savedTrending = await TrendingAnime.find();
    if (savedTrending.length > 0) return res.json({ data: savedTrending });
    const response = await fetch('https://api.jikan.moe/v4/seasons/now?limit=15&type=tv', { headers: jikanHeaders });
    const data = await response.json();
    if(data.data) {
       await TrendingAnime.deleteMany({}); 
       await TrendingAnime.insertMany(data.data);
       res.json({ data: data.data });
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/anime/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: "Search query required" });
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=5`, { headers: jikanHeaders });
    const data = await response.json();
    res.json(data.data || []);
  } catch (error) { res.status(500).json({ message: "Error searching anime" }); }
});

// ==========================================
// 🔥 CUSTOM NEWS API ROUTE (MAL) 🔥
// ==========================================
app.get('/api/news', async (req, res) => {
    try {
        const now = Date.now();
        
        // Cache Check
        if (cachedNews.length > 0 && (now - lastFetchTime < CACHE_DURATION)) {
            console.log("Serving Anime News from Cache ⚡");
            return res.json({ success: true, data: cachedNews });
        }

        console.log("Fetching Fresh News from MyAnimeList 📰...");
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
        res.status(500).json({ success: false, message: "Failed to fetch news" });
    }
});


// ==========================================
// 🔥 TRAILERS ROUTES 🔥
// ==========================================

// Get latest trailers (upcoming + airing anime with youtube_id)
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
    console.error("❌ Trailers Fetch Error:", error.message);
    res.status(500).json({ success: false, message: "Error fetching trailers", error: error.message });
  }
});

// Search trailers by anime name
app.get('/api/trailers/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: "Query required" });
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    const data = await response.json();
    const withTrailers = (data.data || []).filter(a => a.trailer?.youtube_id);
    res.json({ success: true, data: withTrailers });
  } catch (error) {
    console.error("❌ Trailer Search Error:", error.message);
    res.status(500).json({ success: false, message: "Error searching trailers", error: error.message });
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
    console.error("❌ Top Manga Fetch Error:", error.message);
    res.status(500).json({ message: "Error fetching Top Manga", error: error.message }); 
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
    console.error("❌ All Manga Fetch Error:", error.message);
    res.status(500).json({ message: "Error fetching All Manga", error: error.message }); 
  }
});

app.get('/api/manga/search', async (req, res) => {
  const query = req.query.q;
  try {
    const response = await fetch(`https://api.jikan.moe/v4/manga?q=${query}&limit=5`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Manga Search Error:", error.message);
    res.status(500).json({ message: "Error searching Manga", error: error.message }); 
  }
});

app.get('/api/manga/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/manga/${req.params.id}`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Manga Details Error:", error.message);
    res.status(500).json({ message: "Error fetching Manga Details", error: error.message }); 
  }
});

app.get('/api/anime/:id', async (req, res) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${req.params.id}/full`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Anime Details Error:", error.message);
    res.status(500).json({ message: "Error fetching Anime Details", error: error.message }); 
  }
});

app.get('/api/anime/:id/recommendations', async (req, res) => {
  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${req.params.id}/recommendations`, { headers: jikanHeaders });
    if (!response.ok) throw new Error(`Jikan API Error: ${response.status}`);
    
    const data = await response.json();
    res.json(data);
  } catch (error) { 
    console.error("❌ Anime Recommendations Error:", error.message);
    res.status(500).json({ message: "Error fetching Recommendations", error: error.message }); 
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
