CREATE TABLE "characters" (
  "id" text PRIMARY KEY NOT NULL,
  "language" text DEFAULT 'FR' NOT NULL,
  "translation_group_id" text,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "short_description" text NOT NULL,
  "biography" text,
  "age_label" text,
  "species" text,
  "personality" text,
  "hobbies" text,
  "motto" text,
  "color" text DEFAULT '#0F8A68' NOT NULL,
  "portrait_media_id" text,
  "published" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  CONSTRAINT "characters_portrait_media_id_media_id_fk" FOREIGN KEY ("portrait_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action
);
CREATE UNIQUE INDEX "characters_language_slug_idx" ON "characters" USING btree ("language","slug");
CREATE INDEX "characters_language_listing_idx" ON "characters" USING btree ("language","published","sort_order");
CREATE INDEX "characters_translation_group_idx" ON "characters" USING btree ("translation_group_id");

CREATE TABLE "media_characters" (
  "media_id" text NOT NULL,
  "character_id" text NOT NULL,
  CONSTRAINT "media_characters_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "media_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action
);
CREATE UNIQUE INDEX "media_characters_unique_idx" ON "media_characters" USING btree ("media_id","character_id");
CREATE INDEX "media_characters_character_idx" ON "media_characters" USING btree ("character_id");
