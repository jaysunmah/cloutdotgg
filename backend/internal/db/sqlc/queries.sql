-- name: GetCompanyBySlug :one
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
WHERE slug = $1;

-- name: GetCompanyByID :one
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
WHERE id = $1;

-- name: ListCompanies :many
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
ORDER BY elo_rating DESC, total_votes DESC;

-- name: ListCompaniesByCategory :many
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
WHERE category = $1
ORDER BY elo_rating DESC, total_votes DESC;

-- name: SearchCompanies :many
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1
ORDER BY elo_rating DESC, total_votes DESC;

-- name: SearchCompaniesByCategory :many
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
WHERE category = $1 AND (LOWER(name) LIKE $2 OR LOWER(description) LIKE $2)
ORDER BY elo_rating DESC, total_votes DESC;

-- name: GetRandomMatchup :many
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
ORDER BY RANDOM()
LIMIT 2;

-- name: GetRandomMatchupByCategory :many
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
WHERE category = $1
ORDER BY RANDOM()
LIMIT 2;

-- name: GetCompanyEloRating :one
SELECT elo_rating FROM companies WHERE id = $1;

-- name: UpdateCompanyAfterWin :exec
UPDATE companies 
SET elo_rating = $2, total_votes = total_votes + 1, wins = wins + 1, updated_at = NOW()
WHERE id = $1;

-- name: UpdateCompanyAfterLoss :exec
UPDATE companies 
SET elo_rating = $2, total_votes = total_votes + 1, losses = losses + 1, updated_at = NOW()
WHERE id = $1;

-- name: CreateVote :one
INSERT INTO votes (winner_id, loser_id, session_id)
VALUES ($1, $2, $3)
RETURNING id, winner_id, loser_id, session_id, created_at;

-- name: GetLeaderboard :many
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
ORDER BY elo_rating DESC, total_votes DESC
LIMIT $1 OFFSET $2;

-- name: GetLeaderboardByCategory :many
SELECT id, name, slug, logo_url, description, website, category, tags,
       founded_year, hq_location, employee_range, funding_stage,
       elo_rating, total_votes, wins, losses, created_at, updated_at
FROM companies
WHERE category = $1
ORDER BY elo_rating DESC, total_votes DESC
LIMIT $2 OFFSET $3;

-- name: CountCompanies :one
SELECT COUNT(*) FROM companies;

-- name: CountCompaniesByCategory :one
SELECT COUNT(*) FROM companies WHERE category = $1;

-- name: GetCompanyRank :one
SELECT COUNT(*) + 1 FROM companies WHERE elo_rating > $1;

-- name: CreateRating :one
INSERT INTO company_ratings (company_id, criterion, score, session_id)
VALUES ($1, $2, $3, $4)
RETURNING id, company_id, criterion, score, session_id, created_at;

-- name: GetAggregatedRatings :many
SELECT criterion, AVG(score)::float as average_score, COUNT(*) as total_ratings
FROM company_ratings
WHERE company_id = $1
GROUP BY criterion;

-- name: CreateComment :one
INSERT INTO company_comments (company_id, content, is_current_employee, session_id)
VALUES ($1, $2, $3, $4)
RETURNING id, company_id, content, is_current_employee, session_id, upvotes, created_at;

-- name: GetCompanyComments :many
SELECT id, company_id, content, is_current_employee, session_id, upvotes, created_at
FROM company_comments
WHERE company_id = $1
ORDER BY upvotes DESC, created_at DESC
LIMIT 100;

-- name: UpvoteComment :one
UPDATE company_comments
SET upvotes = upvotes + 1
WHERE id = $1
RETURNING id, company_id, content, is_current_employee, session_id, upvotes, created_at;

-- name: GetCategories :many
SELECT category, COUNT(*) as count
FROM companies
GROUP BY category
ORDER BY count DESC;

-- name: GetDistinctCategories :many
SELECT DISTINCT category FROM companies ORDER BY category;

-- name: CountVotes :one
SELECT COUNT(*) FROM votes;

-- name: CountRatings :one
SELECT COUNT(*) FROM company_ratings;

-- name: CountComments :one
SELECT COUNT(*) FROM company_comments;

-- name: CompanyExists :one
SELECT EXISTS(SELECT 1 FROM companies WHERE id = $1);

-- name: GetCompanyIDBySlug :one
SELECT id FROM companies WHERE slug = $1;
