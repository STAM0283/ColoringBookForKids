CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category_id" text,
	"preview_media_id" text,
	"pdf_media_id" text,
	"age_min" integer,
	"age_max" integer,
	"page_count" integer,
	"access_level" text DEFAULT 'PUBLIC' NOT NULL,
	"download_enabled" boolean DEFAULT true NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "activity_categories" (
	"activity_id" text NOT NULL,
	"category_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"path" text NOT NULL,
	"size" integer NOT NULL,
	"status" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "book_gallery" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text NOT NULL,
	"media_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text NOT NULL,
	"description" text NOT NULL,
	"category_id" text,
	"cover_media_id" text,
	"video_media_id" text,
	"age_min" integer,
	"age_max" integer,
	"page_count" integer,
	"amazon_url" text,
	"pricing_type" text DEFAULT 'PAID' NOT NULL,
	"price_cents" integer,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"price_updated_at" timestamp with time zone,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"og_image_media_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#0F8A68' NOT NULL,
	"badge" text DEFAULT '🏷️' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"code_hint" text NOT NULL,
	"instagram_handle" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"access_duration_minutes" integer DEFAULT 43200 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"redeemed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "club_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"access_code_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"path" text NOT NULL,
	"alt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_categories" (
	"media_id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"cover_media_id" text,
	"category_id" text,
	"author_name" text NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recovery_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event" text NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"details" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"type" text DEFAULT 'STRING' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_visits" (
	"id" text PRIMARY KEY NOT NULL,
	"visitor_hash" text NOT NULL,
	"visited_on" text NOT NULL,
	"page_views" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_networks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"icon" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'ADMIN' NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vlogs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category_id" text,
	"video_media_id" text,
	"thumbnail_media_id" text,
	"duration" integer,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_preview_media_id_media_id_fk" FOREIGN KEY ("preview_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_pdf_media_id_media_id_fk" FOREIGN KEY ("pdf_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_categories" ADD CONSTRAINT "activity_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_gallery" ADD CONSTRAINT "book_gallery_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_gallery" ADD CONSTRAINT "book_gallery_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_video_media_id_media_id_fk" FOREIGN KEY ("video_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_og_image_media_id_media_id_fk" FOREIGN KEY ("og_image_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_sessions" ADD CONSTRAINT "club_sessions_access_code_id_club_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."club_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_categories" ADD CONSTRAINT "media_categories_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_categories" ADD CONSTRAINT "media_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_codes" ADD CONSTRAINT "recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vlogs" ADD CONSTRAINT "vlogs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vlogs" ADD CONSTRAINT "vlogs_video_media_id_media_id_fk" FOREIGN KEY ("video_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vlogs" ADD CONSTRAINT "vlogs_thumbnail_media_id_media_id_fk" FOREIGN KEY ("thumbnail_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_slug_idx" ON "activities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "activities_listing_idx" ON "activities" USING btree ("published","featured","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_categories_unique_idx" ON "activity_categories" USING btree ("activity_id","category_id");--> statement-breakpoint
CREATE INDEX "activity_categories_category_idx" ON "activity_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "book_gallery_book_sort_idx" ON "book_gallery" USING btree ("book_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "books_slug_idx" ON "books" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "books_listing_idx" ON "books" USING btree ("published","featured","sort_order");--> statement-breakpoint
CREATE INDEX "books_pricing_idx" ON "books" USING btree ("published","pricing_type","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "category_scope_slug_idx" ON "categories" USING btree ("scope","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "club_codes_hash_idx" ON "club_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "club_codes_status_created_idx" ON "club_codes" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "club_sessions_token_idx" ON "club_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "club_sessions_expiry_idx" ON "club_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_path_idx" ON "media" USING btree ("path");--> statement-breakpoint
CREATE INDEX "media_type_created_idx" ON "media" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "media_categories_category_idx" ON "media_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_listing_idx" ON "posts" USING btree ("published","featured","published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_codes_hash_idx" ON "recovery_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "recovery_codes_user_idx" ON "recovery_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "security_logs_created_idx" ON "security_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "security_logs_user_created_idx" ON "security_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "site_visits_visitor_day_idx" ON "site_visits" USING btree ("visitor_hash","visited_on");--> statement-breakpoint
CREATE INDEX "site_visits_day_idx" ON "site_visits" USING btree ("visited_on");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "vlogs_slug_idx" ON "vlogs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "vlogs_listing_idx" ON "vlogs" USING btree ("published","featured","published_at");--> statement-breakpoint
CREATE INDEX "vlogs_category_idx" ON "vlogs" USING btree ("category_id");