import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: 'Otaku', email: 'Member' });
  const [stats, setStats] = useState({ totalSaved: 0, anime: 0, manga: 0 });
  const [loading, setLoading] = useState(true);
  
  // 🔥 SETTINGS MODAL STATE 🔥
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({ subDub: 'sub', theme: 'dark', notifications: true });

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    const rawUser = localStorage.getItem('user');
    const rawUserName = localStorage.getItem('user_name');

    if (!token || !userId) {
      alert("Please login to view your profile!");
      navigate('/auth');
      return;
    }

    let finalUsername = 'Otaku';
    let finalEmail = 'Anime Nation Member';

    if (rawUser && rawUser.startsWith('{')) {
        try {
            const parsed = JSON.parse(rawUser);
            finalUsername = parsed.username || parsed.name || finalUsername;
            finalEmail = parsed.email || finalEmail;
        } catch(e) {}
    } else if (rawUserName) {
        finalUsername = rawUserName.replace(/['"]+/g, '');
    } else if (rawUser) {
        finalUsername = rawUser.replace(/['"]+/g, '');
    }

    setUser({ username: finalUsername, email: finalEmail });

    // 🔥 BULLETPROOF COUNT LOGIC 🔥
    const fetchUserStats = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/watchlist/${userId}`);
        if (response.ok) {
          const data = await response.json();
          
          let animeCount = 0;
          let mangaCount = 0;

          data.forEach(item => {
              // API theke asha type ke lowercase kore check korchi jate kono kichu miss na jay
              const type = item.type ? item.type.toLowerCase() : '';
              if (type.includes('manga') || type.includes('manhwa') || type.includes('novel') || type.includes('one-shot')) {
                  mangaCount++;
              } else {
                  animeCount++; // TV, Movie, OVA, ONA, Special sob Anime er under e porbe
              }
          });

          setStats({
              totalSaved: data.length,
              anime: animeCount,
              manga: mangaCount
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [navigate]);

  const handleLogout = () => {
    if(window.confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_id');
        
        window.dispatchEvent(new Event('auth-change')); 
        
        alert("Logged out successfully!");
        navigate('/');
    }
  };

  const togglePreference = (key) => {
      setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="page-wrap" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <i className="fas fa-spinner fa-spin fa-3x" style={{ color: 'var(--primary)' }}></i>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh' }}>
      
      {/* ================= PROFILE HEADER ================= */}
      <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '0 20px' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 20px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', padding: '4px', boxShadow: '0 10px 30px rgba(255, 75, 107, 0.4)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0a0c1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#fff', fontWeight: 'bold' }}>
                  {user.username.charAt(0).toUpperCase()}
              </div>
              <button style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#fff', color: '#000', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-camera"></i>
              </button>
          </div>
          
          <h1 style={{ fontSize: '2.5rem', color: '#fff', fontWeight: '800', marginBottom: '5px' }}>{user.username}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <i className="fas fa-envelope" style={{ color: 'var(--primary)' }}></i> {user.email}
          </p>
      </div>

      {/* ================= STATS DASHBOARD ================= */}
      <div style={{ padding: '0 20px', marginBottom: '4rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '20px', borderLeft: '4px solid var(--primary)', paddingLeft: '15px' }}>Your Otaku Stats</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              
              {/* Total Saved Card */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '20px', padding: '30px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', color: 'rgba(255,255,255,0.02)' }}><i className="fas fa-bookmark"></i></div>
                  <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(255, 75, 107, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                      <i className="fas fa-bookmark"></i>
                  </div>
                  <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '5px' }}>Total Saved</div>
                      <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800' }}>{stats.totalSaved}</div>
                  </div>
              </div>

              {/* Anime Card */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '20px', padding: '30px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', color: 'rgba(255,255,255,0.02)' }}><i className="fas fa-tv"></i></div>
                  <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(255, 213, 74, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                      <i className="fas fa-tv"></i>
                  </div>
                  <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '5px' }}>Anime Series</div>
                      <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800' }}>{stats.anime}</div>
                  </div>
              </div>

              {/* Manga Card */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '20px', padding: '30px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '8rem', color: 'rgba(255,255,255,0.02)' }}><i className="fas fa-book-open"></i></div>
                  <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(74, 144, 226, 0.1)', color: '#4a90e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                      <i className="fas fa-book-open"></i>
                  </div>
                  <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '5px' }}>Manga/Novels</div>
                      <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800' }}>{stats.manga}</div>
                  </div>
              </div>

          </div>
      </div>

      {/* ================= ACTION BUTTONS ================= */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
          <button 
             onClick={() => navigate('/watchlist')} 
             className="btn-primary hover-scale" 
             style={{ padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px', cursor: 'pointer', border: 'none' }}
          >
              <i className="fas fa-list"></i> View My Watchlist
          </button>

          {/* 🔥 SETTINGS BUTTON 🔥 */}
          <button 
             onClick={() => setShowSettings(true)} 
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: '0.3s' }}
             onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
             onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
              <i className="fas fa-cog"></i> Account Settings
          </button>

          <button 
             onClick={handleLogout} 
             style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', color: '#ff3b30', padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: '0.3s', marginTop: '20px' }}
             onMouseOver={(e) => { e.currentTarget.style.background = '#ff3b30'; e.currentTarget.style.color = '#fff'; }}
             onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'; e.currentTarget.style.color = '#ff3b30'; }}
          >
              <i className="fas fa-sign-out-alt"></i> Logout Securely
          </button>
      </div>

      {/* ================= 🔥 SETTINGS MODAL UI 🔥 ================= */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '90%', maxWidth: '450px', background: '#121429', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', animation: 'smoothFade 0.3s forwards' }}>
                <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: '#fff', margin: 0, fontSize: '1.3rem' }}><i className="fas fa-user-cog" style={{ color: 'var(--primary)', marginRight: '10px' }}></i> Account Settings</h3>
                    <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                </div>
                
                <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Email Details */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Registered Email</div>
                        <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>{user.email}</div>
                    </div>

                    {/* Audio Preference */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>Default Audio</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Preferred playback language</div>
                        </div>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '3px' }}>
                            <button onClick={() => setPreferences({...preferences, subDub: 'sub'})} style={{ background: preferences.subDub === 'sub' ? 'var(--primary)' : 'transparent', color: preferences.subDub === 'sub' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Sub</button>
                            <button onClick={() => setPreferences({...preferences, subDub: 'dub'})} style={{ background: preferences.subDub === 'dub' ? 'var(--primary)' : 'transparent', color: preferences.subDub === 'dub' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Dub</button>
                        </div>
                    </div>

                    {/* Notifications Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>Push Notifications</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Get episode release alerts</div>
                        </div>
                        <div 
                            onClick={() => togglePreference('notifications')}
                            style={{ width: '50px', height: '26px', background: preferences.notifications ? 'var(--primary)' : 'rgba(255,255,255,0.1)', borderRadius: '99px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                        >
                            <div style={{ width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: preferences.notifications ? '26px' : '2px', transition: '0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}></div>
                        </div>
                    </div>

                    {/* Password Update Dummy Button */}
                    <button onClick={() => alert("Password reset link sent to your email!")} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', borderRadius: '12px', marginTop: '10px', cursor: 'pointer', transition: '0.2s', fontWeight: 'bold' }} className="hover-bg-change">
                        Change Password
                    </button>
                </div>

                <div style={{ padding: '15px 25px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                    <button onClick={() => {alert("Settings saved!"); setShowSettings(false);}} className="btn-primary" style={{ padding: '10px 25px', borderRadius: '8px', fontSize: '1rem', border: 'none', cursor: 'pointer' }}>Save Changes</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Profile;