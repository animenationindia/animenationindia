import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Schedule = () => {
  const navigate = useNavigate();
  
  // Days Array
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const todayStr = new Date().toLocaleString('en-US', {weekday: 'long'}).toLowerCase();
  
  const [activeDay, setActiveDay] = useState(todayStr);
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time Calculator
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

  // 🔥 ANILIST GRAPHQL FETCHER 🔥
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
                      .filter(item => item.media.idMal) 
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
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh' }}>
      
      {/* ================= HEADER ================= */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem', padding: '0 20px' }}>
          <h1 style={{ fontSize: '3.5rem', color: '#fff', marginBottom: '15px', fontWeight: '800', letterSpacing: '-1px' }}>
              <i className="fas fa-broadcast-tower" style={{ color: 'var(--primary)', marginRight: '15px' }}></i>
              Simulcast <span style={{ color: 'var(--primary)' }}>Schedule</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
              Track exactly when your favorite seasonal anime drops. Air times are automatically synced to your local time zone.
          </p>
      </div>

      {/* ================= PREMIUM DAY TABS ================= */}
      <div className="hide-scrollbar" style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '0 20px', marginBottom: '4rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {days.map((day) => (
              <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  style={{
                      padding: '12px 30px',
                      borderRadius: '99px',
                      border: activeDay === day ? '1px solid rgba(255, 75, 107, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: activeDay === day ? 'linear-gradient(135deg, var(--primary) 0%, #ff7eb3 100%)' : 'rgba(255,255,255,0.03)',
                      color: activeDay === day ? '#fff' : 'var(--text-muted)',
                      boxShadow: activeDay === day ? '0 10px 25px rgba(255, 75, 107, 0.4)' : 'none',
                      transform: activeDay === day ? 'translateY(-3px)' : 'translateY(0)'
                  }}
                  onMouseOver={(e) => { if (activeDay !== day) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseOut={(e) => { if (activeDay !== day) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              >
                  {day} {todayStr === day && " (Today)"}
              </button>
          ))}
      </div>

      {/* ================= SCHEDULE GRID ================= */}
      <div style={{ padding: '0 20px' }}>
          {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
                  <i className="fas fa-circle-notch fa-spin fa-4x" style={{ color: 'var(--primary)', marginBottom: '20px' }}></i>
                  <h3 style={{ fontSize: '1.3rem', letterSpacing: '1px' }}>Syncing Schedule...</h3>
              </div>
          ) : scheduleData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <i className="fas fa-coffee fa-4x" style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '20px' }}></i>
                  <h3 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '10px' }}>Quiet Day for Anime</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No major episodes are scheduled for {activeDay} this week. Time to catch up on your Watchlist!</p>
              </div>
          ) : (
              <div className="grid-wrap" style={{ display: 'grid', gap: '25px', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                  {scheduleData.map((anime) => (
                      <div 
                          key={anime.mal_id} 
                          style={{ background: 'var(--bg-elevated)', borderRadius: '20px', overflow: 'hidden', textDecoration: 'none', display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                          onClick={() => navigate(`/anime/${anime.mal_id}`)}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                          {/* Image Container */}
                          <div style={{ position: 'relative', height: '340px', width: '100%', overflow: 'hidden' }}>
                              <img 
                                src={anime.images?.webp?.large_image_url} 
                                alt={anime.title} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              />
                              
                              {/* Overlay Gradient */}
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,20,41,1) 0%, rgba(18,20,41,0) 50%)' }}></div>

                              {/* Glassmorphism Time Badge */}
                              <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255, 75, 107, 0.85)', backdropFilter: 'blur(10px)', color: '#fff', padding: '6px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '1px' }}>
                                  <i className="fas fa-broadcast-tower"></i> {anime.broadcast.time}
                              </div>

                              {/* Score Badge */}
                              {anime.score !== 'N/A' && (
                                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', color: '#fff', padding: '5px 10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                      <i className="fas fa-star" style={{color: 'var(--accent)'}}></i> {anime.score}
                                  </div>
                              )}

                              {/* Floating Watchlist Button */}
                              <button 
                                  onClick={(e) => addToWatchlist(e, anime)} 
                                  style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: '0.3s' }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.border = 'none'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)'; }}
                              >
                                  <i className="fas fa-bookmark"></i>
                              </button>
                          </div>
                          
                          {/* Details Container */}
                          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                  <h3 style={{ color: '#fff', fontWeight: '800', fontSize: '1.1rem', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                                      {anime.title_english || anime.title}
                                  </h3>
                                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '15px' }}>
                                      {anime.genres.length > 0 ? anime.genres.map(g=>g.name).join(' • ') : 'Anime'}
                                  </p>
                              </div>
                              
                              {/* Bottom Status Bar */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                                  <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <i className="fas fa-play-circle"></i> Ep {anime.episodes}
                                  </span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
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