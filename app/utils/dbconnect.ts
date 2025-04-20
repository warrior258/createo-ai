import { bigserial, pgTable, text, timestamp, integer, numeric, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from "pg";
import { relations } from 'drizzle-orm';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: false
});

export const users = pgTable('users', {
    id: bigserial('id', {mode: "number"}).primaryKey(),
    googleId: varchar("google_id", {length: 255}).notNull(),
    email: varchar('email', {length: 255}).notNull().unique(),
    username: varchar('username', {length: 255}).notNull(),
    picture: text('picture')
});

export const user_youtube = pgTable("youtube", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    refresh_expiry: timestamp("refresh_expiry", { mode: 'date' }).notNull(),
    googleId: varchar("google_id", {length: 255}).notNull().references(() => users.googleId),
});

export const user_videos = pgTable("videos", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    cloudinaryPublicId: varchar("cloudinary_public_id", {length: 255}).notNull(),
    cloudinaryUrl: text("cloudinary_url").notNull(),
    duration: numeric("duration"),
    width: integer("width"),
    height: integer("height"),
    format: varchar("format", {length: 20}),
    bytes: integer("bytes"),
    googleId: varchar("google_id", {length: 255}).notNull().references(() => users.googleId),
});

export const platform_uploads = pgTable("platform_uploads", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    video_id: bigserial("video_id", { mode: "number" })
    .references(() => user_videos.id)
    .notNull(),
    platform: varchar("platform", { length: 20 }).notNull(), // 'youtube', 'instagram', 'facebook'
    platform_video_id: varchar("platform_video_id", { length: 255 }).notNull(),
    url: text("url").notNull(),
    
});

// relations
export const userVideoRelations = relations(user_videos, ({ many }) => ({
    platform_uploads: many(platform_uploads),
}));
  
export const platformUploadRelations = relations(platform_uploads, ({ one }) => ({
    video: one(user_videos, {
        fields: [platform_uploads.video_id],
        references: [user_videos.id],
    }),
}));

export const db = drizzle(pool, { schema: { users, user_youtube, user_videos, platform_uploads, userVideoRelations,
    platformUploadRelations} });