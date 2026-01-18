CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action_type` text NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
CREATE TABLE `board_members` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar` text,
	`role` text DEFAULT 'member' NOT NULL,
	`added_at` integer NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`background_url` text,
	`background_public_id` text,
	`background_color` text
);
--> statement-breakpoint
CREATE TABLE `card_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`label_id` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `card_members` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`member_id` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `board_members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`order` integer NOT NULL,
	`cover_url` text,
	`cover_public_id` text,
	`cover_color` text,
	`cover_mode` text,
	`list_id` text NOT NULL,
	`start_date` integer,
	`deadline` integer,
	`due_at` integer,
	`due_complete` integer DEFAULT false,
	`reminder_minutes` integer,
	`recurrence` text,
	`recurrence_day` integer,
	`recurrence_weekday` integer,
	`repeat_frequency` text,
	`repeat_interval` integer,
	`latitude` integer,
	`longitude` integer,
	`completed` integer DEFAULT false,
	`is_template` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `checklist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`order` integer NOT NULL,
	`card_id` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
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
CREATE TABLE `labels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `labels_user_id_name_color_unique` ON `labels` (`user_id`,`name`,`color`);--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL,
	`board_id` text NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
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
