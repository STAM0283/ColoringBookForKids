ALTER TABLE "coloring_games"
  ADD COLUMN IF NOT EXISTS "category_id" text REFERENCES "categories"("id") ON DELETE set null;

CREATE INDEX IF NOT EXISTS "coloring_games_category_idx"
  ON "coloring_games" USING btree ("category_id");
