import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // navigate ta soriye dilam karon dorkar nei

const Trailers = () => {
  const [trailers, setTrailers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 🔥 Pagination States 🔥
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🚀 The Master AniList Fetcher with Pagination & Search 🚀
  const fetchTrailers = async (searchParam = "", pageNum = 1) => {
    setLoading(true);
    
    // GraphQL Query with PageInfo
    const query = `
      query ($search: String, $page: Int) {
        Page(page: $page, perPage: 24) {
          pageInfo {
            currentPage
            lastPage
            hasNextPage
          }
          media(search: $search, sort: TRENDING_DESC, type: ANIME) {
            id
            idMal
            title { english romaji }
            trailer { id site }
          }
        }
      }
    `;

    const variables = { page: pageNum };
    if (searchParam) variables.search = searchParam;

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables })
      });
      const data = await response.json();
      
      if (data?.data?.Page) {
          // Shudhu YouTube trailer thakle filter korbe
          const mediaArray = data.data.Page.media || [];
          const validTrailers = mediaArray.filter(anime => anime.trailer && anime.trailer.site === "youtube");
          
          // Remove duplicates
          const unique = Array.from(new Map(validTrailers.map(item => [item.trailer.id, item])).values());
          
          setTrailers(unique);
          setTotalPages(data.data.Page.pageInfo.lastPage || 1);
      } else {
          setTrailers([]);
          setTotalPages(1);
      }
    } catch (error) {
      console.error("AniList Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Jokhon page number change hobe ba load hobe
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    if (searchQuery.length > 2 || searchQuery.length === 0) {
       fetchTrailers(searchQuery.length > 2 ? searchQuery : "", currentPage);
    }
  }, [currentPage]);

  // 🔍 Live Search Typing effect
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      setCurrentPage(1); // Notun search e always page 1 theke shuru hobe
      if (searchQuery.length > 2) {
        fetchTrailers(searchQuery, 1);
      } else if (searchQuery.length === 0) {
        fetchTrailers("", 1); 
      }
    }, 600); 

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 🔥 THE NEW RESET FUNCTION 🔥
  const resetToAllTrailers = () => {
    setSearchQuery(''); // Search faka kore debe
    setCurrentPage(1); // 1 no page e niye jabe
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '50px' }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '20px' }}>
        <div>
          {/* 🔥 CLICK KORLE RESET HOBE 🔥 */}
          <h1 
            onClick={resetToAllTrailers} 
            style={{ fontSize: '2.5rem', color: '#fff', margin: 0, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}
            title="Click to view all trailers"
          >
            <i className="fas fa-film" style={{color: 'var(--primary)'}}></i> Anime Trailers
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>Watch the latest and classic anime promos.</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
          <input 
            type="text" 
            placeholder="Search anime trailers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--primary)' }}>
          <i className="fas fa-spinner fa-spin fa-3x"></i>
          <p style={{ marginTop: '15px', color: '#fff' }}>Fetching HD Trailers from AniList...</p>
        </div>
      ) : trailers.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {trailers.map((anime) => (
              <div key={anime.id} className="hover-scale" style={{ background: 'var(--bg-elevated)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                  <iframe 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                    src={`https://www.youtube.com/embed/${anime.trailer.id}`} 
                    title={anime.title.english || anime.title.romaji} 
                    frameBorder="0" 
                    allowFullScreen 
                    loading="lazy">
                  </iframe>
                </div>
                
                <div style={{ padding: '1.2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {anime.title.english || anime.title.romaji}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', background: 'rgba(255,213,74,0.1)', padding: '4px 10px', borderRadius: '99px' }}>
                      Trailer
                    </span>
                    {anime.idMal && (
                        <Link to={`/anime/${anime.idMal}`} style={{ fontSize: '0.85rem', color: '#fff', textDecoration: 'none', background: 'var(--primary)', padding: '5px 12px', borderRadius: '6px' }}>
                          View Anime
                        </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 🔥 PROFESSIONAL PAGINATION 🔥 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '3rem' }}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: currentPage === 1 ? 'gray' : '#fff', transition: '0.3s' }}
              >
                <i className="fas fa-chevron-left"></i> Prev
              </button>

              {/* Dynamic Number Buttons */}
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Smart Pagination: Show only active page, first, last, and surrounding pages
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button 
                      key={pageNum} 
                      onClick={() => handlePageChange(pageNum)} 
                      style={{ width: '35px', height: '35px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: currentPage === pageNum ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: currentPage === pageNum ? '#fff' : 'var(--text-muted)', transition: '0.3s' }}
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
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', background: currentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: currentPage === totalPages ? 'gray' : '#fff', transition: '0.3s' }}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <i className="fas fa-video-slash fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '15px' }}></i>
          <h3 style={{ color: '#fff' }}>No trailers found!</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try searching with a different name.</p>
        </div>
      )}
    </div>
  );
};

export default Trailers;