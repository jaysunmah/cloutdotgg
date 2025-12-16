import { getAccessToken } from "@auth0/nextjs-auth0";

// Get access token for API calls (server-side only)
export async function getApiAccessToken(): Promise<string | null> {
  try {
    const { accessToken } = await getAccessToken();
    return accessToken || null;
  } catch {
    return null;
  }
}

// Client-side: fetch access token via API route
export async function fetchAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/token");
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken || null;
  } catch {
    return null;
  }
}
