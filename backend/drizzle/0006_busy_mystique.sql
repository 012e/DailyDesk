-- First add user_id column to existing labels table
ALTER TABLE `labels` ADD `user_id` text;--> statement-breakpoint
-- Populate user_id from boards table (labels belong to boards which have user_id)
UPDATE `labels` SET `user_id` = (SELECT `user_id` FROM `boards` WHERE `boards`.`id` = `labels`.`board_id`);--> statement-breakpoint
-- Now recreate the table without board_id
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_labels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_labels`("id", "name", "color", "user_id") SELECT "id", "name", "color", "user_id" FROM `labels`;--> statement-breakpoint
DROP TABLE `labels`;--> statement-breakpoint
ALTER TABLE `__new_labels` RENAME TO `labels`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `labels_user_id_name_color_unique` ON `labels` (`user_id`,`name`,`color`);