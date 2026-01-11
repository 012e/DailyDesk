CREATE TABLE `due_reminder_log` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`due_at_snapshot` integer NOT NULL,
	`reminder_minutes` integer NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `cards` ADD `cover_mode` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `due_at` integer;--> statement-breakpoint
ALTER TABLE `cards` ADD `due_complete` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `cards` ADD `reminder_minutes` integer;--> statement-breakpoint
ALTER TABLE `cards` ADD `created_at` integer;--> statement-breakpoint
ALTER TABLE `cards` ADD `updated_at` integer;