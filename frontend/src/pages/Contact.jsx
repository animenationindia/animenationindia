import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  // 🔥 SOCIAL LINKS LIST 🔥 (Tomar ashol link gulo set kora ache)
  const socialLinks = [
    { name: 'discord', url: 'https://discord.gg/pShT9Auspx' },
    { name: 'instagram', url: 'https://www.instagram.com/animenationindia' },
    { name: 'twitter', url: 'https://x.com/shouvikdas155' },
    { name: 'youtube', url: 'https://youtube.com/@animenationindia-1?si=uhPsc6_xk_B0oPGg' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: '' });

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        setStatus({ loading: false, success: true, error: '' });
        setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
        setTimeout(() => setStatus(prev => ({...prev, success: false})), 5000); // Hide success after 5s
      } else {
        setStatus({ loading: false, success: false, error: data.message });
      }
    } catch (error) {
      setStatus({ loading: false, success: false, error: "Server connection failed." });
    }
  };

  return (
    <div className="page-wrap" style={{ paddingTop: '8rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '0 20px' }}>
          <h1 className="section-title" style={{ fontSize: '3.5rem', color: '#fff', marginBottom: '15px' }}>
              Get in <span style={{ color: 'var(--primary)' }}>Touch</span>
          </h1>
          <p className="section-sub" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
              Have a question, feedback, or a business inquiry? Drop us a message below and our team will get back to you!
          </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', padding: '0 20px' }}>
        {/* Contact Info Box */}
        <div style={{ background: 'var(--bg-elevated)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '20px' }}>Contact Information</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.6' }}>We are always open to discussing new projects, creative ideas or opportunities to be part of your visions.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(255, 75, 107, 0.1)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}><i className="fas fa-envelope"></i></div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Email Us</div>
                        {/* 🔥 Tomar Notun Email Ta Ekhane Bosiyechi 🔥 */}
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>animenationindia.global@gmail.com</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(255, 75, 107, 0.1)', color: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}><i className="fas fa-map-marker-alt"></i></div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Location</div>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>   India</div>
                    </div>
                </div>
            </div>

            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px' }}>Follow Us</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
                {socialLinks.map(social => (
                    <a 
                      key={social.name} 
                      href={social.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ width: '45px', height: '45px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', textDecoration: 'none', transition: '0.3s' }} 
                      className="hover-bg-change"
                    >
                        <i className={`fab fa-${social.name}`}></i>
                    </a>
                ))}
            </div>
        </div>

        {/* Contact Form */}
        <div style={{ background: 'var(--bg-elevated)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>Your Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Goku Son" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '15px', borderRadius: '12px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="goku@capsulecorp.com" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '15px', borderRadius: '12px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>Subject</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleChange} required placeholder="Business Inquiry" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '15px', borderRadius: '12px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 'bold' }}>Message</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} required placeholder="Type your message here..." rows="5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '15px', borderRadius: '12px', outline: 'none', resize: 'vertical' }}></textarea>
                </div>

                {status.error && <div style={{ color: '#ff4b6b', fontSize: '0.9rem', fontWeight: 'bold' }}>{status.error}</div>}
                {status.success && <div style={{ color: '#2ecc71', fontSize: '0.9rem', fontWeight: 'bold' }}>✅ Message sent successfully!</div>}

                <button type="submit" disabled={status.loading} className="btn-primary" style={{ padding: '15px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: status.loading ? 'not-allowed' : 'pointer', border: 'none', marginTop: '10px' }}>
                    {status.loading ? 'Sending...' : 'Send Message'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;