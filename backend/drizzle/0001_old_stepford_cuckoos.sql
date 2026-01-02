ALTER TABLE `cards` ADD `description` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `labels` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `members` text;--> statement-breakpoint
ALTER TABLE `labels` ADD `color` text NOT NULL;--> statement-breakpoint
ALTER TABLE `labels` ADD `board_id` text NOT NULL REFERENCES boards(id);