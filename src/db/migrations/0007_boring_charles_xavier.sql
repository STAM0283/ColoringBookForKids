ALTER TABLE `books` ADD `pricing_type` text DEFAULT 'PAID' NOT NULL;--> statement-breakpoint
ALTER TABLE `books` ADD `price_cents` integer;--> statement-breakpoint
ALTER TABLE `books` ADD `currency` text DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE `books` ADD `price_updated_at` integer;--> statement-breakpoint
CREATE INDEX `books_pricing_idx` ON `books` (`published`,`pricing_type`,`published_at`);