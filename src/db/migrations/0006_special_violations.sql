DROP TABLE `activity_books`;--> statement-breakpoint
DROP TABLE `activity_images`;--> statement-breakpoint
DROP TABLE `activity_videos`;--> statement-breakpoint
ALTER TABLE `categories` ADD `color` text DEFAULT '#0F8A68' NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `badge` text DEFAULT '🏷️' NOT NULL;