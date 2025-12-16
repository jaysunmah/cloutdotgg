-- Remove user_id column from votes table
DROP INDEX IF EXISTS idx_votes_user_id;
ALTER TABLE votes DROP COLUMN IF EXISTS user_id;
