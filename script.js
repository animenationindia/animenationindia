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

const navMenu      = document.getElementById("navMenu");
const menuToggle   = document.getElementById("menuToggle");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const jumpTodayBtn = document.getElementById("jumpTodayBtn");

const searchInput  = document.getElementById("searchInput");
const searchBtn    = document.getElementById("searchBtn");
const featuredCarousel = document.getElementById("featuredCarousel");
const animeGrid    = document.getElementById("animeGrid");
const popularGrid  = document.getElementById("popularGrid");
const categoriesGrid = document.getElementById("categoriesGrid");
const calendarDay  = document.getElementById("calendarDay");
const calendarTomorrow = document.getElementById("calendarTomorrow");

const latestGrid   = document.getElementById("latestGrid");
const movieGrid    = document.getElementById("movieGrid");
const hindiGrid    = document.getElementById("hindiGrid");
const englishGrid  = document.getElementById("englishGrid");

const tabToday     = document.getElementById("tabToday");
const tabTomorrow  = document.getElementById("tabTomorrow");
const wrapToday    = document.getElementById("calendarTodayWrap");
const wrapTomorrow = document.getElementById("calendarTomorrowWrap");
const btnEstimated = document.getElementById("btnEstimated");
const estimatedWrap = document.getElementById("estimatedWrap");
const estimatedTabs = document.getElementById("estimatedTabs");
const estimatedList = document.getElementById("estimatedList");

const newsGrid = document.getElementById("newsGrid");

// spotlight DOM
const spotlightImg      = document.getElementById("spotlightImg");
const spotlightTitle    = document.getElementById("spotlightTitle");
const spotlightSub      = document.getElementById("spotlightSub");
const spotlightGenres   = document.getElementById("spotlightGenres");
const spotlightDuration = document.getElementById("spotlightDuration");
const spotlightScore    = document.getElementById("spotlightScore");
const spotlightEpisodes = document.getElementById("spotlightEpisodes");
const spotlightDesc     = document.getElementById("spotlightDesc");

// modal DOM
const animeModal       = document.getElementById("animeModal");
const modalCloseBtn    = document.getElementById("modalCloseBtn");
const modalPoster      = document.getElementById("modalPoster");
const modalTitle       = document.getElementById("modalTitle");
const modalMeta        = document.getElementById("modalMeta");
const modalSummary     = document.getElementById("modalSummary");
const modalTags        = document.getElementById("modalTags");
const modalAniListLink = document.getElementById("modalAniListLink");

// stats
const statAnimeCount = document.getElementById("statAnimeCount");
const statTodayShows = document.getElementById("statTodayShows");
const statNewsCount  = document.getElementById("statNewsCount");

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
                   ? "Upcoming"  : "Ongoing";
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

/* ---------- AniList: trending list for base page ---------- */
async function loadTrendingFromAniList(){
  const query = `
    query ($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        media(type:ANIME,sort:TRENDING_DESC,isAdult:false){
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) isAdult format
        }
      }
    }
  `;
  const variables = {page:1,perPage:60};
  const json = await anilistQuery(query,variables);
  const list = json?.data?.Page?.media || [];

  animeData = mapMediaList(list,"Trending anime from AniList.");
  featuredAnime = animeData.slice(0,8);
  popularAnime  = animeData.slice(0,6);
  newsAnime     = animeData.slice().reverse();

  const allGenres = new Set(categoriesList);
  animeData.forEach(m=>{
    m.genre.split(",").forEach(g=>{ if(g.trim()) allGenres.add(g.trim()); });
  });
  categoriesList = Array.from(allGenres).sort();

  renderEverything();
  updateStats();
  updateSpotlightFromFirst();
  renderNewsFromAnime();
}

/* ---------- AniList: home auto sections ---------- */
async function loadHomeBlocksFromAniList(){
  const latestQuery = `
    query($page:Int,$perPage:Int,$seasonYear:Int){
      Page(page:$page,perPage:$perPage){
        media(type:ANIME,status_in:[RELEASING],sort:[START_DATE_DESC,POPULARITY_DESC],seasonYear:$seasonYear,isAdult:false){
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) isAdult format
        }
      }
    }
  `;
  const year = new Date().getFullYear();
  const latestJson = await anilistQuery(latestQuery,{page:1,perPage:16,seasonYear:year});
  latestReleases = mapMediaList(latestJson?.data?.Page?.media || [],"Recently airing anime.");

  const movieQuery = `
    query($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        media(type:ANIME,format:MOVIE,sort:[SCORE_DESC,POPULARITY_DESC],isAdult:false){
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) isAdult format
        }
      }
    }
  `;
  const movieJson = await anilistQuery(movieQuery,{page:1,perPage:12});
  bestMovies = mapMediaList(movieJson?.data?.Page?.media || [],"Top rated anime movie.");

  const hindiQuery = `
    query($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        media(type:ANIME,sort:POPULARITY_DESC,isAdult:false,search:"Hindi"){
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) isAdult format
        }
      }
    }
  `;
  const hindiJson = await anilistQuery(hindiQuery,{page:1,perPage:16});
  hindiDubbed = mapMediaList(hindiJson?.data?.Page?.media || [],"Anime related to Hindi / Indian region on AniList.");

  const engQuery = `
    query($page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        media(type:ANIME,sort:TRENDING_DESC,isAdult:false,search:"Dub"){
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) isAdult format
        }
      }
    }
  `;
  const engJson = await anilistQuery(engQuery,{page:1,perPage:16});
  englishDubbed = mapMediaList(engJson?.data?.Page?.media || [],"Trending series with dub keyword on AniList.");

  renderHomeBlocks();
}

function renderHomeBlocks(){
  if(latestGrid){
    latestGrid.innerHTML = latestReleases.length
      ? latestReleases.map(createAnimeCard).join("")
      : `<div style="grid-column:1/-1;font-size:.86rem;color:var(--text-muted);">No latest releases found right now.</div>`;
  }
  if(movieGrid){
    movieGrid.innerHTML = bestMovies.length
      ? bestMovies.map(createAnimeCard).join("")
      : `<div style="grid-column:1/-1;font-size:.86rem;color:var(--text-muted);">No movies found.</div>`;
  }
  if(hindiGrid){
    hindiGrid.innerHTML = hindiDubbed.length
      ? hindiDubbed.map(createAnimeCard).join("")
      : `<div style="grid-column:1/-1;font-size:.86rem;color:var(--text-muted);">Hindi‑related titles not detected on AniList search.</div>`;
  }
  if(englishGrid){
    englishGrid.innerHTML = englishDubbed.length
      ? englishDubbed.map(createAnimeCard).join("")
      : `<div style="grid-column:1/-1;font-size:.86rem;color:var(--text-muted);">Dub‑tagged trending titles not found for now.</div>`;
  }
}

/* ---------- AniList: airing schedule (today/tomorrow + 7‑day estimated) ---------- */
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

/* ---------- Search with AniList API ---------- */
async function searchAnimeOnAniList(queryText){
  if(!queryText) return;
  const query = `
    query ($search:String,$page:Int,$perPage:Int){
      Page(page:$page,perPage:$perPage){
        media(search:$search,type:ANIME,sort:POPULARITY_DESC,isAdult:false){
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) isAdult format
        }
      }
    }
  `;
  const variables = {search:queryText,page:1,perPage:40};
  const json = await anilistQuery(query,variables);
  const list = json?.data?.Page?.media || [];

  if(!list.length){
    animeGrid.innerHTML =
      `<div style="grid-column:1/-1;padding:1.8rem;border-radius:20px;background:rgba(0,0,0,.5);text-align:center;">
         <p style="color:#fff;font-weight:600;">No results found.</p>
         <p style="color:#9fa0c4;font-size:.86rem;margin-top:.3rem;">Try another title or genre keyword.</p>
       </div>`;
    return;
  }

  animeData = mapMediaList(list,"Search result from AniList.");
  featuredAnime = animeData.slice(0,8);
  popularAnime  = animeData.slice(0,6);
  newsAnime     = animeData.slice().reverse();

  renderEverything();
  updateStats();
  updateSpotlightFromFirst();
  renderNewsFromAnime();
}

/* ---------- Rendering helpers ---------- */
function createAnimeCard(anime){
  const statusClass =
    anime.status === "Completed" ? "badge-status badge-completed" :
    anime.status === "Upcoming"  ? "badge-status badge-upcoming"  :
                                   "badge-status badge-ongoing";

  return `
    <article class="anime-card" data-anime-id="${anime.id}">
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
  return `
    <div class="poster-card" data-anime-id="${anime.id}">
      <img src="${anime.poster}" alt="${anime.title}" class="poster-img" loading="lazy">
      <div class="poster-meta">
        <div class="poster-title">${anime.title}</div>
        <div class="poster-cat">${anime.genre}</div>
      </div>
    </div>
  `;
}

function renderFeaturedCarousel(){
  featuredCarousel.innerHTML = featuredAnime.map(createPosterCard).join("");
}

function renderGrid(){
  animeGrid.innerHTML = animeData.map(createAnimeCard).join("");
}

function renderPopular(){
  popularGrid.innerHTML = popularAnime.map(createAnimeCard).join("");
}

function renderCategories(){
  if(!categoriesList.length){
    categoriesGrid.innerHTML = "";
    return;
  }
  categoriesGrid.innerHTML = categoriesList.map(g=>`
    <div class="anime-card category-card" data-category="${g}">
      <div class="anime-card-body">
        <h3 class="anime-name">${g}</h3>
        <div class="anime-meta-row">
          <span style="color:var(--text-muted);font-size:.8rem;">
            Tap to view top "${g}" anime.
          </span>
        </div>
      </div>
    </div>
  `).join("");
}

function renderCalendar(){
  if(!calendarTodayData.length){
    calendarDay.innerHTML =
      `<div class="schedule-card">
         <div class="schedule-time">No schedule</div>
         <div class="schedule-title">No episodes found for today from AniList.</div>
         <div class="schedule-label">Try again later.</div>
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
         <div class="schedule-label">Please check again later.</div>
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
    estimatedList.innerHTML =
      `<div style="padding:1rem 0;font-size:.86rem;color:var(--text-muted);">
         No broadcast estimated for this day from AniList.
       </div>`;
    return;
  }

  estimatedList.innerHTML = day.list.map(item=>{
    const name  = item.title.replace(/ – Ep.*$/,"");
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
  if(!newsAnime.length){
    newsGrid.innerHTML =
      `<div style="grid-column:1/-1;padding:1.2rem;border-radius:18px;background:rgba(0,0,0,.45);font-size:.86rem;color:var(--text-muted);">
         Live news feed could not be loaded. Try again later.
       </div>`;
    return;
  }
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

function renderEverything(){
  renderFeaturedCarousel();
  renderGrid();
  renderPopular();
  renderCategories();
  renderHomeBlocks();
}

/* ---------- Spotlight slider (top 5 featured) ---------- */
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

document.getElementById("spotlightCard").addEventListener("click", () => {
  const pool = featuredAnime.length ? featuredAnime : animeData;
  if (!pool.length) return;
  spotlightIndex = (spotlightIndex + 1) % Math.min(pool.length, 5);
  setSpotlightFromAnime(pool[spotlightIndex]);
  startSpotlightAutoRotate();
});

/* ---------- Stats + date ---------- */
function updateStats(){
  statAnimeCount.textContent = animeData.length.toLocaleString();
  statTodayShows.textContent = calendarTodayData.length;
  if(!newsAnime.length){
    statNewsCount.textContent = "0";
  }
}

function updateCurrentDate(){
  const now = new Date();
  const opt = {
    weekday:"long",year:"numeric",month:"long",day:"numeric",
    hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"
  };
  document.getElementById("currentDate").textContent =
    now.toLocaleDateString("en-IN",opt);
}

/* ---------- Modal helpers ---------- */
function openAnimeModalByObject(anime){
  if (!anime) return;
  modalPoster.src = anime.poster;
  modalPoster.alt = anime.title;
  modalTitle.textContent = anime.title;
  
  // New Badges setup
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
  
  // Updated Link 
  modalAniListLink.href = "https://animeyy.com/";

  animeModal.classList.add("open");
}

function openAnimeModal(animeId){
  const allPools = [
    animeData,
    featuredAnime,
    popularAnime,
    latestReleases,
    bestMovies,
    hindiDubbed,
    englishDubbed
  ];
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
animeModal.addEventListener("click", e => {
  if (e.target === animeModal) closeAnimeModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeAnimeModal();
});

function setupAnimeCardClick(){
  document.addEventListener("click", e => {
    const card = e.target.closest(".anime-card, .poster-card, .news-card");
    if (card && card.dataset.animeId){
      openAnimeModal(card.dataset.animeId);
      return;
    }
    const estRow = e.target.closest(".est-row");
    if(estRow && estRow.dataset.mediaId){
      const mediaId = estRow.dataset.mediaId;
      const fromSchedule = [...calendarTodayData,...calendarTomorrowData,...estimatedWeek.flatMap(d=>d.list)]
        .find(i=>String(i.mediaId)===String(mediaId));
      if(fromSchedule){
        const mapped = {
          id:fromSchedule.mediaId,
          title:fromSchedule.title.replace(/ – Ep.*$/,""),
          genre:"",
          poster:fromSchedule.poster,
          synopsis:`Upcoming episode from AniList schedule. ${fromSchedule.title}`,
          status:"Ongoing",
          episodes:fromSchedule.episodes,
          rating:fromSchedule.score,
          duration:fromSchedule.duration,
          releaseDate:"",
          studio:"",
          externalUrl:fromSchedule.externalUrl,
          format: fromSchedule.format || "TV"
        };
        openAnimeModalByObject(mapped);
      }
      return;
    }
    const schedCard = e.target.closest(".schedule-card");
    if(schedCard && schedCard.dataset.mediaId){
      const mediaId = schedCard.dataset.mediaId;
      const fromSchedule = [...calendarTodayData,...calendarTomorrowData]
        .find(i=>String(i.mediaId)===String(mediaId));
      if(fromSchedule){
        const mapped = {
          id:fromSchedule.mediaId,
          title:fromSchedule.title.replace(/ – Ep.*$/,""),
          genre:"",
          poster:fromSchedule.poster,
          synopsis:`Upcoming episode from AniList schedule. ${fromSchedule.title}`,
          status:"Ongoing",
          episodes:fromSchedule.episodes,
          rating:fromSchedule.score,
          duration:fromSchedule.duration,
          releaseDate:"",
          studio:"",
          externalUrl:fromSchedule.externalUrl,
          format: fromSchedule.format || "TV"
        };
        openAnimeModalByObject(mapped);
      }
    }
  });
}

/* ---------- Filters & interactions ---------- */
function setupFilterChips(){
  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach(chip=>{
    chip.addEventListener("click",()=>{
      chips.forEach(c=>c.classList.remove("active"));
      chip.classList.add("active");
      const val = chip.dataset.filter;
      let filtered = animeData;
      if(val === "airing"){
        filtered = animeData.filter(a=>a.status === "Ongoing");
      }else if(val === "upcoming"){
        filtered = animeData.filter(a=>a.status === "Upcoming");
      }else if(val === "completed"){
        filtered = animeData.filter(a=>a.status === "Completed");
      }
      animeGrid.innerHTML = filtered.map(createAnimeCard).join("");
    });
  });
}

// Dynamic Genre Fetching from AniList API
async function fetchAnimeByGenre(genre) {
  const gridSection = document.getElementById("animeGrid");
  const sectionHead = gridSection.previousElementSibling;
  const sectionTitleWrapper = sectionHead.querySelector("div");
  
  if (!gridSection.dataset.originalTitleHtml) {
    gridSection.dataset.originalTitleHtml = sectionTitleWrapper.innerHTML;
  }
  
  sectionTitleWrapper.innerHTML = `<h2 class="section-title">⏳ Loading top <strong>${genre}</strong> anime...</h2><p class="section-sub">Fetching directly from AniList...</p>`;
  sectionHead.scrollIntoView({behavior: "smooth", block: "start"});

  const query = `
    query ($genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(genre: $genre, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          id title{romaji english native} coverImage{large} genres episodes averageScore status duration startDate{year} studios(isMain:true){nodes{name}} siteUrl description(asHtml:false) isAdult format
        }
      }
    }
  `;
  
  const variables = { genre: genre, page: 1, perPage: 24 };
  
  try {
    const json = await anilistQuery(query, variables);
    const list = json?.data?.Page?.media || [];
    const mappedData = mapMediaList(list, `Top ${genre} anime.`);

    sectionTitleWrapper.innerHTML = `<h2 class="section-title">🏷️ Category: ${genre} <button id="clearGenreBtn" style="margin-left:12px; padding: 4px 12px; border-radius: 20px; background: var(--danger); color: white; border: none; cursor: pointer; font-size: 0.75rem; font-weight: 600; vertical-align: middle;"><i class="fas fa-times"></i> Clear Filter</button></h2><p class="section-sub">Top trending anime in this genre.</p>`;
    
    gridSection.innerHTML = mappedData.length ? mappedData.map(createAnimeCard).join("") : `<div style="grid-column:1/-1;font-size:.86rem;color:var(--text-muted);">No anime found for this genre.</div>`;

    document.getElementById("clearGenreBtn").addEventListener("click", () => {
      sectionTitleWrapper.innerHTML = gridSection.dataset.originalTitleHtml;
      renderGrid(); 
    });
  } catch(e) {
    sectionTitleWrapper.innerHTML = `<h2 class="section-title">❌ Error loading ${genre}.</h2><p class="section-sub">Please try again later.</p>`;
  }
}

function setupCategoryClick(){
  document.addEventListener("click", e => {
    const catCard = e.target.closest(".category-card");
    if(!catCard) return;
    const cat = catCard.dataset.category;
    fetchAnimeByGenre(cat);
  });
}

function setupSearch(){
  function triggerSearch(){
    const q = searchInput.value.trim();
    if(q) searchAnimeOnAniList(q);
  }
  searchInput.addEventListener("keydown",e=>{
    if(e.key === "Enter"){
      e.preventDefault();
      triggerSearch();
    }
  });
  searchBtn.addEventListener("click",e=>{
    e.preventDefault();
    triggerSearch();
  });
}

function setupNav(){
  menuToggle.addEventListener("click",()=>{
    navMenu.classList.toggle("open");
  });

  navMenu.addEventListener("click",e=>{
    const link = e.target.closest(".nav-link");
    if(!link) return;
    e.preventDefault();
    document.querySelectorAll(".nav-link").forEach(l=>l.classList.remove("active"));
    link.classList.add("active");
    const href = link.getAttribute("href");
    if(href && href.startsWith("#")){
      const target = document.querySelector(href);
      if(target){
        const top = target.offsetTop - 80;
        window.scrollTo({top,behavior:"smooth"});
      }
    }
    navMenu.classList.remove("open");
  });

  jumpTodayBtn.addEventListener("click",()=>{
    const target = document.getElementById("airing");
    if(target){
      const top = target.offsetTop - 80;
      window.scrollTo({top,behavior:"smooth"});
    }
  });
}

function setupScrollTop(){
  window.addEventListener("scroll",()=>{
    if(window.scrollY > 480){
      scrollTopBtn.classList.add("visible");
    }else{
      scrollTopBtn.classList.remove("visible");
    }
  });
  scrollTopBtn.addEventListener("click",()=>{
    window.scrollTo({top:0,behavior:"smooth"});
  });
}

function setupTabs(){
  tabToday.addEventListener("click",()=>{
    tabToday.classList.add("active");
    tabTomorrow.classList.remove("active");
    wrapToday.style.display = "block";
    wrapTomorrow.style.display = "none";
  });
  tabTomorrow.addEventListener("click",()=>{
    tabTomorrow.classList.add("active");
    tabToday.classList.remove("active");
    wrapTomorrow.style.display = "block";
    wrapToday.style.display = "none";
  });

  btnEstimated.addEventListener("click",()=>{
    estimatedWrap.scrollIntoView({behavior:"smooth",block:"start"});
  });

  estimatedTabs.addEventListener("click",e=>{
    const btn = e.target.closest(".est-day-btn");
    if(!btn) return;
    document.querySelectorAll(".est-day-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const idx = Number(btn.dataset.dayIndex||0);
    renderEstimatedList(idx);
  });
}

/* ---------- Init ---------- */
async function init(){
  updateCurrentDate();
  setupNav();
  setupFilterChips();
  setupCategoryClick();
  setupSearch();
  setupScrollTop();
  setupTabs();
  setupAnimeCardClick();

  // Faster Loading with Promise.all
  try {
    await Promise.all([
      loadTrendingFromAniList(),
      loadHomeBlocksFromAniList(),
      loadCalendarFromAniList()
    ]);
  } catch (e) {
    console.error("AniList API calls failed during initialization", e);
  }

  setInterval(loadCalendarFromAniList,15*60*1000);
}

document.addEventListener("DOMContentLoaded",init);
/* ---------- 3-Click Ad & Redirection Logic (100% New Tab) ---------- */
const mainWatchBtn = document.getElementById("mainWatchBtn");

if (mainWatchBtn) {
  const adLink = "https://www.effectivegatecpm.com/nr48k2kn7k?key=9b16d89b068467ece9c425d8a6098f80";
  const targetWebsite = "https://animeyy.com/"; // <-- Tomar asol link ekhane debe

  // Page load howar somoy aager click count check kora
  let clickCount = parseInt(localStorage.getItem("watchBtnClicks")) || 0;

  // Jodi aage theke 2 bar click hoye thake, tahole button er link ta aage thekei asol website er kora thakbe
  if (clickCount >= 2) {
    mainWatchBtn.href = targetWebsite;
  } else {
    mainWatchBtn.href = adLink;
  }

  mainWatchBtn.addEventListener("click", function() {
    // Ekhane e.preventDefault() use kora holo NA. Tai browser normally new tab e khulbe.
    
    clickCount++;

    if (clickCount >= 3) {
      // 3rd click er por count 0 kore dewa holo jate porer bar abar Ad theke suru hoy
      localStorage.setItem("watchBtnClicks", 0);
      clickCount = 0;
      
      // Click hoye jabar half second por pichon theke link ta abar Ad er link set kore dewa holo
      setTimeout(() => {
        mainWatchBtn.href = adLink;
      }, 500);
      
    } else {
      // 1st ba 2nd click count save holo
      localStorage.setItem("watchBtnClicks", clickCount);
      
      // Jodi 2 bar click kora hoye jay, tahole 3rd click er jonno button er link ta asol website er kore dewa holo
      if (clickCount === 2) {
        setTimeout(() => {
          mainWatchBtn.href = targetWebsite;
        }, 500);
      }
    }
  });
}
