import { pgTable, text, timestamp, boolean, serial, integer, unique } from 'drizzle-orm/pg-core';

// ==========================================
// 🔐 BETTER AUTH & USER CORE TABLES
// ==========================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role').default('user'), // 'admin' | 'vip' | 'user'
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  issuer: text('issuer'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const userTwoFactor = pgTable('user_two_factor', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(false),
  deliveryEmail: text('deliveryEmail'),
  backupCodes: text('backupCodes').notNull(), // JSON string array e.g. ["12345678", ...]
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// ==========================================
// 🎬 ANIME, MANGA & MANHWA LIBRARY TABLES
// ==========================================

export const watchlist = pgTable(
  'watchlist',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    mediaId: text('mediaId').notNull(), // MAL ID or AniList ID
    mediaType: text('mediaType').notNull().default('anime'), // 'anime' | 'manga' | 'manhwa' | 'movie'
    title: text('title').notNull(),
    posterPath: text('posterPath'),
    backdropPath: text('backdropPath'),
    rating: text('rating'),
    year: text('year'),
    status: text('status').notNull().default('plan_to_watch'), // 'watching' | 'completed' | 'plan_to_watch' | 'dropped'
    progress: integer('progress').default(0), // Episode or Chapter count
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserMedia: unique().on(table.userId, table.mediaId, table.mediaType),
  })
);

export const catalogs = pgTable(
  'catalogs',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    catalogId: text('catalogId').notNull(),
    name: text('name').notNull(),
    color: text('color').notNull().default('pink'), // 'pink' | 'emerald' | 'purple' | 'rose' | 'amber' | 'cyan'
    thumbnail: text('thumbnail').notNull().default('Folder'), // 'Folder' | 'Sparkles' | 'BookOpen' | 'Film' | 'Tv' | 'Flame' | 'Star' | 'Heart'
    itemIds: text('itemIds').notNull().default('[]'), // JSON string array of media IDs
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserCatalog: unique().on(table.userId, table.catalogId),
  })
);

export const reactions = pgTable(
  'reactions',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    mediaId: text('mediaId').notNull(),
    mediaType: text('mediaType').notNull().default('anime'),
    isWatched: boolean('isWatched').notNull().default(false),
    isLiked: boolean('isLiked').notNull().default(false),
    isDisliked: boolean('isDisliked').notNull().default(false),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserReaction: unique().on(table.userId, table.mediaId, table.mediaType),
  })
);

export const userReviews = pgTable(
  'user_reviews',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    mediaId: text('mediaId').notNull(),
    mediaType: text('mediaType').notNull().default('anime'),
    score: integer('score').notNull(), // 1 to 10
    title: text('title').notNull(),
    content: text('content').notNull(),
    tags: text('tags').notNull().default('[]'), // JSON string array e.g. ["#Masterpiece", "#MustWatch"]
    helpfulCount: integer('helpfulCount').notNull().default(0),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  }
);

export const progress = pgTable(
  'progress',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
    mediaId: text('mediaId').notNull(),
    mediaType: text('mediaType').notNull().default('anime'),
    season: integer('season').default(1),
    episode: integer('episode').default(1),
    timestamp: integer('timestamp').notNull().default(0),
    duration: integer('duration'),
    title: text('title').notNull(),
    posterPath: text('posterPath'),
    backdropPath: text('backdropPath'),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserMediaEpisode: unique().on(
      table.userId,
      table.mediaId,
      table.mediaType,
      table.season,
      table.episode
    ),
  })
);

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }), // null = broadcast to all
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'), // 'info' | 'release' | 'system' | 'social'
  link: text('link'),
  isRead: boolean('isRead').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export const contactMessages = pgTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  topic: text('topic').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'), // 'unread' | 'read' | 'replied'
  replyText: text('replyText'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const songPlaylists = pgTable('song_playlists', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').default(''),
  isFavorites: boolean('isFavorites').notNull().default(false),
  songs: text('songs').notNull().default('[]'), // JSON array string of songs
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});
