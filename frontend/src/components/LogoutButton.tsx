"use client";

export default function LogoutButton() {
  return (
    <a
      href="/auth/logout"
      className="btn-secondary btn-sm"
    >
      Log Out
    </a>
  );
}
