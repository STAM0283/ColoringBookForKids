ALTER TABLE "coloring_games" ADD COLUMN IF NOT EXISTS "engine" text DEFAULT 'SVG' NOT NULL;
ALTER TABLE "coloring_games" ALTER COLUMN "svg_content" SET DEFAULT '';
ALTER TABLE "coloring_games" ADD COLUMN IF NOT EXISTS "source_media_id" text REFERENCES "media"("id") ON DELETE set null;
