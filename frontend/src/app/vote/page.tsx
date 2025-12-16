"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { api, getSessionId, Company, CategoryCount, GetMatchupResponse, SubmitVoteResponse } from "@/lib/api";

type VoteState = "idle" | "voting" | "voted";

export default function VotePage() {
  const { user } = useUser();
  const [matchup, setMatchup] = useState<GetMatchupResponse | null>(null);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [voteState, setVoteState] = useState<VoteState>("idle");
  const [voteResult, setVoteResult] = useState<SubmitVoteResponse | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [votesThisSession, setVotesThisSession] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatchup = useCallback(async () => {
    try {
      setLoading(true);
      setVoteState("idle");
      setVoteResult(null);
      setSelectedId(null);
      const data = await api.getMatchup({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      });
      setMatchup(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matchup");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    api.listCategories({}).then((res) => setCategories(res.categories)).catch(console.error);
  }, []);

  useEffect(() => {
    loadMatchup();
  }, [loadMatchup]);

  const handleVote = async (winnerId: number, loserId: number) => {
    if (voteState !== "idle" || !matchup) return;

    setVoteState("voting");
    setSelectedId(winnerId);

    try {
      const result = await api.submitVote({
        winnerId,
        loserId,
        sessionId: getSessionId(),
        userId: user?.sub,
      });
      setVoteResult(result);
      setVoteState("voted");
      setVotesThisSession((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit vote");
      setVoteState("idle");
      setSelectedId(null);
    }
  };

  const renderCompanyCard = (company: Company, isLeft: boolean) => {
    const isWinner = voteResult?.winner?.id === company.id;
    const isLoser = voteResult?.loser?.id === company.id;
    const isSelected = selectedId === company.id;
    const eloDiff = isWinner ? voteResult?.winnerEloDiff : isLoser ? voteResult?.loserEloDiff : null;
    const otherCompany = isLeft ? matchup?.company2 : matchup?.company1;

    return (
      <button
        onClick={() => otherCompany && handleVote(company.id, otherCompany.id)}
        disabled={voteState !== "idle"}
        className={`vote-card w-full text-left ${isWinner ? "winner" : isLoser ? "loser" : ""} ${isSelected && voteState === "voting" ? "selected" : ""}`}
      >
        {eloDiff !== null && eloDiff !== undefined && (
          <div className={`absolute top-4 right-4 text-2xl font-bold ${eloDiff > 0 ? "elo-up" : "elo-down"} animate-scaleIn`}>
            {eloDiff > 0 ? "+" : ""}{eloDiff}
          </div>
        )}

        {(isWinner || isLoser) && (
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold animate-scaleIn ${isWinner ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
            {isWinner ? "Winner" : "Loser"}
          </div>
        )}

        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white mx-auto mb-6 flex items-center justify-center">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="logo-fallback w-full h-full text-4xl">{company.name.charAt(0)}</div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">{company.name}</h2>
        <div className="flex justify-center mb-4"><span className="badge-primary">{company.category}</span></div>
        <p className="text-[var(--text-secondary)] text-center text-sm mb-6 line-clamp-3">{company.description || "No description available"}</p>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-accent">{company.eloRating}</div>
            <div className="text-xs text-[var(--text-muted)]">ELO</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">{company.totalVotes > 0 ? ((company.wins / company.totalVotes) * 100).toFixed(0) : 0}%</div>
            <div className="text-xs text-[var(--text-muted)]">Win Rate</div>
          </div>
          <div>
            <div className="text-xl font-bold">{company.totalVotes}</div>
            <div className="text-xs text-[var(--text-muted)]">Votes</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 mt-4">
          {company.tags?.slice(0, 3).map((tag) => (<span key={tag} className="badge-secondary text-xs">{tag}</span>))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
          {company.hqLocation && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {company.hqLocation}
            </span>
          )}
          {company.foundedYear && <span>Founded {company.foundedYear}</span>}
        </div>
      </button>
    );
  };

  return (
    <main className="gradient-bg min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Which is better to work at?</h1>
          <p className="text-[var(--text-secondary)]">Click on a company to vote. Your vote affects the rankings!</p>
          {votesThisSession > 0 && (
            <p className="text-sm text-accent mt-2">You&apos;ve cast {votesThisSession} vote{votesThisSession !== 1 ? "s" : ""} this session</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button onClick={() => setSelectedCategory("all")} className={`btn-sm rounded-full ${selectedCategory === "all" ? "btn-primary" : "btn-secondary"}`}>All Categories</button>
          {categories.map((cat) => (
            <button key={cat.category} onClick={() => setSelectedCategory(cat.category)} className={`btn-sm rounded-full ${selectedCategory === cat.category ? "btn-primary" : "btn-secondary"}`}>
              {cat.category}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-[var(--text-secondary)]">Loading matchup...</p>
          </div>
        )}

        {error && !loading && (
          <div className="card rounded-2xl p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-[var(--text-secondary)] mb-4">{error}</p>
            <button onClick={loadMatchup} className="btn-primary">Try Again</button>
          </div>
        )}

        {matchup && matchup.company1 && matchup.company2 && !loading && !error && (
          <>
            <div className="grid md:grid-cols-2 gap-6 lg:gap-12 max-w-5xl mx-auto">
              {renderCompanyCard(matchup.company1, true)}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] flex items-center justify-center">
                  <span className="text-xl font-bold text-[var(--text-muted)]">VS</span>
                </div>
              </div>
              {renderCompanyCard(matchup.company2, false)}
            </div>

            <div className="flex md:hidden justify-center -mt-3 -mb-3 relative z-10">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] border-2 border-[var(--border-color)] flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--text-muted)]">VS</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              {voteState === "voted" ? (
                <>
                  <button onClick={loadMatchup} className="btn-primary btn-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Next Matchup
                  </button>
                  <Link href={`/company/${voteResult?.winner?.slug}`} className="btn-secondary">View {voteResult?.winner?.name}</Link>
                </>
              ) : (
                <button onClick={loadMatchup} className="btn-secondary" disabled={voteState === "voting"}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Skip / New Matchup
                </button>
              )}
            </div>
          </>
        )}

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="card rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How Voting Works
            </h3>
            <ul className="text-sm text-[var(--text-secondary)] space-y-2">
              <li className="flex items-start gap-2"><span className="text-accent">•</span>We use an ELO rating system (like chess) to rank companies</li>
              <li className="flex items-start gap-2"><span className="text-accent">•</span>Beating higher-ranked companies gives more points</li>
              <li className="flex items-start gap-2"><span className="text-accent">•</span>Your votes are anonymous and help shape the community rankings</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
