"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  api,
  Company,
  CategoryCount,
  UserLeaderboardEntry,
  GetLeaderboardResponse,
  GetUserLeaderboardResponse,
} from "@/lib/api";

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialTab = searchParams.get("tab") || "companies";

  const [activeTab, setActiveTab] = useState<"companies" | "users">(initialTab as "companies" | "users");
  const [leaderboard, setLeaderboard] = useState<GetLeaderboardResponse | null>(null);
  const [userLeaderboard, setUserLeaderboard] = useState<GetUserLeaderboardResponse | null>(null);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getLeaderboard({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        page,
        pageSize: 25,
      });
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, page]);

  const loadUserLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUserLeaderboard({ page: userPage, pageSize: 25 });
      setUserLeaderboard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user leaderboard");
    } finally {
      setLoading(false);
    }
  }, [userPage]);

  useEffect(() => {
    api.listCategories({})
      .then((res) => setCategories(res.categories))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === "companies") {
      loadLeaderboard();
    } else {
      loadUserLeaderboard();
    }
  }, [activeTab, loadLeaderboard, loadUserLeaderboard]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
    router.push(`/leaderboard${category !== "all" ? `?category=${encodeURIComponent(category)}` : ""}`);
  };

  const handleTabChange = (tab: "companies" | "users") => {
    setActiveTab(tab);
    setPage(1);
    setUserPage(1);
    router.push(`/leaderboard?tab=${tab}${tab === "companies" && selectedCategory !== "all" ? `&category=${encodeURIComponent(selectedCategory)}` : ""}`);
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "bg-[var(--bg-secondary)]";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  const totalPages = leaderboard
    ? Math.ceil(leaderboard.totalCount / leaderboard.pageSize)
    : 0;

  const totalUserPages = userLeaderboard
    ? Math.ceil(userLeaderboard.totalCount / userLeaderboard.pageSize)
    : 0;

  const renderUserRow = (user: UserLeaderboardEntry, index: number) => {
    const displayName = user.userId.includes("|")
      ? `User ${user.userId.split("|")[1].slice(0, 8)}...`
      : user.userId.slice(0, 12) + "...";

    return (
      <div
        key={user.userId}
        className="card rounded-xl p-4 sm:p-5 flex items-center gap-4 animate-slideIn"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${getRankStyle(user.rank)}`}
        >
          {user.rank <= 3 ? getRankIcon(user.rank) : user.rank}
        </div>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-accent/20 to-accent/40 shrink-0 flex items-center justify-center">
          <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{displayName}</h3>
          <p className="text-sm text-[var(--text-secondary)]">Voter</p>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          <div className="text-center">
            <div className="text-lg font-bold text-accent">{user.totalVotes}</div>
            <div className="text-xs text-[var(--text-muted)]">Votes Cast</div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompanyRow = (company: Company, index: number) => {
    const winRate = company.totalVotes > 0
      ? ((company.wins / company.totalVotes) * 100).toFixed(1)
      : "0.0";

    return (
      <Link
        key={company.id}
        href={`/company/${company.slug}`}
        className="card rounded-xl p-4 sm:p-5 flex items-center gap-4 animate-slideIn hover:border-accent/50"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${getRankStyle(company.rank || 0)}`}
        >
          {company.rank && company.rank <= 3 ? getRankIcon(company.rank) : company.rank}
        </div>

        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white shrink-0 flex items-center justify-center">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="w-full h-full object-contain p-1.5"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="logo-fallback w-full h-full text-xl">{company.name.charAt(0)}</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{company.name}</h3>
            <span className="badge-primary text-xs hidden sm:inline-flex">{company.category}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {company.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="badge-secondary text-xs">{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          <div className="text-center hidden sm:block">
            <div className="text-lg font-bold text-accent">{company.eloRating}</div>
            <div className="text-xs text-[var(--text-muted)]">ELO</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{winRate}%</div>
            <div className="text-xs text-[var(--text-muted)]">Win Rate</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-lg font-bold">{company.wins}-{company.losses}</div>
            <div className="text-xs text-[var(--text-muted)]">W-L</div>
          </div>
          <div className="text-center hidden lg:block">
            <div className="text-lg font-bold text-[var(--text-secondary)]">{company.totalVotes}</div>
            <div className="text-xs text-[var(--text-muted)]">Votes</div>
          </div>
          <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    );
  };

  return (
    <main className="gradient-bg min-h-screen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-[var(--text-secondary)]">
            {activeTab === "companies"
              ? `${leaderboard?.totalCount || 0} companies ranked by ELO rating`
              : `${userLeaderboard?.totalCount || 0} users ranked by votes cast`}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => handleTabChange("companies")}
            className={`btn-sm rounded-full flex items-center gap-2 ${activeTab === "companies" ? "btn-primary" : "btn-secondary"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Companies
          </button>
          <button
            onClick={() => handleTabChange("users")}
            className={`btn-sm rounded-full flex items-center gap-2 ${activeTab === "users" ? "btn-primary" : "btn-secondary"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Top Voters
          </button>
        </div>

        {activeTab === "companies" && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`btn-sm rounded-full ${selectedCategory === "all" ? "btn-primary" : "btn-secondary"}`}
            >
              All ({categories.reduce((sum, c) => sum + c.count, 0)})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => handleCategoryChange(cat.category)}
                className={`btn-sm rounded-full ${selectedCategory === cat.category ? "btn-primary" : "btn-secondary"}`}
              >
                {cat.category} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Loading leaderboard...</p>
          </div>
        )}

        {error && !loading && (
          <div className="card rounded-2xl p-8 text-center max-w-md mx-auto">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={activeTab === "companies" ? loadLeaderboard : loadUserLeaderboard} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {activeTab === "companies" && leaderboard && !loading && !error && (
          <>
            <div className="space-y-3">
              {leaderboard.companies.map((company, index) => renderCompanyRow(company, index))}
            </div>
            {leaderboard.companies.length === 0 && (
              <div className="card rounded-xl p-12 text-center">
                <p className="text-[var(--text-secondary)]">No companies found in this category</p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <span className="px-4 text-[var(--text-secondary)]">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary btn-sm">
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "users" && userLeaderboard && !loading && !error && (
          <>
            <div className="space-y-3">
              {userLeaderboard.users.map((user, index) => renderUserRow(user, index))}
            </div>
            {userLeaderboard.users.length === 0 && (
              <div className="card rounded-xl p-12 text-center">
                <p className="text-[var(--text-secondary)]">No users have voted yet. Be the first!</p>
              </div>
            )}
            {totalUserPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage === 1} className="btn-secondary btn-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <span className="px-4 text-[var(--text-secondary)]">Page {userPage} of {totalUserPages}</span>
                <button onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))} disabled={userPage === totalUserPages} className="btn-secondary btn-sm">
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-12 text-center">
          <Link href="/vote" className="btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help Improve Rankings - Vote Now
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <main className="gradient-bg min-h-screen pt-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Loading...</p>
          </div>
        </main>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
