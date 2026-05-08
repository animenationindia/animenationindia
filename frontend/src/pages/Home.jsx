import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LatestTrailersSection from '../components/LatestTrailersSection';
import BottomBannerAd from '../components/BottomBannerAd'; // 🔥 AD COMPONENT IMPORTED HERE 🔥
import NativeBannerAd from '../components/NativeBannerAd';
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
  
  // 🔥 NEW: Awards State 🔥
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

  // 🔥 BULLETPROOF FETCHER FOR JIKAN
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
    const fetchAllJikanData = async () => {
      try {
        const heroData = await fetchJikan('ani_hero', 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=10&type=tv');
        setHeroAnime(heroData); 
        await delay(350); 

        const trendData = await fetchJikan('ani_trending', 'https://api.jikan.moe/v4/seasons/now?limit=15&type=tv');
        setTrendingAnime(trendData);
        await delay(350);

        const seasonData = await fetchJikan('ani_seasonal', 'https://api.jikan.moe/v4/seasons/upcoming?limit=15&type=tv');
        setSeasonalAnime(seasonData);
        await delay(350);

        const movieData = await fetchJikan('ani_movies', 'https://api.jikan.moe/v4/top/anime?type=movie&limit=4');
        setTopMovies(movieData);
        await delay(350);

        const tvData = await fetchJikan('ani_tv', 'https://api.jikan.moe/v4/top/anime?type=tv&limit=4');
        setTopTv(tvData);
        await delay(350);

        const dubbedData = await fetchJikan('ani_dubbed', 'https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=15');
        setPopularDubbed(dubbedData);
        await delay(350);

        const reviewData = await fetchJikan('ani_reviews', 'https://api.jikan.moe/v4/reviews/anime?limit=12');
        setReviews(reviewData);
      } catch (error) { console.error("Jikan Error:", error); }
    };

    // 2. ANILIST API FETCH
    const fetchAllAniListData = async () => {
      const schedData = await fetchAniListSchedule(); 
      setTodaySchedule(schedData);

      await fetchAwards(); 
    };

    fetchAllJikanData();
    fetchAllAniListData();
  }, []);

  // 🔥 ANILIST GRAPHQL FETCHER FOR TODAY'S SCHEDULE 🔥
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

  // 🔥 ANILIST GRAPHQL FETCHER FOR AWARDS (Auto-Updating) 🔥
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
  const scrollDubbed = (dir) => { if(dubbedRef.current) dubbedRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' }); };

  // 🔥 PERSONAL DATABASE SAVE LOGIC 🔥
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
            body: JSON.stringify({ 
                anime: anime,
                userId: userId
            }) 
        });

        const data = await response.json();

        if (response.ok) {
            alert(`🎉 ${anime.title_english || anime.title} saved to your personal collection!`);
        } else {
            alert(`⚠️ ${data.message || "Already in your Watchlist!"}`);
        }
    } catch (error) {
        console.error("Database connection error", error);
        alert("❌ Failed to connect to Database.");
    }
  };

  const currentHero = heroAnime[heroIndex];

  return (
    <div className="page-wrap" id="home" style={{ overflowX: 'hidden' }}>
      {/* 🔥 INJECTED PREMIUM UI/UX ANIMATION CSS 🔥 */}
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          /* Glow Search */
          .glow-search:focus-within {
            box-shadow: 0 0 20px rgba(255, 75, 107, 0.3);
            border-color: rgba(255, 75, 107, 0.5) !important;
          }

          /* Premium Hover & Neon Glow for Poster Cards */
          .poster-card { 
            background: #1a1c32; 
            border-radius: 12px; 
            overflow: hidden; 
            transition: all 0.3s ease; 
            border: 1px solid rgba(255,255,255,0.05); 
            position: relative; 
            cursor: pointer; 
          }
          .poster-card:hover { 
            transform: translateY(-5px); 
            box-shadow: 0 0 20px rgba(255, 75, 107, 0.4); 
            border-color: rgba(255, 75, 107, 0.5); 
          }
          
          /* Image Zoom Effect */
          .poster-img { 
            width: 100%; 
            height: 240px; 
            object-fit: cover; 
            transition: 0.5s ease; 
          }
          .poster-card:hover .poster-img { 
            transform: scale(1.1); 
          }

          /* Sub / Dub Badges */
          .sub-badge { 
            position: absolute; 
            bottom: 8px; 
            left: 8px; 
            background: rgba(0,0,0,0.7); 
            color: #fff; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.7rem; 
            font-weight: bold; 
            z-index: 5; 
            backdrop-filter: blur(4px); 
          }
          .dub-badge { 
            position: absolute; 
            bottom: 8px; 
            right: 8px; 
            background: #ff4dd2; 
            color: #fff; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.7rem; 
            font-weight: bold; 
            z-index: 5; 
          }

          /* Watchlist Btn Animation */
          .card-watchlist-btn { 
            position: absolute; 
            top: 10px; 
            right: 10px; 
            background: rgba(0,0,0,0.6); 
            border: none; 
            color: #fff; 
            width: 35px; 
            height: 35px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            opacity: 0; 
            transition: 0.3s; 
            z-index: 10; 
          }
          .poster-card:hover .card-watchlist-btn, .anime-card-wrap:hover .card-watchlist-btn { 
            opacity: 1; 
            transform: translateY(0); 
          }

          /* Hero Slider Navigation Arrows */
          .hero-nav-btn { 
            background: rgba(0,0,0,0.5); 
            color: #fff; 
            border: 1px solid rgba(255,255,255,0.2); 
            width: 40px; 
            height: 40px; 
            border-radius: 50%; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            transition: 0.3s; 
          }
          .hero-nav-btn:hover { 
            background: #ff4dd2; 
            border-color: #ff4dd2; 
          }
          
          /* Smartlink Button Animation */
          @keyframes glowing {
             0% { box-shadow: 0 0 5px #ff4b6b; }
             50% { box-shadow: 0 0 20px #ff4b6b, 0 0 30px #ff4b6b; }
             100% { box-shadow: 0 0 5px #ff4b6b; }
          }
          .smartlink-btn {
             background: linear-gradient(135deg, #ff4b6b 0%, #ff7eb3 100%);
             color: white;
             padding: 12px 30px;
             border-radius: 99px;
             font-weight: bold;
             text-decoration: none;
             display: inline-flex;
             align-items: center;
             gap: 10px;
             transition: all 0.3s ease;
             animation: glowing 2s infinite;
          }
          .smartlink-btn:hover {
             transform: translateY(-3px) scale(1.05);
          }
        `}
      </style>

      {/* ================= LIVE SEARCH (Moved Higher) ================= */}
      <section className="search-row glow-search" style={{ marginTop: '0.5rem', position: 'relative', zIndex: 50, transition: '0.3s' }}>
        <div className="search-input-wrap">
          <i className="fas fa-search"></i>
          <input type="text" className="search-input" placeholder="Search anime, manga, or characters..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <button className="search-btn"><i className="fas fa-arrow-right"></i> Search</button>
        </div>
        {searchQuery.length > 2 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#121326', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', marginTop: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
            {isSearching ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin"></i> Searching...</div>
            : searchResults.length > 0 ? searchResults.map((anime, index) => (
                <Link to={`/anime/${anime.mal_id}`} key={index} style={{ display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', alignItems: 'center', textDecoration: 'none' }}>
                  <img src={anime.images?.webp?.large_image_url} alt="poster" style={{ width: '50px', height: '70px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: 0 }}>{anime.title_english || anime.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'rgba(255,213,74,0.1)', padding: '2px 8px', borderRadius: '99px', marginTop: '5px', display: 'inline-block' }}>{anime.status}</span>
                  </div>
                </Link>
              )) : <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No results found.</div>}
          </div>
        )}
      </section>

      {/* ================= HERO SLIDER (Made Bigger) ================= */}
      {heroAnime.length > 0 ? (
        <section style={{ position: 'relative', height: '500px', borderRadius: '16px', overflow: 'hidden', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', height: '100%', transition: 'transform 0.6s ease-in-out', transform: `translateX(-${heroIndex * 100}%)` }}>
             {heroAnime.map((anime) => (
                <div key={anime.mal_id} style={{ flex: '0 0 100%', height: '100%', position: 'relative', backgroundImage: `url(${anime.trailer?.images?.maximum_image_url || anime.images.webp.large_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                   <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #0f0f1a 0%, rgba(15,15,26,0.7) 40%, transparent 100%)' }}></div>
                   <div style={{ position: 'absolute', top: '50%', left: '3rem', transform: 'translateY(-50%)', maxWidth: '600px', zIndex: 10 }}>
                     <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ background: '#ff4dd2', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>#1 AIRING</span>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{anime.rating?.split(' ')[0] || 'PG-13'}</span>
                     </div>
                     <h1 style={{ fontSize: '2.8rem', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>{anime.title_english || anime.title}</h1>
                     <div style={{ color: '#ffd54a', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' }}>{anime.type || 'TV'} • {anime.genres?.map(g => g.name).join(' • ')}</div>
                     <p style={{ color: '#d0d5e0', fontSize: '0.9rem', marginBottom: '25px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{anime.synopsis}</p>
                     <div style={{ display: 'flex', gap: '15px' }}>
                       <button onClick={() => navigate(`/anime/${anime.mal_id}`)} style={{ background: 'linear-gradient(90deg, #ff4dd2 0%, #ffd54a 100%)', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fas fa-play"></i> VIEW DETAILS</button>
                       <button onClick={(e) => addToWatchlist(e, anime)} className="hero-nav-btn" style={{ borderRadius: '6px' }}><i className="fas fa-bookmark"></i></button>
                     </div>
                   </div>
                </div>
             ))}
          </div>
          <div style={{ position: 'absolute', right: '2rem', bottom: '2rem', display: 'flex', gap: '10px', zIndex: 20 }}>
            <button onClick={() => setHeroIndex(prev => (prev - 1 + heroAnime.length) % heroAnime.length)} className="hero-nav-btn"><i className="fas fa-chevron-left"></i></button>
            <button onClick={() => setHeroIndex(prev => (prev + 1) % heroAnime.length)} className="hero-nav-btn"><i className="fas fa-chevron-right"></i></button>
          </div>
        </section>
      ) : (
        <section style={{ height: '500px', background: '#121326', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1.5rem' }}>
           <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
        </section>
      )}

      {/* 🔥 NEW COMPONENT INJECTED HERE 🔥 */}
      <LatestTrailersSection />

      {/* ================= TRENDING ROW ================= */}
      <section className="carousel-section" style={{ marginTop: '3rem' }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">🔥 Trending Airing Anime</h2>
            <p className="section-sub">What's hot right now on MAL.</p>
          </div>
          {/* 🔥 SEASONS LINK 🔥 */}
          <Link to="/seasons" className="view-all-btn" style={{textDecoration: 'none'}}>View All</Link>
        </div>
        <div className="poster-row">
          {trendingAnime.length > 0 ? trendingAnime.map((anime) => (
            <div key={anime.mal_id} className="poster-card hover-scale" style={{textDecoration: 'none', position: 'relative', cursor: 'pointer'}} onClick={() => navigate(`/anime/${anime.mal_id}`)}>
              <img src={anime.images?.webp?.large_image_url} alt={anime.title} className="poster-img" />
              <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn"><i className="fas fa-bookmark"></i></button>
              <div className="poster-meta">
                <div className="poster-title" style={{color: '#fff'}}>{anime.title_english || anime.title}</div>
                <div className="poster-cat">{anime.genres && anime.genres[0] ? anime.genres[0].name : 'Anime'}</div>
              </div>
            </div>
          )) : <div style={{ padding: '20px' }}><i className="fas fa-spinner fa-spin"></i> Loading...</div>}
        </div>
      </section>

      {/* ================= SEASONAL ANIME ================= */}
      <section className="carousel-section" style={{ marginTop: '3rem' }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">🌸 Upcoming Seasonal Anime</h2>
            <p className="section-sub">Anticipated releases for the next season.</p>
          </div>
          {/* 🔥 UPCOMING LINK 🔥 */}
          <Link to="/upcoming" className="view-all-btn" style={{textDecoration: 'none'}}>View All</Link>
        </div>
        <div className="poster-row">
          {seasonalAnime.length > 0 ? seasonalAnime.map((anime) => (
             <div key={anime.mal_id} className="poster-card hover-scale" style={{textDecoration: 'none', position: 'relative', cursor: 'pointer'}} onClick={() => navigate(`/anime/${anime.mal_id}`)}>
               <img src={anime.images?.webp?.large_image_url} alt={anime.title} className="poster-img" />
               <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn"><i className="fas fa-bookmark"></i></button>
               <div className="poster-meta">
                 <div className="poster-title" style={{color: '#fff'}}>{anime.title_english || anime.title}</div>
                 <div className="poster-cat">{anime.type || 'TV'} • {anime.genres && anime.genres[0] ? anime.genres[0].name : 'Action'}</div>
               </div>
             </div>
          )) : <div style={{ padding: '20px' }}><i className="fas fa-spinner fa-spin"></i> Loading...</div>}
        </div>
      </section>

      {/* ================= TODAY'S SCHEDULE ================= */}
      <section style={{ marginTop: '3rem' }}>
        <div className="section-head">
          <div>
            <h2 className="section-title"><i className="fas fa-calendar-alt"></i> Today's Schedule</h2>
            <p className="section-sub">Find out when your favorite anime airs today.</p>
          </div>
          <button className="view-all-btn" onClick={() => navigate('/schedule')}>View Full Calendar <i className="fas fa-chevron-right" style={{ fontSize: '0.7rem', marginLeft: '5px' }}></i></button>
        </div>
        <div style={{ background: 'linear-gradient(150deg,#10132a,#161938)', borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
           <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent)', textTransform: 'capitalize' }}>{new Date().toLocaleString('en-US', {weekday: 'long'})}'s Releases</h3>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {todaySchedule.length > 0 ? todaySchedule.slice(0,4).map((anime) => (
                <div key={anime.mal_id} style={{ display: 'flex', gap: '15px', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '12px', transition: '0.2s', textDecoration: 'none', position: 'relative', cursor: 'pointer' }} className="hover-scale anime-card-wrap" onClick={() => navigate(`/anime/${anime.mal_id}`)}>
                  <img src={anime.images?.webp?.image_url} alt={anime.title} style={{ width: '50px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} />
                  <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn" style={{top: '10px', right: '10px', width: '25px', height: '25px', fontSize: '0.8rem'}}><i className="fas fa-bookmark"></i></button>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minWidth: 0 }}>
                     <h4 style={{ fontSize: '0.9rem', margin: 0, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{anime.title_english || anime.title}</h4>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{anime.episodes ? `Ep ${anime.episodes}` : 'Airing'} | Sub</span>
                  </div>
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>{anime.broadcast?.time || 'TBA'}</div>
                </div>
              )) : <div style={{ color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin"></i> Loading AniList Schedule...</div>}
           </div>
        </div>
      </section>

      {/* ================= 3 COLUMN GRID SECTION ================= */}
      <section style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Top Movies</h3>
              <Link to="/movies" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}><i className="fas fa-external-link-alt"></i></Link>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             {topMovies.map((movie) => (
                <div key={movie.mal_id} style={{ display: 'flex', gap: '15px', background: 'var(--bg-elevated)', padding: '10px', borderRadius: '12px', alignItems: 'center', position: 'relative', cursor: 'pointer' }} className="hover-scale anime-card-wrap" onClick={() => navigate(`/anime/${movie.mal_id}`)}>
                  <img src={movie.images?.webp?.image_url} alt="poster" style={{ width: '45px', height: '65px', borderRadius: '6px', objectFit: 'cover' }} />
                  <button onClick={(e) => addToWatchlist(e, movie)} className="card-watchlist-btn" style={{top: '5px', right: '5px', width: '25px', height: '25px', fontSize: '0.7rem'}}><i className="fas fa-bookmark"></i></button>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title_english || movie.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Movie • {movie.score || 'N/A'} <i className="fas fa-star" style={{color: 'var(--accent)'}}></i></span>
                  </div>
                </div>
             ))}
           </div>
        </div>

        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Top TV Series</h3>
              <Link to="/tv-series" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}><i className="fas fa-external-link-alt"></i></Link>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             {topTv.map((tv) => (
                <div key={tv.mal_id} style={{ display: 'flex', gap: '15px', background: 'var(--bg-elevated)', padding: '10px', borderRadius: '12px', alignItems: 'center', position: 'relative', cursor: 'pointer' }} className="hover-scale anime-card-wrap" onClick={() => navigate(`/anime/${tv.mal_id}`)}>
                  <img src={tv.images?.webp?.image_url} alt="poster" style={{ width: '45px', height: '65px', borderRadius: '6px', objectFit: 'cover' }} />
                  <button onClick={(e) => addToWatchlist(e, tv)} className="card-watchlist-btn" style={{top: '5px', right: '5px', width: '25px', height: '25px', fontSize: '0.7rem'}}><i className="fas fa-bookmark"></i></button>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tv.title_english || tv.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TV • {tv.score || 'N/A'} <i className="fas fa-star" style={{color: 'var(--accent)'}}></i></span>
                  </div>
                </div>
             ))}
           </div>
        </div>

        {/* 🔥 DYNAMIC AWARDS COLUMN 🔥 */}
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>The {new Date().getFullYear()} Awards</h3>
              <i className="fas fa-trophy" style={{ color: 'var(--accent)' }}></i>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             {awardContenders.length > 0 ? awardContenders.map((anime) => (
                <div key={anime.idMal || anime.title.romaji} onClick={() => anime.idMal && navigate(`/anime/${anime.idMal}`)} style={{ display: 'flex', gap: '15px', background: 'var(--bg-elevated)', padding: '10px', borderRadius: '12px', alignItems: 'center', cursor: 'pointer' }} className="hover-scale">
                  <div style={{ width: '45px', height: '65px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {anime.coverImage?.large ? (
                      <>
                        <img src={anime.coverImage.large} alt="anime" style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6}} />
                        <i className="fas fa-crown" style={{ color: 'var(--accent)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}></i>
                      </>
                    ) : (
                      <i className="fas fa-crown" style={{ color: 'var(--accent)' }}></i>
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {anime.title.english || anime.title.romaji}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Anime of the Year Contender</span>
                  </div>
                </div>
             )) : (
                 <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}><i className="fas fa-spinner fa-spin"></i> Loading Contenders...</div>
             )}
           </div>
        </div>
      </section>

      {/* 🔥 TOMAR NATIVE AD EKHANE CHOLE ELO 🔥 */}
      <NativeBannerAd />

      {/* ================= POPULAR DUBBED ================= */}
      <section style={{ marginTop: '4rem' }}>
        <div className="section-head">
          <div>
            <h2 className="section-title">🎙️ Popular Dubbed</h2>
            <p className="section-sub">Fan favorites available in English Dub.</p>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
             <button onClick={() => scrollDubbed('left')} style={{width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer'}}><i className="fas fa-chevron-left"></i></button>
             <button onClick={() => scrollDubbed('right')} style={{width: '35px', height: '35px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer'}}><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>
        <div ref={dubbedRef} className="poster-row hide-scrollbar" style={{ overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: '15px' }}>
          {popularDubbed.map((anime) => (
            <div key={`dub-${anime.mal_id}`} className="poster-card hover-scale" style={{ flex: '0 0 180px', position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/anime/${anime.mal_id}`)}>
              <img src={anime.images?.webp?.large_image_url} alt={anime.title} className="poster-img" style={{height: '260px'}} />
              <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn"><i className="fas fa-bookmark"></i></button>
              <div className="poster-meta">
                <div className="poster-title" style={{color: '#fff'}}>{anime.title_english || anime.title}</div>
                <div className="poster-cat">{anime.genres && anime.genres[0] ? anime.genres[0].name : 'Dubbed'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= COMMUNITY REVIEWS ================= */}
      <section style={{ marginTop: '4rem', marginBottom: '2rem' }}>
        <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>💬 Community Reviews</h2>
          <Link to="/reviews" className="view-all-btn" style={{textDecoration: 'none'}}>View All</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
           {reviews.slice(0, 12).map((review, index) => (
              <div key={index} style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '20px', display: 'flex', gap: '15px' }}>
                 <img src={review.entry.images?.webp?.image_url} alt="anime" style={{ width: '70px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                 <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                      <span>SCORE: {review.score}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{review.user.username}</span>
                    </div>
                    <h4 style={{ color: '#fff', marginTop: '5px', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.entry.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5', margin: 0 }}>{review.review}</p>
                 </div>
              </div>
           ))}
        </div>
      </section>
      {/* 🔥 SMARTLINK SUPPORT BUTTON 🔥 */}
      <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '4rem' }}>
         <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>Help us keep Anime Nation India running! ❤️</p>
         <a 
           href="https://www.profitablecpmratenetwork.com/nr48k2kn7k?key=9b16d89b068467ece9c425d8a6098f80" 
           target="_blank" 
           rel="noopener noreferrer"
           className="smartlink-btn"
         >
           <i className="fas fa-heart"></i> Support Anime Nation India
         </a>
      </div>
      
      {/* 🔥 TOMAR BANNER AD EKHANE CHOLE ELO 🔥 */}
      <BottomBannerAd />

    </div>
  );
};

export default Home;
