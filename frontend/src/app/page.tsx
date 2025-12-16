"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, Company, CategoryCount, GetStatsResponse } from "@/lib/api";
import CompanyCard from "@/components/CompanyCard";

export default function Home() {
  const [stats, setStats] = useState<GetStatsResponse | null>(null);
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, leaderboardData, categoriesData] = await Promise.all([
          api.getStats({}),
          api.getLeaderboard({ page: 1, pageSize: 6 }),
          api.listCategories({}),
        ]);
        setStats(statsData);
        setTopCompanies(leaderboardData.companies);
        setCategories(categoriesData.categories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <main className="gradient-hero min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="gradient-hero min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="card rounded-2xl p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
            <p className="text-sm text-[var(--text-muted)]">
              Make sure the backend server is running on port 8080
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="gradient-hero min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              {stats?.totalVotes.toLocaleString() || 0} votes cast
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fadeIn" style={{ animationDelay: "100ms" }}>
              Rank the Best
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-400 to-pink-400">
                AI Companies
              </span>
              to Work For
            </h1>
            
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: "200ms" }}>
              Help the community discover the best AI companies. Vote head-to-head, 
              explore detailed profiles, and share your insights.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn" style={{ animationDelay: "300ms" }}>
              <Link href="/vote" className="btn-primary btn-lg w-full sm:w-auto animate-pulse-glow">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Voting
              </Link>
              <Link href="/leaderboard" className="btn-secondary btn-lg w-full sm:w-auto">
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-accent/20 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none"></div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-accent mb-1">
                {stats?.totalCompanies || 0}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">AI Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-1">
                {stats?.totalVotes.toLocaleString() || 0}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-1">
                {stats?.totalRatings.toLocaleString() || 0}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Ratings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-1">
                {categories.length}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Browse by Category</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, index) => (
              <Link
                key={cat.category}
                href={`/leaderboard?category=${encodeURIComponent(cat.category)}`}
                className="card card-interactive rounded-xl p-5 text-center animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-lg font-semibold mb-1">{cat.category}</div>
                <div className="text-sm text-[var(--text-muted)]">{cat.count} companies</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Companies Section */}
      <section className="py-16 bg-[var(--bg-secondary)]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Top Ranked Companies</h2>
            <Link href="/leaderboard" className="btn-ghost text-accent">
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topCompanies.map((company, index) => (
              <div key={company.id} style={{ animationDelay: `${index * 100}ms` }}>
                <CompanyCard company={company} showRank size="md" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-purple-500/10"></div>
            <div className="relative">
              <h2 className="text-2xl sm:text-4xl font-bold mb-4">
                Help Shape the Rankings
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
                Your votes matter! Compare AI companies head-to-head and help the 
                community discover the best places to work in AI.
              </p>
              <Link href="/vote" className="btn-primary btn-lg inline-flex">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cast Your Vote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-semibold">AI Rankings</span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Ranking the best AI companies to work for
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
