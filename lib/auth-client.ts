import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

// The auth API is served by this application. Using the browser's current origin
// keeps session cookies valid across local aliases and preview hostnames.
export const { signIn, signUp, signOut, useSession } = createAuthClient({
  plugins: [usernameClient({ displayUsername: false })],
});
