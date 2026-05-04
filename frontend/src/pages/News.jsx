import React, { useState, useEffect } from 'react';

const News = () => {
  const [newsList, setNewsList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestUpdates = async () => {
      setLoading(true);
      try {
        // 🔥 DIRECT HD JIKAN API (No Hotlink Block Issues) 🔥
        const response = await fetch(`https://api.jikan.moe/v4/watch/promos?page=${currentPage}`);
        const result = await response.json();
        
        if (result.data) {
          setNewsList(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch updates:", error);
      } finally {
        setLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    fetchLatestUpdates();
  }, [currentPage]);

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh' }}>
      
      {/* ================= HEADER ================= */}
      <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '0 20px' }}>
          <h1 className="section-title" style={{ fontSize: '3.5rem', color: '#fff', marginBottom: '15px' }}>
              🎬 Latest Trailers & News
          </h1>
          <p className="section-sub" style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
              Watch the newest promotional videos, season announcements, and official anime updates.
          </p>
      </div>

      {/* ================= NEWS FEED ================= */}
      <div style={{ padding: '0 20px' }}>
          {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '100px 0' }}>
                  <i className="fas fa-spinner fa-spin fa-4x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
                  <h3>Loading HD Updates...</h3>
              </div>
          ) : newsList.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px', background: 'var(--bg-elevated)', borderRadius: '20px' }}>
                  <i className="fas fa-video-slash fa-3x" style={{ opacity: 0.5, marginBottom: '15px' }}></i>
                  <h3>No updates available at the moment.</h3>
              </div>
          ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '50px' }}>
                  {newsList.map((item, index) => {
                      // Extracting HD YouTube Thumbnail or Anime Poster
                      const imgUrl = item.trailer?.images?.maximum_image_url || item.trailer?.images?.large_image_url || item.entry?.images?.webp?.large_image_url;
                      
                      return (
                          <a 
                              key={`${item.entry.mal_id}-${index}`} 
                              href={item.trailer?.url || `https://myanimelist.net/anime/${item.entry.mal_id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover-scale"
                              style={{ display: 'flex', gap: '25px', background: 'var(--bg-elevated)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: 'inherit', alignItems: 'center', flexWrap: 'wrap' }}
                          >
                              {/* Thumbnail Image */}
                              <div style={{ width: '280px', height: '160px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', position: 'relative', background: '#000', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                                  <img src={imgUrl} alt={item.entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--danger)', color: '#fff', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '99px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <i className="fas fa-play"></i> Trailer
                                  </div>
                              </div>

                              {/* Content Details */}
                              <div style={{ flex: 1, minWidth: '300px' }}>
                                  <div style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                      Official Update
                                  </div>
                                  <h3 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '10px', lineHeight: '1.4' }}>
                                      {item.entry.title}
                                  </h3>
                                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '15px' }}>
                                      {item.title} has just been released! Click to watch the latest promotional video and see what's coming next for {item.entry.title}.
                                  </p>
                                  <div style={{ color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      Watch Video <i className="fas fa-external-link-alt" style={{ fontSize: '0.8rem', marginLeft: '3px' }}></i>
                                  </div>
                              </div>
                          </a>
                      );
                  })}
              </div>
          )}

          {/* ================= PAGINATION ================= */}
          {!loading && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                  <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                      disabled={currentPage === 1}
                      style={{ padding: '12px 25px', borderRadius: '99px', border: 'none', background: currentPage === 1 ? 'rgba(255,255,255,0.05)' : 'var(--primary)', color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}
                  >
                      <i className="fas fa-chevron-left"></i> Newer
                  </button>
                  
                  <div style={{ color: '#fff', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '99px' }}>
                      Page {currentPage}
                  </div>

                  <button 
                      onClick={() => setCurrentPage(prev => prev + 1)} 
                      style={{ padding: '12px 25px', borderRadius: '99px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s' }}
                  >
                      Older <i className="fas fa-chevron-right"></i>
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};

export default News;