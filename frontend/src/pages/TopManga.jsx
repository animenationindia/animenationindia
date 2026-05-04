import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TopManga = () => {
  const navigate = useNavigate();
  
  // States
  const [topManga, setTopManga] = useState([]);
  const [allManga, setAllManga] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const removeDuplicates = (mangaArray) => {
    if (!mangaArray || !Array.isArray(mangaArray)) return [];
    return Array.from(new Map(mangaArray.map(item => [item.mal_id, item])).values());
  };

  // 🔥 BULLETPROOF FETCHER FOR MANGA (cache enabled by default)
  const fetchJikan = async (cacheKey, url, bypassCache = false) => {
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(cacheKey + '_time');
    const now = new Date().getTime();

    // 🔥 FIX: Cache use karo — rate limit se bachega
    if (!bypassCache && cachedData && cacheTime && now - parseInt(cacheTime) < 6 * 60 * 60 * 1000) {
      return JSON.parse(cachedData);
    }

    let retries = 3;
    while (retries > 0) {
      try {
        const res = await fetch(url);
        if (res.status === 429) {
          await delay(3000); // Rate limit: 3 sec wait
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

  // 1. Fetch Top 3 Manga — pehle yeh load hoga
  useEffect(() => {
    const getTopManga = async () => {
      setLoadingTop(true);
      const data = await fetchJikan('ani_top_manga_3', 'http://localhost:5000/api/manga/top');
      if (data && data.data) {
        setTopManga(removeDuplicates(data.data));
      }
      setLoadingTop(false);
    };
    getTopManga();
  }, []);

  // 2. Fetch Paginated "All Manga" — 🔥 FIX: 1s delay + bypassCache hata diya
  useEffect(() => {
    const getAllManga = async () => {
      setLoadingAll(true);

      // 🔥 FIX: 1 second stagger — top manga ke request ke baad wait karo
      // Jikan rate limit: max 3 req/sec. Dono ek saath jaane se 500 aata tha.
      if (currentPage === 1) await delay(1000);

      const cacheKey = `ani_all_manga_page_${currentPage}`;
      // 🔥 FIX: bypassCache=true hata diya — ab cache use hoga, rate limit nahi lagega
      const data = await fetchJikan(cacheKey, `http://localhost:5000/api/manga/all?page=${currentPage}`);
      
      if (data && data.data) {
        setAllManga(removeDuplicates(data.data));
        if (data.pagination) {
            setTotalPages(data.pagination.last_visible_page > 100 ? 100 : data.pagination.last_visible_page);
        }
      }
      setLoadingAll(false);
      
      if(currentPage > 1) {
         document.getElementById('all-manga-section').scrollIntoView({ behavior: 'smooth' });
      }
    };
    getAllManga();
  }, [currentPage]);

  // 3. Live Manga Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`http://localhost:5000/api/manga/search?q=${searchQuery}`);
          if (res.ok) {
              const data = await res.json();
              setSearchResults(removeDuplicates(data.data)); 
          }
        } catch (err) { console.error(err); }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // ===============================================================
  // 🔥 PERSONAL DATABASE SAVE LOGIC 🔥
  // ===============================================================
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

  // Pagination Functions
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
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem' }}>
      
      {/* ================= HEADER & SEARCH BAR ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '3rem', padding: '0 20px' }}>
          <div>
            <h1 className="section-title" style={{ fontSize: '2.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px' }}>
                📚 Top Manga Series
            </h1>
            <p className="section-sub" style={{ fontSize: '1rem' }}>Highest rated manga, manhwa, and novels of all time.</p>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '350px', zIndex: 50 }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', padding: '5px 15px', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-search" style={{ color: 'var(--text-muted)' }}></i>
              <input 
                type="text" 
                placeholder="Search Manga..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '10px 0', width: '100%', outline: 'none' }}
              />
            </div>

            {searchQuery.length > 2 && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#121326', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', overflow: 'hidden' }}>
                {isSearching ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin"></i> Searching...</div>
                : searchResults.length > 0 ? searchResults.map((manga, index) => (
                    <Link to={`/manga/${manga.mal_id}`} key={index} style={{ display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', alignItems: 'center', textDecoration: 'none' }}>
                      <img src={manga.images?.webp?.large_image_url} alt="poster" style={{ width: '40px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{manga.title_english || manga.title}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '5px', display: 'inline-block' }}>{manga.type || 'Manga'} • {manga.score || 'N/A'} <i className="fas fa-star"></i></span>
                      </div>
                    </Link>
                  )) : <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No manga found.</div>}
              </div>
            )}
          </div>
      </div>

      {/* ================= TOP 3 MANGA ================= */}
      <div style={{ padding: '0 20px', marginBottom: '5rem' }}>
          {loadingTop ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}><i className="fas fa-spinner fa-spin fa-2x"></i></div>
          ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {topManga.map((manga, index) => (
                      <Link to={`/manga/${manga.mal_id}`} key={manga.mal_id} style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: '20px', padding: '20px', gap: '20px', alignItems: 'center', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.05)' }} className="hover-scale">
                          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-muted)', width: '50px', textAlign: 'center' }}>#{index + 1}</div>
                          <img src={manga.images?.webp?.large_image_url} alt={manga.title} style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }} />
                          <div style={{ flex: 1 }}>
                              <h3 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '10px' }}>{manga.title_english || manga.title}</h3>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                  {manga.genres?.slice(0,4).map(g => (
                                      <span key={g.mal_id} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.8rem' }}>{g.name}</span>
                                  ))}
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                  {manga.type || 'Manga'} • {manga.published?.prop?.from?.year || 'Unknown'} • {manga.chapters ? `${manga.chapters} Chapters` : 'Publishing'}
                              </div>
                          </div>
                          <div style={{ textAlign: 'right', paddingRight: '20px' }}>
                              <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold' }}><i className="fas fa-star" style={{ color: 'var(--accent)', fontSize: '1.2rem' }}></i> {manga.score}</div>
                              <button onClick={(e) => addToWatchlist(e, manga)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 15px', borderRadius: '99px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', zIndex: 10, position: 'relative' }}>
                                  + Bookmark
                              </button>
                          </div>
                      </Link>
                  ))}
              </div>
          )}
      </div>

      {/* ================= ALL MANGA SECTION ================= */}
      <div id="all-manga-section" style={{ padding: '0 20px', paddingTop: '20px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.8rem', borderLeft: '4px solid var(--accent)', paddingLeft: '15px', marginBottom: '30px' }}>All Manga Collection</h2>
          
          {loadingAll ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '100px 0' }}><i className="fas fa-spinner fa-spin fa-3x"></i><p style={{marginTop: '20px'}}>Loading Manga Page {currentPage}...</p></div>
          ) : (
              <>
                  <div className="grid-wrap" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginBottom: '40px' }}>
                      {allManga.map((manga) => (
                          <Link to={`/manga/${manga.mal_id}`} key={`all-${manga.mal_id}`} className="anime-card hover-scale" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', overflow: 'hidden', textDecoration: 'none', display: 'block', position: 'relative' }}>
                              <div style={{ position: 'relative' }}>
                                  <img src={manga.images?.webp?.large_image_url} alt={manga.title} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '3px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <i className="fas fa-star" style={{color: 'var(--accent)'}}></i> {manga.score || 'N/A'}
                                  </div>
                              </div>
                              <div style={{ padding: '15px' }}>
                                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{manga.title_english || manga.title}</div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{manga.genres?.map(g=>g.name).join(', ') || 'Manga'}</div>
                              </div>
                              <button onClick={(e) => addToWatchlist(e, manga)} style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'var(--primary)', border: 'none', color: '#fff', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                                  <i className="fas fa-bookmark"></i>
                              </button>
                          </Link>
                      ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={handlePrevPage} disabled={currentPage === 1} style={{ padding: '10px 20px', borderRadius: '99px', border: 'none', background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'var(--primary)', color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-chevron-left"></i> Prev
                      </button>
                      <div style={{ display: 'flex', gap: '5px' }}>
                          {getPageNumbers().map(num => (
                              <button key={num} onClick={() => handlePageClick(num)} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: currentPage === num ? '#fff' : 'rgba(255,255,255,0.05)', color: currentPage === num ? '#000' : '#fff', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
                                  {num}
                              </button>
                          ))}
                      </div>
                      <button onClick={handleNextPage} disabled={currentPage === totalPages} style={{ padding: '10px 20px', borderRadius: '99px', border: 'none', background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'var(--primary)', color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Next <i className="fas fa-chevron-right"></i>
                      </button>
                  </div>
              </>
          )}
      </div>

    </div>
  );
};

export default TopManga;