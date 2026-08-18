CREATE TABLE `activity_books` (
	`activity_id` text NOT NULL,
	`book_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_books_unique_idx` ON `activity_books` (`activity_id`,`book_id`);--> statement-breakpoint
CREATE INDEX `activity_books_activity_idx` ON `activity_books` (`activity_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `activity_categories` (
	`activity_id` text NOT NULL,
	`category_id` text NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_categories_unique_idx` ON `activity_categories` (`activity_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `activity_categories_category_idx` ON `activity_categories` (`category_id`);--> statement-breakpoint
INSERT OR IGNORE INTO `activity_categories` (`activity_id`,`category_id`) SELECT `id`,`category_id` FROM `activities` WHERE `category_id` IS NOT NULL;--> statement-breakpoint
CREATE TABLE `activity_images` (
	`activity_id` text NOT NULL,
	`media_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_images_unique_idx` ON `activity_images` (`activity_id`,`media_id`);--> statement-breakpoint
CREATE INDEX `activity_images_activity_idx` ON `activity_images` (`activity_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `activity_videos` (
	`activity_id` text NOT NULL,
	`vlog_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vlog_id`) REFERENCES `vlogs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_videos_unique_idx` ON `activity_videos` (`activity_id`,`vlog_id`);--> statement-breakpoint
CREATE INDEX `activity_videos_activity_idx` ON `activity_videos` (`activity_id`,`sort_order`);
