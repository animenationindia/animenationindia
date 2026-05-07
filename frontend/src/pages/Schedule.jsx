import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../api/config';

const Schedule = () => {
  const navigate = useNavigate();
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const todayStr = new Date().toLocaleString('en-US', {weekday: 'long'}).toLowerCase();
  
  const [activeDay, setActiveDay] = useState(todayStr);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDayTimestamps = (targetDayName) => {
      const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const now = new Date();
      const currentDayIndex = now.getDay();
      const targetDayIndex = daysMap.indexOf(targetDayName);
      
      const diff = targetDayIndex - currentDayIndex;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + diff);
      
      const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      
      return { 
          start: Math.floor(start.getTime() / 1000), 
          end: Math.floor(end.getTime() / 1000) 
      };
  };

  useEffect(() => {
      const fetchSchedule = async () => {
          setLoading(true);
          setScheduleData([]); 
          
          const { start, end } = getDayTimestamps(activeDay);
          const cacheKey = `anilist_sched_full_${activeDay}`;
          const cachedData = localStorage.getItem(cacheKey);
          const cacheTime = localStorage.getItem(cacheKey + '_time');
          const nowTime = new Date().getTime();

          if (cachedData && cacheTime && nowTime - parseInt(cacheTime) < 6 * 60 * 60 * 1000) {
             setScheduleData(JSON.parse(cachedData));
             setLoading(false);
             return;
          }

          const query = `
            query ($start: Int, $end: Int) {
              Page(page: 1, perPage: 50) {
                airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
                  airingAt
                  episode
                  media {
                    idMal
                    title { english romaji }
                    coverImage { large }
                    genres
                    averageScore
                  }
                }
              }
            }
          `;

          try {
              const aniRes = await fetch('https://graphql.anilist.co', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                  body: JSON.stringify({ query, variables: { start, end } })
              });
              
              if (aniRes.ok) {
                  const aniData = await aniRes.json();
                  const mappedData = aniData.data.Page.airingSchedules
                      .filter(item => item.media && item.media.idMal) 
                      .map(item => ({
                          mal_id: item.media.idMal,
                          title_english: item.media.title.english || item.media.title.romaji,
                          title: item.media.title.romaji,
                          images: { webp: { large_image_url: item.media.coverImage.large } },
                          episodes: item.episode,
                          score: item.media.averageScore ? (item.media.averageScore / 10).toFixed(2) : 'N/A',
                          genres: item.media.genres ? item.media.genres.map(g => ({name: g})) : [],
                          broadcast: { time: new Date(item.airingAt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
                      }));
                  
                  localStorage.setItem(cacheKey, JSON.stringify(mappedData));
                  localStorage.setItem(cacheKey + '_time', nowTime.toString());
                  setScheduleData(mappedData);
              }
          } catch (error) {
              console.error("Failed to fetch schedule from AniList", error);
          }
          setLoading(false);
      };

      fetchSchedule();
  }, [activeDay]);

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
        const response = await fetch(`${API_URL}/api/watchlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                anime: anime,
                userId: userId
            }) 
        });

        const data = await response.json();

        if (response.ok) {
            alert(`🎉 ${anime.title_english || anime.title} saved to your personal collection!`);
        } else {
            alert(`⚠️ ${data.message || "Already in your Watchlist!"}`);
        }
    } catch (error) {
        console.error("Database connection error", error);
        alert("❌ Failed to connect to Database.");
    }
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh', position: 'relative' }}>
      
      {/* INJECTED CSS FOR PULSE AND GLOW EFFECTS */}
      <style>
        {`
          @keyframes livePulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 75, 107, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(255, 75, 107, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 75, 107, 0); }
          }
          .live-dot {
            width: 8px;
            height: 8px;
            background-color: #ff4b6b;
            border-radius: 50%;
            display: inline-block;
            animation: livePulse 2s infinite;
          }
          .schedule-card:hover .card-img {
            transform: scale(1.12);
          }
        `}
      </style>

      {/* BACKGROUND AMBIENT GLOW */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '400px', background: 'radial-gradient(ellipse at top, rgba(255, 75, 107, 0.15), transparent 70%)', pointerEvents: 'none', zIndex: 0 }}></div>
      
      {/* ================= HEADER ================= */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem', padding: '0 20px', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3.8rem', marginBottom: '15px', fontWeight: '900', letterSpacing: '-1px', background: 'linear-gradient(to right, #ffffff, #ff7eb3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
              <i className="fas fa-satellite-dish" style={{ color: 'var(--primary)', marginRight: '15px', WebkitTextFillColor: 'initial' }}></i>
              Simulcast Tracker
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
              Track exactly when your favorite seasonal anime drops. Air times are automatically synced to your local time zone.
          </p>
      </div>

      {/* ================= PREMIUM DAY TABS ================= */}
      <div className="hide-scrollbar" style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '0 20px', marginBottom: '4rem', overflowX: 'auto', whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}>
          {days.map((day) => (
              <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  style={{
                      padding: '14px 35px',
                      borderRadius: '12px',
                      border: activeDay === day ? '1px solid rgba(255, 75, 107, 0.8)' : '1px solid rgba(255,255,255,0.05)',
                      fontWeight: '800',
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      background: activeDay === day ? 'rgba(255, 75, 107, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: activeDay === day ? '#fff' : 'var(--text-muted)',
                      boxShadow: activeDay === day ? '0 10px 30px rgba(255, 75, 107, 0.3), inset 0 0 15px rgba(255, 75, 107, 0.2)' : 'none',
                      transform: activeDay === day ? 'translateY(-5px)' : 'translateY(0)'
                  }}
                  onMouseOver={(e) => { if (activeDay !== day) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseOut={(e) => { if (activeDay !== day) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              >
                  {day} {todayStr === day && <span style={{ color: 'var(--primary)', marginLeft: '5px' }}>•</span>}
              </button>
          ))}
      </div>

      {/* ================= SCHEDULE GRID ================= */}
      <div style={{ padding: '0 20px', position: 'relative', zIndex: 1 }}>
          {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '20px' }}>
                    <i className="fas fa-circle-notch fa-spin fa-4x" style={{ color: 'var(--primary)', position: 'absolute', top: 0, left: 0 }}></i>
                    <i className="fas fa-satellite" style={{ color: '#fff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.2rem' }}></i>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff' }}>Syncing Signals...</h3>
              </div>
          ) : scheduleData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.05)', maxWidth: '600px', margin: '0 auto' }}>
                  <i className="fas fa-moon fa-4x" style={{ color: 'var(--primary)', opacity: 0.5, marginBottom: '25px', textShadow: '0 0 20px var(--primary)' }}></i>
                  <h3 style={{ color: '#fff', fontSize: '2rem', marginBottom: '10px', fontWeight: '800' }}>Quiet Day for Anime</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>No major episodes are broadcasting on {activeDay} this week. Perfect time to clear out your Watchlist!</p>
              </div>
          ) : (
              <div className="grid-wrap" style={{ display: 'grid', gap: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                  {scheduleData.map((anime) => (
                      <div 
                          key={anime.mal_id} 
                          className="schedule-card"
                          style={{ background: '#121426', borderRadius: '24px', overflow: 'hidden', textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.4s ease' }}
                          onClick={() => navigate(`/anime/${anime.mal_id}`)}
                          onMouseOver={(e) => { 
                            e.currentTarget.style.transform = 'translateY(-10px)'; 
                            e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.7), 0 0 20px rgba(255, 75, 107, 0.15)'; 
                            e.currentTarget.style.borderColor = 'rgba(255, 75, 107, 0.3)';
                          }}
                          onMouseOut={(e) => { 
                            e.currentTarget.style.transform = 'translateY(0)'; 
                            e.currentTarget.style.boxShadow = 'none'; 
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
                          }}
                      >
                          {/* Image Container */}
                          <div style={{ position: 'relative', height: '360px', width: '100%', overflow: 'hidden' }}>
                              <img 
                                src={anime.images?.webp?.large_image_url} 
                                alt={anime.title} 
                                className="card-img"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }} 
                              />
                              
                              {/* Dark Overlay Gradient */}
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #121426 0%, rgba(18,20,41,0) 60%)' }}></div>

                              {/* 🔥 LIVE Time Badge 🔥 */}
                              <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(15, 15, 15, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                                  <span className="live-dot"></span>
                                  {anime.broadcast.time}
                              </div>

                              {/* Score Badge */}
                              {anime.score !== 'N/A' && (
                                  <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: '#fff', padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid rgba(255,213,74,0.3)' }}>
                                      <i className="fas fa-star" style={{color: 'var(--accent)'}}></i> {anime.score}
                                  </div>
                              )}

                              {/* Floating Watchlist Button */}
                              <button 
                                  onClick={(e) => addToWatchlist(e, anime)} 
                                  style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: '0.3s', fontSize: '1.2rem' }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)'; e.currentTarget.style.border = 'none'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(255,75,107,0.4)'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                              >
                                  <i className="fas fa-bookmark"></i>
                              </button>
                          </div>
                          
                          {/* Details Container */}
                          <div style={{ padding: '0 25px 25px 25px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', marginTop: '-30px', position: 'relative', zIndex: 2 }}>
                              <div>
                                  <h3 style={{ color: '#fff', fontWeight: '900', fontSize: '1.25rem', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4', textShadow: '0 2px 5px rgba(0,0,0,0.8)' }}>
                                      {anime.title_english || anime.title}
                                  </h3>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                                      {anime.genres.slice(0, 3).map((g, i) => (
                                          <span key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                                              {g.name}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                              
                              {/* Bottom Status Bar */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
                                  <span style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <i className="fas fa-play" style={{ fontSize: '0.8rem' }}></i> Episode {anime.episodes}
                                  </span>
                                  <span style={{ color: 'var(--primary)', fontSize: '0.75rem', background: 'rgba(255, 75, 107, 0.1)', border: '1px solid rgba(255, 75, 107, 0.2)', padding: '5px 12px', borderRadius: '8px', fontWeight: '900', letterSpacing: '1px' }}>
                                      SIMULCAST
                                  </span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default Schedule;
