-- AI Companies ranking schema

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    website VARCHAR(512),
    category VARCHAR(100) NOT NULL DEFAULT 'General AI',
    tags TEXT[], -- Array of tags like 'LLM', 'Robotics', etc.
    founded_year INTEGER,
    hq_location VARCHAR(255),
    employee_range VARCHAR(50), -- e.g., '1-50', '51-200', '201-500', '501-1000', '1000+'
    funding_stage VARCHAR(100), -- e.g., 'Seed', 'Series A', 'Series B', 'Public'
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
    session_id VARCHAR(255), -- Anonymous session tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Category ratings for companies
CREATE TABLE IF NOT EXISTS company_ratings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    criterion VARCHAR(100) NOT NULL, -- e.g., 'compensation', 'culture', 'work_life_balance', 'growth', 'tech_stack'
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

-- Seed data for top AI companies
INSERT INTO companies (name, slug, logo_url, description, website, category, tags, founded_year, hq_location, employee_range, funding_stage, elo_rating) VALUES
-- LLM Companies
('OpenAI', 'openai', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/512px-OpenAI_Logo.svg.png', 'Leading AI research lab behind GPT-4, ChatGPT, and DALL-E. Focused on ensuring artificial general intelligence benefits all of humanity.', 'https://openai.com', 'LLM & AGI', ARRAY['LLM', 'AGI', 'Research', 'ChatGPT'], 2015, 'San Francisco, CA', '1000+', 'Private', 1500),

('Anthropic', 'anthropic', 'https://upload.wikimedia.org/wikipedia/commons/1/15/Anthropic_logo.svg', 'AI safety company building reliable, interpretable AI systems. Creators of Claude, focused on AI alignment research.', 'https://anthropic.com', 'LLM & AGI', ARRAY['LLM', 'AI Safety', 'Research', 'Claude'], 2021, 'San Francisco, CA', '501-1000', 'Series D', 1500),

('Google DeepMind', 'deepmind', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/DeepMind_Logo.svg/512px-DeepMind_Logo.svg.png', 'World-leading AI research lab. Created AlphaGo, AlphaFold, and Gemini. Pioneering breakthroughs in deep learning and reinforcement learning.', 'https://deepmind.google', 'LLM & AGI', ARRAY['LLM', 'Research', 'AGI', 'Gemini', 'AlphaFold'], 2010, 'London, UK', '1000+', 'Acquired (Google)', 1500),

('Meta AI (FAIR)', 'meta-ai', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/512px-Meta_Platforms_Inc._logo.svg.png', 'Fundamental AI Research lab at Meta. Open-source leaders with LLaMA, PyTorch, and cutting-edge research in computer vision and NLP.', 'https://ai.meta.com', 'LLM & AGI', ARRAY['LLM', 'Open Source', 'Research', 'LLaMA', 'PyTorch'], 2013, 'Menlo Park, CA', '1000+', 'Public (Meta)', 1500),

('Cohere', 'cohere', 'https://upload.wikimedia.org/wikipedia/en/8/81/Cohere_Logo.png', 'Enterprise AI platform providing NLP models for businesses. Focus on enterprise-grade LLMs and RAG solutions.', 'https://cohere.com', 'LLM & AGI', ARRAY['LLM', 'Enterprise', 'NLP', 'RAG'], 2019, 'Toronto, Canada', '201-500', 'Series C', 1500),

('Mistral AI', 'mistral-ai', 'https://mistral.ai/images/logo.svg', 'European AI lab building efficient, open-weight language models. Known for high-performance models with smaller footprints.', 'https://mistral.ai', 'LLM & AGI', ARRAY['LLM', 'Open Source', 'European'], 2023, 'Paris, France', '51-200', 'Series B', 1500),

('xAI', 'xai', 'https://x.ai/favicon.ico', 'Elon Musk''s AI company building Grok. Focused on understanding the universe through AI.', 'https://x.ai', 'LLM & AGI', ARRAY['LLM', 'Grok', 'Research'], 2023, 'San Francisco, CA', '51-200', 'Series B', 1500),

-- Self-Driving & Robotics
('Waymo', 'waymo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Waymo_logo.svg/512px-Waymo_logo.svg.png', 'Autonomous driving technology company. Operating commercial robotaxi services in multiple US cities.', 'https://waymo.com', 'Self-Driving', ARRAY['Autonomous Vehicles', 'Robotics', 'Transportation'], 2016, 'Mountain View, CA', '1000+', 'Private (Alphabet)', 1500),

('Tesla AI', 'tesla-ai', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tesla_T_symbol.svg/512px-Tesla_T_symbol.svg.png', 'Tesla''s AI division working on Full Self-Driving, Optimus robot, and Dojo supercomputer.', 'https://tesla.com/ai', 'Self-Driving', ARRAY['Autonomous Vehicles', 'Robotics', 'FSD', 'Optimus'], 2016, 'Palo Alto, CA', '1000+', 'Public', 1500),

('Cruise', 'cruise', 'https://getcruise.com/static/images/social-image.png', 'Self-driving car company building autonomous vehicles for ridesharing. GM subsidiary.', 'https://getcruise.com', 'Self-Driving', ARRAY['Autonomous Vehicles', 'Robotics', 'Transportation'], 2013, 'San Francisco, CA', '1000+', 'Acquired (GM)', 1500),

('Figure AI', 'figure-ai', 'https://www.figure.ai/favicon.ico', 'Building general-purpose humanoid robots. Working with OpenAI on AI integration.', 'https://figure.ai', 'Robotics', ARRAY['Robotics', 'Humanoid', 'Manufacturing'], 2022, 'Sunnyvale, CA', '201-500', 'Series B', 1500),

('Boston Dynamics', 'boston-dynamics', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Boston_Dynamics_logo.svg/512px-Boston_Dynamics_logo.svg.png', 'Pioneer in advanced robotics. Famous for Spot, Atlas, and Stretch robots.', 'https://bostondynamics.com', 'Robotics', ARRAY['Robotics', 'Humanoid', 'Industrial'], 1992, 'Waltham, MA', '501-1000', 'Acquired (Hyundai)', 1500),

-- AI Infrastructure & Tools
('Nvidia', 'nvidia', 'https://upload.wikimedia.org/wikipedia/sco/thumb/2/21/Nvidia_logo.svg/512px-Nvidia_logo.svg.png', 'Leading AI hardware and software company. Dominates GPU market for AI training and inference.', 'https://nvidia.com', 'AI Infrastructure', ARRAY['Hardware', 'GPUs', 'CUDA', 'Infrastructure'], 1993, 'Santa Clara, CA', '1000+', 'Public', 1500),

('Hugging Face', 'hugging-face', 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg', 'The GitHub of machine learning. Hosts models, datasets, and spaces for the AI community.', 'https://huggingface.co', 'AI Infrastructure', ARRAY['Open Source', 'ML Platform', 'Transformers', 'Community'], 2016, 'New York, NY', '201-500', 'Series D', 1500),

('Scale AI', 'scale-ai', 'https://scale.com/static/images/scale-logo.svg', 'AI data platform providing training data and model evaluation for enterprises.', 'https://scale.com', 'AI Infrastructure', ARRAY['Data Labeling', 'Enterprise', 'ML Ops'], 2016, 'San Francisco, CA', '501-1000', 'Series E', 1500),

('Databricks', 'databricks', 'https://upload.wikimedia.org/wikipedia/commons/6/63/Databricks_Logo.png', 'Unified analytics platform for data engineering and AI. Creators of Apache Spark.', 'https://databricks.com', 'AI Infrastructure', ARRAY['Data Platform', 'MLOps', 'Enterprise', 'Spark'], 2013, 'San Francisco, CA', '1000+', 'Series I', 1500),

('Weights & Biases', 'wandb', 'https://wandb.ai/logo.svg', 'ML experiment tracking, model management, and collaboration platform.', 'https://wandb.ai', 'AI Infrastructure', ARRAY['MLOps', 'Experiment Tracking', 'Developer Tools'], 2017, 'San Francisco, CA', '201-500', 'Series C', 1500),

-- AI Applications
('Midjourney', 'midjourney', 'https://www.midjourney.com/favicon.ico', 'Leading AI image generation platform. Known for artistic, high-quality image synthesis.', 'https://midjourney.com', 'AI Applications', ARRAY['Image Generation', 'Creative', 'Generative AI'], 2022, 'San Francisco, CA', '51-200', 'Private (Bootstrapped)', 1500),

('Stability AI', 'stability-ai', 'https://stability.ai/favicon.ico', 'Open-source generative AI company behind Stable Diffusion and other models.', 'https://stability.ai', 'AI Applications', ARRAY['Image Generation', 'Open Source', 'Stable Diffusion'], 2020, 'London, UK', '201-500', 'Series B', 1500),

('Runway', 'runway', 'https://runwayml.com/favicon.ico', 'AI-powered creative tools for video editing, generation, and visual effects.', 'https://runwayml.com', 'AI Applications', ARRAY['Video Generation', 'Creative', 'Gen-2'], 2018, 'New York, NY', '201-500', 'Series C', 1500),

('Jasper', 'jasper', 'https://www.jasper.ai/favicon.ico', 'AI content platform for marketing teams. Enterprise-focused writing assistance.', 'https://jasper.ai', 'AI Applications', ARRAY['Content Generation', 'Marketing', 'Enterprise'], 2021, 'Austin, TX', '201-500', 'Series A', 1500),

('Copy.ai', 'copy-ai', 'https://www.copy.ai/favicon.ico', 'AI-powered copywriting and content generation tool for marketers and writers.', 'https://copy.ai', 'AI Applications', ARRAY['Content Generation', 'Marketing', 'Writing'], 2020, 'Memphis, TN', '51-200', 'Series A', 1500),

-- AI for Science & Healthcare
('Recursion', 'recursion', 'https://www.recursion.com/favicon.ico', 'AI-driven drug discovery company using machine learning to decode biology.', 'https://recursion.com', 'AI for Science', ARRAY['Drug Discovery', 'Healthcare', 'Biotech'], 2013, 'Salt Lake City, UT', '501-1000', 'Public', 1500),

('Insitro', 'insitro', 'https://www.insitro.com/favicon.ico', 'ML-driven drug discovery company combining biology and machine learning.', 'https://insitro.com', 'AI for Science', ARRAY['Drug Discovery', 'Healthcare', 'Biotech'], 2018, 'South San Francisco, CA', '201-500', 'Series C', 1500),

('Tempus', 'tempus', 'https://www.tempus.com/favicon.ico', 'AI platform for precision medicine. Analyzes clinical and molecular data.', 'https://tempus.com', 'AI for Science', ARRAY['Healthcare', 'Precision Medicine', 'Genomics'], 2015, 'Chicago, IL', '1000+', 'Series G', 1500),

-- AI Coding & Developer Tools
('GitHub Copilot', 'github-copilot', 'https://github.githubassets.com/favicons/favicon.svg', 'AI pair programmer by GitHub. Uses OpenAI Codex for code completion and generation.', 'https://github.com/features/copilot', 'AI Coding', ARRAY['Code Generation', 'Developer Tools', 'IDE'], 2021, 'San Francisco, CA', '1000+', 'Acquired (Microsoft)', 1500),

('Cursor', 'cursor', 'https://cursor.sh/favicon.ico', 'AI-first code editor built for pair programming with AI. Fast and intelligent.', 'https://cursor.sh', 'AI Coding', ARRAY['Code Editor', 'Developer Tools', 'IDE'], 2022, 'San Francisco, CA', '51-200', 'Series A', 1500),

('Replit', 'replit', 'https://replit.com/public/icons/favicon-96.png', 'Browser-based IDE with AI features. Making programming accessible with Ghostwriter AI.', 'https://replit.com', 'AI Coding', ARRAY['IDE', 'Cloud Development', 'Education'], 2016, 'San Francisco, CA', '201-500', 'Series B', 1500),

('Tabnine', 'tabnine', 'https://www.tabnine.com/favicon.ico', 'AI code completion that runs locally. Privacy-focused AI assistant for developers.', 'https://tabnine.com', 'AI Coding', ARRAY['Code Completion', 'Developer Tools', 'Privacy'], 2018, 'Tel Aviv, Israel', '51-200', 'Series B', 1500),

('Sourcegraph', 'sourcegraph', 'https://sourcegraph.com/favicon.ico', 'Code intelligence platform with AI-powered code search and Cody AI assistant.', 'https://sourcegraph.com', 'AI Coding', ARRAY['Code Search', 'Developer Tools', 'Enterprise'], 2013, 'San Francisco, CA', '201-500', 'Series D', 1500)

ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    category = EXCLUDED.category,
    tags = EXCLUDED.tags,
    founded_year = EXCLUDED.founded_year,
    hq_location = EXCLUDED.hq_location,
    employee_range = EXCLUDED.employee_range,
    funding_stage = EXCLUDED.funding_stage,
    updated_at = CURRENT_TIMESTAMP;
