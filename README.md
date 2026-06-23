<div align="center">
  <img src="frontend/public/favicon.ico" alt="Anime Nation India Logo" width="120" />
  <h1>🌌 Anime Nation India</h1>
  <p><strong>The Ultimate Cinematic Anime & Manga Database, Tracking, and Discovery Platform</strong></p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16_Turbopack-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
    <a href="https://mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  </p>
</div>

---

## 🚀 About The Project

**Anime Nation India** is a feature-rich, high-performance web application designed for anime fans, manga readers, and Otaku communities. Featuring a gorgeous "Deep Space Cinematic" dark UI (`#050716`) with glowing neon-pink (`#ff4dd2`) and gold (`#ffd54a`) accents, it combines extensive media tracking, real-time news aggregation, community discussion boards, and an advanced custom streaming player simulation interface.

The application leverages the **AniList GraphQL API** for modern listings and search data, alongside the **Jikan REST API** (MyAnimeList wrapper) for deep character details, staff voice-acting mappings, and franchise relationships.

🌐 **Live Domain:** [https://www.animenationindia.online](https://www.animenationindia.online)

---

## ✨ Core Features

### 🎥 1. Premium Interactive Watch Page & Custom Video Player
- **Neon-Pink Custom Player:** Fully custom HTML5 control bar overlay with Play/Pause, 10s Skip, hover-expanding Volume, Fullscreen, and Picture-in-Picture.
- **Advanced Player settings:** Autoplay Next Episode, Cinema Mode (dimming all page elements), Auto Skip Intro (from the 10s to 40s mark), and playback speed controller (0.5x to 2x).
- **Interactive Subtitles:** Simulated closed-captions synced dynamically to the video player timeline.
- **Licensing Dialogue Overlay:** Clean, glassmorphic notice explaining streaming licensing restrictions and encouraging official sources.
- **Range Pagination & Search:** Search and filter through long episode lists using custom duration indicators and paginated selectors (e.g., episodes 1-100).

### 📖 2. Browse Manga & Novels Tab
- **Full Library Interface:** Dedicated `/browse/manga` tab with filtering systems to discover Manga, Manhwa, Manhua, Light Novels, and Novels.
- **MAL Syncing:** Clickable external redirect portals linking directly to MyAnimeList profiles for expanded details.
- **Relations Slider:** Responsive horizontal lists allowing quick navigation across sequels, prequels, spin-offs, and shared franchise timelines.

### 🌟 3. Advanced User Watchlist & Reading List Tracking
- **Smart Labels:** Dynamically updates labels and action buttons to **Reading**, **Plan to Read**, or **Completed** for books, and **Watching**, **Plan to Watch**, or **Completed** for video categories.
- **Media Filtering:** Easily filter your watchlist cards into active categories: `All`, `Anime`, `Manga`, `Manhwa`, `Light Novel`, and `Novel`.
- **Status Persistence:** Integrated directly into the backend database API to preserve individual watchlist states.

### 📰 4. RSS News Aggregator Portal
- **Feed Parsing:** Automatically aggregates the latest anime news, reviews, spotlight segments, and announcements from feeds like **MyAnimeList** and **Anime Corner**.
- **Article Details:** Dedicated `/news/[slug]` routes that render clean paragraph block layouts, category badges, image extraction from CDATA content, and original source redirects.

### 👥 5. Community Forum Boards (ANI Community)
- Dedicated discussion channels with full sub-route navigation:
  - `/forums/general` - General Otaku chat.
  - `/forums/manga-novels` - Manga and light novel chapters, ratings, and reviews.
  - `/forums/recommendations` - Request and share show suggestions.
  - `/forums/trending` - Discussions around ongoing releases.

### 🔍 6. Real-Time Debounced Search
- Ultra-fast search filters on `/search` and `/browse/manga` with a `600ms` debounce handler, dynamically updating browser query strings to support deep linking.

### 🛡️ 7. Secure SMTP Mail System & Authentication
- Contact forms are routed via an Express **Nodemailer** transport configuration linked securely using Gmail App Credentials.
- Account settings (`/settings`) allow users to change passwords, manage preferences, customize 3D splash entrance screens, and edit profile avatars.

---

## 🛠️ Project Architecture

```text
animenationindia/
├── backend/            # Express.js Server
│   ├── .env            # Mongo & SMTP configuration
│   ├── package.json    # Backend dependencies (express, mongoose, nodemailer)
│   └── server.js       # Core API endpoints & feed parser
│
└── frontend/           # Next.js Application (App Router)
    ├── app/            # Pages & Routes
    │   ├── series/     # Anime Details
    │   ├── watch/      # Interactive Streaming Page
    │   ├── manga/      # Manga Details & redirection
    │   ├── sitemap.ts  # Dynamic SEO Sitemap
    │   └── robots.ts   # Crawling rules
    ├── components/     # Reusable UI Components
    ├── lib/            # API services & configurations
    └── tailwind.config # Tailwind CSS styles
```

---

## ⚙️ Getting Started

### 1. Setting Up the Backend
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_secret
   
   # SMTP Email Settings
   EMAIL_USER=your_gmail_address
   EMAIL_PASS=your_gmail_app_password
   EMAIL_TO=recipient_email_address
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```

### 2. Setting Up the Frontend
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 SEO & Indexing Rules
- **robots.txt:** Fully open to search engine crawling (`allow: /`), except for internal API paths (`/api/*`).
- **sitemap.xml:** Dynamically generated on request (`/sitemap.xml`) cached for 30 minutes, automatically pulling:
  - 45+ static routes.
  - Top 50 popular anime pages (`/series/[id]`).
  - Top 50 popular manga pages (`/manga/[id]`).
  - Top 50 news articles (`/news/[slug]`).
