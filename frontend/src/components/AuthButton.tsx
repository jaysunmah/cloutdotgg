"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export default function AuthButton() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="w-20 h-9 rounded-lg bg-white/5 animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name || "User"}
              className="w-8 h-8 rounded-full border border-white/10"
            />
          )}
          <span className="text-sm text-white/70 hidden sm:inline">
            {user.name || user.email}
          </span>
        </div>
        {/* Auth0 requires full page navigation, not client-side routing */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/auth/logout"
          className="btn-secondary btn-sm text-sm"
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      href="/api/auth/login"
      className="btn-primary btn-sm"
    >
      Login
    </a>
  );
}
