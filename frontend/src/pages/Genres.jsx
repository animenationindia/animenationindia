import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Genres = () => {
  const navigate = useNavigate();
  
  // States
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [animeList, setAnimeList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [loadingAnime, setLoadingAnime] = useState(false);

  // Common delay function
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Magic API Fetcher with Cache
  const fetchJikan = async (cacheKey, url, bypassCache = false) => {
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheKey + '_time');
    const now = new Date().getTime();

    if (!bypassCache && cachedData && cacheTime && now - parseInt(cacheTime) < 24 * 60 * 60 * 1000) {
      return JSON.parse(cachedData); // Genres don't change often, cache for 24h
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
            return data.data;
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

  // 1. Fetch All Genres on Mount
  useEffect(() => {
    const getGenres = async () => {
      setLoadingGenres(true);
      const data = await fetchJikan('ani_genres_list', 'https://api.jikan.moe/v4/genres/anime');
      if (data) {
        // Filter out some obscure ones if needed, or sort by count
        const sortedGenres = data.sort((a, b) => b.count - a.count);
        setGenres(sortedGenres);
      }
      setLoadingGenres(false);
    };
    getGenres();
  }, []);

  // 2. Fetch Anime when a Genre is selected
  useEffect(() => {
    if (!selectedGenre) return;

    const getAnimeByGenre = async () => {
      setLoadingAnime(true);
      
      try {
          const res = await fetch(`https://api.jikan.moe/v4/anime?genres=${selectedGenre.mal_id}&page=${currentPage}&limit=24&order_by=score&sort=desc`);
          if (res.ok) {
              const data = await res.json();
              setAnimeList(data.data || []);
              if (data.pagination) {
                  setTotalPages(data.pagination.last_visible_page > 100 ? 100 : data.pagination.last_visible_page);
              }
          }
      } catch (error) {
          console.error("Failed to fetch anime for genre:", error);
      }
      
      setLoadingAnime(false);
      
      // Scroll smoothly to the results section
      if (currentPage > 1 || selectedGenre) {
         document.getElementById('genre-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    getAnimeByGenre();
  }, [selectedGenre, currentPage]);

  // Handle Genre Click
  const handleGenreClick = (genre) => {
      if (selectedGenre?.mal_id === genre.mal_id) {
          // Deselect if clicking the same genre
          setSelectedGenre(null);
          setAnimeList([]);
      } else {
          setSelectedGenre(genre);
          setCurrentPage(1); // Reset to page 1 for new genre
      }
  };

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

  // Helper to assign colors to genres for a premium look
  const getGenreColor = (index) => {
      const colors = ['#FF4B6B', '#4a90e2', '#FFD54A', '#2ecc71', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c'];
      return colors[index % colors.length];
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh' }}>
      
      {/* ================= HEADER ================= */}
      <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 20px' }}>
          <h1 className="section-title" style={{ fontSize: '3.5rem', color: '#fff', marginBottom: '15px' }}>
              Explore <span style={{ color: 'var(--primary)' }}>Genres</span>
          </h1>
          <p className="section-sub" style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
              Discover new anime based on your favorite categories. From action-packed Shounen to heartwarming Romance.
          </p>
      </div>

      {/* ================= GENRES GRID ================= */}
      <div style={{ padding: '0 20px', marginBottom: '4rem' }}>
          {loadingGenres ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px 0' }}>
                  <i className="fas fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
                  <h3>Loading Categories...</h3>
              </div>
          ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                  {genres.map((genre, index) => {
                      const isSelected = selectedGenre?.mal_id === genre.mal_id;
                      const accentColor = getGenreColor(index);
                      
                      return (
                          <button
                              key={genre.mal_id}
                              onClick={() => handleGenreClick(genre)}
                              className="hover-scale"
                              style={{
                                  background: isSelected ? accentColor : 'rgba(255,255,255,0.03)',
                                  border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                  color: isSelected ? '#fff' : 'var(--text-muted)',
                                  padding: '12px 25px',
                                  borderRadius: '99px',
                                  fontSize: '1rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  boxShadow: isSelected ? `0 10px 20px ${accentColor}40` : 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px'
                              }}
                              onMouseOver={(e) => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; } }}
                              onMouseOut={(e) => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                          >
                              {genre.name} 
                              <span style={{ 
                                  background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)', 
                                  padding: '2px 8px', 
                                  borderRadius: '10px', 
                                  fontSize: '0.75rem' 
                              }}>
                                  {genre.count.toLocaleString()}
                              </span>
                          </button>
                      );
                  })}
              </div>
          )}
      </div>

      {/* ================= ANIME RESULTS SECTION ================= */}
      <div id="genre-results" style={{ padding: '0 20px', minHeight: '400px' }}>
          
          {/* Header for Results */}
          {selectedGenre && (
              <div style={{ marginBottom: '30px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <h2 style={{ color: '#fff', fontSize: '2rem', margin: 0 }}>
                      Top <span style={{ color: 'var(--primary)' }}>{selectedGenre.name}</span> Anime
                  </h2>
                  <button 
                      onClick={() => {setSelectedGenre(null); setAnimeList([]);}} 
                      style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', padding: '8px 15px', borderRadius: '99px', cursor: 'pointer', fontWeight: 'bold' }}
                      className="hover-bg-change"
                  >
                      <i className="fas fa-times"></i> Clear Filter
                  </button>
              </div>
          )}

          {/* Loading State for Anime */}
          {selectedGenre && loadingAnime ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '100px 0' }}>
                  <i className="fas fa-circle-notch fa-spin fa-4x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
                  <h3>Finding the best {selectedGenre.name} anime...</h3>
              </div>
          ) : selectedGenre && animeList.length === 0 && !loadingAnime ? (
              <div style={{ textAlign: 'center', padding: '50px', background: 'var(--bg-elevated)', borderRadius: '20px' }}>
                  <i className="fas fa-ghost fa-3x" style={{ opacity: 0.5, marginBottom: '15px', color: 'var(--text-muted)' }}></i>
                  <h3 style={{ color: '#fff' }}>No anime found for this category.</h3>
              </div>
          ) : selectedGenre && animeList.length > 0 ? (
              <>
                  {/* Anime Grid */}
                  <div className="grid-wrap" style={{ display: 'grid', gap: '25px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', marginBottom: '50px' }}>
                      {animeList.map((anime) => (
                          <div 
                              key={anime.mal_id} 
                              className="anime-card hover-scale" 
                              style={{ background: 'var(--bg-elevated)', borderRadius: '18px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} 
                              onClick={() => navigate(`/anime/${anime.mal_id}`)}
                          >
                              <div style={{ position: 'relative', height: '320px' }}>
                                  <img src={anime.images?.webp?.large_image_url} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  
                                  {/* Score Badge */}
                                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(4px)' }}>
                                      <i className="fas fa-star" style={{color: 'var(--accent)'}}></i> {anime.score || 'N/A'}
                                  </div>

                                  {/* 🔥 FLOATING WATCHLIST BUTTON 🔥 */}
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
                                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {anime.title_english || anime.title}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                          {anime.type || 'TV'} • {anime.episodes ? `${anime.episodes} Eps` : 'Ongoing'}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Pagination Controls */}
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
          ) : (
              // Default state when no genre is selected
              <div style={{ textAlign: 'center', padding: '100px 20px', opacity: 0.6 }}>
                  <i className="fas fa-mouse-pointer fa-4x" style={{ color: 'var(--text-muted)', marginBottom: '20px' }}></i>
                  <h2 style={{ color: '#fff', fontSize: '2rem' }}>Select a Genre</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Click on any category above to discover top-rated anime in that genre.</p>
              </div>
          )}
      </div>

    </div>
  );
};

export default Genres;