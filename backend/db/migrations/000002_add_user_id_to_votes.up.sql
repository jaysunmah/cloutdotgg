-- Add user_id column to votes table to track which user voted
ALTER TABLE votes ADD COLUMN user_id VARCHAR(255);

-- Create index for efficient user vote lookups
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
