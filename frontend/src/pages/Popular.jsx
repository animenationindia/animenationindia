import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Popular = () => {
  const navigate = useNavigate();
  
  // States
  const [popularAnime, setPopularAnime] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Magic Function to Remove Duplicates
  const removeDuplicates = (animeArray) => {
    if (!animeArray || !Array.isArray(animeArray)) return [];
    return Array.from(new Map(animeArray.map(item => [item.mal_id, item])).values());
  };

  // 🔥 BULLETPROOF FETCHER FOR JIKAN 🔥
  const fetchJikan = async (cacheKey, url, bypassCache = false) => {
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheKey + '_time');
    const now = new Date().getTime();

    if (!bypassCache && cachedData && cacheTime && now - parseInt(cacheTime) < 6 * 60 * 60 * 1000) {
      return JSON.parse(cachedData);
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
          if (data) {
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(cacheKey + '_time', now.toString());
            return data;
          }
        }
        return null;
      } catch (error) {
        retries--;
        await delay(2000);
      }
    }
    return null; 
  };

  // Fetch Paginated Popular Anime
  useEffect(() => {
    const getPopularAnime = async () => {
      setLoading(true);
      const cacheKey = `ani_popular_page_${currentPage}`;
      // 🔥 API Endpoint filtering by popularity 🔥
      const data = await fetchJikan(cacheKey, `https://api.jikan.moe/v4/top/anime?filter=bypopularity&page=${currentPage}&limit=24`, true); 
      
      if (data && data.data) {
        setPopularAnime(removeDuplicates(data.data));
        if (data.pagination) {
            // Cap pages at 100 to prevent API overload
            setTotalPages(data.pagination.last_visible_page > 100 ? 100 : data.pagination.last_visible_page);
        }
      }
      setLoading(false);
      
      if (currentPage > 1) {
         window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    
    getPopularAnime();
  }, [currentPage]);

  // ===============================================================
  // 🔥 PERSONAL DATABASE SAVE LOGIC 🔥
  // ===============================================================
  const addToWatchlist = async (e, anime) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        alert("Please login first to add to your watchlist!");
        navigate('/auth');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                anime: anime,
                userId: userId
            }) 
        });

        const data = await response.json();

        if (response.ok) {
            alert(`🎉 ${anime.title_english || anime.title} saved to your collection!`);
        } else {
            alert(`⚠️ ${data.message || "Already in your Watchlist!"}`);
        }
    } catch (error) {
        console.error("Database connection error", error);
        alert("❌ Failed to connect to Database.");
    }
  };

  // Pagination Controls
  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };
  const handlePageClick = (pageNum) => { setCurrentPage(pageNum); };

  const getPageNumbers = () => {
      let pages = [];
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      return pages;
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh' }}>
      
      {/* ================= HEADER ================= */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 20px' }}>
          <h1 className="section-title" style={{ fontSize: '3rem', color: '#fff', marginBottom: '10px' }}>
              🔥 Most Popular Anime
          </h1>
          <p className="section-sub" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              The most recognized and loved anime series of all time by the global community.
          </p>
      </div>

      {/* ================= GRID SECTION ================= */}
      <div style={{ padding: '0 20px' }}>
          
          {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '100px 0' }}>
                  <i className="fas fa-spinner fa-spin fa-4x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
                  <h3>Loading Popular Anime (Page {currentPage})...</h3>
              </div>
          ) : (
              <>
                  <div className="grid-wrap" style={{ display: 'grid', gap: '25px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', marginBottom: '50px' }}>
                      {popularAnime.map((anime) => (
                          <div 
                              key={anime.mal_id} 
                              className="anime-card hover-scale" 
                              style={{ background: 'var(--bg-elevated)', borderRadius: '18px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} 
                              onClick={() => navigate(`/anime/${anime.mal_id}`)}
                          >
                              <div style={{ position: 'relative', height: '320px' }}>
                                  <img src={anime.images?.webp?.large_image_url} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  
                                  {/* Rank Badge */}
                                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--primary)', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                                      #{anime.popularity || 'N/A'}
                                  </div>

                                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(4px)' }}>
                                      <i className="fas fa-users" style={{color: 'var(--accent)'}}></i> {(anime.members / 1000000).toFixed(1)}M
                                  </div>

                                  {/* 🔥 FLOATING WATCHLIST ICON BUTTON 🔥 */}
                                  <button 
                                      onClick={(e) => addToWatchlist(e, anime)} 
                                      style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'var(--primary)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 4px 15px rgba(255,75,107,0.5)', transition: '0.2s' }}
                                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  >
                                      <i className="fas fa-bookmark"></i>
                                  </button>
                              </div>
                              
                              <div style={{ padding: '20px 15px' }}>
                                  {/* 🔥 TITLE: English First 🔥 */}
                                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {anime.title_english || anime.title}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                          {anime.type || 'TV'} • {anime.episodes ? `${anime.episodes} Eps` : 'Ongoing'}
                                      </span>
                                      <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                          <i className="fas fa-star" style={{ color: 'var(--accent)', marginRight: '4px' }}></i>{anime.score || 'N/A'}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* ================= PAGINATION CONTROLS ================= */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button 
                          onClick={handlePrevPage} 
                          disabled={currentPage === 1} 
                          style={{ padding: '12px 25px', borderRadius: '99px', border: 'none', background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'var(--primary)', color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}
                      >
                          <i className="fas fa-chevron-left"></i> Prev
                      </button>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                          {getPageNumbers().map(num => (
                              <button 
                                  key={num} 
                                  onClick={() => handlePageClick(num)} 
                                  style={{ width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: currentPage === num ? '#fff' : 'rgba(255,255,255,0.05)', color: currentPage === num ? '#000' : '#fff', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s', fontSize: '1rem' }}
                              >
                                  {num}
                              </button>
                          ))}
                      </div>
                      
                      <button 
                          onClick={handleNextPage} 
                          disabled={currentPage === totalPages} 
                          style={{ padding: '12px 25px', borderRadius: '99px', border: 'none', background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'var(--primary)', color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}
                      >
                          Next <i className="fas fa-chevron-right"></i>
                      </button>
                  </div>
              </>
          )}
      </div>

    </div>
  );
};

export default Popular;