import React from 'react';

const Terms = () => {
  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh', paddingLeft: '20px', paddingRight: '20px', color: 'var(--text-muted)' }}>
      <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '2rem' }}>Terms of Service</h1>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Welcome to Anime Nation India. By accessing our website, you agree to these Terms of Service.</p>
      <h3 style={{ color: '#fff', marginTop: '2rem', marginBottom: '1rem' }}>1. Usage License</h3>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>This website is provided as a free service for the anime community. You may not use our service for any illegal or unauthorized purpose.</p>
      <h3 style={{ color: '#fff', marginTop: '2rem', marginBottom: '1rem' }}>2. Data APIs</h3>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Our website acts as an interface that displays data from public APIs (Jikan and AniList). We do not claim ownership of the images, synopses, or characters displayed.</p>
      <h3 style={{ color: '#fff', marginTop: '2rem', marginBottom: '1rem' }}>3. Account Termination</h3>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>We reserve the right to terminate or suspend accounts that engage in spamming or abuse of our systems.</p>
    </div>
  );
};
export default Terms;