import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LatestTrailersSection from '../components/LatestTrailersSection';
import { API_URL } from '../api/config';

const Home = () => {
  const navigate = useNavigate();
  const dubbedRef = useRef(null);
  const trendingRef = useRef(null);
  const seasonalRef = useRef(null);
  
  // Data States
  const [heroAnime, setHeroAnime] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [seasonalAnime, setSeasonalAnime] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [topTv, setTopTv] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [popularDubbed, setPopularDubbed] = useState([]);
  
  // Awards State
  const [awardContenders, setAwardContenders] = useState([]);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Magic Function to Remove Duplicates
  const removeDuplicates = (animeArray) => {
    if (!animeArray || !Array.isArray(animeArray)) return [];
    return Array.from(new Map(animeArray.map(item => [item.mal_id || (item.entry && item.entry.mal_id), item])).values());
  };

  // BULLETPROOF FETCHER FOR JIKAN
  const fetchJikan = async (cacheKey, url) => {
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheKey + '_time');
    const now = new Date().getTime();

    if (cachedData && cacheTime && now - parseInt(cacheTime) < 6 * 60 * 60 * 1000) {
      return removeDuplicates(JSON.parse(cachedData));
    }

    let retries = 3;
    while (retries > 0) {
      try {
        const res = await fetch(url);
        if (res.status === 429) {
          await delay(2000);
          retries--;
          continue;
        }
        if (res.ok) {
          const data = await res.json();
          if (data && data.data) {
            localStorage.setItem(cacheKey, JSON.stringify(data.data));
            localStorage.setItem(cacheKey + '_time', now.toString());
            return removeDuplicates(data.data);
          }
        }
        return [];
      } catch (error) {
        retries--;
        await delay(2000);
      }
    }
    return []; 
  };

  // Load All Data Sequentially
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const heroData = await fetchJikan('ani_hero', 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=10&type=tv');
        setHeroAnime(heroData);
        await delay(500);

        const trendData = await fetchJikan('ani_trending', 'https://api.jikan.moe/v4/seasons/now?limit=15&type=tv');
        setTrendingAnime(trendData);
        await delay(500);

        const seasonData = await fetchJikan('ani_seasonal', 'https://api.jikan.moe/v4/seasons/upcoming?limit=15&type=tv');
        setSeasonalAnime(seasonData);
        await delay(500);

        const movieData = await fetchJikan('ani_movies', 'https://api.jikan.moe/v4/top/anime?type=movie&limit=4');
        setTopMovies(movieData);
        await delay(500);

        const tvData = await fetchJikan('ani_tv', 'https://api.jikan.moe/v4/top/anime?type=tv&limit=4');
        setTopTv(tvData);
        await delay(500);

        // ANILIST GRAPHQL FETCHER FOR TODAY'S SCHEDULE
        const fetchAniListSchedule = async () => {
            const cacheKey = 'anilist_today_sched';
            const cachedData = localStorage.getItem(cacheKey);
            const cacheTime = localStorage.getItem(cacheKey + '_time');
            const nowTime = new Date().getTime();

            if (cachedData && cacheTime && nowTime - parseInt(cacheTime) < 6 * 60 * 60 * 1000) {
              return JSON.parse(cachedData);
            }

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
            const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

            const query = `
              query ($start: Int, $end: Int) {
                Page(page: 1, perPage: 4) {
                  airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
                    airingAt
                    episode
                    media {
                      idMal
                      title { english romaji }
                      coverImage { large }
                    }
                  }
                }
              }
            `;
            try {
              const aniRes = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ query, variables: { start: startTimestamp, end: endTimestamp } })
              });
              if (aniRes.ok) {
                const aniData = await aniRes.json();
                const mappedSchedule = aniData.data.Page.airingSchedules
                  .filter(item => item.media.idMal) 
                  .map(item => ({
                    mal_id: item.media.idMal,
                    title_english: item.media.title.english || item.media.title.romaji,
                    title: item.media.title.romaji,
                    images: { webp: { image_url: item.media.coverImage.large } },
                    episodes: item.episode,
                    broadcast: { time: new Date(item.airingAt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
                  }));
                  
                localStorage.setItem(cacheKey, JSON.stringify(mappedSchedule));
                localStorage.setItem(cacheKey + '_time', nowTime.toString());
                return mappedSchedule;
              }
            } catch (e) { console.error("AniList Error:", e); }
            return [];
        };

        const schedData = await fetchAniListSchedule();
        setTodaySchedule(schedData);
        await delay(500);

        const dubbedData = await fetchJikan('ani_dubbed', 'https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=15');
        setPopularDubbed(dubbedData);
        await delay(500);

        const reviewData = await fetchJikan('ani_reviews', 'https://api.jikan.moe/v4/reviews/anime?limit=12');
        setReviews(reviewData);

        // ANILIST GRAPHQL FETCHER FOR AWARDS
        const fetchAwards = async () => {
          const currentYear = new Date().getFullYear();
          const query = `
            query {
              Page(page: 1, perPage: 4) {
                media(seasonYear: ${currentYear}, sort: SCORE_DESC, type: ANIME, format: TV) {
                  idMal
                  title { english romaji }
                  coverImage { large }
                }
              }
            }
          `;
          try {
            const res = await fetch('https://graphql.anilist.co', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ query })
            });
            if (res.ok) {
              const data = await res.json();
              if(data?.data?.Page?.media){
                   setAwardContenders(data.data.Page.media);
              }
            }
          } catch (e) { console.error("Awards Fetch Error:", e); }
        };
        await fetchAwards();

      } catch (error) { console.error("Critical fetching error:", error); }
    };
    
    fetchHomeData();
  }, []);

  // Hero Slider Auto-Scroll
  useEffect(() => {
    if (heroAnime.length > 0) {
      const interval = setInterval(() => setHeroIndex((prev) => (prev + 1) % heroAnime.length), 6000);
      return () => clearInterval(interval);
    }
  }, [heroAnime]);

  // Live Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://api.jikan.moe/v4/anime?q=${searchQuery}&limit=5&type=tv`);
          if (res.ok) setSearchResults(removeDuplicates((await res.json()).data)); 
        } catch (err) { console.error(err); }
        setIsSearching(false);
      } else setSearchResults([]);
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const nextHero = () => setHeroIndex((prev) => (prev + 1) % heroAnime.length);
  const prevHero = () => setHeroIndex((prev) => (prev - 1 + heroAnime.length) % heroAnime.length);
  const scrollRef = (ref, dir) => { if(ref.current) ref.current.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' }); };

  // PERSONAL DATABASE SAVE LOGIC
  const addToWatchlist = async (e, anime) => {
    e.stopPropagation(); 
    e.preventDefault(); 
    
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        alert("Please login first to add to your watchlist!");
        navigate('/auth');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/watchlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anime: anime, userId: userId }) 
        });

        const data = await response.json();
        if (response.ok) alert(`🎉 ${anime.title_english || anime.title} saved to your personal collection!`);
        else alert(`⚠️ ${data.message || "Already in your Watchlist!"}`);
    } catch (error) {
        console.error("Database error", error);
        alert("❌ Failed to connect to Database.");
    }
  };

  const currentHero = heroAnime[heroIndex];

  return (
    <div className="page-wrap" id="home">
      {/* 🔥 INJECTED PREMIUM CSS 🔥 */}
      <style>
        {`
          @keyframes smoothFade { 0% { opacity: 0.4; filter: blur(10px); transform: scale(1.02); } 100% { opacity: 1; filter: blur(0px); transform: scale(1); } }
          .animate-hero { animation: smoothFade 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Glowing Search Input */
          .glow-search:focus-within {
            box-shadow: 0 0 20px rgba(255, 75, 107, 0.3);
            border-color: rgba(255, 75, 107, 0.5) !important;
          }

          /* Premium Full-Image Card */
          .premium-card {
            flex: 0 0 220px;
            height: 330px;
            position: relative;
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid rgba(255,255,255,0.05);
            background: #0a0c1a;
          }
          .premium-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 15px rgba(255, 75, 107, 0.3);
            border-color: rgba(255, 75, 107, 0.5);
          }
          .premium-card-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
          }
          .premium-card:hover .premium-card-img {
            transform: scale(1.1);
          }
          .premium-meta-layer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 60px 15px 15px;
            background: linear-gradient(to top, rgba(10,12,26,1) 0%, rgba(10,12,26,0.8) 40%, transparent 100%);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            transition: padding-bottom 0.3s ease;
          }
          .premium-card:hover .premium-meta-layer {
            padding-bottom: 25px; /* Slight text lift on hover */
          }
          .card-watchlist-btn {
              position: absolute;
              top: 10px;
              right: 10px;
              background: rgba(0,0,0,0.6);
              backdrop-filter: blur(5px);
              border: 1px solid rgba(255,255,255,0.1);
              color: #fff;
              width: 35px;
              height: 35px;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10;
              opacity: 0;
              transition: all 0.3s ease;
          }
          .premium-card:hover .card-watchlist-btn, .anime-card-wrap:hover .card-watchlist-btn {
              opacity: 1;
              transform: translateY(0) scale(1);
          }
          .card-watchlist-btn:hover {
             background: var(--primary);
             border-color: var(--primary);
             transform: scale(1.1) !important;
          }
        `}
      </style>

      {/* ================= PREMIUM LIVE SEARCH ================= */}
      <section className="search-row glow-search" style={{ marginTop: '2rem', position: 'relative', zIndex: 50, transition: '0.3s' }}>
        <div className="search-input-wrap" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '5px 5px 5px 25px' }}>
          <i className="fas fa-search" style={{ color: 'var(--text-muted)' }}></i>
          <input type="text" className="search-input" placeholder="Search anime, manga, or characters..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'transparent' }} />
          <button className="search-btn" style={{ borderRadius: '99px', padding: '12px 30px' }}><i className="fas fa-arrow-right"></i> Search</button>
        </div>
        {searchQuery.length > 2 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#121426', border: '1px solid rgba(255,75,107,0.3)', borderRadius: '15px', marginTop: '15px', boxShadow: '0 25px 50px rgba(0,0,0,0.9)', overflow: 'hidden', backdropFilter: 'blur(20px)' }}>
            {isSearching ? <div style={{ padding: '30px', textAlign: 'center', color: 'var(--primary)' }}><i className="fas fa-circle-notch fa-spin fa-2x"></i></div>
            : searchResults.length > 0 ? searchResults.map((anime, index) => (
                <Link to={`/anime/${anime.mal_id}`} key={index} style={{ display: 'flex', gap: '15px', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', alignItems: 'center', textDecoration: 'none', transition: '0.2s' }} className="hover-bg-change">
                  <img src={anime.images?.webp?.large_image_url} alt="poster" style={{ width: '50px', height: '70px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }} />
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '1rem', margin: '0 0 5px 0', fontWeight: 'bold' }}>{anime.title_english || anime.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#fff', background: 'rgba(255,75,107,0.2)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(255,75,107,0.3)' }}>{anime.status}</span>
                  </div>
                </Link>
              )) : <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No results found in the database.</div>}
          </div>
        )}
      </section>

      {/* ================= CINEMATIC HERO SLIDER ================= */}
      {currentHero ? (
        <section key={currentHero.mal_id} className="animate-hero" style={{ position: 'relative', height: '480px', borderRadius: '32px', overflow: 'hidden', marginTop: '2.5rem', backgroundImage: `url(${currentHero.trailer?.images?.maximum_image_url || currentHero.images.webp.large_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,12,26,1) 0%, rgba(10,12,26,0.7) 45%, transparent 100%), linear-gradient(to top, rgba(10,12,26,0.9) 0%, transparent 40%)' }}></div>
          
          <div style={{ position: 'absolute', top: '50%', left: '4rem', transform: 'translateY(-50%)', maxWidth: '650px', zIndex: 10 }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <span style={{ background: 'var(--primary)', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '900', letterSpacing: '1px' }}>#1 AIRING</span>
              <span style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>{currentHero.rating ? currentHero.rating.split(' ')[0] : 'PG-13'}</span>
            </div>
            
            <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#fff', marginBottom: '15px', textShadow: '0 10px 20px rgba(0,0,0,0.8)', lineHeight: '1.1' }}>
              {currentHero.title_english || currentHero.title}
            </h1>
            
            <div style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {currentHero.genres?.map(g => g.name).join(' • ')}
            </div>
            
            <p style={{ color: '#d0d5e0', fontSize: '1rem', marginBottom: '30px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {currentHero.synopsis}
            </p>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <button onClick={() => navigate(`/anime/${currentHero.mal_id}`)} className="btn-primary hover-scale" style={{ padding: '15px 35px', borderRadius: '99px', fontSize: '1.1rem', fontWeight: '800', boxShadow: '0 10px 25px rgba(255,75,107,0.4)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-play"></i> View Details
              </button>
              <button onClick={(e) => addToWatchlist(e, currentHero)} className="hover-scale" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '15px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '55px', height: '55px', fontSize: '1.2rem' }}>
                <i className="fas fa-bookmark"></i>
              </button>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '20px', right: '30px', display: 'flex', gap: '10px', zIndex: 20 }}>
            <button onClick={prevHero} className="hover-scale" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-chevron-left"></i></button>
            <button onClick={nextHero} className="hover-scale" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-chevron-right"></i></button>
          </div>
        </section>
      ) : (
        <section style={{ height: '480px', background: '#121426', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
           <i className="fas fa-circle-notch fa-spin fa-3x" style={{ color: 'var(--primary)' }}></i>
        </section>
      )}

      {/* 🔥 NEW COMPONENT INJECTED HERE 🔥 */}
      <LatestTrailersSection />

      {/* ================= TRENDING AIRING ROW ================= */}
      <section style={{ marginTop: '4rem' }}>
        <div className="section-head" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: '#fff', fontWeight: '800', margin: '0 0 5px 0' }}>🔥 Trending Airing Anime</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>What's hot right now on MAL.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
               <button onClick={() => scrollRef(trendingRef, 'left')} style={{width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer'}}><i className="fas fa-chevron-left"></i></button>
               <button onClick={() => scrollRef(trendingRef, 'right')} style={{width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer'}}><i className="fas fa-chevron-right"></i></button>
            </div>
            <Link to="/seasons" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none', background: 'rgba(255,75,107,0.1)', padding: '8px 20px', borderRadius: '99px', border: '1px solid rgba(255,75,107,0.3)' }}>View All</Link>
          </div>
        </div>

        <div ref={trendingRef} className="hide-scrollbar" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', scrollBehavior: 'smooth' }}>
          {trendingAnime.length > 0 ? trendingAnime.map((anime) => (
            <div key={anime.mal_id} className="premium-card" onClick={() => navigate(`/anime/${anime.mal_id}`)}>
              <img src={anime.images?.webp?.large_image_url} alt={anime.title} className="premium-card-img" />
              <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn"><i className="fas fa-bookmark"></i></button>
              
              <div className="premium-meta-layer">
                <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                    <span style={{ background: 'rgba(255, 213, 74, 0.2)', backdropFilter: 'blur(5px)', color: '#ffd54a', border: '1px solid rgba(255, 213, 74, 0.4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Sub | Dub</span>
                </div>
                <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', margin: '0 0 5px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {anime.title_english || anime.title}
                </h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>{anime.genres && anime.genres[0] ? anime.genres[0].name : 'Action'}</div>
              </div>
            </div>
          )) : <div style={{ color: 'var(--text-muted)' }}><i className="fas fa-circle-notch fa-spin"></i> Loading Trending...</div>}
        </div>
      </section>

      {/* ================= SEASONAL ANIME ================= */}
      <section style={{ marginTop: '4rem' }}>
        <div className="section-head" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: '#fff', fontWeight: '800', margin: '0 0 5px 0' }}>🌸 Upcoming Seasonal Anime</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>Anticipated releases for the next season.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
               <button onClick={() => scrollRef(seasonalRef, 'left')} style={{width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer'}}><i className="fas fa-chevron-left"></i></button>
               <button onClick={() => scrollRef(seasonalRef, 'right')} style={{width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer'}}><i className="fas fa-chevron-right"></i></button>
            </div>
            <Link to="/upcoming" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none', background: 'rgba(255,75,107,0.1)', padding: '8px 20px', borderRadius: '99px', border: '1px solid rgba(255,75,107,0.3)' }}>View All</Link>
          </div>
        </div>

        <div ref={seasonalRef} className="hide-scrollbar" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', scrollBehavior: 'smooth' }}>
          {seasonalAnime.length > 0 ? seasonalAnime.map((anime) => (
             <div key={anime.mal_id} className="premium-card" onClick={() => navigate(`/anime/${anime.mal_id}`)}>
               <img src={anime.images?.webp?.large_image_url} alt={anime.title} className="premium-card-img" />
               <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn"><i className="fas fa-bookmark"></i></button>
               
               <div className="premium-meta-layer">
                 <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                     <span style={{ background: 'rgba(255, 75, 107, 0.2)', backdropFilter: 'blur(5px)', color: '#ff4b6b', border: '1px solid rgba(255, 75, 107, 0.4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Upcoming</span>
                 </div>
                 <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', margin: '0 0 5px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                   {anime.title_english || anime.title}
                 </h4>
                 <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>{anime.type || 'TV'} • {anime.genres && anime.genres[0] ? anime.genres[0].name : 'Action'}</div>
               </div>
             </div>
          )) : <div style={{ color: 'var(--text-muted)' }}><i className="fas fa-circle-notch fa-spin"></i> Loading Seasonal...</div>}
        </div>
      </section>

      {/* ================= TODAY'S SCHEDULE ================= */}
      <section style={{ marginTop: '5rem' }}>
        <div className="section-head" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: '#fff', fontWeight: '800', margin: '0 0 5px 0' }}><i className="fas fa-satellite-dish" style={{ color: 'var(--primary)' }}></i> Today's Schedule</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>Find out when your favorite anime airs today.</p>
          </div>
          <button className="hover-scale" onClick={() => navigate('/schedule')} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
            View Full Calendar <i className="fas fa-arrow-right"></i>
          </button>
        </div>
        
        <div style={{ background: 'linear-gradient(135deg, rgba(18,20,38,1) 0%, rgba(10,12,26,1) 100%)', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
           <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
             <span style={{ color: 'var(--primary)' }}>{new Date().toLocaleString('en-US', {weekday: 'long'})}'s</span> Releases
           </h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {todaySchedule.length > 0 ? todaySchedule.slice(0,4).map((anime) => (
                <div key={anime.mal_id} style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', transition: '0.3s', textDecoration: 'none', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.02)' }} className="hover-scale anime-card-wrap" onClick={() => navigate(`/anime/${anime.mal_id}`)}>
                  <img src={anime.images?.webp?.image_url} alt={anime.title} style={{ width: '65px', height: '85px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }} />
                  <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn" style={{top: '12px', right: '12px', width: '30px', height: '30px', fontSize: '0.8rem'}}><i className="fas fa-bookmark"></i></button>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                     <h4 style={{ fontSize: '1rem', margin: '0 0 5px 0', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>{anime.title_english || anime.title}</h4>
                     <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{anime.episodes ? `Episode ${anime.episodes}` : 'Airing'} | Sub</span>
                  </div>
                  <div style={{ color: '#fff', fontWeight: '900', fontSize: '1rem', display: 'flex', alignItems: 'center', background: 'rgba(255,75,107,0.15)', padding: '0 15px', borderRadius: '12px', border: '1px solid rgba(255,75,107,0.3)' }}>
                    {anime.broadcast?.time || 'TBA'}
                  </div>
                </div>
              )) : <div style={{ color: 'var(--text-muted)' }}><i className="fas fa-circle-notch fa-spin"></i> Syncing Satellite Signals...</div>}
           </div>
        </div>
      </section>

      {/* ================= 3 COLUMN GRID SECTION ================= */}
      <section style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
        
        {/* TOP MOVIES */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: '800', margin: 0 }}>Top Movies</h3>
              <Link to="/movies" style={{ color: 'var(--text-muted)', fontSize: '1rem', textDecoration: 'none' }} className="hover-scale"><i className="fas fa-arrow-right"></i></Link>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {topMovies.map((movie, idx) => (
                <div key={movie.mal_id} style={{ display: 'flex', gap: '15px', padding: '10px', borderRadius: '16px', alignItems: 'center', position: 'relative', cursor: 'pointer', transition: '0.2s' }} className="hover-bg-change anime-card-wrap" onClick={() => navigate(`/anime/${movie.mal_id}`)} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.1)', width: '25px', textAlign: 'center' }}>{idx + 1}</div>
                  <img src={movie.images?.webp?.image_url} alt="poster" style={{ width: '50px', height: '70px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
                  <button onClick={(e) => addToWatchlist(e, movie)} className="card-watchlist-btn" style={{top: '50%', right: '10px', transform: 'translateY(-50%)', width: '30px', height: '30px', fontSize: '0.8rem'}}><i className="fas fa-bookmark"></i></button>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>{movie.title_english || movie.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Movie • {movie.score || 'N/A'} <i className="fas fa-star" style={{color: 'var(--accent)'}}></i></span>
                  </div>
                </div>
             ))}
           </div>
        </div>

        {/* TOP TV SERIES */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: '800', margin: 0 }}>Top TV Series</h3>
              <Link to="/tv-series" style={{ color: 'var(--text-muted)', fontSize: '1rem', textDecoration: 'none' }} className="hover-scale"><i className="fas fa-arrow-right"></i></Link>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {topTv.map((tv, idx) => (
                <div key={tv.mal_id} style={{ display: 'flex', gap: '15px', padding: '10px', borderRadius: '16px', alignItems: 'center', position: 'relative', cursor: 'pointer', transition: '0.2s' }} className="hover-bg-change anime-card-wrap" onClick={() => navigate(`/anime/${tv.mal_id}`)} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'rgba(255,255,255,0.1)', width: '25px', textAlign: 'center' }}>{idx + 1}</div>
                  <img src={tv.images?.webp?.image_url} alt="poster" style={{ width: '50px', height: '70px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
                  <button onClick={(e) => addToWatchlist(e, tv)} className="card-watchlist-btn" style={{top: '50%', right: '10px', transform: 'translateY(-50%)', width: '30px', height: '30px', fontSize: '0.8rem'}}><i className="fas fa-bookmark"></i></button>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>{tv.title_english || tv.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TV Series • {tv.score || 'N/A'} <i className="fas fa-star" style={{color: 'var(--accent)'}}></i></span>
                  </div>
                </div>
             ))}
           </div>
        </div>

        {/* 🔥 DYNAMIC AWARDS COLUMN 🔥 */}
        <div style={{ background: 'linear-gradient(135deg, rgba(255,213,74,0.05) 0%, rgba(255,255,255,0.01) 100%)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,213,74,0.2)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', fontWeight: '800', margin: 0 }}>The {new Date().getFullYear()} Awards</h3>
              <i className="fas fa-trophy" style={{ color: 'var(--accent)', fontSize: '1.2rem', textShadow: '0 0 10px var(--accent)' }}></i>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {awardContenders.length > 0 ? awardContenders.map((anime, idx) => (
                <div key={anime.idMal || anime.title.romaji} onClick={() => anime.idMal && navigate(`/anime/${anime.idMal}`)} style={{ display: 'flex', gap: '15px', padding: '10px', borderRadius: '16px', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }} className="hover-scale" onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,213,74,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: idx === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.2)', width: '25px', textAlign: 'center' }}>{idx + 1}</div>
                  <div style={{ width: '50px', height: '70px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                    {anime.coverImage?.large ? (
                      <>
                        <img src={anime.coverImage.large} alt="anime" style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8}} />
                        {idx === 0 && <i className="fas fa-crown" style={{ color: 'var(--accent)', position: 'absolute', top: '-5px', right: '-5px', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontSize: '1.2rem', transform: 'rotate(15deg)' }}></i>}
                      </>
                    ) : (
                      <i className="fas fa-crown" style={{ color: 'var(--accent)' }}></i>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                      {anime.title.english || anime.title.romaji}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold' }}>AOTY Contender</span>
                  </div>
                </div>
             )) : (
                 <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}><i className="fas fa-circle-notch fa-spin"></i> Analyzing Rankings...</div>
             )}
           </div>
        </div>
      </section>

      {/* ================= POPULAR DUBBED ================= */}
      <section style={{ marginTop: '5rem' }}>
        <div className="section-head" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: '#fff', fontWeight: '800', margin: '0 0 5px 0' }}>🎙️ Popular Dubbed</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>Fan favorites available in English Dub.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={() => scrollRef(dubbedRef, 'left')} style={{width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer'}}><i className="fas fa-chevron-left"></i></button>
             <button onClick={() => scrollRef(dubbedRef, 'right')} style={{width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer'}}><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>

        <div ref={dubbedRef} className="hide-scrollbar" style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', scrollBehavior: 'smooth' }}>
          {popularDubbed.map((anime) => (
            <div key={`dub-${anime.mal_id}`} className="premium-card" onClick={() => navigate(`/anime/${anime.mal_id}`)}>
              <img src={anime.images?.webp?.large_image_url} alt={anime.title} className="premium-card-img" />
              <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn"><i className="fas fa-bookmark"></i></button>
              
              <div className="premium-meta-layer">
                <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                    <span style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(5px)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.4)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>English Dub</span>
                </div>
                <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold', margin: '0 0 5px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  {anime.title_english || anime.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= COMMUNITY REVIEWS ================= */}
      <section style={{ marginTop: '5rem', marginBottom: '3rem' }}>
        <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: '#fff', fontWeight: '800', margin: '0 0 5px 0' }}>💬 Community Reviews</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>See what other otakus are saying.</p>
          </div>
          <Link to="/reviews" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none', background: 'rgba(255,75,107,0.1)', padding: '8px 20px', borderRadius: '99px', border: '1px solid rgba(255,75,107,0.3)' }}>View All</Link>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
           {reviews.slice(0, 6).map((review, index) => (
              <div key={index} style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '24px', display: 'flex', gap: '20px', border: '1px solid rgba(255,255,255,0.05)', transition: '0.3s' }} className="hover-scale">
                 <img src={review.entry.images?.webp?.image_url} alt="anime" style={{ width: '80px', height: '120px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} />
                 <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ background: 'rgba(255,213,74,0.1)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '900', border: '1px solid rgba(255,213,74,0.2)' }}><i className="fas fa-star"></i> {review.score}/10</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>@{review.user.username}</span>
                    </div>
                    <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: '0 0 10px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '800' }}>{review.entry.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#a0a5b5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6', margin: 0 }}>"{review.review}"</p>
                 </div>
              </div>
           ))}
        </div>
      </section>

    </div>
  );
};

export default Home;
