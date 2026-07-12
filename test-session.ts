import { createAuthClient } from "better-auth/react";
const authClient = createAuthClient();
const session = authClient.useSession();
// Print keys of session to check available fields at runtime, or we can just compile it to see type errors.
console.log(Object.keys(session));
