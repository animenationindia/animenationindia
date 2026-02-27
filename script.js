const JIKAN_API_BASE = "https://api.jikan.moe/v4";
const ANILIST_API_URL = "https://graphql.anilist.co";

const jikanGenres = [
  { name: "Action", id: 1 }, { name: "Adventure", id: 2 }, { name: "Comedy", id: 4 },
  { name: "Drama", id: 8 }, { name: "Fantasy", id: 10 }, { name: "Romance", id: 22 },
  { name: "Sci-Fi", id: 24 }, { name: "Sports", id: 30 }, { name: "Supernatural", id: 37 },
  { name: "Thriller", id: 41 }, { name: "Slice of Life", id: 36 }, { name: "Mystery", id: 7 }
];

let spotlightTimer;
let currentSpotlightPool = [];
let spotlightIndex = 0;
const MAX_SPOTLIGHT = 6;

const delay = ms => new Promise(res => setTimeout(res, ms));

// ================= API FETCHERS =================
async function fetchJikan(endpoint) {
  try {
    const res = await fetch(`${JIKAN_API_BASE}${endpoint}`);
    if (!res.ok) throw new Error("API Limit");
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error(`Jikan Error (${endpoint}):`, error);
    return [];
  }
}

async function fetchAniList(query, variables = {}) {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error("AniList Error:", error);
    return {};
  }
}

// ================= GLOBAL ROUTING =================
function openDetailsPage(id, type) {
  window.location.href = `details.html?id=${id}&type=${type}`;
}

// 🔥 FIXED: Ebar direct tomar details page e jabe (Same Tab e) 🔥
function openAniListDetails(id) {
  window.location.href = `details.html?anilist_id=${id}&type=anime`;
}

function mapJikanData(list, type = "anime") {
  return list.filter(m => !m.genres?.some(g => g.name === "Hentai" || g.name === "Ecchi")).map(m => {
    let st = m.status === "Finished Airing" ? "Completed" : m.status === "Not yet aired" ? "Upcoming" : m.status || "Ongoing";
    return {
      id: m.mal_id, type: type, title: m.title_english || m.title, genre: (m.genres || []).map(g => g.name).join(", "),
      poster: m.images?.webp?.large_image_url || m.images?.jpg?.large_image_url || "", 
      synopsis: m.synopsis ? m.synopsis.replace(/<[^>]*>/g, "") : "No summary available.",
      status: st, episodes: m.episodes || "?", rating: m.score ? m.score.toFixed(1) : "N/A"
    };
  });
}

// ================= UI CREATORS =================
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

function createAniListItem(item, index) {
  const score = item.averageScore ? `${item.averageScore}%` : "N/A";
  const format = item.format === 'TV' ? 'TV Show' : item.format || 'Anime';
  const eps = item.episodes ? `${item.episodes} eps` : 'Ongoing';
  
  const colors = ['pill-green', 'pill-red', 'pill-blue', 'pill-yellow'];
  const genres = item.genres.slice(0, 3).map((g, i) => {
    let colorClass = colors[i % colors.length];
    if(g === 'Action') colorClass = 'pill-red';
    if(g === 'Adventure') colorClass = 'pill-green';
    if(g === 'Drama') colorClass = 'pill-blue';
    return `<span class="ani-genre-pill ${colorClass}">${g.toLowerCase()}</span>`;
  }).join("");
  
  // 🔥 Same here, dynamically using openAniListDetails 🔥
  return `<div class="anilist-list-item" onclick="openAniListDetails(${item.id})">
      <div class="ani-left">
        <div class="ani-rank ${index < 3 ? 'top-3' : ''}">#${index + 1}</div>
        <img src="${item.coverImage.large}" class="ani-poster" loading="lazy">
        <div class="ani-title-row">
          <div class="ani-title">${item.title.english || item.title.romaji}</div>
          <div class="ani-genres">${genres}</div>
        </div>
      </div>
      <div class="ani-right">
        <div class="ani-score"><i class="fas fa-smile" style="color:#3edfa4;"></i> ${score}</div>
        <div class="ani-type">
          <span style="color:#fff;">${format}</span>
          <span style="color:#8ba0b2">${eps}</span>
        </div>
      </div>
    </div>`;
}

function createAniListPoster(item) {
  return `<div class="poster-card" onclick="openAniListDetails(${item.id})">
    <img src="${item.coverImage.large}" class="poster-img" loading="lazy">
    <div class="poster-meta"><div class="poster-title">${item.title.english || item.title.romaji}</div><div class="poster-cat">${item.genres[0] || 'Anime'}</div></div></div>`;
}

/* ================= CAROUSEL ARROWS LOGIC ================= */
document.querySelectorAll('.row-nav').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetRowId = btn.getAttribute('data-target');
    const row = document.getElementById(targetRowId);
    if(row) {
      const scrollAmount = 300;
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
  document.getElementById("spotlightDesc").textContent = a.synopsis ? a.synopsis : "No summary available.";
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

/* ================= 7-DAY CALENDAR LOGIC ================= */
async function loadCalendarFast() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDate = new Date();
  let currentDayIndex = todayDate.getDay();

  let tabsHtml = "";
  for(let i = -1; i <= 5; i++) {
    let d = new Date();
    d.setDate(todayDate.getDate() + i);
    let dayName = i === -1 ? "Yesterday" : i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()];
    let activeClass = i === 0 ? "active" : "";
    let jikanDay = days[d.getDay()].toLowerCase(); 
    
    tabsHtml += `<button class="tab-btn ${activeClass}" onclick="fetchDaySchedule('${jikanDay}', this)">${dayName}</button>`;
  }
  if(document.getElementById("calendarTabs")) document.getElementById("calendarTabs").innerHTML = tabsHtml;

  fetchDaySchedule(days[currentDayIndex].toLowerCase(), document.querySelector('#calendarTabs .active'));
}

window.fetchDaySchedule = async function(dayString, btnElement) {
  if(!document.getElementById("calendarGrid")) return;

  document.querySelectorAll('#calendarTabs .tab-btn').forEach(b => b.classList.remove('active'));
  if(btnElement) btnElement.classList.add('active');
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = `<div style="padding:20px; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading schedule...</div>`;

  const scheduleData = await fetchJikan(`/schedules?filter=${dayString}`);
  const safeScheds = mapJikanData(scheduleData, "anime");

  if(safeScheds.length === 0) {
    grid.innerHTML = `<div class="schedule-card" style="grid-column: 1 / -1;">No schedule available.</div>`;
    return;
  }

  grid.innerHTML = safeScheds.slice(0, 16).map(i => {
    return `<div class="schedule-card" onclick="openDetailsPage(${i.id}, 'anime')"><div class="schedule-time" style="color:var(--accent); font-weight:600; font-size:0.8rem; margin-bottom:5px;">${i.status}</div><div class="schedule-title" style="font-weight:600; font-size:0.9rem;">${i.title}</div></div>`;
  }).join("");
}

/* ================= DATA LOADING (Jikan + AniList) ================= */
async function loadPageData() {
  try {
    const top10Query = `query { Page(page: 1, perPage: 10) { media(type: ANIME, sort: SCORE_DESC, isAdult: false) { id title { english romaji } coverImage { large } episodes format averageScore genres } } }`;
    const popularQuery = `query { Page(page: 1, perPage: 15) { media(type: ANIME, sort: POPULARITY_DESC, isAdult: false, format: TV) { id title { english romaji } coverImage { large } genres } } }`;

    const aniTopData = await fetchAniList(top10Query);
    const aniPopData = await fetchAniList(popularQuery);

    if (aniTopData.Page && document.getElementById("anilistTop10List")) {
      document.getElementById("anilistTop10List").innerHTML = aniTopData.Page.media.map((item, i) => createAniListItem(item, i)).join("");
    }
    if (aniPopData.Page && document.getElementById("homeDubbedRow")) {
      document.getElementById("homeDubbedRow").innerHTML = aniPopData.Page.media.map(item => createAniListPoster(item)).join("");
    }

    const [homeTrending, homeManga, homePopularData] = await Promise.all([
      fetchJikan("/seasons/now?limit=15"),
      fetchJikan("/top/manga?filter=bypopularity&limit=15"),
      fetchJikan("/top/anime?filter=bypopularity&limit=12")
    ]);
    await delay(1100);

    const mappedTrending = mapJikanData(homeTrending, "anime");
    if (document.getElementById("homeTrendingRow")) document.getElementById("homeTrendingRow").innerHTML = mappedTrending.map(createPosterCard).join("");
    if (document.getElementById("homeMangaRow")) document.getElementById("homeMangaRow").innerHTML = mapJikanData(homeManga, "manga").map(createPosterCard).join("");
    if (document.getElementById("popularSeasonGrid")) document.getElementById("popularSeasonGrid").innerHTML = mapJikanData(homePopularData, "anime").map(createAnimeCard).join("");

    if (mappedTrending.length > 0) {
      currentSpotlightPool = mappedTrending;
      renderSpotlightItem();
      startSpotlightTimer();
    }

    const [reviewsData, peopleData] = await Promise.all([
      fetchJikan("/reviews/anime?limit=8"),
      fetchJikan("/top/people?limit=15")
    ]);

    if (document.getElementById("reviewsGrid")) {
      document.getElementById("reviewsGrid").innerHTML = reviewsData.filter(r => r.entry).map(r => {
        const safeReviewText = (r.review || "No review text available.").slice(0, 150);
        const userName = r.user?.username || "MAL User";
        const imgUrl = r.entry.images?.webp?.large_image_url || r.entry.images?.jpg?.large_image_url || 'ani-logo.png';
        
        return `<article class="news-card" onclick="openDetailsPage(${r.entry.mal_id}, 'anime')">
          <div class="review-card-inner">
            <img src="${imgUrl}" class="review-img" loading="lazy">
            <div class="review-content">
              <div class="news-tag" style="margin-bottom:2px;">Score: ${r.score} • ${userName}</div>
              <h3 class="news-title" style="font-size: 0.95rem; margin-bottom:5px;">${r.entry.title}</h3>
              <p class="news-summary" style="font-size: 0.8rem; line-height: 1.4;">${safeReviewText}...</p>
            </div>
          </div>
        </article>`;
      }).join("");
    }

    if (document.getElementById("peopleRow")) {
      document.getElementById("peopleRow").innerHTML = peopleData.map(p => {
        const imgUrl = p.images?.jpg?.image_url || 'ani-logo.png';
        return `<div class="poster-card" onclick="window.open('https://myanimelist.net/people/${p.mal_id}', '_blank')"><img src="${imgUrl}" class="poster-img" style="border-radius:50%; width:150px; height:150px; margin:15px auto; display:block; object-fit:cover;" loading="lazy"><div class="poster-meta" style="text-align:center;"><div class="poster-title">${p.name}</div><div class="poster-cat">${p.favorites} Favorites</div></div></div>`;
      }).join("");
    }

    if (document.getElementById("categoriesGrid")) {
      document.getElementById("categoriesGrid").innerHTML = jikanGenres.map(g => `<div class="anime-card category-card" onclick="window.location.href='view-all.html?type=genre_jikan&id=${g.id}&name=${g.name}'"><div class="anime-card-body"><h3 class="anime-name">${g.name}</h3><span style="font-size:0.8rem; color:var(--text-muted);">Browse on MAL</span></div></div>`).join("");
    }
    
    if(document.getElementById("statAnimeCount")) document.getElementById("statAnimeCount").textContent = "38,000+";
    
    loadCalendarFast();

  } catch (err) {
    console.error("Critical loading error handled safely:", err);
    if(document.getElementById("statAnimeCount")) document.getElementById("statAnimeCount").textContent = "API Error";
  }
}

// ================= BASIC INTERACTIONS =================
const navMenu = document.getElementById("navMenu"), menuToggle = document.getElementById("menuToggle");
if(menuToggle) menuToggle.onclick = () => navMenu.classList.toggle("open");

const scrollTopBtn = document.getElementById("scrollTopBtn");
if(scrollTopBtn) {
  window.addEventListener("scroll", () => { if (window.scrollY > 480) scrollTopBtn.classList.add("visible"); else scrollTopBtn.classList.remove("visible"); });
  scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
}

const searchBtn = document.getElementById("searchBtn");
if(searchBtn) {
  searchBtn.onclick = (e) => { e.preventDefault(); const q = document.getElementById("searchInput").value.trim(); if (q) window.location.href = `view-all.html?type=search&val=${q}`; };
  document.getElementById("searchInput").onkeydown = (e) => { if (e.key === "Enter") searchBtn.click(); };
}

const btnRandom = document.getElementById("randomAnimeBtn");
if (btnRandom) {
  btnRandom.onclick = async () => {
    btnRandom.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Loading...`;
    const rand = await fetchJikan("/random/anime");
    if (rand && rand.length > 0) openDetailsPage(rand[0].mal_id, "anime");
    btnRandom.innerHTML = `<i class="fas fa-dice"></i> Random Anime`;
  };
}

const jumpTodayBtn = document.getElementById("jumpTodayBtn");
if (jumpTodayBtn) jumpTodayBtn.onclick = () => document.getElementById("airing").scrollIntoView({ behavior: "smooth" });

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

document.addEventListener("DOMContentLoaded", () => {
  if(document.getElementById("currentDate")) {
    document.getElementById("currentDate").textContent = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }
  loadPageData();
});
