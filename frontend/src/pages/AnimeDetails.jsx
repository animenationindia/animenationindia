import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const AnimeDetails = () => {
  const { id } = useParams();
  
  const [anime, setAnime] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false); 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      setLoading(true);
      setError(false);
      setShowAllEpisodes(false); 
      setShowTrailerModal(false); 
      try {
        const resAnime = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
        if (!resAnime.ok) throw new Error("Anime not found");
        const animeData = await resAnime.json();
        setAnime(animeData.data);
        
        await new Promise(resolve => setTimeout(resolve, 800));

        const resRecs = await fetch(`[https://animenationindia-backend.onrender.com](https://animenationindia-backend.onrender.com)/api/anime/${id}/recommendations`);
        if (resRecs.ok) {
          const recData = await resRecs.json();
          setRecommendations(recData.data ? recData.data.slice(0, 8) : []);
        }

        await new Promise(resolve => setTimeout(resolve, 800));

        const resChars = await fetch(`https://api.jikan.moe/v4/anime/${id}/characters`);
        if (resChars.ok) {
          const charData = await resChars.json();
          setCharacters(charData.data.slice(0, 10));
        }

        await new Promise(resolve => setTimeout(resolve, 800));

        if (animeData.data.type === 'TV') {
          const resEps = await fetch(`https://api.jikan.moe/v4/anime/${id}/episodes`);
          if (resEps.ok) {
            const epData = await resEps.json();
            setEpisodes(epData.data || []);
          }
        }

      } catch (err) {
        console.error("Error fetching details:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if(id) fetchAnimeDetails();
  }, [id]);


  // 🔥 THE ULTIMATE MERN BACKEND LOGIC: Save to MongoDB 🔥
  const addToWatchlist = async () => {
    if (!anime) return;
    
    try {
        const response = await fetch('[https://animenationindia-backend.onrender.com](https://animenationindia-backend.onrender.com)/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anime: anime }) 
        });

        const data = await response.json();

        if (response.ok) {
            alert(`${anime.title_english || anime.title} securely saved to Database! 🚀`);
        } else {
            alert(data.message || "Already in your Watchlist!");
        }
    } catch (error) {
        console.error("Database connection error", error);
        alert("Failed to connect to Database. Make sure your Node.js server is running on port 5000.");
    }
  };


  const getRelatedAnime = () => {
    if (!anime) return [];
    
    let relatedList = [{
      mal_id: anime.mal_id,
      name: anime.title_english || anime.title,
      relation_type: 'Current Viewing',
      isCurrent: true
    }];

    if (anime.relations) {
      anime.relations.forEach(rel => {
        rel.entry.forEach(item => {
          if (item.type === 'anime') {
            relatedList.push({
              mal_id: item.mal_id,
              name: item.name,
              relation_type: rel.relation, 
              isCurrent: false
            });
          }
        });
      });
    }
    return relatedList;
  };

  const relatedAnimeList = getRelatedAnime();

  if (loading) {
    return (
      <div className="page-wrap" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
          <h2 style={{ color: '#fff' }}>Loading Anime Details...</h2>
        </div>
      </div>
    );
  }
  
  if (error || !anime) {
    return (
      <div className="page-wrap" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <div style={{ textAlign: 'center', background: 'rgba(255,75,107,0.1)', padding: '40px', borderRadius: '20px' }}>
            <i className="fas fa-exclamation-triangle fa-3x" style={{ color: 'var(--danger)', marginBottom: '20px' }}></i>
            <h2 style={{ color: '#fff', marginBottom: '10px' }}>Anime Not Found</h2>
            <Link to="/" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 25px', borderRadius: '99px' }}>Go Back Home</Link>
         </div>
      </div>
    );
  }

  const displayedEpisodes = showAllEpisodes ? episodes : episodes.slice(0, 10);

  // 💡 DUMMY DATA ARRAYS FOR LANGUAGES (Future proofing for your DB)
  const availableAudio = ["Japanese", "English"];
  const availableSubtitles = ["English", "Spanish", "Hindi"];

  return (
    <div className="page-wrap" style={{ paddingBottom: '5rem' }}>
      
      {/* ================= HERO SECTION ================= */}
      <div style={{ position: 'relative', width: '100%', minHeight: '600px', background: '#0a0c1a', marginTop: '60px' }}>
        
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${anime.images?.webp?.large_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px)', opacity: 0.3 }}></div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050716 0%, rgba(5,7,22,0.5) 100%)' }}></div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
            
            {/* ================= LEFT SIDE: CARD ================= */}
            <div style={{ flex: '0 0 300px', margin: '0 auto' }}>
                <img 
                  src={anime.images?.webp?.large_image_url} 
                  alt={anime.title} 
                  style={{ width: '100%', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} 
                />
                
                {/* Watch Official Trailer Button */}
                {(anime.trailer?.youtube_id || anime.trailer?.embed_url) ? (
                    <button 
                      onClick={() => setShowTrailerModal(true)}
                      className="btn-primary hover-scale" 
                      style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#ff0000', color: '#fff', border: 'none', transition: '0.3s' }}
                    >
                        <i className="fab fa-youtube" style={{ fontSize: '1.3rem' }}></i> Watch Trailer
                    </button>
                ) : (
                    <button 
                      disabled
                      style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'none', cursor: 'not-allowed' }}
                    >
                        <i className="fas fa-video-slash"></i> No Trailer
                    </button>
                )}

                {/* Watchlist Button */}
                <button 
                  onClick={addToWatchlist} 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: '10px', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                    <i className="fas fa-bookmark" style={{ color: 'var(--primary)' }}></i> Add to Watchlist
                </button>
                
                {/* 🔥 UPDATED: Information Box with MULTIPLE Languages/Subtitles as Tags 🔥 */}
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
                    <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '15px' }}>Information</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--text-muted)' }}>Type:</strong> 
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{anime.type || 'Unknown'}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--text-muted)' }}>Episodes:</strong> 
                            <span style={{ color: '#fff' }}>{anime.episodes || 'Unknown'}</span>
                        </div>
                        
                        {/* Audio Languages (Multiple Tags) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ color: 'var(--text-muted)', paddingTop: '2px' }}>Audio:</strong> 
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '70%' }}>
                                {availableAudio.map(lang => (
                                    <span key={lang} style={{ background: 'rgba(255, 75, 107, 0.15)', color: 'var(--primary)', border: '1px solid rgba(255, 75, 107, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Subtitles (Multiple Tags) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ color: 'var(--text-muted)', paddingTop: '2px' }}>Subtitles:</strong> 
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '70%' }}>
                                {availableSubtitles.map(sub => (
                                    <span key={sub} style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        {sub}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <strong style={{ color: 'var(--text-muted)' }}>Status:</strong> 
                            <span style={{ color: '#fff' }}>{anime.status}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--text-muted)' }}>Aired:</strong> 
                            <span style={{ color: '#fff', fontSize: '0.8rem' }}>{anime.aired?.string?.split('to')[0] || 'Unknown'}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong style={{ color: 'var(--text-muted)' }}>Studios:</strong> 
                            <span style={{ color: 'var(--primary)', textAlign: 'right', maxWidth: '70%' }}>{anime.studios?.map(s => s.name).join(', ') || 'Unknown'}</span>
                        </div>

                    </div>
                </div>
            </div>

            {/* ================= RIGHT SIDE ================= */}
            <div style={{ flex: 1, minWidth: '300px' }}>
                
                {/* Genres */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                    {anime.genres?.map(g => (
                        <span key={g.mal_id} style={{ background: 'rgba(255,77,210,0.1)', color: 'var(--primary)', padding: '5px 12px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold' }}>{g.name}</span>
                    ))}
                </div>
                
                {/* Titles */}
                <h1 style={{ fontSize: '3rem', color: '#fff', fontWeight: '800', marginBottom: '10px', lineHeight: '1.2' }}>{anime.title_english || anime.title}</h1>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 'normal', marginBottom: '30px' }}>{anime.title_japanese}</h2>

                {/* Stats Box */}
                <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold' }}><i className="fas fa-star" style={{ color: 'var(--accent)', fontSize: '1.4rem' }}></i> {anime.score || 'N/A'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{anime.scored_by?.toLocaleString()} Users</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ranked</div>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold' }}>#{anime.rank || 'N/A'}</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Popularity</div>
                        <div style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold' }}>#{anime.popularity || 'N/A'}</div>
                    </div>
                </div>

                {/* Synopsis */}
                <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '15px' }}>Synopsis</h3>
                <p style={{ color: '#d0d5e0', fontSize: '1rem', lineHeight: '1.8', marginBottom: '40px' }}>
                    {anime.synopsis || "No synopsis information has been added to this title."}
                </p>

                {/* SEASONS & RELATED SECTION */}
                {relatedAnimeList.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-layer-group" style={{ color: 'var(--primary)' }}></i> Franchise & Seasons
                        </h3>
                        
                        <div className="hide-scrollbar" style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
                            {relatedAnimeList.map((rel, idx) => (
                                <Link 
                                    key={idx}
                                    to={`/anime/${rel.mal_id}`}
                                    className="hover-scale"
                                    style={{
                                        flex: '0 0 220px',
                                        background: rel.isCurrent ? 'linear-gradient(135deg, rgba(255,75,107,0.2) 0%, rgba(255,75,107,0.05) 100%)' : 'rgba(255,255,255,0.03)',
                                        border: rel.isCurrent ? '1px solid rgba(255,75,107,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px',
                                        padding: '15px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        minHeight: '100px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${anime.images?.webp?.large_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px)', opacity: 0.15, zIndex: 0 }}></div>
                                    <div style={{ position: 'relative', zIndex: 1, color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {rel.name}
                                    </div>
                                    <span style={{ position: 'relative', zIndex: 1, background: rel.isCurrent ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: rel.isCurrent ? '#fff' : 'var(--text-muted)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {rel.relation_type}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* ================= RECOMMENDATIONS GRID ================= */}
        {recommendations.length > 0 && (
            <div style={{ marginBottom: '50px' }}>
                <h2 style={{ color: '#fff', fontSize: '1.8rem', borderLeft: '4px solid var(--accent)', paddingLeft: '15px', marginBottom: '10px' }}>Recommendations</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px', paddingLeft: '15px' }}>Similar titles you might like</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                    {recommendations.map((rec) => (
                        <Link to={`/anime/${rec.entry.mal_id}`} key={rec.entry.mal_id} className="anime-card hover-scale" style={{ background: 'var(--bg-elevated)', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none', display: 'block' }}>
                            <img src={rec.entry.images?.webp?.large_image_url} alt={rec.entry.title} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                            <div style={{ padding: '12px' }}>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.entry.title}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        {/* ================= CHARACTERS SECTION ================= */}
        {characters.length > 0 && (
            <div style={{ marginBottom: '50px' }}>
                <h2 style={{ color: '#fff', fontSize: '1.8rem', borderLeft: '4px solid var(--primary)', paddingLeft: '15px', marginBottom: '30px' }}>Characters & Voice Actors</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {characters.map((char, index) => {
                        const voiceActor = char.voice_actors?.find(va => va.language === 'Japanese');
                        return (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-elevated)', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', gap: '15px', padding: '10px' }}>
                                    <img src={char.character.images?.webp?.image_url} alt={char.character.name} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{char.character.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{char.role}</div>
                                    </div>
                                </div>
                                {voiceActor && (
                                    <div style={{ display: 'flex', gap: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderLeft: '1px solid rgba(255,255,255,0.05)', width: '50%', justifyContent: 'flex-end', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{voiceActor.person.name}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Japanese</div>
                                        </div>
                                        <img src={voiceActor.person.images?.jpg?.image_url} alt={voiceActor.person.name} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* ================= EPISODES SECTION ================= */}
        {episodes.length > 0 && (
            <div style={{ marginBottom: '50px' }}>
                <h2 style={{ color: '#fff', fontSize: '1.8rem', borderLeft: '4px solid var(--accent)', paddingLeft: '15px', marginBottom: '30px' }}>Episodes List</h2>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '16px', overflow: 'hidden' }}>
                    
                    {displayedEpisodes.map((ep, index) => (
                        <div key={ep.mal_id} style={{ display: 'flex', alignItems: 'center', padding: '20px', borderBottom: index !== displayedEpisodes.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', gap: '20px' }} className="hover-color-primary">
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)', width: '40px', textAlign: 'center' }}>{ep.mal_id}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{ep.title}</div>
                                {ep.title_japanese && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ep.title_japanese}</div>}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'right' }}>
                                <div><i className="fas fa-calendar-alt"></i> Aired</div>
                                <div style={{ color: '#fff' }}>{ep.aired ? new Date(ep.aired).toLocaleDateString() : 'N/A'}</div>
                            </div>
                        </div>
                    ))}
                    
                    {episodes.length > 10 && (
                        <div 
                            onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                            style={{ textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.02)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        >
                            {showAllEpisodes ? (
                                <>Show Less <i className="fas fa-chevron-up" style={{ marginLeft: '5px' }}></i></>
                            ) : (
                                <>View All {episodes.length} Episodes <i className="fas fa-chevron-down" style={{ marginLeft: '5px' }}></i></>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* ================= 🔥 THE MAGIC TRAILER MODAL 🔥 ================= */}
      {showTrailerModal && (anime.trailer?.youtube_id || anime.trailer?.embed_url) && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
              
              <div style={{ width: '100%', maxWidth: '1000px', background: '#000', borderRadius: '20px', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  
                  <button 
                      onClick={() => setShowTrailerModal(false)}
                      style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.9)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      title="Close Trailer"
                  >
                      <i className="fas fa-times"></i>
                  </button>

                  <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
                      <iframe 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          src={anime.trailer.embed_url || `https://www.youtube.com/embed/${anime.trailer.youtube_id}?autoplay=1`} 
                          title={`${anime.title} Trailer`} 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen>
                      </iframe>
                  </div>
              </div>

              <div 
                  onClick={() => setShowTrailerModal(false)} 
                  style={{ position: 'absolute', inset: 0, zIndex: -1, cursor: 'pointer' }}
              ></div>
          </div>
      )}

    </div>
  );
};

export default AnimeDetails;