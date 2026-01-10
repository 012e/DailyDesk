-- Migration: Add recurrence fields to cards table
-- Description: Adds recurrence, recurrence_day, and recurrence_weekday columns to support recurring cards

-- Add recurrence column (never, daily_weekdays, weekly, monthly_date, monthly_day)
ALTER TABLE cards ADD COLUMN recurrence TEXT;

-- Add recurrence_day column (1-5 for 1st-5th occurrence in month)
ALTER TABLE cards ADD COLUMN recurrence_day INTEGER;

-- Add recurrence_weekday column (0-6 for Sunday-Saturday)
ALTER TABLE cards ADD COLUMN recurrence_weekday INTEGER;
