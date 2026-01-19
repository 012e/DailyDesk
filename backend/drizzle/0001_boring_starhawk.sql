CREATE TABLE `checklist_item_members` (
	`id` text PRIMARY KEY NOT NULL,
	`checklist_item_id` text NOT NULL,
	`member_id` text NOT NULL,
	FOREIGN KEY (`checklist_item_id`) REFERENCES `checklist_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `board_members`(`id`) ON UPDATE no action ON DELETE cascade
);
