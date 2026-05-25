import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Clerk redirects here after the Google OAuth handshake completes.
// AuthenticateWithRedirectCallback finalises the session and forwards
// the user to the redirectUrlComplete that was set in SignInForm.
export default function SSOCallback() {
  return <AuthenticateWithRedirectCallback />;
}
