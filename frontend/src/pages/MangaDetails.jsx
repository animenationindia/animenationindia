import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const MangaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchMangaDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`[https://animenationindia-backend.onrender.com](https://animenationindia-backend.onrender.com)/api/manga/${id}`);
        const data = await response.json();
        
        if (data.data) {
          setManga(data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching manga details:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMangaDetails();
  }, [id]);

  // 🔥 PERSONAL WATCHLIST FUNCTION (Database Save) 🔥
  const addToWatchlist = async () => {
    if (!manga) return;
    
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        alert("Please login first to bookmark this manga!");
        navigate('/auth');
        return;
    }

    try {
        const response = await fetch('[https://animenationindia-backend.onrender.com](https://animenationindia-backend.onrender.com)/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                anime: manga, // Database schema expect korche animeData, tai manga tai pathalam
                userId: userId
            }) 
        });

        const data = await response.json();

        if (response.ok) {
            alert(`🎉 ${manga.title_english || manga.title} saved to your collection!`);
        } else {
            alert(`⚠️ ${data.message || "Already in your Watchlist!"}`);
        }
    } catch (error) {
        console.error("Database connection error", error);
        alert("❌ Failed to connect to Database.");
    }
  };

  if (loading) {
    return (
      <div className="page-wrap" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
          <h2 style={{ color: '#fff' }}>Loading Manga Details...</h2>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="page-wrap" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <div style={{ textAlign: 'center', background: 'rgba(255,75,107,0.1)', padding: '40px', borderRadius: '20px' }}>
            <i className="fas fa-exclamation-triangle fa-3x" style={{ color: 'var(--danger)', marginBottom: '20px' }}></i>
            <h2 style={{ color: '#fff', marginBottom: '10px' }}>Manga Not Found</h2>
            <Link to="/manga" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 25px', borderRadius: '99px' }}>Go Back</Link>
         </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ paddingBottom: '5rem' }}>
      
      {/* ================= HERO SECTION ================= */}
      <div style={{ position: 'relative', width: '100%', minHeight: '600px', background: '#0a0c1a', marginTop: '60px' }}>
        
        {/* Blurred Background Image */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${manga.images?.webp?.large_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px)', opacity: 0.3 }}></div>
        
        {/* Gradient Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050716 0%, rgba(5,7,22,0.5) 100%)' }}></div>

        {/* Content Wrapper */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
            
            {/* ================= LEFT SIDE: CARD (Poster + Actions + Info) ================= */}
            <div style={{ flex: '0 0 300px', margin: '0 auto' }}>
                <img 
                  src={manga.images?.webp?.large_image_url} 
                  alt={manga.title} 
                  style={{ width: '100%', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} 
                />
                
                {/* Watchlist Button */}
                <button 
                  onClick={addToWatchlist} 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px', cursor: 'pointer', border: 'none' }}
                >
                    <i className="fas fa-bookmark"></i> Bookmark Manga
                </button>

                {/* Read Manga Button (Dummy link for now) */}
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '10px', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px', cursor: 'pointer', background: 'var(--accent)', color: '#000', border: 'none' }}
                >
                    <i className="fas fa-book-open"></i> Read Manga
                </button>
                
                {/* Information Box */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
                    <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '15px' }}>Information</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Type:</strong> <span style={{ color: '#fff', float: 'right' }}>{manga.type || 'Unknown'}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Volumes:</strong> <span style={{ color: '#fff', float: 'right' }}>{manga.volumes || 'Unknown'}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Chapters:</strong> <span style={{ color: '#fff', float: 'right' }}>{manga.chapters || 'Publishing'}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Status:</strong> <span style={{ color: '#fff', float: 'right' }}>{manga.status}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Published:</strong> <span style={{ color: '#fff', float: 'right', fontSize: '0.8rem' }}>{manga.published?.string?.split('to')[0] || 'Unknown'}</span></div>
                        <div><strong style={{ color: 'var(--text-muted)' }}>Authors:</strong> <span style={{ color: 'var(--primary)', float: 'right', textAlign: 'right' }}>{manga.authors?.map(a => a.name).join(', ') || 'Unknown'}</span></div>
                    </div>
                </div>
            </div>

            {/* ================= RIGHT SIDE ================= */}
            <div style={{ flex: 1, minWidth: '300px' }}>
                
                {/* Genres */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {manga.genres?.map(g => (
                        <span key={g.mal_id} style={{ background: 'rgba(255,77,210,0.1)', color: 'var(--primary)', padding: '5px 12px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold' }}>{g.name}</span>
                    ))}
                    {manga.themes?.map(t => (
                        <span key={t.mal_id} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '5px 12px', borderRadius: '99px', fontSize: '0.85rem' }}>{t.name}</span>
                    ))}
                </div>
                
                {/* 🔥 Titles (English Force) 🔥 */}
                <h1 style={{ fontSize: '3rem', color: '#fff', fontWeight: '800', marginBottom: '10px', lineHeight: '1.2' }}>
                  {manga.title_english || manga.title}
                </h1>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 'normal', marginBottom: '30px' }}>
                  {manga.title_japanese}
                </h2>

                {/* Stats Box */}
                <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold' }}><i className="fas fa-star" style={{ color: 'var(--accent)', fontSize: '1.4rem' }}></i> {manga.score || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{manga.scored_by?.toLocaleString()} Users</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ranked</div>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold' }}>#{manga.rank || 'N/A'}</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Popularity</div>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold' }}>#{manga.popularity || 'N/A'}</div>
                    </div>
                </div>

                {/* Synopsis */}
                <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '15px' }}>Synopsis</h3>
                <p style={{ color: '#d0d5e0', fontSize: '1rem', lineHeight: '1.8', marginBottom: '40px' }}>
                    {manga.synopsis || "No synopsis information has been added to this title."}
                </p>
                
            </div>
        </div>
      </div>
      
    </div>
  );
};

export default MangaDetails;