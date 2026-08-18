ALTER TABLE `activities` ADD `download_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `club_codes` ADD `access_duration_minutes` integer DEFAULT 43200 NOT NULL;