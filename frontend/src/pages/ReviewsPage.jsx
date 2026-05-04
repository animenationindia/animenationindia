import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ReviewsPage = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🚀 Fetch Recent Reviews with Pagination 🚀
  const fetchReviews = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.jikan.moe/v4/reviews/anime?page=${pageNum}`);
      const data = await response.json();
      
      if (data && data.data) {
          setReviews(data.data);
          // Jikan API theke last visible page ta tule anchi
          setTotalPages(data.pagination?.last_visible_page || 1);
      } else {
          setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Page change hole ekdom opore scroll korbe
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    fetchReviews(currentPage);
  }, [currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetToAllReviews = () => {
    setSearchQuery(''); 
    setCurrentPage(1); 
  };

  // 🔍 Local Live Search
  const filteredReviews = reviews.filter(r => 
    r.entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-wrap" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '50px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '20px' }}>
        <div>
          <h1 
            onClick={resetToAllReviews} 
            style={{ fontSize: '2.5rem', color: '#fff', margin: 0, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '10px' }}
            title="Click to view all Reviews"
          >
            <i className="fas fa-comments" style={{color: 'var(--primary)'}}></i> Community Reviews
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>Read what the community is saying about top anime.</p>
        </div>
        
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
          <input 
            type="text" 
            placeholder="Filter reviews by anime or username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--primary)' }}>
          <i className="fas fa-spinner fa-spin fa-3x"></i>
          <p style={{ marginTop: '15px', color: '#fff' }}>Fetching the latest thoughts...</p>
        </div>
      ) : filteredReviews.length > 0 ? (
        <>
          {/* Reviews Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {filteredReviews.map((review, index) => (
              <div 
                key={index} 
                className="hover-scale" 
                style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '20px', display: 'flex', gap: '20px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                onClick={() => navigate(`/anime/${review.entry.mal_id}`)}
              >
                 <img src={review.entry.images?.webp?.large_image_url} alt="anime" style={{ width: '90px', height: '130px', borderRadius: '8px', objectFit: 'cover' }} />
                 <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#000', background: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        ★ {review.score}/10
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>By @{review.user.username}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 10px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {review.entry.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6', margin: 0 }}>
                      {review.review}
                    </p>
                 </div>
              </div>
            ))}
          </div>

          {/* 🔥 PROFESSIONAL PAGINATION (Prev 1 2 3 ... Next) 🔥 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '3rem' }}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: currentPage === 1 ? 'gray' : '#fff', transition: '0.3s' }}
              >
                <i className="fas fa-chevron-left"></i> Prev
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                // Smart display: Only show first, last, and pages close to current
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
          <i className="fas fa-search-minus fa-3x" style={{ color: 'var(--text-muted)', marginBottom: '15px' }}></i>
          <h3 style={{ color: '#fff' }}>No reviews found!</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try a different search term.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;