CREATE TABLE `recovery_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recovery_codes_hash_idx` ON `recovery_codes` (`code_hash`);--> statement-breakpoint
CREATE INDEX `recovery_codes_user_idx` ON `recovery_codes` (`user_id`);--> statement-breakpoint
CREATE TABLE `security_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`event` text NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	`details` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `security_logs_created_idx` ON `security_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `security_logs_user_created_idx` ON `security_logs` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `failed_login_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `locked_until` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `password_changed_at` integer;