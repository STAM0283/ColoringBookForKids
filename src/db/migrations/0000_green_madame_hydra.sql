CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`category_id` text,
	`preview_media_id` text,
	`pdf_media_id` text,
	`age_min` integer,
	`age_max` integer,
	`page_count` integer,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`preview_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`pdf_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activities_slug_idx` ON `activities` (`slug`);--> statement-breakpoint
CREATE INDEX `activities_listing_idx` ON `activities` (`published`,`featured`,`created_at`);--> statement-breakpoint
CREATE TABLE `backups` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`status` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `book_gallery` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`media_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text NOT NULL,
	`description` text NOT NULL,
	`category_id` text,
	`cover_media_id` text,
	`age_min` integer,
	`age_max` integer,
	`page_count` integer,
	`amazon_url` text,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`og_image_media_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`og_image_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `books_slug_idx` ON `books` (`slug`);--> statement-breakpoint
CREATE INDEX `books_listing_idx` ON `books` (`published`,`featured`,`sort_order`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_scope_slug_idx` ON `categories` (`scope`,`slug`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`filename` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`width` integer,
	`height` integer,
	`duration` integer,
	`path` text NOT NULL,
	`alt` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_path_idx` ON `media` (`path`);--> statement-breakpoint
CREATE INDEX `media_type_created_idx` ON `media` (`type`,`created_at`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`cover_media_id` text,
	`category_id` text,
	`author_name` text NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_slug_idx` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `posts_listing_idx` ON `posts` (`published`,`featured`,`published_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`type` text DEFAULT 'STRING' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_networks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`icon` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'ADMIN' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `vlogs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text NOT NULL,
	`video_media_id` text,
	`thumbnail_media_id` text,
	`duration` integer,
	`featured` integer DEFAULT false NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer,
	FOREIGN KEY (`video_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`thumbnail_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vlogs_slug_idx` ON `vlogs` (`slug`);--> statement-breakpoint
CREATE INDEX `vlogs_listing_idx` ON `vlogs` (`published`,`featured`,`published_at`);