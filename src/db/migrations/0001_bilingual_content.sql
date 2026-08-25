ALTER TABLE "categories" ADD COLUMN "language" text DEFAULT 'FR' NOT NULL;
ALTER TABLE "books" ADD COLUMN "language" text DEFAULT 'FR' NOT NULL;
ALTER TABLE "books" ADD COLUMN "translation_group_id" text;
ALTER TABLE "activities" ADD COLUMN "language" text DEFAULT 'FR' NOT NULL;
ALTER TABLE "activities" ADD COLUMN "translation_group_id" text;
ALTER TABLE "posts" ADD COLUMN "language" text DEFAULT 'FR' NOT NULL;
ALTER TABLE "posts" ADD COLUMN "translation_group_id" text;
ALTER TABLE "vlogs" ADD COLUMN "language" text DEFAULT 'FR' NOT NULL;
ALTER TABLE "vlogs" ADD COLUMN "translation_group_id" text;

DROP INDEX IF EXISTS "category_scope_slug_idx";
DROP INDEX IF EXISTS "books_listing_idx";
DROP INDEX IF EXISTS "activities_listing_idx";
DROP INDEX IF EXISTS "posts_listing_idx";
DROP INDEX IF EXISTS "vlogs_listing_idx";

CREATE UNIQUE INDEX "category_scope_language_slug_idx" ON "categories" ("scope", "language", "slug");
CREATE INDEX "categories_scope_language_idx" ON "categories" ("scope", "language");
CREATE INDEX "books_language_listing_idx" ON "books" ("language", "published", "featured", "sort_order");
CREATE INDEX "books_translation_group_idx" ON "books" ("translation_group_id");
CREATE INDEX "activities_language_listing_idx" ON "activities" ("language", "published", "featured", "created_at");
CREATE INDEX "activities_translation_group_idx" ON "activities" ("translation_group_id");
CREATE INDEX "posts_language_listing_idx" ON "posts" ("language", "published", "featured", "published_at");
CREATE INDEX "posts_translation_group_idx" ON "posts" ("translation_group_id");
CREATE INDEX "vlogs_language_listing_idx" ON "vlogs" ("language", "published", "featured", "published_at");
CREATE INDEX "vlogs_translation_group_idx" ON "vlogs" ("translation_group_id");
