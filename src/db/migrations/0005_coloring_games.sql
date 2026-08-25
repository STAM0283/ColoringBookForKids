CREATE TABLE IF NOT EXISTS "coloring_games" (
  "id" text PRIMARY KEY NOT NULL,
  "language" text DEFAULT 'FR' NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "description" text NOT NULL,
  "svg_content" text NOT NULL,
  "difficulty" text DEFAULT 'EASY' NOT NULL,
  "age_min" integer,
  "age_max" integer,
  "zone_count" integer DEFAULT 0 NOT NULL,
  "published" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "coloring_games_language_slug_idx" ON "coloring_games" USING btree ("language","slug");
CREATE INDEX IF NOT EXISTS "coloring_games_listing_idx" ON "coloring_games" USING btree ("language","published","sort_order","created_at");
CREATE TABLE IF NOT EXISTS "coloring_game_characters" (
  "coloring_game_id" text NOT NULL REFERENCES "coloring_games"("id") ON DELETE cascade,
  "character_id" text NOT NULL REFERENCES "characters"("id") ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS "coloring_game_characters_unique_idx" ON "coloring_game_characters" USING btree ("coloring_game_id","character_id");
CREATE INDEX IF NOT EXISTS "coloring_game_characters_character_idx" ON "coloring_game_characters" USING btree ("character_id");
