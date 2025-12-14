"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  fetchCompany,
  fetchCompanyRatings,
  fetchCompanyComments,
  submitRating,
  submitComment,
  upvoteComment,
  Company,
  AggregatedRating,
  Comment,
} from "@/lib/api";

const RATING_CRITERIA = [
  { key: "compensation", label: "Compensation", icon: "💰" },
  { key: "culture", label: "Culture", icon: "🏢" },
  { key: "work_life_balance", label: "Work-Life Balance", icon: "⚖️" },
  { key: "growth", label: "Career Growth", icon: "📈" },
  { key: "tech_stack", label: "Tech Stack", icon: "💻" },
  { key: "leadership", label: "Leadership", icon: "👔" },
  { key: "interview", label: "Interview Process", icon: "🎯" },
];

interface Props {
  params: Promise<{ slug: string }>;
}

export default function CompanyPage({ params }: Props) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [ratings, setRatings] = useState<AggregatedRating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating form state
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null);
  const [selectedScore, setSelectedScore] = useState<number>(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Comment form state
  const [newComment, setNewComment] = useState("");
  const [isCurrentEmployee, setIsCurrentEmployee] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [companyData, ratingsData, commentsData] = await Promise.all([
          fetchCompany(slug),
          fetchCompanyRatings(slug),
          fetchCompanyComments(slug),
        ]);
        setCompany(companyData);
        setRatings(ratingsData);
        setComments(commentsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load company");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const handleSubmitRating = async () => {
    if (!selectedCriterion || !selectedScore || !company) return;

    setSubmittingRating(true);
    try {
      await submitRating(company.id, selectedCriterion, selectedScore);
      // Refresh ratings
      const newRatings = await fetchCompanyRatings(slug);
      setRatings(newRatings);
      setSelectedCriterion(null);
      setSelectedScore(0);
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !company) return;

    setSubmittingComment(true);
    try {
      const comment = await submitComment(company.id, newComment, isCurrentEmployee);
      setComments([comment, ...comments]);
      setNewComment("");
      setIsCurrentEmployee(false);
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpvote = async (commentId: number) => {
    try {
      const updated = await upvoteComment(commentId);
      setComments(comments.map((c) => (c.id === commentId ? updated : c)));
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  const getRatingForCriterion = (criterion: string) => {
    return ratings.find((r) => r.criterion === criterion);
  };

  const winRate =
    company && company.total_votes > 0
      ? ((company.wins / company.total_votes) * 100).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <main className="gradient-bg min-h-screen pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[var(--text-secondary)]">Loading company...</p>
        </div>
      </main>
    );
  }

  if (error || !company) {
    return (
      <main className="gradient-bg min-h-screen pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="card rounded-2xl p-8 text-center max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-2">Company Not Found</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
            <Link href="/leaderboard" className="btn-primary">
              View Leaderboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="gradient-bg min-h-screen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <li>
              <Link href="/leaderboard" className="hover:text-accent">
                Leaderboard
              </Link>
            </li>
            <li>/</li>
            <li className="text-[var(--text-primary)]">{company.name}</li>
          </ol>
        </nav>

        {/* Company Header */}
        <div className="card rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-white shrink-0 flex items-center justify-center mx-auto sm:mx-0">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="logo-fallback w-full h-full text-4xl">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold">{company.name}</h1>
                <span className="badge-primary text-sm">{company.category}</span>
              </div>

              <p className="text-[var(--text-secondary)] mb-4 max-w-2xl">
                {company.description || "No description available"}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                {company.tags?.map((tag) => (
                  <span key={tag} className="badge-secondary">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Meta */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-[var(--text-secondary)]">
                {company.hq_location && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {company.hq_location}
                  </span>
                )}
                {company.founded_year && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Founded {company.founded_year}
                  </span>
                )}
                {company.employee_range && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {company.employee_range} employees
                  </span>
                )}
                {company.funding_stage && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {company.funding_stage}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-accent hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-[var(--border-color)]">
            <div className="text-center p-4 rounded-xl bg-[var(--bg-secondary)]">
              <div className="text-2xl sm:text-3xl font-bold text-accent">#{company.rank}</div>
              <div className="text-sm text-[var(--text-muted)]">Rank</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--bg-secondary)]">
              <div className="text-2xl sm:text-3xl font-bold">{company.elo_rating}</div>
              <div className="text-sm text-[var(--text-muted)]">ELO Rating</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--bg-secondary)]">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">{winRate}%</div>
              <div className="text-sm text-[var(--text-muted)]">Win Rate</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--bg-secondary)]">
              <div className="text-2xl sm:text-3xl font-bold">
                {company.wins}-{company.losses}
              </div>
              <div className="text-sm text-[var(--text-muted)]">Record (W-L)</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Ratings Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Ratings</h2>
            <div className="card rounded-xl p-6 space-y-4">
              {RATING_CRITERIA.map((criterion) => {
                const rating = getRatingForCriterion(criterion.key);
                const avgScore = rating?.average_score || 0;
                const percentage = (avgScore / 5) * 100;

                return (
                  <div key={criterion.key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2">
                        <span>{criterion.icon}</span>
                        <span className="text-sm font-medium">{criterion.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">
                          {avgScore > 0 ? avgScore.toFixed(1) : "-"}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          ({rating?.total_ratings || 0} votes)
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {/* Add Rating */}
              <div className="pt-4 border-t border-[var(--border-color)]">
                <h3 className="text-sm font-semibold mb-3">Add Your Rating</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {RATING_CRITERIA.map((criterion) => (
                    <button
                      key={criterion.key}
                      onClick={() => setSelectedCriterion(criterion.key)}
                      className={`btn-sm rounded-full ${
                        selectedCriterion === criterion.key
                          ? "btn-primary"
                          : "btn-secondary"
                      }`}
                    >
                      {criterion.icon} {criterion.label}
                    </button>
                  ))}
                </div>

                {selectedCriterion && (
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          onClick={() => setSelectedScore(score)}
                          className={`w-10 h-10 rounded-lg border-2 font-bold transition-all ${
                            selectedScore >= score
                              ? "border-accent bg-accent text-white"
                              : "border-[var(--border-color)] hover:border-accent"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSubmitRating}
                      disabled={!selectedScore || submittingRating}
                      className="btn-primary btn-sm"
                    >
                      {submittingRating ? "..." : "Submit"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Comments Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">
              Reviews ({comments.length})
            </h2>
            <div className="card rounded-xl p-6">
              {/* Add Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience working at this company..."
                  className="input w-full h-24 resize-none mb-3"
                  maxLength={2000}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isCurrentEmployee}
                      onChange={(e) => setIsCurrentEmployee(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-color)] accent-accent"
                    />
                    <span className="text-[var(--text-secondary)]">
                      I currently work here
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="btn-primary btn-sm"
                  >
                    {submittingComment ? "Posting..." : "Post Review"}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 && (
                  <p className="text-center text-[var(--text-muted)] py-8">
                    No reviews yet. Be the first to share your experience!
                  </p>
                )}
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {comment.is_current_employee && (
                          <span className="badge-primary text-xs">
                            Current Employee
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)]">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUpvote(comment.id)}
                        className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-accent transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                        {comment.upvotes}
                      </button>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <Link href="/vote" className="btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Vote for {company.name}
          </Link>
          <Link href="/leaderboard" className="btn-secondary">
            Back to Leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}
