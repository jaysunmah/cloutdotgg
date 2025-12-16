-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    website VARCHAR(512),
    category VARCHAR(100) NOT NULL DEFAULT 'General AI',
    tags TEXT[],
    founded_year INTEGER,
    hq_location VARCHAR(255),
    employee_range VARCHAR(50),
    funding_stage VARCHAR(100),
    elo_rating INTEGER NOT NULL DEFAULT 1500,
    total_votes INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Votes table (head-to-head comparisons)
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    winner_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    loser_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Category ratings for companies
CREATE TABLE IF NOT EXISTS company_ratings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    criterion VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments/reviews for companies
CREATE TABLE IF NOT EXISTS company_comments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_current_employee BOOLEAN DEFAULT FALSE,
    session_id VARCHAR(255),
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_elo ON companies(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies(category);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_votes_winner ON votes(winner_id);
CREATE INDEX IF NOT EXISTS idx_votes_loser ON votes(loser_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_ratings_company ON company_ratings(company_id);
CREATE INDEX IF NOT EXISTS idx_comments_company ON company_comments(company_id);
