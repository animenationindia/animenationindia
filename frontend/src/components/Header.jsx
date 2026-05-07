import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import { API_URL } from '../api/config';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef(null);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

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

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        try {
          const response = await fetch(`${API_URL}/api/anime/search?q=${searchQuery}`);
          const data = await response.json();
          setSearchResults(data);
        } catch (error) { console.error(error); } finally { setIsSearching(false); }
      } else { setSearchResults([]); }
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
        setSearchQuery('');
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate('/'); 
  };

  return (
    <>
      <style>
        {`
          .nav-menu { margin: 0 auto; flex: 1; display: flex; justify-content: center; gap: 1.5vw; list-style: none; padding: 0; }
          .bottom-nav-mobile { display: none; }
          
          /* Custom classes for hiding/showing elements based on screen size */
          .show-on-mobile-only { display: none !important; }
          .hide-on-mobile { display: flex !important; }

          @media (max-width: 768px) {
            .nav-menu { display: none !important; }
            .show-on-mobile-only { display: flex !important; }
            .hide-on-mobile { display: none !important; }
            
            .bottom-nav-mobile {
              display: flex; position: fixed; bottom: 0; left: 0; right: 0;
              background: rgba(10, 12, 26, 0.98); backdrop-filter: blur(15px);
              border-top: 1px solid rgba(255,255,255,0.08); z-index: 9999;
              justify-content: space-around; padding: 10px 0; padding-bottom: env(safe-area-inset-bottom, 10px);
            }
            .nav-item-bottom { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #888; text-decoration: none; font-size: 0.65rem; }
            .nav-item-bottom i { font-size: 1.2rem; }
            .nav-item-bottom.active { color: var(--primary); }
            body { padding-bottom: 70px !important; }
          }
        `}
      </style>

      <header className="header" style={{ position: 'relative', zIndex: 999 }}>
        <nav className="nav-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
          
          <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/ani-logo.png" style={{ width: '40px', height: '40px', borderRadius: '10px' }} alt="Logo" />
            <div className="brand-text hide-on-mobile" style={{ flexDirection: 'column' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', display: 'block' }}>Anime Nation India</span>
              <span style={{ fontSize: '0.6rem', color: '#888' }}>LIVE CALENDAR • NEWS</span>
            </div>
          </Link>

          {/* 🔥 DESKTOP MENU 🔥 */}
          <ul className="nav-menu">
            <li><Link to="/" className="nav-link">Home</Link></li>
            <li><Link to="/schedule" className="nav-link">Schedule</Link></li>
            <li><Link to="/top-anime" className="nav-link">Top Anime</Link></li>
            <li><Link to="/manga" className="nav-link">Top Manga</Link></li>
            <li><Link to="/popular" className="nav-link">Popular</Link></li>
            <li><Link to="/genres" className="nav-link">Genres</Link></li>
            <li><Link to="/contact" className="nav-link">Contact</Link></li>
          </ul>

          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div ref={searchRef} style={{ position: 'relative' }}>
              <input
                type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 15px 8px 35px', borderRadius: '20px', width: '160px' }}
              />
              <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '0.8rem' }}></i>
              
              {/* Live Search Dropdown */}
              {(searchResults.length > 0 || isSearching) && searchQuery.length >= 3 && (
                <div style={{ position: 'absolute', top: '45px', right: '0', width: '300px', maxWidth: '90vw', background: '#121326', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px #000', overflow: 'hidden', zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
                  {isSearching ? (
                    <div style={{ padding: '15px', textAlign: 'center', color: '#888' }}><i className="fas fa-spinner fa-spin"></i></div>
                  ) : (
                    searchResults.map(anime => (
                      <Link key={anime.mal_id} to={`/anime/${anime.mal_id}`} onClick={() => { setSearchQuery(''); setSearchResults([]); }} style={{ display: 'flex', gap: '10px', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: '#fff' }} className="hover-bg-change">
                        <img src={anime.images.jpg.small_image_url} alt={anime.title} style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: '4px' }} loading="lazy" />
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{anime.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px' }}>⭐ {anime.score || 'N/A'}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                
                {/* 🔥 MOBILE ER JONNO GENRES ICON 🔥 */}
                <Link to="/genres" className="show-on-mobile-only" style={{ alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--primary)', color: '#fff', padding: '6px 14px', borderRadius: '99px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <i className="fas fa-tags"></i> Genres
                </Link>

                {/* 🔥 DESKTOP ER JONNO PROFILE (Mobile-e hide thakbe) 🔥 */}
                <div ref={profileMenuRef} className="hide-on-mobile" style={{ position: 'relative' }}>
                  <div onClick={() => setShowDropdown(!showDropdown)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '99px' }}>
                    <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>{userName.charAt(0).toUpperCase()}</div>
                    <i className="fas fa-caret-down" style={{ color: '#fff' }}></i>
                  </div>
                  {showDropdown && (
                    <div style={{ position: 'absolute', top: '45px', right: '0', background: '#121326', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', width: '180px', boxShadow: '0 10px 30px #000' }}>
                      <Link to="/profile" className="nav-link" style={{ padding: '8px', display: 'block' }} onClick={() => setShowDropdown(false)}>My Profile</Link>
                      <Link to="/watchlist" className="nav-link" style={{ padding: '8px', display: 'block' }} onClick={() => setShowDropdown(false)}>Watchlist</Link>
                      <button onClick={handleLogout} style={{ color: '#ff4b6b', background: 'none', border: 'none', padding: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>Log Out</button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <Link to="/auth" className="btn-primary" style={{ padding: '8px 15px', fontSize: '0.8rem', textDecoration: 'none' }}>Login</Link>
            )}
          </div>
        </nav>
      </header>

      {/* BOTTOM NAV FOR MOBILE */}
      <nav className="bottom-nav-mobile">
        <Link to="/" className={`nav-item-bottom ${currentPath === '/' ? 'active' : ''}`}><i className="fas fa-home"></i><span>Home</span></Link>
        <Link to="/watchlist" className={`nav-item-bottom ${currentPath === '/watchlist' ? 'active' : ''}`}><i className="fas fa-bookmark"></i><span>Watchlist</span></Link>
        <Link to="/popular" className={`nav-item-bottom ${currentPath === '/popular' ? 'active' : ''}`}><i className="fas fa-th-large"></i><span>Browse</span></Link>
        <Link to="/contact" className={`nav-item-bottom ${currentPath === '/contact' ? 'active' : ''}`}><i className="fas fa-envelope"></i><span>Contact</span></Link>
        <Link to={isLoggedIn ? "/profile" : "/auth"} className={`nav-item-bottom ${currentPath === '/profile' || currentPath === '/auth' ? 'active' : ''}`}><i className="fas fa-user-circle"></i><span>Account</span></Link>
      </nav>
    </>
  );
};

export default Header;
