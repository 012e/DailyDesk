CREATE TABLE `board_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text,
	`user_id` text,
	`is_public` integer DEFAULT false,
	`background_url` text,
	`background_color` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `template_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`order` integer NOT NULL,
	`template_list_id` text NOT NULL,
	FOREIGN KEY (`template_list_id`) REFERENCES `template_lists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `template_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`template_id` text NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `board_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `template_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL,
	`template_id` text NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `board_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
