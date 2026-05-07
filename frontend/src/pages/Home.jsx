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
  const [awardContenders, setAwardContenders] = useState([]);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const removeDuplicates = (animeArray) => {
    if (!animeArray || !Array.isArray(animeArray)) return [];
    return Array.from(new Map(animeArray.map(item => [item.mal_id || (item.entry && item.entry.mal_id), item])).values());
  };

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
        if (res.status === 429) { await delay(2000); retries--; continue; }
        if (res.ok) {
          const data = await res.json();
          if (data && data.data) {
            localStorage.setItem(cacheKey, JSON.stringify(data.data));
            localStorage.setItem(cacheKey + '_time', now.toString());
            return removeDuplicates(data.data);
          }
        }
        return [];
      } catch (error) { retries--; await delay(2000); }
    }
    return []; 
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const heroData = await fetchJikan('ani_hero', 'https://api.jikan.moe/v4/top/anime?filter=airing&limit=10&type=tv');
        setHeroAnime(heroData);
        await delay(500);

        const trendData = await fetchJikan('ani_trending', 'https://api.jikan.moe/v4/seasons/now?limit=15&type=tv');
        setTrendingAnime(trendData);
        await delay(500);

        const seasonData = await fetchJikan('ani_seasonal', 'https://api.jikan.moe/v4/seasons/upcoming?limit=10&type=tv');
        setSeasonalAnime(seasonData);
        await delay(500);

        const movieData = await fetchJikan('ani_movies', 'https://api.jikan.moe/v4/top/anime?type=movie&limit=4');
        setTopMovies(movieData);
        await delay(500);

        const tvData = await fetchJikan('ani_tv', 'https://api.jikan.moe/v4/top/anime?type=tv&limit=4');
        setTopTv(tvData);
        await delay(500);

        const fetchAniListSchedule = async () => {
            const query = `query ($start: Int, $end: Int) { Page(page: 1, perPage: 20) { airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) { airingAt episode media { idMal title { english romaji } coverImage { large } genres } } } }`;
            const now = new Date();
            const start = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime() / 1000);
            const end = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime() / 1000);
            try {
              const res = await fetch('https://graphql.anilist.co', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: { start, end } })
              });
              if (res.ok) {
                const aniData = await res.json();
                return aniData.data.Page.airingSchedules
                  .filter(item => item.media && item.media.idMal && (!item.media.genres || !item.media.genres.includes('Kids'))) 
                  .map(item => ({
                    mal_id: item.media.idMal,
                    title_english: item.media.title.english || item.media.title.romaji,
                    images: { webp: { image_url: item.media.coverImage.large } },
                    episodes: item.episode,
                    broadcast: { time: new Date(item.airingAt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
                  }));
              }
            } catch (e) { console.error(e); }
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

        const awardRes = await fetch('https://graphql.anilist.co', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `query { Page(page: 1, perPage: 4) { media(seasonYear: ${new Date().getFullYear()}, sort: SCORE_DESC, type: ANIME, format: TV) { idMal title { english romaji } coverImage { large } } } }` })
        });
        if (awardRes.ok) setAwardContenders((await awardRes.json()).data.Page.media);
      } catch (error) { console.error(error); }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    if (heroAnime.length > 0) {
      const interval = setInterval(() => setHeroIndex((prev) => (prev + 1) % heroAnime.length), 7000);
      return () => clearInterval(interval);
    }
  }, [heroAnime]);

  const scrollRef = (ref, dir) => { if(ref.current) ref.current.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' }); };

  const addToWatchlist = async (e, anime) => {
    e.stopPropagation(); e.preventDefault(); 
    const userId = localStorage.getItem('user_id');
    if (!userId) { alert("Please login first!"); navigate('/auth'); return; }
    try {
        const response = await fetch(`${API_URL}/api/watchlist`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anime, userId }) 
        });
        if (response.ok) alert(`🎉 Saved to collection!`);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="page-wrap" id="home">
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .poster-card { background: #1a1c32; border-radius: 12px; overflow: hidden; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.05); position: relative; cursor: pointer; }
          .poster-card:hover { transform: translateY(-5px); box-shadow: 0 0 20px rgba(255, 75, 107, 0.4); border-color: rgba(255, 75, 107, 0.5); }
          .poster-img { width: 100%; height: 240px; object-fit: cover; transition: 0.5s; }
          .poster-card:hover .poster-img { transform: scale(1.1); }
          .sub-badge { position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; z-index: 5; backdrop-filter: blur(4px); }
          .dub-badge { position: absolute; bottom: 8px; right: 8px; background: #ff4dd2; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; z-index: 5; }
          .hero-nav-btn { background: rgba(0,0,0,0.5); color: #fff; border: 1px solid rgba(255,255,255,0.2); width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
          .hero-nav-btn:hover { background: #ff4dd2; border-color: #ff4dd2; }
          .card-watchlist-btn { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; }
          .poster-card:hover .card-watchlist-btn { opacity: 1; }
        `}
      </style>

      {/* ================= HERO SLIDER ================= */}
      {heroAnime.length > 0 ? (
        <section style={{ position: 'relative', height: '400px', borderRadius: '16px', overflow: 'hidden', marginTop: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', height: '100%', transition: 'transform 0.6s ease-in-out', transform: `translateX(-${heroIndex * 100}%)` }}>
             {heroAnime.map((anime) => (
                <div key={anime.mal_id} style={{ flex: '0 0 100%', height: '100%', position: 'relative', backgroundImage: `url(${anime.trailer?.images?.maximum_image_url || anime.images.webp.large_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                   <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #0f0f1a 0%, rgba(15,15,26,0.7) 40%, transparent 100%)' }}></div>
                   <div style={{ position: 'absolute', top: '50%', left: '3rem', transform: 'translateY(-50%)', maxWidth: '600px', zIndex: 10 }}>
                     <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ background: '#ff4dd2', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>#1 AIRING</span>
                        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>{anime.rating?.split(' ')[0]}</span>
                     </div>
                     <h1 style={{ fontSize: '2.8rem', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>{anime.title_english || anime.title}</h1>
                     <div style={{ color: '#ffd54a', fontSize: '0.85rem', marginBottom: '15px', fontWeight: 'bold' }}>{anime.genres?.map(g => g.name).join(' • ')}</div>
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
      ) : null}

      <LatestTrailersSection />

      {/* ================= TRENDING ROW ================= */}
      <section style={{ marginTop: '3rem' }}>
        <div className="section-head">
          <h2 className="section-title">🔥 Trending Airing Anime</h2>
          <Link to="/seasons" className="view-all-btn">View All</Link>
        </div>
        <div className="poster-row">
          {trendingAnime.map((anime) => (
            <div key={anime.mal_id} className="poster-card" onClick={() => navigate(`/anime/${anime.mal_id}`)}>
              <div style={{ position: 'relative' }}>
                <img src={anime.images?.webp?.large_image_url} alt={anime.title} className="poster-img" />
                <span className="sub-badge">Sub</span>
                <span className="dub-badge">Dub</span>
                <button onClick={(e) => addToWatchlist(e, anime)} className="card-watchlist-btn"><i className="fas fa-bookmark"></i></button>
              </div>
              <div className="poster-meta" style={{ padding: '10px' }}>
                <div className="poster-title" style={{color: '#fff', fontSize: '0.85rem', fontWeight: 'bold'}}>{anime.title_english || anime.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TODAY'S SCHEDULE ================= */}
      <section style={{ marginTop: '4rem' }}>
        <div className="section-head">
          <h2 className="section-title" style={{ color: '#ff4dd2' }}><i className="fas fa-satellite-dish"></i> Today's Schedule</h2>
          <button onClick={() => navigate('/schedule')} className="view-all-btn">View Full Calendar <i className="fas fa-arrow-right"></i></button>
        </div>
        <div style={{ background: '#121426', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
           <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#ff4dd2', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>{new Date().toLocaleString('en-US', {weekday: 'long'})}'S RELEASES</h3>
           <div className="hide-scrollbar" style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
              {todaySchedule.map((anime) => (
                <div key={anime.mal_id} style={{ minWidth: '320px', background: '#1a1c32', padding: '12px', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'center' }} className="hover-scale" onClick={() => navigate(`/anime/${anime.mal_id}`)}>
                  <img src={anime.images?.webp?.image_url} alt="p" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>{anime.title_english}</h4>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Episode {anime.episodes} | Sub</div>
                  </div>
                  <div style={{ background: 'rgba(255,77,210,0.15)', color: '#ff4dd2', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>{anime.broadcast.time}</div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* ================= 3 COLUMN SECTION (Movies, TV, Awards) ================= */}
      <section style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <div>
           <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem' }}>Top Movies</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {topMovies.map((movie) => (
                <div key={movie.mal_id} className="hover-scale" style={{ display: 'flex', gap: '15px', background: '#1a1c32', padding: '10px', borderRadius: '12px', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/anime/${movie.mal_id}`)}>
                  <img src={movie.images?.webp?.image_url} alt="m" style={{ width: '45px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>{movie.title_english || movie.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#ffd54a' }}>⭐ {movie.score}</span>
                  </div>
                </div>
             ))}
           </div>
        </div>
        <div>
           <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem' }}>Top TV Series</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {topTv.map((tv) => (
                <div key={tv.mal_id} className="hover-scale" style={{ display: 'flex', gap: '15px', background: '#1a1c32', padding: '10px', borderRadius: '12px', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/anime/${tv.mal_id}`)}>
                  <img src={tv.images?.webp?.image_url} alt="t" style={{ width: '45px', height: '60px', borderRadius: '6px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', margin: 0 }}>{tv.title_english || tv.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#ffd54a' }}>⭐ {tv.score}</span>
                  </div>
                </div>
             ))}
           </div>
        </div>
        <div style={{ background: 'rgba(255,213,74,0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,213,74,0.1)' }}>
           <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.5rem' }}>The {new Date().getFullYear()} Awards</h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {awardContenders.map((anime, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'rgba(255,255,255,0.1)', width: '20px' }}>{idx+1}</div>
                  <img src={anime.coverImage?.large} style={{ width: '40px', height: '55px', borderRadius: '6px' }} alt="a" />
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{anime.title.english || anime.title.romaji}</div>
                </div>
             ))}
           </div>
        </div>
      </section>

      {/* ================= POPULAR DUBBED ================= */}
      <section style={{ marginTop: '4rem' }}>
        <div className="section-head">
          <h2 className="section-title">🎙️ Popular Dubbed</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
             <button onClick={() => scrollRef(dubbedRef, 'left')} className="hero-nav-btn" style={{ width: '35px', height: '35px' }}><i className="fas fa-chevron-left"></i></button>
             <button onClick={() => scrollRef(dubbedRef, 'right')} className="hero-nav-btn" style={{ width: '35px', height: '35px' }}><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>
        <div ref={dubbedRef} className="poster-row hide-scrollbar" style={{ overflowX: 'auto' }}>
          {popularDubbed.map((anime) => (
            <div key={anime.mal_id} className="premium-card" style={{ flex: '0 0 200px' }} onClick={() => navigate(`/anime/${anime.mal_id}`)}>
               <div className="poster-card">
                  <img src={anime.images?.webp?.large_image_url} alt="d" className="poster-img" style={{ height: '280px' }} />
                  <span className="dub-badge">Dubbed</span>
                  <div className="poster-meta" style={{ padding: '10px' }}>
                    <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>{anime.title_english || anime.title}</div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= COMMUNITY REVIEWS ================= */}
      <section style={{ marginTop: '4rem', marginBottom: '3rem' }}>
        <div className="section-head"><h2 className="section-title">💬 Community Reviews</h2><Link to="/reviews" className="view-all-btn">View All</Link></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
           {reviews.slice(0, 12).map((review, index) => (
              <div key={index} style={{ background: '#1a1c32', padding: '1.2rem', borderRadius: '12px', display: 'flex', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' }} className="hover-scale">
                 <img src={review.entry.images?.webp?.image_url} alt="a" style={{ width: '60px', height: '90px', borderRadius: '6px', objectFit: 'cover' }} />
                 <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#ffd54a' }}><span>⭐ {review.score}/10</span><span>@{review.user.username}</span></div>
                    <h4 style={{ color: '#fff', margin: '4px 0', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.entry.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{review.review}</p>
                 </div>
              </div>
           ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
