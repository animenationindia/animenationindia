import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../api/config';

const UpcomingAnime = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Time States
  const [indTime, setIndTime] = useState('');
  const [indDate, setIndDate] = useState('');
  const [jpTime, setJpTime] = useState('');
  const [jpDate, setJpDate] = useState('');

  // Year States
  const [year, setYear] = useState(2027); // Default upcoming year
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Pagination State (For showing ALL anime)
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Generate Year Options (2027 to 2032)
  const yearsList = [2027, 2028, 2029, 2030, 2031, 2032];

  // Live Clocks Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Indian Time
      setIndTime(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIndDate(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
      
      // Japan Time
      setJpTime(now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setJpDate(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 FETCH DATA FROM JIKAN API 🔥
  useEffect(() => {
    const fetchUpcomingAnime = async () => {
      setLoading(true);
      try {
        // Fetching specific year data (Sorted by popularity)
        const response = await fetch(`https://api.jikan.moe/v4/anime?start_date=${year}-01-01&end_date=${year}-12-31&order_by=members&sort=desc&page=${page}`);
        if (response.ok) {
          const data = await response.json();
          if (page === 1) {
            setAnimeList(data.data || []);
          } else {
            setAnimeList(prev => [...prev, ...(data.data || [])]);
          }
          setHasNextPage(data.pagination?.has_next_page || false);
        }
      } catch (error) {
        console.error("Error fetching upcoming anime:", error);
      }
      setLoading(false);
    };

    fetchUpcomingAnime();
    if (page === 1) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [year, page]);

  // Navigate Prev/Next Year
  const handleYearChange = (direction) => {
    let newYear = direction === 'next' ? year + 1 : year - 1;
    if (newYear >= 2027 && newYear <= 2032) {
        setYear(newYear);
        setPage(1); // Reset page to 1 when year changes
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
        if (response.ok) alert(`🎉 ${item.title_english || item.title} saved!`);
        else alert(`⚠️ ${data.message || "Already in your Watchlist!"}`);
    } catch (error) {
        console.error("Database error", error);
        alert("❌ Failed to connect to Database.");
    }
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* ================= STYLISH DUAL CLOCKS ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '3rem', padding: '0 20px' }}>
          
          {/* INDIAN CLOCK */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.1) 0%, rgba(255,255,255,0.03) 50%, rgba(19, 136, 8, 0.1) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: '4px solid #FF9933', borderRight: '4px solid #138808', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 15px 30px rgba(0,0,0,0.4)' }}>
              <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}><i className="fas fa-map-marker-alt" style={{color: '#FF9933'}}></i> INDIA (IST)</h4>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>{indDate || 'Loading...'}</div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', textShadow: '0 0 10px rgba(255, 153, 51, 0.5)' }}>
                  {indTime || '00:00:00'}
              </div>
          </div>

          {/* JAPANESE CLOCK */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(188, 0, 45, 0.15) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: '4px solid #BC002D', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 15px 30px rgba(0,0,0,0.4)' }}>
              <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}><i className="fas fa-torii-gate" style={{color: '#BC002D'}}></i> JAPAN (JST)</h4>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>{jpDate || 'Loading...'}</div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', fontFamily: 'monospace', letterSpacing: '2px', textShadow: '0 0 10px rgba(188, 0, 45, 0.5)' }}>
                  {jpTime || '00:00:00'}
              </div>
          </div>
      </div>

      {/* ================= HEADER & DROPDOWN ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '15px', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#fff', fontWeight: '800', margin: 0 }}>
          Upcoming {year} Releases
        </h1>

        {/* YEAR DROPDOWN */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 20px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}
            className="hover-bg-change"
          >
            <i className="fas fa-calendar-alt" style={{ color: 'var(--primary)' }}></i> YEAR {year} <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'}`} style={{ marginLeft: '10px', fontSize: '0.8rem' }}></i>
          </button>

          {isDropdownOpen && (
            <div className="hide-scrollbar" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '10px', background: '#1a1c32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', width: '180px', maxHeight: '300px', overflowY: 'auto', zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              {yearsList.map((y) => (
                <div 
                  key={y}
                  onClick={() => { setYear(y); setPage(1); setIsDropdownOpen(false); }}
                  style={{ padding: '12px 20px', color: y === year ? 'var(--primary)' : '#fff', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: y === year ? 'bold' : 'normal', background: y === year ? 'rgba(255,255,255,0.05)' : 'transparent', transition: '0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.background = y === year ? 'rgba(255,255,255,0.05)' : 'transparent'}
                >
                  Year {y}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= ANIME GRID ================= */}
      <div style={{ padding: '0 20px' }}>
        {animeList.length > 0 ? (
          <>
            <div className="grid-wrap" style={{ display: 'grid', gap: '25px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {animeList.map((anime, index) => (
                <div 
                  key={`${anime.mal_id}-${index}`} 
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
                          <span style={{ background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', backdropFilter: 'blur(5px)' }}>Upcoming</span>
                      </div>
                  </div>
                  
                  <div style={{ padding: '15px' }}>
                    <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', marginBottom: '8px', minHeight: '40px' }}>
                      {anime.title_english || anime.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {anime.type || 'TV'} • {year}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* LOAD MORE BUTTON FOR SHOWING ALL */}
            {hasNextPage && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button 
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={loading}
                  className="btn-primary hover-scale"
                  style={{ padding: '12px 35px', borderRadius: '99px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Load More Releases'}
                </button>
              </div>
            )}
          </>
        ) : loading && page === 1 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--primary)' }}>
            <i className="fas fa-spinner fa-spin fa-4x"></i>
            <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#fff' }}>Hunting future releases...</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            <h2 style={{ color: '#fff', fontSize: '2rem' }}>No Anime Announced</h2>
            <p style={{ marginTop: '10px', fontSize: '1.1rem' }}>Studios haven't revealed much for {year} yet. Check back later!</p>
          </div>
        )}
      </div>

      {/* ================= PREV / NEXT YEAR NAVIGATION ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4rem', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={() => handleYearChange('prev')}
            disabled={year === 2027}
            style={{ background: 'transparent', border: 'none', color: year === 2027 ? 'rgba(255,255,255,0.2)' : 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold', cursor: year === 2027 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', transition: '0.3s' }}
            onMouseOver={(e) => { if(year !== 2027) e.currentTarget.style.color = '#fff' }}
            onMouseOut={(e) => { if(year !== 2027) e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <i className="fas fa-chevron-left"></i> Previous Year
          </button>
          
          <button 
            onClick={() => handleYearChange('next')}
            disabled={year === 2032}
            style={{ background: 'transparent', border: 'none', color: year === 2032 ? 'rgba(255,255,255,0.2)' : 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold', cursor: year === 2032 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', transition: '0.3s' }}
            onMouseOver={(e) => { if(year !== 2032) e.currentTarget.style.color = '#fff' }}
            onMouseOut={(e) => { if(year !== 2032) e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            Next Year <i className="fas fa-chevron-right"></i>
          </button>
      </div>

    </div>
  );
};

export default UpcomingAnime;
