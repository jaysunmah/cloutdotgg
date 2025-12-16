-- Remove seed data (truncate companies table)
-- Note: This will also cascade delete votes, ratings, and comments
TRUNCATE TABLE companies CASCADE;
