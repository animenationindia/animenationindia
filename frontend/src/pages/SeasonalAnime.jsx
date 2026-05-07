import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../api/config';

const SeasonalAnime = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Helper arrays for Seasons
  const seasonsOrder = ['winter', 'spring', 'summer', 'fall'];
  const currentYear = new Date().getFullYear(); // 2026

  // Determine current season based on current month
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  };

  // State Management
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(currentYear);
  const [season, setSeason] = useState(getCurrentSeason());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Generate Season List for Dropdown (Current Year down to 2013)
  const generateSeasonOptions = () => {
    const options = [];
    for (let y = currentYear + 1; y >= 2013; y--) {
      // Added currentYear + 1 to include upcoming year
      seasonsOrder.slice().reverse().forEach(s => {
        // Skip future seasons beyond next year
        if (y === currentYear + 1 && (s === 'fall' || s === 'summer')) return; 
        options.push({ year: y, season: s });
      });
    }
    return options;
  };
  const seasonOptions = generateSeasonOptions();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 FETCH DATA FROM JIKAN API 🔥
  useEffect(() => {
    const fetchSeasonalAnime = async () => {
      setLoading(true);
      setAnimeList([]);
      try {
        const response = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}?limit=24`);
        if (response.ok) {
          const data = await response.json();
          setAnimeList(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching seasonal anime:", error);
      }
      setLoading(false);
    };

    fetchSeasonalAnime();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [year, season]);

  // Navigate Prev/Next Season
  const handleSeasonChange = (direction) => {
    let currentIdx = seasonsOrder.indexOf(season);
    let newYear = year;
    let newSeasonIdx;

    if (direction === 'next') {
      newSeasonIdx = currentIdx + 1;
      if (newSeasonIdx > 3) {
        newSeasonIdx = 0;
        newYear += 1;
      }
    } else {
      newSeasonIdx = currentIdx - 1;
      if (newSeasonIdx < 0) {
        newSeasonIdx = 3;
        newYear -= 1;
      }
    }
    
    // Limit check (Don't go below 2013)
    if (newYear >= 2013) {
        setSeason(seasonsOrder[newSeasonIdx]);
        setYear(newYear);
    }
  };

  // 🔥 WATCHLIST LOGIC 🔥
  const addToWatchlist = async (e, item) => {
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
            body: JSON.stringify({ anime: item, userId: userId }) 
        });
        const data = await response.json();
        if (response.ok) alert(`🎉 ${item.title_english || item.title} saved to your collection!`);
        else alert(`⚠️ ${data.message || "Already in your Watchlist!"}`);
    } catch (error) {
        console.error("Database error", error);
        alert("❌ Failed to connect to Database.");
    }
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* ================= HEADER & DROPDOWN ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#fff', fontWeight: '800', margin: 0, textTransform: 'capitalize' }}>
          {season} {year} Anime
        </h1>

        {/* CUSTOM DROPDOWN (Crunchyroll Style) */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', transition: '0.3s' }}
            className="hover-bg-change"
          >
            <i className="fas fa-filter" style={{ color: 'var(--primary)' }}></i> {season} {year} <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'}`} style={{ marginLeft: '10px', fontSize: '0.8rem' }}></i>
          </button>

          {isDropdownOpen && (
            <div className="hide-scrollbar" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: '#1a1c32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '220px', maxHeight: '350px', overflowY: 'auto', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              {seasonOptions.map((opt, idx) => (
                <div 
                  key={idx}
                  onClick={() => { setYear(opt.year); setSeason(opt.season); setIsDropdownOpen(false); }}
                  style={{ padding: '12px 20px', color: (opt.year === year && opt.season === season) ? 'var(--primary)' : '#fff', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', textTransform: 'capitalize', fontWeight: (opt.year === year && opt.season === season) ? 'bold' : 'normal', background: (opt.year === year && opt.season === season) ? 'rgba(255,255,255,0.05)' : 'transparent', transition: '0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.background = (opt.year === year && opt.season === season) ? 'rgba(255,255,255,0.05)' : 'transparent'}
                >
                  {opt.season} {opt.year}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= ANIME GRID ================= */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--primary)' }}>
            <i className="fas fa-spinner fa-spin fa-4x"></i>
            <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#fff' }}>Loading Seasonal Anime...</p>
          </div>
        ) : animeList.length > 0 ? (
          <div className="grid-wrap" style={{ display: 'grid', gap: '25px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {animeList.map((anime) => (
              <div 
                key={anime.mal_id} 
                className="anime-card hover-scale" 
                style={{ background: 'var(--bg-elevated)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}
                onClick={() => navigate(`/anime/${anime.mal_id}`)}
              >
                <div style={{ position: 'relative', height: '280px' }}>
                    <img src={anime.images?.webp?.large_image_url} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    
                    {/* Watchlist Bookmark Icon */}
                    <button 
                        onClick={(e) => addToWatchlist(e, anime)}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: '0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                    >
                        <i className="fas fa-bookmark"></i>
                    </button>
                    
                    {/* Sub | Dub Tags */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', gap: '5px' }}>
                        <span style={{ background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>Subtitled</span>
                    </div>
                </div>
                
                <div style={{ padding: '15px' }}>
                  <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', marginBottom: '8px', minHeight: '40px' }}>
                    {anime.title_english || anime.title}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {anime.type || 'TV'} • {anime.episodes ? `${anime.episodes} Eps` : 'Airing'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            <h2 style={{ color: '#fff', fontSize: '2rem' }}>No Anime Found</h2>
            <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>We couldn't find any data for this season.</p>
          </div>
        )}
      </div>

      {/* ================= PREV / NEXT SEASON NAVIGATION ================= */}
      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4rem', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              onClick={() => handleSeasonChange('prev')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', transition: '0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <i className="fas fa-chevron-left"></i> Previous Season
            </button>
            
            <button 
              onClick={() => handleSeasonChange('next')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', transition: '0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Next Season <i className="fas fa-chevron-right"></i>
            </button>
        </div>
      )}

    </div>
  );
};

export default SeasonalAnime;
