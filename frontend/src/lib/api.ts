import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { RankingsService } from "./gen/apiv1/api_pb";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const transport = createConnectTransport({
  baseUrl: API_URL,
  useBinaryFormat: false,
});

// Export the client directly - no wrapper functions needed
export const api = createClient(RankingsService, transport);

// Re-export proto types
export type {
  Company,
  Vote,
  CompanyRating,
  AggregatedRating,
  CompanyComment,
  CategoryCount,
  UserLeaderboardEntry,
  GetStatsResponse,
  GetLeaderboardResponse,
  GetUserLeaderboardResponse,
  GetMatchupResponse,
  SubmitVoteResponse,
  GetCompanyRatingsResponse,
  GetCompanyCommentsResponse,
} from "./gen/apiv1/api_pb";

// Session ID helper
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("ai_rankings_session");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("ai_rankings_session", sessionId);
  }
  return sessionId;
}
