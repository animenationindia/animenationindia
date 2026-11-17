// lib/config.ts
export const BACKEND_URL = 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? 'https://animenationindia.onrender.com'
    : (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://animenationindia.onrender.com');
