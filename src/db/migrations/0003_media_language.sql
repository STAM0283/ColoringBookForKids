ALTER TABLE "media" ADD COLUMN "language" text DEFAULT 'FR' NOT NULL;
DROP INDEX IF EXISTS "media_gallery_listing_idx";
CREATE INDEX "media_gallery_listing_idx" ON "media" ("gallery_enabled", "language", "published", "access_level", "created_at");
