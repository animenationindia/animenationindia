import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_xHZldnK6ap9T@ep-delicate-mode-b38ydh09-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// 🚀 Neon HTTP Client for Cloudflare Workers Free Tier
// Uses standard HTTPS fetch() with 0ms Worker CPU wait time, eliminating Error 1108
const sql = neon(dbUrl);

export const db = drizzle(sql, { schema });

