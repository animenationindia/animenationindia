import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_xHZldnK6ap9T@ep-delicate-mode-b38ydh09-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  },
});
