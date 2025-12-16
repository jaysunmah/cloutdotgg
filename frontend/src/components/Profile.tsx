"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export default function Profile() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <div className="w-8 h-8 rounded-full skeleton" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <img
        src={user.picture || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%238b5cf6'/%3E%3Cpath d='M16 14.4c2.4 0 4.36-1.96 4.36-4.36S18.4 5.68 16 5.68s-4.36 1.96-4.36 4.36S13.6 14.4 16 14.4zm0 2.18c-2.91 0-8.73 1.46-8.73 4.36v1.09c0 .6.49 1.09 1.09 1.09h15.28c.6 0 1.09-.49 1.09-1.09v-1.09c0-2.9-5.82-4.36-8.73-4.36z' fill='%23fff'/%3E%3C/svg%3E`}
        alt={user.name || "User profile"}
        className="w-8 h-8 rounded-full border-2 border-[var(--accent)] object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%238b5cf6'/%3E%3Cpath d='M16 14.4c2.4 0 4.36-1.96 4.36-4.36S18.4 5.68 16 5.68s-4.36 1.96-4.36 4.36S13.6 14.4 16 14.4zm0 2.18c-2.91 0-8.73 1.46-8.73 4.36v1.09c0 .6.49 1.09 1.09 1.09h15.28c.6 0 1.09-.49 1.09-1.09v-1.09c0-2.9-5.82-4.36-8.73-4.36z' fill='%23fff'/%3E%3C/svg%3E`;
        }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {user.name}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {user.email}
        </span>
      </div>
    </div>
  );
}
