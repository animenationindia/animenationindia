import React from 'react';

const Privacy = () => {
  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '800px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh', paddingLeft: '20px', paddingRight: '20px', color: 'var(--text-muted)' }}>
      <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '2rem' }}>Privacy Policy</h1>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Last updated: April 2026</p>
      <h3 style={{ color: '#fff', marginTop: '2rem', marginBottom: '1rem' }}>1. Information We Collect</h3>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>We only collect the information you provide when creating an account, which includes your chosen username, email address, and securely hashed password.</p>
      <h3 style={{ color: '#fff', marginTop: '2rem', marginBottom: '1rem' }}>2. How We Use Your Information</h3>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Your data is strictly used to provide the service (such as saving your personal watchlist to your profile). We do not sell, trade, or otherwise transfer your personal information to outside parties.</p>
      <h3 style={{ color: '#fff', marginTop: '2rem', marginBottom: '1rem' }}>3. Data Security</h3>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>We implement industry-standard security measures, including bcrypt password hashing and JWT token authentication, to maintain the safety of your personal information.</p>
    </div>
  );
};
export default Privacy;