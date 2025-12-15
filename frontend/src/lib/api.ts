import * as pb from "./proto/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Configuration for using protobuf or JSON
// Set to true to use protobuf, false for JSON (default for backwards compatibility)
const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === "true";

const CONTENT_TYPE_PROTOBUF = "application/x-protobuf";
const CONTENT_TYPE_JSON = "application/json";

// Export interfaces for backwards compatibility (re-export from proto)
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

// Conversion helpers: Proto to API types

function protoCompanyToApi(c: pb.Company): Company {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    logo_url: c.logoUrl ?? null,
    description: c.description ?? null,
    website: c.website ?? null,
    category: c.category,
    tags: c.tags,
    founded_year: c.foundedYear ?? null,
    hq_location: c.hqLocation ?? null,
    employee_range: c.employeeRange ?? null,
    funding_stage: c.fundingStage ?? null,
    elo_rating: c.eloRating,
    total_votes: c.totalVotes,
    wins: c.wins,
    losses: c.losses,
    rank: c.rank || undefined,
    created_at: c.createdAt?.toISOString() ?? "",
    updated_at: c.updatedAt?.toISOString() ?? "",
  };
}

function protoMatchupToApi(m: pb.MatchupPair): MatchupPair {
  return {
    company1: protoCompanyToApi(m.company1!),
    company2: protoCompanyToApi(m.company2!),
  };
}

function protoVoteResponseToApi(v: pb.VoteResponse): VoteResponse {
  return {
    winner: protoCompanyToApi(v.winner!),
    loser: protoCompanyToApi(v.loser!),
    winner_elo_diff: v.winnerEloDiff,
    loser_elo_diff: v.loserEloDiff,
  };
}

function protoLeaderboardToApi(l: pb.LeaderboardResponse): LeaderboardResponse {
  return {
    companies: l.companies.map(protoCompanyToApi),
    total_count: l.totalCount,
    page: l.page,
    page_size: l.pageSize,
  };
}

function protoStatsToApi(s: pb.StatsResponse): Stats {
  return {
    total_companies: s.totalCompanies,
    total_votes: s.totalVotes,
    total_ratings: s.totalRatings,
    total_comments: s.totalComments,
    categories: s.categories,
  };
}

function protoCategoryCountsToApi(c: pb.CategoryCountList): CategoryCount[] {
  return c.categories.map((cat) => ({
    category: cat.category,
    count: cat.count,
  }));
}

function protoAggregatedRatingsToApi(r: pb.AggregatedRatingList): AggregatedRating[] {
  return r.ratings.map((rating) => ({
    criterion: rating.criterion,
    average_score: rating.averageScore,
    total_ratings: rating.totalRatings,
  }));
}

function protoCommentsToApi(c: pb.CommentList): Comment[] {
  return c.comments.map((comment) => ({
    id: comment.id,
    company_id: comment.companyId,
    content: comment.content,
    is_current_employee: comment.isCurrentEmployee,
    session_id: comment.sessionId ?? null,
    upvotes: comment.upvotes,
    created_at: comment.createdAt?.toISOString() ?? "",
  }));
}

function protoCommentToApi(c: pb.CompanyComment): Comment {
  return {
    id: c.id,
    company_id: c.companyId,
    content: c.content,
    is_current_employee: c.isCurrentEmployee,
    session_id: c.sessionId ?? null,
    upvotes: c.upvotes,
    created_at: c.createdAt?.toISOString() ?? "",
  };
}

// Helper functions for protobuf requests

async function fetchProto<T>(
  url: string,
  decoder: (data: Uint8Array) => T
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: CONTENT_TYPE_PROTOBUF,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  const buffer = await res.arrayBuffer();
  return decoder(new Uint8Array(buffer));
}

async function postProto<TReq, TRes>(
  url: string,
  encoder: (msg: TReq) => Uint8Array,
  decoder: (data: Uint8Array) => TRes,
  data: TReq
): Promise<TRes> {
  const encoded = encoder(data);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": CONTENT_TYPE_PROTOBUF,
      Accept: CONTENT_TYPE_PROTOBUF,
    },
    // Use Response body format that works with fetch
    body: new Uint8Array(encoded) as unknown as BodyInit,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  const buffer = await res.arrayBuffer();
  return decoder(new Uint8Array(buffer));
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
  if (USE_PROTOBUF) {
    const stats = await fetchProto(`${API_URL}/api/stats`, (data) =>
      pb.StatsResponse.decode(data)
    );
    return protoStatsToApi(stats);
  }
  
  const res = await fetch(`${API_URL}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// Fetch categories
export async function fetchCategories(): Promise<CategoryCount[]> {
  if (USE_PROTOBUF) {
    const categories = await fetchProto(`${API_URL}/api/categories`, (data) =>
      pb.CategoryCountList.decode(data)
    );
    return protoCategoryCountsToApi(categories);
  }
  
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

// Fetch companies
export async function fetchCompanies(
  category?: string,
  search?: string
): Promise<Company[]> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (search) params.set("search", search);

  if (USE_PROTOBUF) {
    const companies = await fetchProto(
      `${API_URL}/api/companies?${params}`,
      (data) => pb.CompanyList.decode(data)
    );
    return companies.companies.map(protoCompanyToApi);
  }
  
  const res = await fetch(`${API_URL}/api/companies?${params}`);
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

// Fetch single company
export async function fetchCompany(slug: string): Promise<Company> {
  if (USE_PROTOBUF) {
    const company = await fetchProto(
      `${API_URL}/api/companies/${slug}`,
      (data) => pb.Company.decode(data)
    );
    return protoCompanyToApi(company);
  }
  
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

  if (USE_PROTOBUF) {
    const leaderboard = await fetchProto(
      `${API_URL}/api/leaderboard?${params}`,
      (data) => pb.LeaderboardResponse.decode(data)
    );
    return protoLeaderboardToApi(leaderboard);
  }
  
  const res = await fetch(`${API_URL}/api/leaderboard?${params}`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

// Fetch matchup
export async function fetchMatchup(category?: string): Promise<MatchupPair> {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);

  if (USE_PROTOBUF) {
    const matchup = await fetchProto(
      `${API_URL}/api/vote/matchup?${params}`,
      (data) => pb.MatchupPair.decode(data)
    );
    return protoMatchupToApi(matchup);
  }
  
  const res = await fetch(`${API_URL}/api/vote/matchup?${params}`);
  if (!res.ok) throw new Error("Failed to fetch matchup");
  return res.json();
}

// Submit vote
export async function submitVote(
  winnerId: number,
  loserId: number
): Promise<VoteResponse> {
  if (USE_PROTOBUF) {
    const request: pb.VoteRequest = {
      winnerId,
      loserId,
      sessionId: getSessionId(),
    };
    const response = await postProto(
      `${API_URL}/api/vote`,
      (msg) => pb.VoteRequest.encode(msg).finish(),
      (data) => pb.VoteResponse.decode(data),
      request
    );
    return protoVoteResponseToApi(response);
  }
  
  const res = await fetch(`${API_URL}/api/vote`, {
    method: "POST",
    headers: { "Content-Type": CONTENT_TYPE_JSON },
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
export async function fetchCompanyRatings(
  slug: string
): Promise<AggregatedRating[]> {
  if (USE_PROTOBUF) {
    const ratings = await fetchProto(
      `${API_URL}/api/companies/${slug}/ratings`,
      (data) => pb.AggregatedRatingList.decode(data)
    );
    return protoAggregatedRatingsToApi(ratings);
  }
  
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
  if (USE_PROTOBUF) {
    const request: pb.RatingRequest = {
      companyId,
      criterion,
      score,
      sessionId: getSessionId(),
    };
    await postProto(
      `${API_URL}/api/ratings`,
      (msg) => pb.RatingRequest.encode(msg).finish(),
      (data) => pb.CompanyRating.decode(data),
      request
    );
    return;
  }
  
  const res = await fetch(`${API_URL}/api/ratings`, {
    method: "POST",
    headers: { "Content-Type": CONTENT_TYPE_JSON },
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
  if (USE_PROTOBUF) {
    const comments = await fetchProto(
      `${API_URL}/api/companies/${slug}/comments`,
      (data) => pb.CommentList.decode(data)
    );
    return protoCommentsToApi(comments);
  }
  
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
  if (USE_PROTOBUF) {
    const request: pb.CommentRequest = {
      companyId,
      content,
      isCurrentEmployee,
      sessionId: getSessionId(),
    };
    const response = await postProto(
      `${API_URL}/api/comments`,
      (msg) => pb.CommentRequest.encode(msg).finish(),
      (data) => pb.CompanyComment.decode(data),
      request
    );
    return protoCommentToApi(response);
  }
  
  const res = await fetch(`${API_URL}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": CONTENT_TYPE_JSON },
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
  if (USE_PROTOBUF) {
    const res = await fetch(`${API_URL}/api/comments/${commentId}/upvote`, {
      method: "POST",
      headers: {
        Accept: CONTENT_TYPE_PROTOBUF,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to upvote comment");
    }
    const buffer = await res.arrayBuffer();
    const response = pb.CompanyComment.decode(new Uint8Array(buffer));
    return protoCommentToApi(response);
  }
  
  const res = await fetch(`${API_URL}/api/comments/${commentId}/upvote`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to upvote comment");
  return res.json();
}

// Export a function to check if protobuf is enabled
export function isProtobufEnabled(): boolean {
  return USE_PROTOBUF;
}
