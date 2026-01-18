-- Migration: Change labels from board-based to user-based
-- Step 1: Create new labels table with userId
CREATE TABLE `labels_new` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`user_id` text NOT NULL
);

-- Step 2: Migrate existing labels data (copy board owner's labels)
INSERT INTO `labels_new` (`id`, `name`, `color`, `user_id`)
SELECT l.`id`, l.`name`, l.`color`, b.`user_id`
FROM `labels` l
INNER JOIN `boards` b ON l.`board_id` = b.`id`;

-- Step 3: Drop old labels table
DROP TABLE `labels`;

-- Step 4: Rename new table to labels
ALTER TABLE `labels_new` RENAME TO `labels`;
