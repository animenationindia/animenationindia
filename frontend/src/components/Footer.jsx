import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ background: '#0a0c1a', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '60px', paddingBottom: '20px', marginTop: '50px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
        
        {/* Brand Section */}
        <div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', marginBottom: '20px' }}>
            <img src="/ani-logo.png" alt="Logo" style={{ width: '45px', borderRadius: '12px' }} />
            <div>
              <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>Anime Nation India</div>
              <div style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>LIVE CALENDAR • NEWS</div>
            </div>
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Your ultimate destination for anime tracking, release schedules, and community discussions. Built for Indian anime fans, by Indian anime fans.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Quick Links</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link to="/top-anime" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: '0.3s' }} className="hover-color-primary">Top Anime</Link></li>
            <li><Link to="/schedule" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: '0.3s' }} className="hover-color-primary">Release Schedule</Link></li>
            <li><Link to="/manga" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: '0.3s' }} className="hover-color-primary">Top Manga</Link></li>
            <li><Link to="/search" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: '0.3s' }} className="hover-color-primary">Search Database</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Support</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link to="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: '0.3s' }} className="hover-color-primary">Contact Us</Link></li>
            <li><Link to="/faq" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: '0.3s' }} className="hover-color-primary">FAQ</Link></li>
            <li><Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: '0.3s' }} className="hover-color-primary">Privacy Policy</Link></li>
            <li><Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: '0.3s' }} className="hover-color-primary">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Connect With Us</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>Join our Discord server and follow us on social media!</p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <a href="https://discord.gg/pShT9Auspx" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', textDecoration: 'none', fontSize: '1.2rem', transition: '0.3s' }} className="hover-scale" title="Discord"><i className="fab fa-discord" style={{ color: '#5865F2' }}></i></a>
            <a href="https://instagram.com/shouvik_das_official" target="_blank" rel="noreferrer" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', textDecoration: 'none', fontSize: '1.2rem', transition: '0.3s' }} className="hover-scale" title="Instagram"><i className="fab fa-instagram" style={{ color: '#E1306C' }}></i></a>
            <a href="https://x.com/shouvikdas155" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', textDecoration: 'none', fontSize: '1.2rem', transition: '0.3s' }} className="hover-scale" title="Twitter"><i className="fab fa-twitter" style={{ color: '#1DA1F2' }}></i></a>
            <a href="https://youtube.com/@animenationindia-1?si=uhPsc6_xk_B0oPGg" style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', textDecoration: 'none', fontSize: '1.2rem', transition: '0.3s' }} className="hover-scale" title="YouTube"><i className="fab fa-youtube" style={{ color: '#FF0000' }}></i></a>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Anime Nation India. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;