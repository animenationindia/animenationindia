import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); 
  const [userName, setUserName] = useState('');
  
  // ---> Mobile Menu State <---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ---> Live Search State <---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // ---> Settings Modal State <---
  const [showSettings, setShowSettings] = useState(false);
  
  // 🔥 FIX: Added 'theme' to settings state and initialized from localStorage 🔥
  const [settings, setSettings] = useState(() => {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    return { subDub: 'sub', autoplay: true, theme: savedTheme };
  });

  const searchRef = useRef(null);
  
  // 🔥 FIX: Added Refs for detecting clicks outside Dropdown and Notifications 🔥
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  
  const navigate = useNavigate();

  // Notifications Data
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New Episode of Demon Slayer is out! 🔥", time: "Just now", icon: "fa-play-circle", color: "var(--danger)", read: false },
    { id: 2, text: "Welcome to Anime Nation India! 🎉", time: "2 hours ago", icon: "fa-star", color: "var(--accent)", read: false }
  ]);

  // Auth Check
  const checkAuthStatus = () => {
    const token = localStorage.getItem('user_token') || localStorage.getItem('token'); 
    const name = localStorage.getItem('user_name') || localStorage.getItem('user'); 
    
    if (token) {
      setIsLoggedIn(true);
      let cleanName = name ? name.replace(/['"]+/g, '') : 'AnimeFan';
      
      if (name && name.startsWith('{')) {
          try {
              const userObj = JSON.parse(name);
              cleanName = userObj.username;
          } catch(e) {}
      }
      setUserName(cleanName);
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  };

  useEffect(() => {
    checkAuthStatus();
    window.addEventListener('auth-change', checkAuthStatus);
    return () => window.removeEventListener('auth-change', checkAuthStatus);
  }, []);

  // 🔥 FIX: Apply theme to the document body when settings.theme changes 🔥
  useEffect(() => {
    if (settings.theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('app_theme', settings.theme);
  }, [settings.theme]);

  // Debounced API Call for Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        try {
          const response = await fetch(`[https://animenationindia-backend.onrender.com](https://animenationindia-backend.onrender.com)/api/anime/search?q=${searchQuery}`);
          const data = await response.json();
          setSearchResults(data);
        } catch (error) {
          console.error("Search API Error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 🔥 FIX: Global Click Handler to close ALL dropdowns if clicked outside 🔥
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Search
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
        setSearchQuery('');
      }
      // Close Profile Menu
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      // Close Notifications Menu
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    setIsLoggedIn(false);
    setShowDropdown(false);
    setShowNotifications(false);
    navigate('/'); 
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  return (
    <>
      <header className="header">
        <nav className="nav-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
          
          {/* ================= LEFT: BRAND LOGO ================= */}
          <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexShrink: 0 }}>
            <div className="brand-logo" style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
              <img src="/ani-logo.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
            </div>
            <div className="brand-text" style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
              <span className="brand-title" style={{ fontSize: '1.2rem', fontWeight: '900', lineHeight: '1.2', color: 'var(--text-color, #fff)' }}>Anime Nation India</span>
              <span className="brand-sub" style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '1px', color: 'var(--text-muted)' }}>LIVE CALENDAR • NEWS</span>
            </div>
          </Link>

          {/* ================= MIDDLE: NAV LINKS ================= */}
          <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`} style={{ margin: '0 auto', flex: 1, display: 'flex', justifyContent: 'center', gap: '1vw' }}>
            <li><Link to="/" className="nav-link active" onClick={() => setIsMobileMenuOpen(false)}>Home</Link></li>
            <li><Link to="/schedule" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Schedule</Link></li>
            <li><Link to="/top-anime" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Top Anime</Link></li>
            <li><Link to="/manga" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Top Manga</Link></li>
            <li><Link to="/popular" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Popular</Link></li>
            <li><Link to="/news" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>News</Link></li>
            <li><Link to="/genres" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Genres</Link></li>
            <li><Link to="/contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link></li>
          </ul>

          {/* ================= RIGHT: SEARCH, ICONS & PROFILE ================= */}
          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0, paddingRight: '10px' }}>
            
            {/* Live Search Bar */}
            <div ref={searchRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'var(--bg-elevated, rgba(255,255,255,0.05))',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    color: 'var(--text-color, #fff)',
                    padding: '8px 15px 8px 35px',
                    borderRadius: '20px',
                    outline: 'none',
                    width: '180px',
                    fontSize: '0.85rem',
                    transition: '0.3s'
                  }}
                />
                <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}></i>
              </div>

              {/* Live Search Dropdown Box */}
              {(searchResults.length > 0 || isSearching) && searchQuery.length >= 3 && (
                <div style={{
                  position: 'absolute', top: '45px', right: '0', width: '300px',
                  background: 'var(--bg-color, #121326)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                  overflow: 'hidden', zIndex: 1000, maxHeight: '400px', overflowY: 'auto'
                }}>
                  {isSearching ? (
                    <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Searching...
                    </div>
                  ) : (
                    searchResults.map(anime => (
                      <Link 
                        key={anime.mal_id} 
                        to={`/anime/${anime.mal_id}`} 
                        onClick={() => { setSearchQuery(''); setSearchResults([]); setIsMobileMenuOpen(false); }} 
                        style={{ display: 'flex', gap: '10px', padding: '10px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', textDecoration: 'none', color: 'var(--text-color, #fff)', transition: '0.2s' }} 
                        className="hover-bg-change"
                      >
                        <img src={anime.images.jpg.small_image_url} alt={anime.title} style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: '4px' }} loading="lazy" />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{anime.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px' }}>⭐ {anime.score || 'N/A'} • {anime.type}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User Auth Section */}
            {!isLoggedIn ? (
              <>
                <button className="social-btn" title="Watchlist" onClick={() => {alert("Please login to see Watchlist!"); navigate('/auth');}}><i className="fas fa-bookmark"></i></button>
                <Link to="/auth" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>Login / Sign Up</Link>
              </>
            ) : (
              <>
                <Link to="/watchlist" className="social-btn" title="Watchlist" style={{ color: 'var(--text-color, #fff)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-bookmark"></i></Link>

                {/* 🔥 FIX: Notifications Wrapper Ref 🔥 */}
                <div ref={notificationMenuRef} style={{ position: 'relative' }}>
                  <button 
                    className="social-btn" 
                    onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false); }}
                    style={{ position: 'relative', cursor: 'pointer', background: showNotifications ? 'var(--bg-elevated, rgba(255,255,255,0.2))' : '' }}
                  >
                    <i className="fas fa-bell"></i>
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', padding: '2px 5px', borderRadius: '50%', fontWeight: 'bold', border: '2px solid var(--bg-color, #0c0f25)' }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Box */}
                  {showNotifications && (
                    <div style={{ position: 'absolute', top: '50px', right: '-15px', background: 'var(--bg-color, #121326)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '16px', width: '320px', boxShadow: '0 15px 40px rgba(0,0,0,0.8)', zIndex: 1000, overflow: 'hidden' }}>
                      <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-color, #fff)', fontSize: '1.1rem' }}>Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Mark all read</button>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '350px', overflowY: 'auto' }}>
                        {notifications.map(n => (
                          <div key={n.id} style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.03))', display: 'flex', gap: '15px', background: n.read ? 'transparent' : 'var(--bg-elevated, rgba(255,75,107,0.05))', cursor: 'pointer', transition: '0.2s' }}>
                             <div style={{ width: '40px', height: '40px', background: 'var(--bg-elevated, rgba(255,255,255,0.05))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                               <i className={`fas ${n.icon}`} style={{ color: n.color, fontSize: '1.1rem' }}></i>
                             </div>
                             <div style={{ flex: 1 }}>
                               <div style={{ color: n.read ? 'var(--text-muted)' : 'var(--text-color, #fff)', fontSize: '0.9rem', lineHeight: '1.4', fontWeight: n.read ? 'normal' : 'bold' }}>{n.text}</div>
                               <div style={{ color: 'var(--primary-soft, var(--primary))', fontSize: '0.75rem', marginTop: '6px', fontWeight: 'bold' }}>{n.time}</div>
                             </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))', background: 'var(--bg-elevated, rgba(0,0,0,0.2))' }}>
                        {/* 🔥 FIX: Changed Link to Button to open Settings Modal directly 🔥 */}
                        <button 
                          onClick={() => { setShowSettings(true); setShowNotifications(false); }} 
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          View All Settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🔥 FIX: Profile Menu Wrapper Ref 🔥 */}
                <div ref={profileMenuRef} style={{ position: 'relative' }}>
                  <div 
                    onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); }} 
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: showDropdown ? 'var(--bg-elevated, rgba(255,255,255,0.15))' : 'var(--bg-elevated, rgba(255,255,255,0.1))', padding: '5px 12px', borderRadius: '99px', transition: '0.3s' }}
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-color, #fff)' }}>{userName}</span>
                    <i className="fas fa-caret-down" style={{ color: 'var(--text-color, #fff)' }}></i>
                  </div>

                  {showDropdown && (
                    <div style={{ position: 'absolute', top: '50px', right: '0', transform: 'translateX(-10px)', background: 'var(--bg-color, #121326)', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', borderRadius: '12px', padding: '10px', width: '200px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000 }}>
                      <Link to="/profile" onClick={() => setShowDropdown(false)} style={{ color: 'var(--text-color, #fff)', fontSize: '0.9rem', display: 'flex', gap: '10px', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none' }} className="hover-bg-change">
                        <i className="fas fa-user-circle"></i> My Profile
                      </Link>

                      <Link to="/watchlist" onClick={() => setShowDropdown(false)} style={{ color: 'var(--text-color, #fff)', fontSize: '0.9rem', display: 'flex', gap: '10px', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none' }} className="hover-bg-change">
                        <i className="fas fa-bookmark"></i> Watchlist
                      </Link>
                      
                      <button onClick={() => { setShowSettings(true); setShowDropdown(false); }} style={{ color: 'var(--text-color, #fff)', fontSize: '0.9rem', display: 'flex', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }} className="hover-bg-change">
                        <i className="fas fa-cog"></i> Settings
                      </button>
                      
                      <hr style={{ borderColor: 'var(--border-color, rgba(255,255,255,0.06))', margin: '5px 0' }} />
                      <button onClick={handleLogout} style={{ color: '#ff4b6b', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', gap: '10px', padding: '8px 10px', borderRadius: '8px' }} className="hover-bg-change">
                        <i className="fas fa-sign-out-alt"></i> Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="menu-icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ cursor: 'pointer', marginLeft: '10px', fontSize: '1.5rem', color: 'var(--text-color, #fff)', display: 'none' }}>
              <i className={isMobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
            </div>

          </div>
        </nav>
      </header>

      {/* ================= 🔥 SETTINGS MODAL 🔥 ================= */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '90%', maxWidth: '400px', background: 'var(--bg-color, #121429)', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border-color, rgba(255,255,255,0.1))', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
                <div style={{ padding: '20px 25px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: 'var(--text-color, #fff)', margin: 0, fontSize: '1.2rem' }}><i className="fas fa-sliders-h" style={{ color: 'var(--primary)', marginRight: '10px' }}></i> Preferences</h3>
                    <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
                </div>
                
                <div style={{ padding: '25px' }}>
                    
                    {/* 🔥 NEW: Theme Toggle 🔥 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <div>
                            <div style={{ color: 'var(--text-color, #fff)', fontWeight: 'bold', marginBottom: '5px' }}>App Theme</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Toggle light and dark mode</div>
                        </div>
                        <div style={{ display: 'flex', background: 'var(--bg-elevated, rgba(0,0,0,0.5))', borderRadius: '8px', padding: '3px' }}>
                            <button onClick={() => setSettings({...settings, theme: 'light'})} style={{ background: settings.theme === 'light' ? 'var(--primary)' : 'transparent', color: settings.theme === 'light' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}><i className="fas fa-sun"></i></button>
                            <button onClick={() => setSettings({...settings, theme: 'dark'})} style={{ background: settings.theme === 'dark' ? 'var(--primary)' : 'transparent', color: settings.theme === 'dark' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}><i className="fas fa-moon"></i></button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <div>
                            <div style={{ color: 'var(--text-color, #fff)', fontWeight: 'bold', marginBottom: '5px' }}>Default Audio</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Preferred playback language</div>
                        </div>
                        <div style={{ display: 'flex', background: 'var(--bg-elevated, rgba(0,0,0,0.5))', borderRadius: '8px', padding: '3px' }}>
                            <button onClick={() => setSettings({...settings, subDub: 'sub'})} style={{ background: settings.subDub === 'sub' ? 'var(--primary)' : 'transparent', color: settings.subDub === 'sub' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Sub</button>
                            <button onClick={() => setSettings({...settings, subDub: 'dub'})} style={{ background: settings.subDub === 'dub' ? 'var(--primary)' : 'transparent', color: settings.subDub === 'dub' ? '#fff' : 'var(--text-muted)', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>Dub</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <div>
                            <div style={{ color: 'var(--text-color, #fff)', fontWeight: 'bold', marginBottom: '5px' }}>Autoplay Next Episode</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Automatically start next episode</div>
                        </div>
                        <div 
                            onClick={() => toggleSetting('autoplay')}
                            style={{ width: '45px', height: '24px', background: settings.autoplay ? 'var(--primary)' : 'var(--border-color, rgba(255,255,255,0.1))', borderRadius: '99px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                        >
                            <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: settings.autoplay ? '23px' : '2px', transition: '0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}></div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '15px 25px', background: 'var(--bg-elevated, rgba(0,0,0,0.2))', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.05))', textAlign: 'right' }}>
                    <button onClick={() => setShowSettings(false)} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem' }}>Save Changes</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Header;