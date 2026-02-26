const JIKAN_API_BASE = "https://api.jikan.moe/v4";

const jikanGenres = [
  { name: "Action", id: 1 }, { name: "Adventure", id: 2 }, { name: "Comedy", id: 4 },
  { name: "Drama", id: 8 }, { name: "Fantasy", id: 10 }, { name: "Romance", id: 22 },
  { name: "Sci-Fi", id: 24 }, { name: "Sports", id: 30 }, { name: "Supernatural", id: 37 },
  { name: "Thriller", id: 41 }, { name: "Slice of Life", id: 36 }, { name: "Mystery", id: 7 }
];

let calendarTodayData = [], calendarTomorrowData = [];
let spotlightTimer;
let currentSpotlightPool = [];
let spotlightIndex = 0;
const MAX_SPOTLIGHT = 6;

// Helper to delay (avoids Jikan rate limit 3 req/sec)
const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchJikan(endpoint) {
  try {
    const res = await fetch(`${JIKAN_API_BASE}${endpoint}`);
    if (!res.ok) throw new Error("API Limit or Error");
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return [];
  }
}

// Global Nav to Premium Details Page
function openDetailsPage(id, type) {
  window.open(`details.html?id=${id}&type=${type}`, '_blank');
}

function mapJikanData(list, type = "anime") {
  return list.filter(m => !m.genres?.some(g => g.name === "Hentai" || g.name === "Ecchi" || g.name === "Boys Love")).map(m => {
    let st = m.status === "Finished Airing" ? "Completed" : m.status === "Not yet aired" ? "Upcoming" : m.status || "Ongoing";
    return {
      id: m.mal_id, type: type, title: m.title_english || m.title, genre: (m.genres || []).map(g => g.name).join(", "),
      poster: m.images.webp.large_image_url, synopsis: m.synopsis ? m.synopsis.replace(/<[^>]*>/g, "") : "No summary available.",
      status: st, episodes: m.episodes || m.chapters || "?", rating: m.score ? m.score.toFixed(1) : "N/A", scoreInt: m.score ? Math.round(m.score * 10) : 80,
      duration: m.duration ? m.duration.replace(" per ep", "") : "24 min", releaseDate: m.year || m.published?.prop?.from?.split("-")[0] || "",
      season: m.season || "", studio: m.studios?.[0]?.name || "Unknown", format: m.type || (type === "manga" ? "Manga" : "TV")
    };
  });
}

/* ================= TABS LOGIC ================= */
document.querySelectorAll('.main-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons and panes
    document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    
    // Add active class to clicked button and target pane
    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
  });
});

/* ================= CAROUSEL ARROWS LOGIC ================= */
document.querySelectorAll('.row-nav').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetRowId = btn.getAttribute('data-target');
    const row = document.getElementById(targetRowId);
    if(row) {
      const scrollAmount = 300; // Scroll by 300px
      if(btn.classList.contains('prev')) {
        row.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  });
});

// ----------------- SPOTLIGHT LOGIC -----------------
function renderSpotlightItem() {
  if (!currentSpotlightPool || !currentSpotlightPool.length) return;
  const a = currentSpotlightPool[spotlightIndex];
  
  document.getElementById("spotlightImg").src = a.poster;
  document.getElementById("spotlightTitle").textContent = a.title;
  document.getElementById("spotlightBadgeText").textContent = `#${spotlightIndex + 1} Spotlight`;
  document.getElementById("spotlightGenres").innerHTML = a.genre.split(",").slice(0, 3).map(g => `<span class="spotlight-pill">${g.trim()}</span>`).join("");
  
  document.getElementById("spotlightCard").onclick = (e) => {
    if (e.target.closest('.spotlight-nav-btn')) return; 
    openDetailsPage(a.id, a.type);
  };
}

function startSpotlightTimer() {
  clearInterval(spotlightTimer);
  spotlightTimer = setInterval(() => {
    spotlightIndex = (spotlightIndex + 1) % Math.min(currentSpotlightPool.length, MAX_SPOTLIGHT);
    renderSpotlightItem();
  }, 5000);
}

const btnNext = document.getElementById("spotlightNext");
if(btnNext) {
  btnNext.addEventListener("click", (e) => {
    e.stopPropagation(); 
    if (!currentSpotlightPool.length) return;
    spotlightIndex = (spotlightIndex + 1) % Math.min(currentSpotlightPool.length, MAX_SPOTLIGHT);
    renderSpotlightItem();
    startSpotlightTimer(); 
  });
}
const btnPrev = document.getElementById("spotlightPrev");
if(btnPrev) {
  btnPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentSpotlightPool.length) return;
    const limit = Math.min(currentSpotlightPool.length, MAX_SPOTLIGHT);
    spotlightIndex = (spotlightIndex - 1 + limit) % limit;
    renderSpotlightItem();
    startSpotlightTimer(); 
  });
}
function setupSpotlight(pool) {
  currentSpotlightPool = pool;
  spotlightIndex = 0;
  renderSpotlightItem();
  startSpotlightTimer();
}

/* ================= API FETCHING & RENDERING ================= */
async function loadAllHomeData() {
  // Batch 1 (Home Tab)
  const homeTrending = await fetchJikan("/seasons/now?limit=15");
  await delay(400); 
  const homeManga = await fetchJikan("/top/manga?limit=15");
  await delay(400);
  const homePopular = await fetchJikan("/top/anime?filter=bypopularity&limit=12");
  await delay(400);

  // Batch 2 (Anime Tab)
  const animeUpcoming = await fetchJikan("/seasons/upcoming?limit=15");
  await delay(400);
  const animeMovies = await fetchJikan("/top/anime?type=movie&limit=15");
  await delay(400);
  const charsData = await fetchJikan("/top/characters?limit=15");
  await delay(400);

  // Batch 3 (Manga Tab)
  const manhwaData = await fetchJikan("/top/manga?type=manhwa&limit=15");
  await delay(400);
  const manhuaData = await fetchJikan("/top/manga?type=manhua&limit=15");
  await delay(400);
  const reviewsData = await fetchJikan("/reviews/anime?limit=9");

  // -------- RENDER HOME TAB --------
  const mappedTrending = mapJikanData(homeTrending, "anime");
  if (document.getElementById("homeTrendingRow")) document.getElementById("homeTrendingRow").innerHTML = mappedTrending.map(createPosterCard).join("");
  if (mappedTrending.length > 0) setupSpotlight(mappedTrending);
  
  const mappedManga = mapJikanData(homeManga, "manga");
  if (document.getElementById("homeMangaRow")) document.getElementById("homeMangaRow").innerHTML = mappedManga.map(createPosterCard).join("");
  if (document.getElementById("popularSeasonGrid")) document.getElementById("popularSeasonGrid").innerHTML = mapJikanData(homePopular, "anime").map(createAnimeCard).join("");

  // -------- RENDER ANIME TAB --------
  if (document.getElementById("animeUpcomingRow")) document.getElementById("animeUpcomingRow").innerHTML = mapJikanData(animeUpcoming, "anime").map(createPosterCard).join("");
  if (document.getElementById("animeMoviesRow")) document.getElementById("animeMoviesRow").innerHTML = mapJikanData(animeMovies, "anime").map(createPosterCard).join("");
  if (document.getElementById("topCharactersRow")) {
    document.getElementById("topCharactersRow").innerHTML = charsData.map(c => {
      return `<div class="poster-card" onclick="window.open('https://myanimelist.net/character/${c.mal_id}', '_blank')"><img src="${c.images.webp.image_url}" class="poster-img" style="border-radius:50%; width:150px; height:150px; margin:15px auto; display:block; object-fit:cover;" loading="lazy"><div class="poster-meta" style="text-align:center;"><div class="poster-title">${c.name}</div><div class="poster-cat">${c.favorites} Favorites</div></div></div>`;
    }).join("");
  }

  // -------- RENDER MANGA TAB --------
  if (document.getElementById("mangaManhwaRow")) document.getElementById("mangaManhwaRow").innerHTML = mapJikanData(manhwaData, "manga").map(createPosterCard).join("");
  if (document.getElementById("mangaManhuaRow")) document.getElementById("mangaManhuaRow").innerHTML = mapJikanData(manhuaData, "manga").map(createPosterCard).join("");

  // -------- RENDER REVIEWS --------
  if (document.getElementById("reviewsGrid")) {
    document.getElementById("reviewsGrid").innerHTML = reviewsData.filter(r => r.entry).map(r => {
      return `<article class="news-card" onclick="openDetailsPage(${r.entry.mal_id}, 'anime')"><div class="news-tag">Review • ${r.user.username}</div><h3 class="news-title">${r.entry.title}</h3><div class="news-meta">Score Given: ${r.score}</div><p class="news-summary">${r.review.slice(0, 160)}...</p></article>`;
    }).join("");
  }

  // -------- RENDER GENRES --------
  if (document.getElementById("categoriesGrid")) {
    document.getElementById("categoriesGrid").innerHTML = jikanGenres.map(g => `<div class="anime-card category-card" onclick="window.open('view-all.html?type=genre_jikan&id=${g.id}&name=${g.name}', '_blank')"><div class="anime-card-body"><h3 class="anime-name">${g.name}</h3><span style="font-size:0.8rem; color:var(--text-muted);">Browse on MAL</span></div></div>`).join("");
  }
  document.getElementById("statAnimeCount").textContent = "38,000+";
}

async function loadCalendarFast() {
  const scheduleData = await fetchJikan("/schedules");
  const now = new Date();
  const safeScheds = mapJikanData(scheduleData, "anime");

  calendarTodayData = safeScheds.slice(0, 10);
  calendarTomorrowData = safeScheds.slice(10, 20);

  const makeCard = (i) => {
    return `<div class="schedule-card" onclick="openDetailsPage(${i.id}, 'anime')"><div class="schedule-time">${i.status}</div><div class="schedule-title">${i.title}</div></div>`;
  };
  document.getElementById("calendarDay").innerHTML = calendarTodayData.length ? calendarTodayData.map(makeCard).join("") : `<div class="schedule-card">No schedule.</div>`;
  document.getElementById("calendarTomorrow").innerHTML = calendarTomorrowData.length ? calendarTomorrowData.map(makeCard).join("") : `<div class="schedule-card">No schedule.</div>`;
  document.getElementById("statTodayShows").textContent = calendarTodayData.length;
}

/* UI CREATION FUNCTIONS */
function createAnimeCard(item) {
  const statusClass = item.status === "Completed" ? "badge-completed" : item.status === "Upcoming" ? "badge-upcoming" : "badge-ongoing";
  return `<article class="anime-card" onclick="openDetailsPage(${item.id}, '${item.type}')">
    <img src="${item.poster}" class="anime-card-img" loading="lazy">
    <div class="anime-card-body">
      <h3 class="anime-name">${item.title}</h3>
      <div class="anime-meta-row"><span>${item.genre.split(",")[0] || item.type}</span><span class="badge-status ${statusClass}">${item.status}</span></div>
      <div class="anime-meta-row" style="margin-top:.2rem;"><span><i class="fas fa-star" style="color:#ffd54a;margin-right:.25rem;"></i>${item.rating}/10</span><span>${item.episodes} eps</span></div>
    </div></article>`;
}
function createPosterCard(item) {
  return `<div class="poster-card" onclick="openDetailsPage(${item.id}, '${item.type}')">
    <img src="${item.poster}" class="poster-img" loading="lazy">
    <div class="poster-meta"><div class="poster-title">${item.title}</div><div class="poster-cat">${item.genre.split(",")[0] || item.type}</div></div></div>`;
}

// Search & Random Button
document.getElementById("searchBtn").onclick = (e) => { e.preventDefault(); const q = searchInput.value.trim(); if (q) window.open(`view-all.html?type=search&val=${q}`, '_blank'); };
searchInput.onkeydown = (e) => { if (e.key === "Enter") document.getElementById("searchBtn").click(); };
const btnRandom = document.getElementById("randomAnimeBtn");
if (btnRandom) {
  btnRandom.onclick = async () => {
    btnRandom.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;
    const rand = await fetchJikan("/random/anime");
    if (rand && rand.length > 0) openDetailsPage(rand[0].mal_id, "anime");
    btnRandom.innerHTML = `<i class="fas fa-dice"></i> Random Anime`;
  };
}

// Basic interactions
const navMenu = document.getElementById("navMenu"), menuToggle = document.getElementById("menuToggle");
const scrollTopBtn = document.getElementById("scrollTopBtn"), jumpTodayBtn = document.getElementById("jumpTodayBtn");
menuToggle.onclick = () => navMenu.classList.toggle("open");
document.getElementById("tabToday").onclick = () => { document.getElementById("tabToday").classList.add("active"); document.getElementById("tabTomorrow").classList.remove("active"); document.getElementById("calendarTodayWrap").style.display = "block"; document.getElementById("calendarTomorrowWrap").style.display = "none"; };
document.getElementById("tabTomorrow").onclick = () => { document.getElementById("tabTomorrow").classList.add("active"); document.getElementById("tabToday").classList.remove("active"); document.getElementById("calendarTomorrowWrap").style.display = "block"; document.getElementById("calendarTodayWrap").style.display = "none"; };
jumpTodayBtn.onclick = () => document.getElementById("airing").scrollIntoView({ behavior: "smooth" });
window.addEventListener("scroll", () => { if (window.scrollY > 480) scrollTopBtn.classList.add("visible"); else scrollTopBtn.classList.remove("visible"); });
scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

// 3-Click Ad Logic
const mainWatchBtn = document.getElementById("mainWatchBtn");
if (mainWatchBtn) {
  let clickCount = parseInt(localStorage.getItem("watchBtnClicks")) || 0;
  if (clickCount >= 2) mainWatchBtn.href = "https://animeyy.com/";
  else mainWatchBtn.href = "https://www.effectivegatecpm.com/nr48k2kn7k?key=9b16d89b068467ece9c425d8a6098f80";
  mainWatchBtn.addEventListener("click", () => {
    clickCount++;
    if (clickCount >= 3) { localStorage.setItem("watchBtnClicks", 0); setTimeout(() => mainWatchBtn.href = "https://www.effectivegatecpm.com/nr48k2kn7k?key=9b16d89b068467ece9c425d8a6098f80", 500); }
    else { localStorage.setItem("watchBtnClicks", clickCount); if (clickCount === 2) setTimeout(() => mainWatchBtn.href = "https://animeyy.com/", 500); }
  });
}

// Init
async function init() {
  document.getElementById("currentDate").textContent = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata" });
  await loadAllHomeData();
  await delay(400); // Respect Jikan Rate limit
  await loadCalendarFast();
}
document.addEventListener("DOMContentLoaded", init);
