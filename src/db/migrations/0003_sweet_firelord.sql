CREATE TABLE `site_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_hash` text NOT NULL,
	`visited_on` text NOT NULL,
	`page_views` integer DEFAULT 1 NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `site_visits_visitor_day_idx` ON `site_visits` (`visitor_hash`,`visited_on`);--> statement-breakpoint
CREATE INDEX `site_visits_day_idx` ON `site_visits` (`visited_on`);