import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TopTvSeries = () => {
  const navigate = useNavigate();
  const [shows, setShows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🚀 Jikan API Fetcher for TV Series 🚀
  const fetchShows = async (searchParam = "", pageNum = 1) => {
    setLoading(true);
    try {
      const url = searchParam 
        ? `https://api.jikan.moe/v4/anime?type=tv&q=${searchParam}&page=${pageNum}`
        : `https://api.jikan.moe/v4/top/anime?type=tv&page=${pageNum}`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.data) {
          setShows(data.data);
          setTotalPages(data.pagination?.last_visible_page || 1);
      } else {
          setShows([]);
          setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching shows:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    if (searchQuery.length > 2 || searchQuery.length === 0) {
       fetchShows(searchQuery.length > 2 ? searchQuery : "", currentPage);
    }
  }, [currentPage]);

  // Debounced Search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setCurrentPage(1); 
      if (searchQuery.length > 2) {
        fetchShows(searchQuery, 1);
      } else if (searchQuery.length === 0) {
        fetchShows("", 1); 
      }
    }, 600); 
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const resetToAllShows = () => {
    setSearchQuery(''); 
    setCurrentPage(1); 
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '50px' }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '20px' }}>
        <div>
          <h1 
            onClick={resetToAllShows} 
            style={{ fontSize: '2.5rem', color: '#fff', margin: 0, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}
            title="Click to view all Top TV Series"
          >
            <i className="fas fa-tv" style={{color: 'var(--primary)'}}></i> Top TV Series
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>Binge the most popular and highest-rated anime shows.</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
          <input 
            type="text" 
            placeholder="Search TV series..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--primary)' }}>
          <i className="fas fa-spinner fa-spin fa-3x"></i>
          <p style={{ marginTop: '15px', color: '#fff' }}>Fetching TV Series...</p>
        </div>
      ) : shows.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
            {shows.map((show) => (
              <div 
                key={show.mal_id} 
                className="hover-scale" 
                onClick={() => navigate(`/anime/${show.mal_id}`)}
                style={{ cursor: 'pointer', background: 'var(--bg-elevated)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div style={{ position: 'relative', width: '100%', height: '300px' }}>
                  <img src={show.images?.webp?.large_image_url} alt={show.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: 'var(--accent)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    <i className="fas fa-star"></i> {show.score || 'N/A'}
                  </div>
                </div>
                
                <div style={{ padding: '1.2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {show.title_english || show.title}
                  </h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {show.episodes ? `${show.episodes} Eps` : 'Airing'} • {show.genres && show.genres[0] ? show.genres[0].name : 'Anime'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '3rem' }}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: currentPage === 1 ? 'gray' : '#fff' }}
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button 
                      key={pageNum} 
                      onClick={() => handlePageChange(pageNum)} 
                      style={{ width: '35px', height: '35px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: currentPage === pageNum ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: currentPage === pageNum ? '#fff' : 'var(--text-muted)' }}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} style={{ color: 'var(--text-muted)' }}>...</span>;
                }
                return null;
              })}

              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: currentPage === totalPages ? 'gray' : '#fff' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <i className="fas fa-search fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '15px' }}></i>
          <h3 style={{ color: '#fff' }}>No TV series found!</h3>
        </div>
      )}
    </div>
  );
};

export default TopTvSeries;