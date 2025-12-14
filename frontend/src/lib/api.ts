const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Company {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  category: string;
  tags: string[];
  founded_year: number | null;
  hq_location: string | null;
  employee_range: string | null;
  funding_stage: string | null;
  elo_rating: number;
  total_votes: number;
  wins: number;
  losses: number;
  rank?: number;
  created_at: string;
  updated_at: string;
}

export interface MatchupPair {
  company1: Company;
  company2: Company;
}

export interface VoteResponse {
  winner: Company;
  loser: Company;
  winner_elo_diff: number;
  loser_elo_diff: number;
}

export interface LeaderboardResponse {
  companies: Company[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface Stats {
  total_companies: number;
  total_votes: number;
  total_ratings: number;
  total_comments: number;
  categories: string[];
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface AggregatedRating {
  criterion: string;
  average_score: number;
  total_ratings: number;
}

export interface Comment {
  id: number;
  company_id: number;
  content: string;
  is_current_employee: boolean;
  session_id: string | null;
  upvotes: number;
  created_at: string;
}

// Get or create session ID
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem("ai_rankings_session");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("ai_rankings_session", sessionId);
  }
  return sessionId;
}

// Fetch stats
export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${API_URL}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// Fetch categories
export async function fetchCategories(): Promise<CategoryCount[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

// Fetch companies
export async function fetchCompanies(category?: string, search?: string): Promise<Company[]> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (search) params.set("search", search);
  
  const res = await fetch(`${API_URL}/api/companies?${params}`);
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

// Fetch single company
export async function fetchCompany(slug: string): Promise<Company> {
  const res = await fetch(`${API_URL}/api/companies/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch company");
  return res.json();
}

// Fetch leaderboard
export async function fetchLeaderboard(
  category?: string,
  page = 1,
  pageSize = 25
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  params.set("page", page.toString());
  params.set("page_size", pageSize.toString());
  
  const res = await fetch(`${API_URL}/api/leaderboard?${params}`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

// Fetch matchup
export async function fetchMatchup(category?: string): Promise<MatchupPair> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  
  const res = await fetch(`${API_URL}/api/vote/matchup?${params}`);
  if (!res.ok) throw new Error("Failed to fetch matchup");
  return res.json();
}

// Submit vote
export async function submitVote(winnerId: number, loserId: number): Promise<VoteResponse> {
  const res = await fetch(`${API_URL}/api/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      winner_id: winnerId,
      loser_id: loserId,
      session_id: getSessionId(),
    }),
  });
  if (!res.ok) throw new Error("Failed to submit vote");
  return res.json();
}

// Fetch company ratings
export async function fetchCompanyRatings(slug: string): Promise<AggregatedRating[]> {
  const res = await fetch(`${API_URL}/api/companies/${slug}/ratings`);
  if (!res.ok) throw new Error("Failed to fetch ratings");
  return res.json();
}

// Submit rating
export async function submitRating(
  companyId: number,
  criterion: string,
  score: number
): Promise<void> {
  const res = await fetch(`${API_URL}/api/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: companyId,
      criterion,
      score,
      session_id: getSessionId(),
    }),
  });
  if (!res.ok) throw new Error("Failed to submit rating");
}

// Fetch company comments
export async function fetchCompanyComments(slug: string): Promise<Comment[]> {
  const res = await fetch(`${API_URL}/api/companies/${slug}/comments`);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

// Submit comment
export async function submitComment(
  companyId: number,
  content: string,
  isCurrentEmployee: boolean
): Promise<Comment> {
  const res = await fetch(`${API_URL}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_id: companyId,
      content,
      is_current_employee: isCurrentEmployee,
      session_id: getSessionId(),
    }),
  });
  if (!res.ok) throw new Error("Failed to submit comment");
  return res.json();
}

// Upvote comment
export async function upvoteComment(commentId: number): Promise<Comment> {
  const res = await fetch(`${API_URL}/api/comments/${commentId}/upvote`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to upvote comment");
  return res.json();
}
