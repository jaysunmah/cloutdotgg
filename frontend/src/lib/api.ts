import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { RankingsService } from "./gen/api_pb";
import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Create Connect transport
const transport = createConnectTransport({
  baseUrl: API_URL,
  // Use JSON by default for browser compatibility
  useBinaryFormat: false,
});

// Create the client
const client = createClient(RankingsService, transport);

// Export interfaces for backwards compatibility
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

// Helper to convert timestamp to ISO string
function timestampToString(ts: Timestamp | undefined): string {
  if (!ts) return "";
  return timestampDate(ts).toISOString();
}

// Conversion helpers using plain objects
function protoCompanyToApi(c: {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  category: string;
  tags: string[];
  foundedYear?: number;
  hqLocation?: string;
  employeeRange?: string;
  fundingStage?: string;
  eloRating: number;
  totalVotes: number;
  wins: number;
  losses: number;
  rank: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}): Company {
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
    created_at: timestampToString(c.createdAt),
    updated_at: timestampToString(c.updatedAt),
  };
}

function protoCommentToApi(c: {
  id: number;
  companyId: number;
  content: string;
  isCurrentEmployee: boolean;
  sessionId?: string;
  upvotes: number;
  createdAt?: Timestamp;
}): Comment {
  return {
    id: c.id,
    company_id: c.companyId,
    content: c.content,
    is_current_employee: c.isCurrentEmployee,
    session_id: c.sessionId ?? null,
    upvotes: c.upvotes,
    created_at: timestampToString(c.createdAt),
  };
}

function protoRatingToApi(r: {
  criterion: string;
  averageScore: number;
  totalRatings: number;
}): AggregatedRating {
  return {
    criterion: r.criterion,
    average_score: r.averageScore,
    total_ratings: r.totalRatings,
  };
}

function protoCategoryToApi(c: {
  category: string;
  count: number;
}): CategoryCount {
  return {
    category: c.category,
    count: c.count,
  };
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
  const response = await client.getStats({});
  return {
    total_companies: response.totalCompanies,
    total_votes: response.totalVotes,
    total_ratings: response.totalRatings,
    total_comments: response.totalComments,
    categories: response.categories,
  };
}

// Fetch categories
export async function fetchCategories(): Promise<CategoryCount[]> {
  const response = await client.listCategories({});
  return response.categories.map(protoCategoryToApi);
}

// Fetch companies
export async function fetchCompanies(
  category?: string,
  search?: string
): Promise<Company[]> {
  const response = await client.listCompanies({
    category: category && category !== "all" ? category : undefined,
    search: search || undefined,
  });
  return response.companies.map(protoCompanyToApi);
}

// Fetch single company
export async function fetchCompany(slug: string): Promise<Company> {
  const response = await client.getCompany({ slug });
  if (!response.company) {
    throw new Error("Company not found");
  }
  return protoCompanyToApi(response.company);
}

// Fetch leaderboard
export async function fetchLeaderboard(
  category?: string,
  page = 1,
  pageSize = 25
): Promise<LeaderboardResponse> {
  const response = await client.getLeaderboard({
    category: category && category !== "all" ? category : undefined,
    page,
    pageSize,
  });
  return {
    companies: response.companies.map(protoCompanyToApi),
    total_count: response.totalCount,
    page: response.page,
    page_size: response.pageSize,
  };
}

// Fetch matchup
export async function fetchMatchup(category?: string): Promise<MatchupPair> {
  const response = await client.getMatchup({
    category: category && category !== "all" ? category : undefined,
  });
  if (!response.company1 || !response.company2) {
    throw new Error("Not enough companies for matchup");
  }
  return {
    company1: protoCompanyToApi(response.company1),
    company2: protoCompanyToApi(response.company2),
  };
}

// Submit vote
export async function submitVote(
  winnerId: number,
  loserId: number
): Promise<VoteResponse> {
  const response = await client.submitVote({
    winnerId,
    loserId,
    sessionId: getSessionId(),
  });
  if (!response.winner || !response.loser) {
    throw new Error("Vote failed");
  }
  return {
    winner: protoCompanyToApi(response.winner),
    loser: protoCompanyToApi(response.loser),
    winner_elo_diff: response.winnerEloDiff,
    loser_elo_diff: response.loserEloDiff,
  };
}

// Fetch company ratings
export async function fetchCompanyRatings(
  slug: string
): Promise<AggregatedRating[]> {
  const response = await client.getCompanyRatings({ slug });
  return response.ratings.map(protoRatingToApi);
}

// Submit rating
export async function submitRating(
  companyId: number,
  criterion: string,
  score: number
): Promise<void> {
  await client.submitRating({
    companyId,
    criterion,
    score,
    sessionId: getSessionId(),
  });
}

// Fetch company comments
export async function fetchCompanyComments(slug: string): Promise<Comment[]> {
  const response = await client.getCompanyComments({ slug });
  return response.comments.map(protoCommentToApi);
}

// Submit comment
export async function submitComment(
  companyId: number,
  content: string,
  isCurrentEmployee: boolean
): Promise<Comment> {
  const response = await client.submitComment({
    companyId,
    content,
    isCurrentEmployee,
    sessionId: getSessionId(),
  });
  if (!response.comment) {
    throw new Error("Comment creation failed");
  }
  return protoCommentToApi(response.comment);
}

// Upvote comment
export async function upvoteComment(commentId: number): Promise<Comment> {
  const response = await client.upvoteComment({ commentId });
  if (!response.comment) {
    throw new Error("Upvote failed");
  }
  return protoCommentToApi(response.comment);
}

// Export a function to check if protobuf is enabled (always true now with Connect)
export function isProtobufEnabled(): boolean {
  return true;
}
