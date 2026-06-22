// lib/config.ts
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://animenationindia-backend.onrender.com');
