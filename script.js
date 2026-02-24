const ANILIST_ENDPOINT = "https://graphql.anilist.co";

let animeData = [];
let featuredAnime = [];
let popularAnime = [];
let newsAnime = [];
let calendarTodayData = [];
let calendarTomorrowData = [];
let estimatedWeek = [];
let categoriesList = [
  "Action","Adventure","Comedy","Drama","Fantasy","Music","Romance",
  "Sci-Fi","Seinen","Shojo","Shonen","Slice of Life","Sports","Supernatural","Thriller"
];

// new section data
let latestReleases = [];
let bestMovies = [];
let hindiDubbed = [];
let englishDubbed = [];
// newly added data
let upcomingAnime = [];
let allTimePopular = [];
let topRatedAnime = [];

// DOM Elements
const navMenu      = document.getElementById("navMenu");
const menuToggle   = document.getElementById("menuToggle");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const jumpTodayBtn = document.getElementById("jumpTodayBtn");
const searchInput  = document.getElementById("searchInput");
const searchBtn    = document.getElementById("searchBtn");

const featuredCarousel = document.getElementById("featuredCarousel");
const animeGrid    = document.getElementById("animeGrid");
const popularGrid  = document.getElementById("popularGrid");
const categoriesGrid = document.getElementById("categoriesGrid");
const calendarDay  = document.getElementById("calendarDay");
const calendarTomorrow = document.getElementById("calendarTomorrow");

const latestGrid   = document.getElementById("latestGrid");
const movieGrid    = document.getElementById("movieGrid");
const hindiGrid    = document.getElementById("hindiGrid");
const englishGrid  = document.getElementById("englishGrid");

// newly added DOM
const upcomingCarousel = document.getElementById("upcomingCarousel");
const allTimeGrid = document.getElementById("allTimeGrid");
const topRatedGrid = document.getElementById("topRatedGrid");

// pages
const mainHomeWrapper = document.getElementById("mainHomeWrapper");
const viewAllPage = document.getElementById("viewAllPage");
const viewAllTitle = document.getElementById("viewAllTitle");
const viewAllSub = document.getElementById("viewAllSub");
const viewAllGrid = document.getElementById("viewAllGrid");

const tabToday     = document.getElementById("tabToday");
const tabTomorrow  = document.getElementById("tabTomorrow");
const wrapToday    = document.getElementById("calendarTodayWrap");
const wrapTomorrow = document.getElementById("calendarTomorrowWrap");
const btnEstimated = document.getElementById("btnEstimated");
const estimatedWrap = document.getElementById("estimatedWrap");
const estimatedTabs = document.getElementById("estimatedTabs");
const estimatedList = document.getElementById("estimatedList");

const newsGrid = document.getElementById("newsGrid");

// spotlight DOM
const spotlightImg      = document.getElementById("spotlightImg");
const spotlightTitle    = document.getElementById("spotlightTitle");
const spotlightSub      = document.getElementById("spotlightSub");
const spotlightGenres   = document.getElementById("spotlightGenres");
const spotlightDuration = document.getElementById("spotlightDuration");
const spotlightScore    = document.getElementById("spotlightScore");
const spotlightEpisodes = document.getElementById("spotlightEpisodes");
const spotlightDesc     = document.getElementById("spotlightDesc");

// modal DOM
const animeModal       = document.getElementById("animeModal");
const modalCloseBtn    = document.getElementById("modalCloseBtn");
const modalPoster      = document.getElementById("modalPoster");
const modalTitle       = document.getElementById("modalTitle");
const modalMeta        = document.getElementById("modalMeta");
const modalSummary     = document.getElementById("modalSummary");
const modalTags        = document.getElementById("modalTags");
const modalAniListLink = document.getElementById("modalAniListLink");

// stats
const statAnimeCount = document.getElementById("statAnimeCount");
const statTodayShows = document.getElementById("statTodayShows");
const statNewsCount  = document.getElementById("statNewsCount");

/* ---------- AniList helper ---------- */
async function anilistQuery(query, variables){
  const res = await fetch(ANILIST_ENDPOINT,{
    method:"POST",
    headers:{"Content-Type":"application/json","Accept":"application/json"},
    body:JSON.stringify({query,variables})
  });
  const json = await res.json();
  return json;
}

// hentai / adult safety filter
function isSafeAnimeMedia(m){
  if(!m) return false;
  if(m.isAdult) return false;
  const genres = (m.genres || []).map(g => g.toLowerCase());
  const titleParts = [
    m.title?.romaji || "",
    m.title?.english || "",
    m.title?.native || ""
  ].join(" ").toLowerCase();
  if(genres.includes("hentai")) return false;
  if(genres.includes("ecchi")) return false;
  if(titleParts.includes("hentai")) return false;
  return true;
}

function mapMediaList(list, defaultSynopsis){
  return (list || []).filter(isSafeAnimeMedia).map(m=>{
    const title = m.title.english || m.title.romaji;
    const genres = (m.genres||[]).join(", ");
    const status = (m.status||"CURRENT").toLowerCase().includes("finish")
                   ? "Completed" : (m.status||"CURRENT").toLowerCase().includes("not_yet")
                   ? "Upcoming"  : "Ongoing";
    return {
      id:m.id,
      title,
      genre:genres,
      poster:m.coverImage.large,
      synopsis:m.description ? m.description.replace(/<[^>]*>/g,"") : defaultSynopsis,
      status,
      episodes:m.episodes || 0,
      rating:m.averageScore ? (m.averageScore/10).toFixed(1) : "8.0",
      duration:m.duration || 24,
      releaseDate:m.startDate?.year || "",
      studio:(m.studios?.nodes?.[0] && m.studios.nodes[0].name) || "Unknown",
      externalUrl:m.siteUrl || "",
      format: m.format || "TV" // Added Format for modal badge
    };
  });
}

/* ---------- AniList: load home API calls ---------- */
async function loadHomeBlocksFromAniList(){
  const baseQuery = `
    query($page:Int, $perPage:Int, $sort:[MediaSort], $format:MediaFormat, $status:MediaStatus, $seasonYear:Int, $search:String) {
      Page(page:$page, perPage:$perPage) {
        media(type:ANIME, sort:$sort, format:$format, status:$status, seasonYear:$seasonYear, search:$search, isAdult:false) {
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) format
        }
      }
    }
  `;

  const year = new Date().getFullYear();

  // 1. Trending Now
  const trendRes = await anilistQuery(baseQuery, {page:1, perPage:20, sort:["TRENDING_DESC"]});
  featuredAnime = mapMediaList(trendRes?.data?.Page?.media || [], "Trending anime.");
  animeData = featuredAnime; // fallback
  newsAnime = [...featuredAnime].reverse();

  // 2. Upcoming Next Season
  const upRes = await anilistQuery(baseQuery, {page:1, perPage:20, status:"NOT_YET_RELEASED", sort:["POPULARITY_DESC"]});
  upcomingAnime = mapMediaList(upRes?.data?.Page?.media || [], "Upcoming anime.");
  
  // 3. Latest Releases
  const lateRes = await anilistQuery(baseQuery, {page:1, perPage:16, status:"RELEASING", sort:["START_DATE_DESC", "POPULARITY_DESC"], seasonYear:year});
  latestReleases = mapMediaList(lateRes?.data?.Page?.media || [], "Recently airing anime.");

  // 4. All Time Popular
  const popRes = await anilistQuery(baseQuery, {page:1, perPage:16, sort:["POPULARITY_DESC"]});
  allTimePopular = mapMediaList(popRes?.data?.Page?.media || [], "All time popular anime.");
  popularAnime = allTimePopular.slice(0,6);

  // 5. Top 100 Anime (Rated)
  const topRes = await anilistQuery(baseQuery, {page:1, perPage:16, sort:["SCORE_DESC", "POPULARITY_DESC"]});
  topRatedAnime = mapMediaList(topRes?.data?.Page?.media || [], "Highest rated anime.");

  // 6. Movies
  const movRes = await anilistQuery(baseQuery, {page:1, perPage:16, format:"MOVIE", sort:["SCORE_DESC", "POPULARITY_DESC"]});
  bestMovies = mapMediaList(movRes?.data?.Page?.media || [], "Top rated anime movie.");

  // 7. Hindi
  const hinRes = await anilistQuery(baseQuery, {page:1, perPage:16, search:"Hindi", sort:["POPULARITY_DESC"]});
  hindiDubbed = mapMediaList(hinRes?.data?.Page?.media || [], "Hindi dubbed/related anime.");

  // 8. English
  const engRes = await anilistQuery(baseQuery, {page:1, perPage:16, search:"Dub", sort:["TRENDING_DESC"]});
  englishDubbed = mapMediaList(engRes?.data?.Page?.media || [], "English dubbed anime.");

  renderEverything();
  updateStats();
  updateSpotlightFromFirst();
  renderNewsFromAnime();
}

function renderEverything(){
  if(featuredCarousel) featuredCarousel.innerHTML = featuredAnime.map(createPosterCard).join("");
  if(upcomingCarousel) upcomingCarousel.innerHTML = upcomingAnime.map(createPosterCard).join("");
  
  if(latestGrid) latestGrid.innerHTML = latestReleases.length ? latestReleases.map(createAnimeCard).join("") : `<div style="grid-column:1/-1;">No data found.</div>`;
  if(allTimeGrid) allTimeGrid.innerHTML = allTimePopular.length ? allTimePopular.map(createAnimeCard).join("") : `<div style="grid-column:1/-1;">No data found.</div>`;
  if(topRatedGrid) topRatedGrid.innerHTML = topRatedAnime.length ? topRatedAnime.map(createAnimeCard).join("") : `<div style="grid-column:1/-1;">No data found.</div>`;
  if(movieGrid) movieGrid.innerHTML = bestMovies.length ? bestMovies.map(createAnimeCard).join("") : `<div style="grid-column:1/-1;">No data found.</div>`;
  if(hindiGrid) hindiGrid.innerHTML = hindiDubbed.length ? hindiDubbed.map(createAnimeCard).join("") : `<div style="grid-column:1/-1;">No data found.</div>`;
  if(englishGrid) englishGrid.innerHTML = englishDubbed.length ? englishDubbed.map(createAnimeCard).join("") : `<div style="grid-column:1/-1;">No data found.</div>`;
  
  if(animeGrid) animeGrid.innerHTML = animeData.map(createAnimeCard).join("");
  if(popularGrid) popularGrid.innerHTML = popularAnime.map(createAnimeCard).join("");
  
  renderCategories();
}

/* ---------- View All Feature Logic ---------- */
function closeViewAll() {
  viewAllPage.style.display = "none";
  mainHomeWrapper.style.display = "block";
  window.scrollTo({top: 0, behavior: "smooth"});
}

async function openViewAll(type, title, subTitle, extraVars = {}) {
  mainHomeWrapper.style.display = "none";
  viewAllPage.style.display = "block";
  window.scrollTo({top: 0, behavior: "smooth"});
  
  viewAllTitle.innerHTML = title;
  viewAllSub.innerHTML = subTitle;
  viewAllGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);font-size:1.2rem;">⏳ Fetching top anime from AniList...</div>`;

  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort], $format: MediaFormat, $status: MediaStatus, $search: String, $genre: String) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: $sort, format: $format, status: $status, search: $search, genre: $genre, isAdult: false) {
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) isAdult format
        }
      }
    }
  `;

  let variables = { page: 1, perPage: 40 };

  if (type === 'trending') variables.sort = ["TRENDING_DESC"];
  else if (type === 'upcoming') { variables.status = "NOT_YET_RELEASED"; variables.sort = ["POPULARITY_DESC"]; }
  else if (type === 'latest') { variables.status = "RELEASING"; variables.sort = ["START_DATE_DESC", "POPULARITY_DESC"]; }
  else if (type === 'allTimePopular') variables.sort = ["POPULARITY_DESC"];
  else if (type === 'topRated') variables.sort = ["SCORE_DESC", "POPULARITY_DESC"];
  else if (type === 'movies') { variables.format = "MOVIE"; variables.sort = ["SCORE_DESC", "POPULARITY_DESC"]; }
  else if (type === 'hindi') { variables.search = "Hindi"; variables.sort = ["POPULARITY_DESC"]; }
  else if (type === 'english') { variables.search = "Dub"; variables.sort = ["TRENDING_DESC"]; }
  else if (type === 'genre') { variables.genre = extraVars.genreName; variables.sort = ["POPULARITY_DESC"]; }
  else if (type === 'search') { variables.search = extraVars.queryText; variables.sort = ["POPULARITY_DESC"]; }

  try {
    const json = await anilistQuery(query, variables);
    const list = json?.data?.Page?.media || [];
    const mappedData = mapMediaList(list, "Fetched from AniList.");
    
    // push to an array so modal can find it
    animeData = animeData.concat(mappedData);

    viewAllGrid.innerHTML = mappedData.length ? mappedData.map(createAnimeCard).join("") : `<div style="grid-column:1/-1;text-align:center;">No results found.</div>`;
  } catch(e) {
    viewAllGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--danger);">❌ Error loading data. Please try again.</div>`;
  }
}

function renderCategories(){
  if(!categoriesList.length){
    categoriesGrid.innerHTML = "";
    return;
  }
  categoriesGrid.innerHTML = categoriesList.map(g=>`
    <div class="anime-card category-card" onclick="openViewAll('genre', '🏷️ Category: ${g}', 'Top trending anime in ${g}.', {genreName: '${g}'})">
      <div class="anime-card-body">
        <h3 class="anime-name">${g}</h3>
        <div class="anime-meta-row">
          <span style="color:var(--text-muted);font-size:.8rem;">Tap to view all.</span>
        </div>
      </div>
    </div>
  `).join("");
}

/* ---------- AniList: airing schedule ---------- */
async function loadCalendarFromAniList(){
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US",{timeZone:"Asia/Kolkata"}));

  const startTodayIST = new Date(istNow);
  startTodayIST.setHours(0,0,0,0);

  const startTomorrowIST = new Date(startTodayIST);
  startTomorrowIST.setDate(startTomorrowIST.getDate()+1);

  const startDayAfterTomorrowIST = new Date(startTomorrowIST);
  startDayAfterTomorrowIST.setDate(startDayAfterTomorrowIST.getDate()+1);

  const startToday = Math.floor(startTodayIST.getTime()/1000);
  const startTomorrow = Math.floor(startTomorrowIST.getTime()/1000);
  const startDayAfterTomorrow = Math.floor(startDayAfterTomorrowIST.getTime()/1000);

  const query = `
    query ($start:Int,$end:Int){
      Page(page:1,perPage:80){
        airingSchedules(airingAt_greater:$start,airingAt_lesser:$end){
          airingAt episode
          media{
            id title{romaji english native} coverImage{large} averageScore episodes duration siteUrl isAdult genres format
          }
        }
      }
    }
  `;

  async function fetchRange(start,end){
    const json = await anilistQuery(query,{start,end});
    const list = json?.data?.Page?.airingSchedules || [];
    return list
      .filter(item=>isSafeAnimeMedia(item.media))
      .map(item=>{
        const t = item.media.title.english || item.media.title.romaji;
        const airingAtMs = item.airingAt*1000;
        const timeIST = new Date(airingAtMs).toLocaleTimeString("en-IN",{
          hour:"2-digit", minute:"2-digit", hour12:false, timeZone:"Asia/Kolkata"
        });
        return {
          time:`${timeIST} IST`,
          title:`${t} – Ep ${item.episode}`,
          status:"Scheduled",
          mediaId:item.media.id,
          poster:item.media.coverImage.large,
          score:item.media.averageScore ? (item.media.averageScore/10).toFixed(1) : "8.0",
          episodes:item.media.episodes || 0,
          duration:item.media.duration || 24,
          externalUrl:item.media.siteUrl || "",
          episode:item.episode,
          format: item.media.format || "TV"
        };
      });
  }

  calendarTodayData = await fetchRange(startToday,startTomorrow);
  calendarTomorrowData = await fetchRange(startTomorrow,startDayAfterTomorrow);

  estimatedWeek = [];
  for(let d=0; d<7; d++){
    const dayStart = new Date(startTodayIST);
    dayStart.setDate(dayStart.getDate()+d);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate()+1);
    const s = Math.floor(dayStart.getTime()/1000);
    const e = Math.floor(dayEnd.getTime()/1000);
    const dayList = await fetchRange(s,e);
    estimatedWeek.push({date:dayStart,list:dayList});
  }

  renderCalendar();
  renderEstimated();
  updateStats();
}

function renderCalendar(){
  if(!calendarTodayData.length){
    calendarDay.innerHTML =
      `<div class="schedule-card">
         <div class="schedule-time">No schedule</div>
         <div class="schedule-title">No episodes found for today from AniList.</div>
       </div>`;
  }else{
    calendarDay.innerHTML = calendarTodayData.map(i=>`
      <div class="schedule-card" data-media-id="${i.mediaId}">
        <div class="schedule-time">${i.time}</div>
        <div class="schedule-title">${i.title}</div>
        <div class="schedule-label">${i.status}</div>
      </div>
    `).join("");
  }

  if(!calendarTomorrowData.length){
    calendarTomorrow.innerHTML =
      `<div class="schedule-card">
         <div class="schedule-time">No schedule</div>
         <div class="schedule-title">No episodes found for tomorrow from AniList.</div>
       </div>`;
  }else{
    calendarTomorrow.innerHTML = calendarTomorrowData.map(i=>`
      <div class="schedule-card" data-media-id="${i.mediaId}">
        <div class="schedule-time">${i.time}</div>
        <div class="schedule-title">${i.title}</div>
        <div class="schedule-label">${i.status}</div>
      </div>
    `).join("");
  }
}

function renderEstimated(){
  if(!estimatedWeek.length){
    estimatedWrap.classList.remove("active");
    return;
  }
  estimatedWrap.classList.add("active");
  estimatedTabs.innerHTML = estimatedWeek.map((day,idx)=>{
    const d = day.date;
    const weekday = d.toLocaleDateString("en-IN",{weekday:"short"});
    const label = d.toLocaleDateString("en-IN",{month:"short",day:"2-digit"});
    return `
      <button class="est-day-btn ${idx===0?"active":""}" data-day-index="${idx}">
        ${weekday}
        <span>${label}</span>
      </button>
    `;
  }).join("");
  renderEstimatedList(0);
}

function renderEstimatedList(index){
  const day = estimatedWeek[index];
  if(!day || !day.list.length){
    estimatedList.innerHTML = `<div style="padding:1rem 0;color:var(--text-muted);">No broadcast estimated for this day.</div>`;
    return;
  }
  estimatedList.innerHTML = day.list.map(item=>{
    const name  = item.title.replace(/ – Ep.*$/,"");
    const epNum = item.episode || "?";
    return `
      <div class="est-row" data-media-id="${item.mediaId}">
        <div class="est-time">${item.time.split(" ")[0]}</div>
        <div class="est-title">${name}</div>
        <div class="est-ep">Episode ${epNum}</div>
      </div>
    `;
  }).join("");
}

function renderNewsFromAnime(){
  if(!newsAnime.length) return;
  newsGrid.innerHTML = newsAnime.slice(0,9).map(a=>{
    const summary = (a.synopsis||"").slice(0,160)+"…";
    return `
      <article class="news-card" data-anime-id="${a.id}">
        <div class="news-tag">News • AniList</div>
        <h3 class="news-title">${a.title}</h3>
        <div class="news-meta">${a.genre}</div>
        <p class="news-summary">${summary}</p>
      </article>
    `;
  }).join("");
  statNewsCount.textContent = newsAnime.length;
}

/* ---------- Rendering helpers ---------- */
function createAnimeCard(anime){
  const statusClass =
    anime.status === "Completed" ? "badge-status badge-completed" :
    anime.status === "Upcoming"  ? "badge-status badge-upcoming"  :
                                   "badge-status badge-ongoing";

  // Use JSON.stringify and single quotes to pass the object safely to onclick
  const safeAnimeStr = JSON.stringify(anime).replace(/'/g, "\\'").replace(/"/g, "&quot;");

  return `
    <article class="anime-card" onclick='openAnimeModalByObject(${safeAnimeStr})'>
      <img src="${anime.poster}" alt="${anime.title}" class="anime-card-img" loading="lazy">
      <div class="anime-card-body">
        <h3 class="anime-name">${anime.title}</h3>
        <div class="anime-meta-row">
          <span>${anime.genre ? anime.genre.split(",")[0] : ""}</span>
          <span class="${statusClass}">${anime.status}</span>
        </div>
        <div class="anime-meta-row" style="margin-top:.2rem;">
          <span><i class="fas fa-star" style="color:#ffd54a;margin-right:.25rem;"></i>${anime.rating}/10</span>
          <span>${anime.episodes || 0} eps</span>
        </div>
      </div>
    </article>
  `;
}

function createPosterCard(anime){
  const safeAnimeStr = JSON.stringify(anime).replace(/'/g, "\\'").replace(/"/g, "&quot;");
  return `
    <div class="poster-card" onclick='openAnimeModalByObject(${safeAnimeStr})'>
      <img src="${anime.poster}" alt="${anime.title}" class="poster-img" loading="lazy">
      <div class="poster-meta">
        <div class="poster-title">${anime.title}</div>
        <div class="poster-cat">${anime.genre}</div>
      </div>
    </div>
  `;
}

/* ---------- Spotlight slider ---------- */
let spotlightIndex = 0;
let spotlightTimer = null;

function setSpotlightFromAnime(anime) {
  if (!anime) return;
  spotlightImg.src = anime.poster;
  spotlightImg.alt = anime.title;
  spotlightTitle.textContent = anime.title;
  spotlightSub.textContent = `${anime.studio || "Unknown studio"} • ${anime.releaseDate || ""}`;
  spotlightDuration.textContent = `${anime.duration || 24}m`;
  spotlightScore.textContent = anime.rating;
  spotlightEpisodes.textContent = anime.episodes || 0;
  spotlightDesc.textContent = (anime.synopsis || "").slice(0, 180) + "...";
  spotlightGenres.innerHTML = "";
  (anime.genre || "").split(",").slice(0, 3).forEach(g => {
    if (g.trim()) {
      const span = document.createElement("span");
      span.className = "spotlight-pill";
      span.textContent = g.trim();
      spotlightGenres.appendChild(span);
    }
  });
  
  // click opens modal
  document.getElementById("spotlightCard").onclick = () => openAnimeModalByObject(anime);
}

function updateSpotlightFromFirst() {
  const pool = featuredAnime.length ? featuredAnime : animeData;
  if (!pool.length) return;
  spotlightIndex = 0;
  setSpotlightFromAnime(pool[spotlightIndex]);
  startSpotlightAutoRotate();
}

function startSpotlightAutoRotate() {
  if (spotlightTimer) clearInterval(spotlightTimer);
  spotlightTimer = setInterval(() => {
    const pool = featuredAnime.length ? featuredAnime : animeData;
    if (!pool.length) return;
    spotlightIndex = (spotlightIndex + 1) % Math.min(pool.length, 5);
    setSpotlightFromAnime(pool[spotlightIndex]);
  }, 6000);
}

/* ---------- Stats + date ---------- */
function updateStats(){
  statAnimeCount.textContent = "38,000+";
  statTodayShows.textContent = calendarTodayData.length;
}

function updateCurrentDate(){
  const now = new Date();
  const opt = { weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata" };
  document.getElementById("currentDate").textContent = now.toLocaleDateString("en-IN",opt);
}

/* ---------- Modal helpers ---------- */
function openAnimeModalByObject(anime){
  if (!anime) return;
  modalPoster.src = anime.poster;
  modalPoster.alt = anime.title;
  modalTitle.textContent = anime.title;
  
  document.getElementById("modalEpSub").textContent = anime.episodes || "?";
  document.getElementById("modalEpDub").textContent = anime.episodes || "?"; 
  document.getElementById("modalFormat").textContent = anime.format || "TV";
  document.getElementById("modalDurationBadge").textContent = (anime.duration || 24) + "m";
  
  modalMeta.textContent = `${anime.studio || "Unknown studio"} • ${anime.releaseDate || "Year N/A"}`;
  modalSummary.textContent = anime.synopsis || "No summary available.";
  modalTags.innerHTML = "";
  (anime.genre || "").split(",").forEach(g => {
    if (g.trim()){
      const span = document.createElement("span");
      span.textContent = g.trim();
      modalTags.appendChild(span);
    }
  });

  animeModal.classList.add("open");
}

function openAnimeModal(animeId){
  const allPools = [animeData, featuredAnime, popularAnime, latestReleases, bestMovies, hindiDubbed, englishDubbed, upcomingAnime, allTimePopular, topRatedAnime];
  let anime = null;
  for(const pool of allPools){
    anime = pool.find(a=>String(a.id)===String(animeId));
    if(anime) break;
  }
  openAnimeModalByObject(anime);
}

function closeAnimeModal(){
  animeModal.classList.remove("open");
}

modalCloseBtn.addEventListener("click", closeAnimeModal);
animeModal.addEventListener("click", e => { if (e.target === animeModal) closeAnimeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAnimeModal(); });

function setupAnimeCardClick(){
  document.addEventListener("click", e => {
    const card = e.target.closest(".news-card");
    if (card && card.dataset.animeId){
      openAnimeModal(card.dataset.animeId);
      return;
    }
    const estRow = e.target.closest(".est-row");
    if(estRow && estRow.dataset.mediaId){
      const mediaId = estRow.dataset.mediaId;
      const fromSchedule = [...calendarTodayData,...calendarTomorrowData,...estimatedWeek.flatMap(d=>d.list)].find(i=>String(i.mediaId)===String(mediaId));
      if(fromSchedule) openAnimeModalByObject({id:fromSchedule.mediaId, title:fromSchedule.title.replace(/ – Ep.*$/,""), genre:"", poster:fromSchedule.poster, synopsis:`Upcoming episode schedule.`, status:"Ongoing", episodes:fromSchedule.episodes, rating:fromSchedule.score, duration:fromSchedule.duration, format: fromSchedule.format || "TV"});
      return;
    }
    const schedCard = e.target.closest(".schedule-card");
    if(schedCard && schedCard.dataset.mediaId){
      const mediaId = schedCard.dataset.mediaId;
      const fromSchedule = [...calendarTodayData,...calendarTomorrowData].find(i=>String(i.mediaId)===String(mediaId));
      if(fromSchedule) openAnimeModalByObject({id:fromSchedule.mediaId, title:fromSchedule.title.replace(/ – Ep.*$/,""), genre:"", poster:fromSchedule.poster, synopsis:`Upcoming episode schedule.`, status:"Ongoing", episodes:fromSchedule.episodes, rating:fromSchedule.score, duration:fromSchedule.duration, format: fromSchedule.format || "TV"});
    }
  });
}

function setupSearch(){
  function triggerSearch(){
    const q = searchInput.value.trim();
    if(q) openViewAll('search', `🔍 Search: "${q}"`, 'Search results from AniList.', {queryText: q});
  }
  searchInput.addEventListener("keydown",e=>{
    if(e.key === "Enter"){ e.preventDefault(); triggerSearch(); }
  });
  searchBtn.addEventListener("click",e=>{ e.preventDefault(); triggerSearch(); });
}

function setupNav(){
  menuToggle.addEventListener("click",()=>navMenu.classList.toggle("open"));
  navMenu.addEventListener("click",e=>{
    const link = e.target.closest(".nav-link");
    if(!link) return;
    document.querySelectorAll(".nav-link").forEach(l=>l.classList.remove("active"));
    link.classList.add("active");
    navMenu.classList.remove("open");
  });
  jumpTodayBtn.addEventListener("click",() => document.getElementById("airing").scrollIntoView({behavior:"smooth",block:"start"}));
}

function setupScrollTop(){
  window.addEventListener("scroll",()=>{
    if(window.scrollY > 480) scrollTopBtn.classList.add("visible");
    else scrollTopBtn.classList.remove("visible");
  });
  scrollTopBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
}

function setupTabs(){
  tabToday.addEventListener("click",()=>{
    tabToday.classList.add("active"); tabTomorrow.classList.remove("active");
    wrapToday.style.display = "block"; wrapTomorrow.style.display = "none";
  });
  tabTomorrow.addEventListener("click",()=>{
    tabTomorrow.classList.add("active"); tabToday.classList.remove("active");
    wrapTomorrow.style.display = "block"; wrapToday.style.display = "none";
  });
  btnEstimated.addEventListener("click",()=>estimatedWrap.scrollIntoView({behavior:"smooth",block:"start"}));
  estimatedTabs.addEventListener("click",e=>{
    const btn = e.target.closest(".est-day-btn");
    if(!btn) return;
    document.querySelectorAll(".est-day-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    renderEstimatedList(Number(btn.dataset.dayIndex||0));
  });
}

/* ---------- Init ---------- */
async function init(){
  updateCurrentDate();
  setupNav();
  setupSearch();
  setupScrollTop();
  setupTabs();
  setupAnimeCardClick();

  try {
    await Promise.all([
      loadHomeBlocksFromAniList(),
      loadCalendarFromAniList()
    ]);
  } catch (e) {
    console.error("AniList API calls failed", e);
  }

  setInterval(loadCalendarFromAniList,15*60*1000);
}

document.addEventListener("DOMContentLoaded",init);

/* ---------- 3-Click Ad & Redirection Logic (100% New Tab) ---------- */
const mainWatchBtn = document.getElementById("mainWatchBtn");

if (mainWatchBtn) {
  const adLink = "https://www.effectivegatecpm.com/nr48k2kn7k?key=9b16d89b068467ece9c425d8a6098f80";
  const targetWebsite = "https://animeyy.com/"; // <-- Tomar asol link ekhane debe

  let clickCount = parseInt(localStorage.getItem("watchBtnClicks")) || 0;

  if (clickCount >= 2) mainWatchBtn.href = targetWebsite;
  else mainWatchBtn.href = adLink;

  mainWatchBtn.addEventListener("click", function() {
    clickCount++;
    if (clickCount >= 3) {
      localStorage.setItem("watchBtnClicks", 0);
      clickCount = 0;
      setTimeout(() => { mainWatchBtn.href = adLink; }, 500);
    } else {
      localStorage.setItem("watchBtnClicks", clickCount);
      if (clickCount === 2) {
        setTimeout(() => { mainWatchBtn.href = targetWebsite; }, 500);
      }
    }
  });
}
