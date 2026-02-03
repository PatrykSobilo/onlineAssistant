-- Add wasMerged column to notes table
ALTER TABLE notes 
ADD COLUMN wasMerged TINYINT(1) NOT NULL DEFAULT 0 AFTER aiResponse;
