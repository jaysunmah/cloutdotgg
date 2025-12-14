"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchLeaderboard,
  fetchCategories,
  LeaderboardResponse,
  CategoryCount,
  Company,
} from "@/lib/api";

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchLeaderboard(selectedCategory, page, 25);
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, page]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
    router.push(`/leaderboard${category !== "all" ? `?category=${encodeURIComponent(category)}` : ""}`);
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
    ? Math.ceil(leaderboard.total_count / leaderboard.page_size)
    : 0;

  const renderCompanyRow = (company: Company, index: number) => {
    const winRate =
      company.total_votes > 0
        ? ((company.wins / company.total_votes) * 100).toFixed(1)
        : "0.0";

    return (
      <Link
        key={company.id}
        href={`/company/${company.slug}`}
        className="card rounded-xl p-4 sm:p-5 flex items-center gap-4 animate-slideIn hover:border-accent/50"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* Rank */}
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${getRankStyle(
            company.rank || 0
          )}`}
        >
          {company.rank && company.rank <= 3 ? getRankIcon(company.rank) : company.rank}
        </div>

        {/* Logo */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white shrink-0 flex items-center justify-center">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-full h-full object-contain p-1.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="logo-fallback w-full h-full text-xl">
              {company.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{company.name}</h3>
            <span className="badge-primary text-xs hidden sm:inline-flex">
              {company.category}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {company.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="badge-secondary text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          <div className="text-center hidden sm:block">
            <div className="text-lg font-bold text-accent">{company.elo_rating}</div>
            <div className="text-xs text-[var(--text-muted)]">ELO</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{winRate}%</div>
            <div className="text-xs text-[var(--text-muted)]">Win Rate</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-lg font-bold">
              {company.wins}-{company.losses}
            </div>
            <div className="text-xs text-[var(--text-muted)]">W-L</div>
          </div>
          <div className="text-center hidden lg:block">
            <div className="text-lg font-bold text-[var(--text-secondary)]">
              {company.total_votes}
            </div>
            <div className="text-xs text-[var(--text-muted)]">Votes</div>
          </div>
          <svg
            className="w-5 h-5 text-[var(--text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </Link>
    );
  };

  return (
    <main className="gradient-bg min-h-screen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-[var(--text-secondary)]">
            {leaderboard?.total_count || 0} companies ranked by ELO rating
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`btn-sm rounded-full ${
              selectedCategory === "all" ? "btn-primary" : "btn-secondary"
            }`}
          >
            All ({categories.reduce((sum, c) => sum + c.count, 0)})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => handleCategoryChange(cat.category)}
              className={`btn-sm rounded-full ${
                selectedCategory === cat.category ? "btn-primary" : "btn-secondary"
              }`}
            >
              {cat.category} ({cat.count})
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Loading leaderboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card rounded-2xl p-8 text-center max-w-md mx-auto">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={loadLeaderboard} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Leaderboard Table */}
        {leaderboard && !loading && !error && (
          <>
            <div className="space-y-3">
              {leaderboard.companies.map((company, index) =>
                renderCompanyRow(company, index)
              )}
            </div>

            {leaderboard.companies.length === 0 && (
              <div className="card rounded-xl p-12 text-center">
                <p className="text-[var(--text-secondary)]">
                  No companies found in this category
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary btn-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <span className="px-4 text-[var(--text-secondary)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary btn-sm"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
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
