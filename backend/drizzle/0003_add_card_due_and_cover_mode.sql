ALTER TABLE `cards` ADD `cover_mode` text;
--> statement-breakpoint
ALTER TABLE `cards` ADD `due_at` integer;
--> statement-breakpoint
ALTER TABLE `cards` ADD `due_complete` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `cards` ADD `reminder_minutes` integer;
--> statement-breakpoint
ALTER TABLE `cards` ADD `created_at` integer;
--> statement-breakpoint
ALTER TABLE `cards` ADD `updated_at` integer;
