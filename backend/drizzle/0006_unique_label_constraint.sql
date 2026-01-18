-- Migration: Add unique constraint on (userId, name, color) for labels
-- This ensures each user can only have one label with a specific name+color combination
-- Users can have multiple labels with the same name (different colors) or same color (different names)

CREATE UNIQUE INDEX `unique_user_name_color` ON `labels` (`user_id`, `name`, `color`);
