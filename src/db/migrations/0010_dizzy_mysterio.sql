CREATE TABLE `media_categories` (
	`media_id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_categories_category_idx` ON `media_categories` (`category_id`);