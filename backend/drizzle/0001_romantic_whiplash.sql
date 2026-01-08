CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`public_id` text,
	`type` text NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`uploaded_at` integer NOT NULL,
	`uploaded_by` text NOT NULL,
	`card_id` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `cards` ADD `completed` integer DEFAULT false;