import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_xHZldnK6ap9T@ep-delicate-mode-b38ydh09-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
if (dbUrl.includes('sslmode=require')) {
  dbUrl = dbUrl.replace('sslmode=require', 'sslmode=verify-full');
} else if (dbUrl && !dbUrl.includes('sslmode=')) {
  dbUrl += dbUrl.includes('?') ? '&sslmode=verify-full' : '?sslmode=verify-full';
}

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
