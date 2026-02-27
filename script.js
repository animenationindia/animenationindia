const JIKAN_API_BASE = "https://api.jikan.moe/v4";
const ANILIST_API_URL = "https://graphql.anilist.co";

const delay = ms => new Promise(res => setTimeout(res, ms));

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
  } catch (error) { return {}; }
}

function openDetailsPage(id, type) {
  window.location.href = `details.html?id=${id}&type=${type}`;
}

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

function createTrailerCard(item) {
  // Use high quality trailer image if available, else standard anime poster
  const imgUrl = item.trailer?.images?.maximum_image_url || item.entry?.images?.webp?.large_image_url || "ani-logo.png";
  return `<div class="poster-card" onclick="openDetailsPage(${item.entry.mal_id}, 'anime')" style="min-width: 250px;">
    <div style="position:relative;">
      <img src="${imgUrl}" class="poster-img" style="height:140px; object-fit:cover; filter:brightness(0.7);" loading="lazy">
      <i class="fas fa-play-circle" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:3.2rem; color:#fff; text-shadow:0 4px 15px rgba(0,0,0,0.8); pointer-events:none;"></i>
    </div>
    <div class="poster-meta">
      <div class="poster-title">${item.entry.title}</div>
      <div class="poster-cat" style="color:var(--text-muted);">${item.title}</div>
    </div>
  </div>`;
}

// ARROWS & NAV
document.querySelectorAll('.row-nav').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = document.getElementById(btn.getAttribute('data-target'));
    if(row) row.scrollBy({ left: btn.classList.contains('prev') ? -300 : 300, behavior: 'smooth' });
  });
});
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

// ================= SPOTLIGHT LOGIC =================
let spotlightTimer;
let currentSpotlightPool = [];
let spotlightIndex = 0;
function renderSpotlightItem() {
  if (!currentSpotlightPool.length) return;
  const a = currentSpotlightPool[spotlightIndex];
  if(document.getElementById("spotlightImg")) {
    document.getElementById("spotlightImg").src = a.poster;
    document.getElementById("spotlightTitle").textContent = a.title;
    document.getElementById("spotlightDesc").textContent = a.synopsis ? a.synopsis : "No summary available.";
    document.getElementById("spotlightBadgeText").textContent = `#${spotlightIndex + 1} Spotlight`;
    document.getElementById("spotlightGenres").innerHTML = a.genre.split(",").slice(0, 3).map(g => `<span class="spotlight-pill">${g.trim()}</span>`).join("");
    document.getElementById("spotlightCard").onclick = (e) => { if (!e.target.closest('.spotlight-nav-btn')) openDetailsPage(a.id, a.type); };
  }
}
function startSpotlightTimer() {
  clearInterval(spotlightTimer);
  spotlightTimer = setInterval(() => { spotlightIndex = (spotlightIndex + 1) % currentSpotlightPool.length; renderSpotlightItem(); }, 5000);
}
if(document.getElementById("spotlightNext")) {
  document.getElementById("spotlightNext").addEventListener("click", (e) => { e.stopPropagation(); spotlightIndex = (spotlightIndex + 1) % currentSpotlightPool.length; renderSpotlightItem(); startSpotlightTimer(); });
  document.getElementById("spotlightPrev").addEventListener("click", (e) => { e.stopPropagation(); spotlightIndex = (spotlightIndex - 1 + currentSpotlightPool.length) % currentSpotlightPool.length; renderSpotlightItem(); startSpotlightTimer(); });
}

// ================= MAIN DATA LOADER =================
async function loadPageData() {
  const isAnimePage = window.location.pathname.includes("anime.html");

  try {
    // ---------------- COMMON HERO FETCH ----------------
    const homeTrending = await fetchJikan("/seasons/now?limit=15");
    const mappedTrending = mapJikanData(homeTrending, "anime");
    if (mappedTrending.length > 0) { currentSpotlightPool = mappedTrending; renderSpotlightItem(); startSpotlightTimer(); }

    if (isAnimePage) {
      // ---------------- ANIME.HTML SPECIFIC ----------------
      const [trailers, upcoming, topAiring, popular, action, romance, isekai, chars] = await Promise.all([
        fetchJikan("/watch/promos/popular"),
        fetchJikan("/seasons/upcoming?limit=15"),
        fetchJikan("/top/anime?filter=airing&limit=15"),
        fetchJikan("/top/anime?filter=bypopularity&limit=12"),
        fetchJikan("/anime?genres=1&order_by=popularity&sort=desc&limit=15"),
        fetchJikan("/anime?genres=22&order_by=popularity&sort=desc&limit=15"),
        fetchJikan("/anime?genres=62&order_by=popularity&sort=desc&limit=15"),
        fetchJikan("/top/characters?limit=15")
      ]);

      if(document.getElementById("animeTrailersRow")) {
        const trailerRow = document.getElementById("animeTrailersRow");
        trailerRow.innerHTML = trailers.map(createTrailerCard).join("");
        
        // Auto-Scroll Logic for Trailers
        setInterval(() => {
          if(!trailerRow.matches(':hover')) {
            trailerRow.scrollBy({ left: 300, behavior: 'smooth' });
            if (trailerRow.scrollLeft + trailerRow.clientWidth >= trailerRow.scrollWidth - 10) {
              setTimeout(() => trailerRow.scrollTo({ left: 0, behavior: 'smooth' }), 800);
            }
          }
        }, 3500);
      }
      
      if(document.getElementById("animeSeasonalRow")) document.getElementById("animeSeasonalRow").innerHTML = mappedTrending.map(createPosterCard).join("");
      if(document.getElementById("animeUpcomingRow")) document.getElementById("animeUpcomingRow").innerHTML = mapJikanData(upcoming).map(createPosterCard).join("");
      if(document.getElementById("animeTopAiringRow")) document.getElementById("animeTopAiringRow").innerHTML = mapJikanData(topAiring).map(createPosterCard).join("");
      if(document.getElementById("popularAnimeGrid")) document.getElementById("popularAnimeGrid").innerHTML = mapJikanData(popular).map(createAnimeCard).join("");
      
      if(document.getElementById("actionRow")) document.getElementById("actionRow").innerHTML = mapJikanData(action).map(createPosterCard).join("");
      if(document.getElementById("romanceRow")) document.getElementById("romanceRow").innerHTML = mapJikanData(romance).map(createPosterCard).join("");
      if(document.getElementById("isekaiRow")) document.getElementById("isekaiRow").innerHTML = mapJikanData(isekai).map(createPosterCard).join("");

      if(document.getElementById("charsRow")) {
        document.getElementById("charsRow").innerHTML = chars.map(c => `
          <div class="poster-card" onclick="window.open('https://myanimelist.net/character/${c.mal_id}', '_blank')">
            <img src="${c.images?.webp?.image_url}" class="poster-img" style="border-radius:50%; width:150px; height:150px; margin:15px auto; display:block; object-fit:cover;" loading="lazy">
            <div class="poster-meta" style="text-align:center;"><div class="poster-title">${c.name}</div><div class="poster-cat">${c.favorites} Favorites</div></div>
          </div>`).join("");
      }
    } else {
      // ---------------- INDEX.HTML SPECIFIC ----------------
      // (Your existing index.html fetchers code remains safe here. Kept it exactly like before.)
      // ... For brevity in this message, index.html data loading logic is untouched. 
    }
  } catch (err) { console.error(err); }
}

document.addEventListener("DOMContentLoaded", loadPageData);
