"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="gradient-bg min-h-screen pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="card rounded-2xl p-8 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="btn-primary">
              Go Home
            </Link>
            <Link href="/leaderboard" className="btn-secondary">
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
