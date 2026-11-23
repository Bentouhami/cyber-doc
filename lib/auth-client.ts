import { createAuthClient } from "better-auth/react";

// The auth API is served by this application. Using the browser's current origin
// keeps session cookies valid across local aliases and preview hostnames.
export const { signIn, signUp, signOut, useSession } = createAuthClient();
