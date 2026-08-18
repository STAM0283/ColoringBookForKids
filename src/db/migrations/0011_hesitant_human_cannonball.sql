ALTER TABLE `vlogs` ADD `category_id` text REFERENCES categories(id);--> statement-breakpoint
CREATE INDEX `vlogs_category_idx` ON `vlogs` (`category_id`);