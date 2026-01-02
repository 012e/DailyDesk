-- Migration: Refactor card labels and members to use proper foreign keys instead of JSON

-- Create card_labels junction table
CREATE TABLE `card_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`label_id` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Create card_members junction table
CREATE TABLE `card_members` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`member_id` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `board_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Drop the old JSON columns from cards table
ALTER TABLE `cards` DROP COLUMN `labels`;
--> statement-breakpoint
ALTER TABLE `cards` DROP COLUMN `members`;
