ALTER TABLE "media" ADD COLUMN "gallery_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "media" ADD COLUMN "published" boolean DEFAULT false NOT NULL;
ALTER TABLE "media" ADD COLUMN "access_level" text DEFAULT 'PUBLIC' NOT NULL;

UPDATE "media" AS m SET "gallery_enabled" = true, "published" = true
WHERE m."type" = 'IMAGE'
  AND NOT EXISTS (SELECT 1 FROM "books" b WHERE b."cover_media_id" = m."id" OR b."video_media_id" = m."id" OR b."og_image_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "book_gallery" bg WHERE bg."media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "activities" a WHERE a."preview_media_id" = m."id" OR a."pdf_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "posts" p WHERE p."cover_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "vlogs" v WHERE v."video_media_id" = m."id" OR v."thumbnail_media_id" = m."id");

CREATE INDEX "media_gallery_listing_idx" ON "media" ("gallery_enabled", "published", "access_level", "created_at");
