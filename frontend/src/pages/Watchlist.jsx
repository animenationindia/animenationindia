import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Watchlist = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchWatchlist = async () => {
      const userId = localStorage.getItem('user_id');

      if (!userId) {
        alert("Please login first to view your Watchlist!");
        navigate('/auth');
        return;
      }

      try {
        // 🔥 DIRECT CALL TO MongoDB 🔥
        const response = await fetch(`[https://animenationindia-backend.onrender.com](https://animenationindia-backend.onrender.com)/api/watchlist/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setWatchlist(data);
        } else {
          console.error("Failed to fetch watchlist");
        }
      } catch (error) {
        console.error("Database connection error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [navigate]);

  // 🔥 REMOVE FROM DATABASE LOGIC 🔥
  const removeFromWatchlist = async (e, mal_id, title) => {
    e.preventDefault();
    e.stopPropagation();

    const userId = localStorage.getItem('user_id');
    
    if(window.confirm(`Are you sure you want to remove ${title} from your watchlist?`)) {
        try {
            const response = await fetch(`[https://animenationindia-backend.onrender.com](https://animenationindia-backend.onrender.com)/api/watchlist/${userId}/${mal_id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove item from UI instantly without refreshing
                setWatchlist(watchlist.filter(item => item.mal_id !== mal_id));
            } else {
                alert("Failed to remove item. Please try again.");
            }
        } catch (error) {
            console.error("Error removing item:", error);
        }
    }
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh' }}>
      
      {/* ================= HEADER ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', padding: '0 20px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 className="section-title" style={{ fontSize: '3rem', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <i className="fas fa-bookmark" style={{ color: 'var(--primary)' }}></i> My Watchlist
            </h1>
            <p className="section-sub" style={{ fontSize: '1.1rem' }}>Your personal collection securely saved in the cloud database.</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
              Total Items: <span style={{ color: 'var(--primary)' }}>{watchlist.length}</span>
          </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div style={{ padding: '0 20px' }}>
          {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '100px 0' }}>
                  <i className="fas fa-spinner fa-spin fa-4x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
                  <h3>Loading your collection...</h3>
              </div>
          ) : watchlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-elevated)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <i className="fas fa-cloud-upload-alt fa-5x" style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '20px' }}></i>
                  <h2 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '15px' }}>Your Database is Empty</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '30px' }}>Start adding anime to save them directly to your MongoDB database!</p>
                  <Link to="/top-anime" className="btn-primary hover-scale" style={{ padding: '15px 35px', borderRadius: '99px', fontSize: '1.2rem', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block' }}>
                      Explore Top Anime
                  </Link>
              </div>
          ) : (
              <div className="grid-wrap" style={{ display: 'grid', gap: '25px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {watchlist.map((item) => {
                      // Check if it's manga to route correctly
                      const itemType = item.type ? item.type.toLowerCase() : '';
                      const isManga = itemType.includes('manga') || itemType.includes('novel') || itemType.includes('manhwa');
                      const routePath = isManga ? `/manga/${item.mal_id}` : `/anime/${item.mal_id}`;

                      return (
                          <div 
                              key={item.mal_id} 
                              className="anime-card hover-scale" 
                              style={{ background: 'var(--bg-elevated)', borderRadius: '18px', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} 
                              onClick={() => navigate(routePath)}
                          >
                              <div style={{ position: 'relative', height: '320px' }}>
                                  <img src={item.images?.webp?.large_image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  
                                  {/* Type Badge */}
                                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: isManga ? '#4a90e2' : 'var(--primary)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                                      {item.type || 'Anime'}
                                  </div>

                                  {/* Score Badge */}
                                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', backdropFilter: 'blur(4px)' }}>
                                      <i className="fas fa-star" style={{color: 'var(--accent)'}}></i> {item.score || 'N/A'}
                                  </div>

                                  {/* 🔥 REMOVE BUTTON 🔥 */}
                                  <button 
                                      onClick={(e) => removeFromWatchlist(e, item.mal_id, item.title_english || item.title)} 
                                      style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(255, 59, 48, 0.9)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 4px 15px rgba(255, 59, 48, 0.5)', transition: '0.2s' }}
                                      title="Remove from Watchlist"
                                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                  >
                                      <i className="fas fa-trash-alt"></i>
                                  </button>
                              </div>
                              
                              <div style={{ padding: '20px 15px' }}>
                                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {item.title_english || item.title}
                                  </div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
                                      {isManga ? (item.chapters ? `${item.chapters} Chapters` : 'Ongoing') : (item.episodes ? `${item.episodes} Eps` : 'Ongoing')} • {item.status}
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
      </div>

    </div>
  );
};

export default Watchlist;