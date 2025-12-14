"use client";

import Link from "next/link";
import { Company } from "@/lib/api";

interface CompanyCardProps {
  company: Company;
  showRank?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function CompanyCard({
  company,
  showRank = false,
  size = "md",
}: CompanyCardProps) {
  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const logoSizes = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "bg-[var(--bg-secondary)] text-[var(--text-secondary)]";
  };

  const winRate =
    company.total_votes > 0
      ? ((company.wins / company.total_votes) * 100).toFixed(0)
      : "0";

  return (
    <Link href={`/company/${company.slug}`}>
      <div className="card card-interactive rounded-2xl cursor-pointer animate-fadeIn">
        <div className={sizeClasses[size]}>
          <div className="flex items-start gap-4">
            {/* Rank Badge */}
            {showRank && company.rank && (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${getRankBadgeClass(
                  company.rank
                )}`}
              >
                {company.rank}
              </div>
            )}

            {/* Logo */}
            <div
              className={`${logoSizes[size]} rounded-xl overflow-hidden shrink-0 bg-white flex items-center justify-center`}
            >
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`logo-fallback ${logoSizes[size]} rounded-xl ${
                  company.logo_url ? "hidden" : ""
                }`}
              >
                {company.name.charAt(0)}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">{company.name}</h3>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                {company.description || "No description available"}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="badge-primary">{company.category}</span>
                {company.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="badge-secondary">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-muted)]">ELO</span>
                  <span className="font-mono font-semibold text-accent">
                    {company.elo_rating}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-muted)]">Win Rate</span>
                  <span className="font-mono font-semibold text-green-400">
                    {winRate}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-muted)]">Votes</span>
                  <span className="font-mono text-[var(--text-secondary)]">
                    {company.total_votes}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
