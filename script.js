const ANILIST_ENDPOINT = "https://graphql.anilist.co";

// JIKAN GENRE IDS (Hardcoded to save API calls)
const jikanGenres = [
  { name: "Action", id: 1 }, { name: "Adventure", id: 2 }, { name: "Comedy", id: 4 },
  { name: "Drama", id: 8 }, { name: "Fantasy", id: 10 }, { name: "Romance", id: 22 },
  { name: "Sci-Fi", id: 24 }, { name: "Sports", id: 30 }, { name: "Supernatural", id: 37 },
  { name: "Thriller", id: 41 }, { name: "Slice of Life", id: 36 }, { name: "Mystery", id: 7 }
];

let calendarTodayData = [], calendarTomorrowData = [];

// DOM Elements
const navMenu = document.getElementById("navMenu"), menuToggle = document.getElementById("menuToggle");
const scrollTopBtn = document.getElementById("scrollTopBtn"), jumpTodayBtn = document.getElementById("jumpTodayBtn");
const searchInput = document.getElementById("searchInput"), searchBtn = document.getElementById("searchBtn");
const animeModal = document.getElementById("animeModal"), modalCloseBtn = document.getElementById("modalCloseBtn");

async function anilistQuery(query, variables){
  const res = await fetch(ANILIST_ENDPOINT, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({query,variables}) });
  return await res.json();
}

function isSafeAnimeMedia(m){
  if(!m || m.isAdult) return false;
  const genres = (m.genres || []).join(" ").toLowerCase();
  if(genres.includes("hentai") || genres.includes("ecchi")) return false;
  return true;
}

function mapMediaList(list){
  return (list || []).filter(isSafeAnimeMedia).map(m=>{
    const status = (m.status||"").toLowerCase().includes("finish") ? "Completed" : (m.status||"").toLowerCase().includes("not_yet") ? "Upcoming" : "Ongoing";
    return {
      id:m.id, title: m.title.english || m.title.romaji, genre: (m.genres||[]).join(", "),
      poster: m.coverImage.large, synopsis: m.description ? m.description.replace(/<[^>]*>/g,"") : "No summary available.",
      status, episodes: m.episodes || "?", rating: m.averageScore ? (m.averageScore/10).toFixed(1) : "N/A", scoreInt: m.averageScore || 0,
      duration: m.duration || 24, releaseDate: m.startDate?.year || "", season: m.season || "",
      studio: (m.studios?.nodes?.[0]?.name) || "Unknown", format: m.format || "TV"
    };
  });
}

function getSeason() {
  const month = new Date().getMonth();
  if (month >= 0 && month <= 2) return "WINTER"; if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER"; return "FALL";
}

/* MASTER FIX: SINGLE API CALL FOR HOME PAGE SECTIONS */
async function loadHomeDataSuperFast() {
  const year = new Date().getFullYear();
  const season = getSeason();
  
  const query = `
    query($season: MediaSeason, $year: Int) {
      trending: Page(page: 1, perPage: 15) { media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { id title{romaji english} coverImage{large} genres episodes averageScore status duration startDate{year} season format studios(isMain:true){nodes{name}} description(asHtml:false) } }
      popularSeason: Page(page: 1, perPage: 12) { media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) { id title{romaji english} coverImage{large} genres episodes averageScore status duration startDate{year} season format studios(isMain:true){nodes{name}} description(asHtml:false) } }
      upcoming: Page(page: 1, perPage: 15) { media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) { id title{romaji english} coverImage{large} genres episodes averageScore status duration startDate{year} season format studios(isMain:true){nodes{name}} description(asHtml:false) } }
      allTime: Page(page: 1, perPage: 12) { media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { id title{romaji english} coverImage{large} genres episodes averageScore status duration startDate{year} season format studios(isMain:true){nodes{name}} description(asHtml:false) } }
      top100: Page(page: 1, perPage: 10) { media(type: ANIME, sort: SCORE_DESC, isAdult: false) { id title{romaji english} coverImage{large} genres episodes averageScore status duration startDate{year} season format studios(isMain:true){nodes{name}} description(asHtml:false) } }
    }
  `;

  try {
    const res = await anilistQuery(query, { season, year });
    const data = res?.data;
    if(!data) return;

    if(document.getElementById("trendingCarousel")) document.getElementById("trendingCarousel").innerHTML = mapMediaList(data.trending.media).map(createPosterCard).join("");
    if(document.getElementById("upcomingCarousel")) document.getElementById("upcomingCarousel").innerHTML = mapMediaList(data.upcoming.media).map(createPosterCard).join("");
    if(document.getElementById("popularSeasonGrid")) document.getElementById("popularSeasonGrid").innerHTML = mapMediaList(data.popularSeason.media).map(createAnimeCard).join("");
    if(document.getElementById("allTimePopularGrid")) document.getElementById("allTimePopularGrid").innerHTML = mapMediaList(data.allTime.media).map(createAnimeCard).join("");
    if(document.getElementById("top100List")) document.getElementById("top100List").innerHTML = mapMediaList(data.top100.media).map((a, i) => createTopRowCard(a, i+1)).join("");

    if(data.trending.media.length > 0) setupSpotlight(mapMediaList(data.trending.media));

    // Render Jikan Categories
    if(document.getElementById("categoriesGrid")) {
      document.getElementById("categoriesGrid").innerHTML = jikanGenres.map(g=>`<div class="anime-card category-card" onclick="location.href='view-all.html?type=genre_jikan&id=${g.id}&name=${g.name}'"><div class="anime-card-body"><h3 class="anime-name">${g.name}</h3><span style="font-size:0.8rem; color:var(--text-muted);">Browse on MAL</span></div></div>`).join("");
    }
    document.getElementById("statAnimeCount").textContent = "38,000+";
  } catch (err) { console.error(err); }
}

async function loadCalendarFast(){
  const now = new Date();
  const startToday = new Date(now.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));
  startToday.setHours(0,0,0,0);
  const startSec = Math.floor(startToday.getTime()/1000);
  const endSec = startSec + (2 * 24 * 60 * 60);

  const query = `query($start:Int, $end:Int){ Page(page:1, perPage:50){ airingSchedules(airingAt_greater:$start, airingAt_lesser:$end, sort:TIME){ airingAt episode media{ id title{romaji english} coverImage{large} averageScore episodes duration format description(asHtml:false) genres startDate{year} studios(isMain:true){nodes{name}} } } } }`;
  const res = await anilistQuery(query, {start: startSec, end: endSec});
  const allScheds = res?.data?.Page?.airingSchedules || [];

  const safeScheds = allScheds.filter(i => isSafeAnimeMedia(i.media)).map(item => {
    const dateObj = new Date(item.airingAt * 1000);
    return {
      dateCode: dateObj.toDateString(),
      time: dateObj.toLocaleTimeString("en-IN",{hour:"2-digit", minute:"2-digit", hour12:false, timeZone:"Asia/Kolkata"}) + " IST",
      title: (item.media.title.english || item.media.title.romaji) + ` - Ep ${item.episode}`,
      poster: item.media.coverImage.large, genre: (item.media.genres||[]).join(", "),
      synopsis: item.media.description ? item.media.description.replace(/<[^>]*>/g,"") : "Upcoming schedule.",
      episodes: item.media.episodes || "?", rating: item.media.averageScore ? (item.media.averageScore/10).toFixed(1) : "8.0",
      duration: item.media.duration || 24, format: item.media.format || "TV", releaseDate: item.media.startDate?.year || "", studio: (item.media.studios?.nodes?.[0]?.name) || "Unknown"
    }
  });

  const todayStr = startToday.toDateString();
  const tmrwDate = new Date(startToday); tmrwDate.setDate(tmrwDate.getDate() + 1);
  const tmrwStr = tmrwDate.toDateString();

  calendarTodayData = safeScheds.filter(s => s.dateCode === todayStr);
  calendarTomorrowData = safeScheds.filter(s => s.dateCode === tmrwStr);

  const makeCard = (i) => {
    const safeObj = JSON.stringify(i).replace(/'/g, "\\'").replace(/"/g, "&quot;");
    return `<div class="schedule-card" onclick='openAnimeModalLocal(${safeObj})'><div class="schedule-time">${i.time}</div><div class="schedule-title">${i.title}</div></div>`;
  };
  document.getElementById("calendarDay").innerHTML = calendarTodayData.length ? calendarTodayData.map(makeCard).join("") : `<div class="schedule-card">No schedule for today.</div>`;
  document.getElementById("calendarTomorrow").innerHTML = calendarTomorrowData.length ? calendarTomorrowData.map(makeCard).join("") : `<div class="schedule-card">No schedule for tomorrow.</div>`;
  document.getElementById("statTodayShows").textContent = calendarTodayData.length;
}

/* UI CREATION FUNCTIONS */
function createAnimeCard(anime){
  const safeObj = JSON.stringify(anime).replace(/'/g, "\\'").replace(/"/g, "&quot;");
  const statusClass = anime.status === "Completed" ? "badge-completed" : anime.status === "Upcoming" ? "badge-upcoming" : "badge-ongoing";
  return `<article class="anime-card" onclick='openAnimeModalLocal(${safeObj})'>
    <img src="${anime.poster}" class="anime-card-img" loading="lazy">
    <div class="anime-card-body">
      <h3 class="anime-name">${anime.title}</h3>
      <div class="anime-meta-row"><span>${anime.genre.split(",")[0]||"Anime"}</span><span class="badge-status ${statusClass}">${anime.status}</span></div>
      <div class="anime-meta-row" style="margin-top:.2rem;"><span><i class="fas fa-star" style="color:#ffd54a;margin-right:.25rem;"></i>${anime.rating}/10</span><span>${anime.episodes} eps</span></div>
    </div></article>`;
}
function createPosterCard(anime){
  const safeObj = JSON.stringify(anime).replace(/'/g, "\\'").replace(/"/g, "&quot;");
  return `<div class="poster-card" onclick='openAnimeModalLocal(${safeObj})'>
    <img src="${anime.poster}" class="poster-img" loading="lazy">
    <div class="poster-meta"><div class="poster-title">${anime.title}</div><div class="poster-cat">${anime.genre.split(",")[0]||"Anime"}</div></div></div>`;
}
function createTopRowCard(anime, index) {
  const safeObj = JSON.stringify(anime).replace(/'/g, "\\'").replace(/"/g, "&quot;");
  const tagsHtml = anime.genre.split(",").slice(0,3).map(g => g.trim() ? `<span class="top-tag-pill">${g.trim()}</span>` : "").join("");
  return `<div class="top-row-card" onclick='openAnimeModalLocal(${safeObj})'>
      <div class="top-rank">#${index}</div>
      <img src="${anime.poster}" class="top-img" loading="lazy">
      <div class="top-info"><div class="top-title-row">${anime.title}</div><div class="top-tags-row">${tagsHtml}</div></div>
      <div class="top-stats"><div class="score"><i class="fas fa-smile"></i> ${anime.scoreInt || 80}%</div></div>
      <div class="top-format">${anime.format.replace("_"," ")}<br>${anime.episodes} eps</div>
      <div class="top-season">${anime.season ? anime.season.charAt(0) + anime.season.slice(1).toLowerCase() : ""} ${anime.releaseDate}</div>
    </div>`;
}

// Spotlight Slider
let spotlightTimer;
function setupSpotlight(pool) {
  let idx = 0;
  const render = () => {
    const a = pool[idx];
    document.getElementById("spotlightImg").src = a.poster;
    document.getElementById("spotlightTitle").textContent = a.title;
    document.getElementById("spotlightGenres").innerHTML = a.genre.split(",").slice(0,3).map(g=>`<span class="spotlight-pill">${g.trim()}</span>`).join("");
    document.getElementById("spotlightCard").onclick = () => openAnimeModalLocal(a);
  };
  render(); clearInterval(spotlightTimer);
  spotlightTimer = setInterval(() => { idx = (idx+1) % Math.min(pool.length, 5); render(); }, 6000);
}

// Global Modal System
function openAnimeModalLocal(anime){
  document.getElementById("modalPoster").src = anime.poster;
  document.getElementById("modalTitle").textContent = anime.title.replace(/ - Ep.*$/,"");
  document.getElementById("modalEpSub").textContent = anime.episodes || "?";
  document.getElementById("modalFormat").textContent = anime.format || "TV";
  document.getElementById("modalDurationBadge").textContent = (anime.duration || 24) + "m";
  document.getElementById("modalMeta").textContent = `${anime.studio||"Studio"} • ${anime.releaseDate||"Year N/A"}`;
  document.getElementById("modalSummary").textContent = anime.synopsis || "No description.";
  document.getElementById("modalTags").innerHTML = (anime.genre||"").split(",").map(g=> g.trim()?`<span>${g.trim()}</span>`:"").join("");
  animeModal.classList.add("open");
}
modalCloseBtn.onclick = () => animeModal.classList.remove("open");
animeModal.onclick = (e) => { if(e.target===animeModal) animeModal.classList.remove("open"); };
document.addEventListener("keydown", e => { if (e.key === "Escape") animeModal.classList.remove("open"); });

// Search & Nav
document.getElementById("searchBtn").onclick = (e) => { e.preventDefault(); const q = searchInput.value.trim(); if(q) location.href = `view-all.html?type=search&val=${q}`; };
searchInput.onkeydown = (e) => { if(e.key === "Enter") document.getElementById("searchBtn").click(); };
menuToggle.onclick = () => navMenu.classList.toggle("open");
document.getElementById("tabToday").onclick = () => { document.getElementById("tabToday").classList.add("active"); document.getElementById("tabTomorrow").classList.remove("active"); document.getElementById("calendarTodayWrap").style.display="block"; document.getElementById("calendarTomorrowWrap").style.display="none"; };
document.getElementById("tabTomorrow").onclick = () => { document.getElementById("tabTomorrow").classList.add("active"); document.getElementById("tabToday").classList.remove("active"); document.getElementById("calendarTomorrowWrap").style.display="block"; document.getElementById("calendarTodayWrap").style.display="none"; };
jumpTodayBtn.onclick = () => document.getElementById("airing").scrollIntoView({behavior:"smooth"});
window.addEventListener("scroll",() => { if(window.scrollY > 480) scrollTopBtn.classList.add("visible"); else scrollTopBtn.classList.remove("visible"); });
scrollTopBtn.onclick = () => window.scrollTo({top:0,behavior:"smooth"});

// 3-Click Ad Logic
const mainWatchBtn = document.getElementById("mainWatchBtn");
if(mainWatchBtn) {
  let clickCount = parseInt(localStorage.getItem("watchBtnClicks")) || 0;
  if(clickCount >= 2) mainWatchBtn.href = "https://animeyy.com/";
  else mainWatchBtn.href = "https://www.effectivegatecpm.com/nr48k2kn7k?key=9b16d89b068467ece9c425d8a6098f80";
  mainWatchBtn.addEventListener("click", () => {
    clickCount++;
    if(clickCount >= 3) { localStorage.setItem("watchBtnClicks", 0); setTimeout(() => mainWatchBtn.href = "https://www.effectivegatecpm.com/nr48k2kn7k?key=9b16d89b068467ece9c425d8a6098f80", 500); }
    else { localStorage.setItem("watchBtnClicks", clickCount); if(clickCount === 2) setTimeout(() => mainWatchBtn.href = "https://animeyy.com/", 500); }
  });
}

// Init
async function init(){
  document.getElementById("currentDate").textContent = new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric",timeZone:"Asia/Kolkata"});
  await Promise.all([loadHomeDataSuperFast(), loadCalendarFast()]);
}
document.addEventListener("DOMContentLoaded", init);
