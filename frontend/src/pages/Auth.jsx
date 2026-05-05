import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 🔥 NOTUN: Password Show/Hide korar jonno State 🔥
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    // 🔥 EKDOM THIK KORA LINK (Kono bracket ba quote nei) 🔥
    const url = `https://animenationindia-backend.onrender.com${endpoint}`;

    try {
      const payload = isLogin 
        ? { email: formData.email, password: formData.password } 
        : formData;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Jodi backend text ba html dey json er bodole, sheta handle korar better error
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
          throw new Error("Server did not return JSON. Is your backend API route (/api/auth/...) setup and running?");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Something went wrong!');
      }

      if (isLogin) {
        localStorage.setItem('user_token', data.token);
        localStorage.setItem('user_name', data.user.username);
        localStorage.setItem('user_id', data.user.id);
        
        navigate('/');
        window.location.reload();
      } else {
        alert("Account created successfully! Please log in.");
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '' });
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 20px', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.15, zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.15, zIndex: 0 }}></div>

      <div style={{ width: '100%', maxWidth: '450px', background: 'rgba(15, 17, 35, 0.7)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', position: 'relative', zIndex: 10 }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', marginBottom: '15px', color: '#fff', fontSize: '1.8rem', boxShadow: '0 10px 20px rgba(255, 75, 107, 0.4)' }}>
              <i className={isLogin ? "fas fa-user-lock" : "fas fa-user-plus"}></i>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
            {isLogin ? 'Welcome Back!' : 'Join the Nation'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isLogin ? 'Login to access your premium watchlist' : 'Create an account to save your favorite anime'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.5)', color: '#ff3b30', padding: '12px 15px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '25px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div><i className="fas fa-exclamation-circle"></i> {error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {!isLogin && (
            <div>
              <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Username</label>
              <div style={{ position: 'relative' }}>
                  <i className="fas fa-user" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required={!isLogin}
                    placeholder="e.g. NarutoUzumaki"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '14px 15px 14px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1rem', outline: 'none', transition: '0.3s' }}
                    onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
                    onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                  />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
                <i className="fas fa-envelope" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '14px 15px 14px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1rem', outline: 'none', transition: '0.3s' }}
                  onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
            </div>
          </div>

          {/* 🔥 UPDATED: Password Input with Eye Icon 🔥 */}
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
            <div style={{ position: 'relative' }}>
                <i className="fas fa-lock" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  style={{ width: '100%', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '14px 45px 14px 45px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1rem', outline: 'none', transition: '0.3s' }}
                  onFocus={(e) => e.target.style.border = '1px solid var(--primary)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.1)'}
                />
                
                {/* The Eye Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: showPassword ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', outline: 'none', padding: 0, fontSize: '1rem', transition: '0.2s' }}
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>

            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hover-scale"
            style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: '#fff', fontWeight: 'bold', padding: '15px', borderRadius: '12px', border: 'none', fontSize: '1.1rem', marginTop: '10px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 10px 25px rgba(255, 75, 107, 0.4)' }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Processing...</>
            ) : (
              isLogin ? <><i className="fas fa-sign-in-alt"></i> Login Securely</> : <><i className="fas fa-user-plus"></i> Create Account</>
            )}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ username: '', email: '', password: '' });
                setShowPassword(false); // Toggle korle password abar hide hoye jabe
              }}
              style={{ color: 'var(--primary)', fontWeight: 'bold', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.95rem', padding: 0 }}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              {isLogin ? 'Sign Up here' : 'Login here'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Auth;
