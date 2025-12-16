import { handleAuth } from "@auth0/nextjs-auth0";

// This creates the following routes:
// /api/auth/login - redirects to Auth0 login page
// /api/auth/logout - logs out the user
// /api/auth/callback - handles the Auth0 callback after login
// /api/auth/me - returns the user profile
export const GET = handleAuth();
