CREATE TABLE `club_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`code_hint` text NOT NULL,
	`instagram_handle` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`redeemed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `club_codes_hash_idx` ON `club_codes` (`code_hash`);--> statement-breakpoint
CREATE INDEX `club_codes_status_created_idx` ON `club_codes` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `club_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`access_code_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`last_used_at` integer NOT NULL,
	`download_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`access_code_id`) REFERENCES `club_codes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `club_sessions_token_idx` ON `club_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `club_sessions_expiry_idx` ON `club_sessions` (`expires_at`);--> statement-breakpoint
ALTER TABLE `activities` ADD `access_level` text DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE `activities` ADD `download_count` integer DEFAULT 0 NOT NULL;