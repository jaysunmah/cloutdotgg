"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) throw new Error("Failed to create user");

      const newUser = await res.json();
      setUsers([newUser, ...users]);
      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="gradient-bg min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            <span className="text-accent">Clout</span>
            <span className="text-white/90">.gg</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Go + PostgreSQL + Next.js
          </p>
        </header>

        {/* Create User Form */}
        <section className="card rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-semibold mb-6">Add New User</h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input flex-1"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input flex-1"
              required
            />
            <button
              type="submit"
              disabled={creating}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Adding..." : "Add User"}
            </button>
          </form>
        </section>

        {/* Users List */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Users</h2>

          {loading && (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <div className="inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3"></div>
              <p>Loading users...</p>
            </div>
          )}

          {error && (
            <div className="card rounded-xl p-6 border-red-500/30 bg-red-500/5 text-red-400">
              <p className="font-medium">Error</p>
              <p className="text-sm opacity-80 mt-1">{error}</p>
              <p className="text-sm opacity-60 mt-3">
                Make sure the Go backend is running on port 8080
              </p>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="card rounded-xl p-12 text-center text-[var(--text-secondary)]">
              <p className="text-lg mb-2">No users yet</p>
              <p className="text-sm opacity-60">Add your first user above</p>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="grid gap-4">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="card rounded-xl p-6 flex items-center justify-between"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: "fadeIn 0.3s ease forwards",
                  }}
                >
                  <div>
                    <h3 className="font-medium text-lg">{user.name}</h3>
                    <p className="text-[var(--text-secondary)] text-sm">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-[var(--text-secondary)] opacity-60">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

