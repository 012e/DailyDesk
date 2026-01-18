ALTER TABLE `cards` ADD `repeat_frequency` text;--> statement-breakpoint
ALTER TABLE `cards` ADD `repeat_interval` integer;
--> statement-breakpoint
ALTER TABLE `cards` ADD `is_template` integer DEFAULT false;
