/**
 * LoginForm component for user authentication via Google Sign-In.
 */

import { useState } from "react";
import { loginWithGoogle } from "../utils/login-google";
import { loginAsGuest } from "../utils/login-guest";

/**
 * Renders a simple Google sign-in button with inline error feedback.
 */
export const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      await loginWithGoogle();
    } catch (err) {
      console.error("Google login failed", err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      await loginAsGuest();
    } catch (err) {
      console.error("Guest login failed", err);
      setError("Guest sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button onClick={handleLogin} className="google-btn border border-gray-300" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in with Google"}
      </button>
      <button
        onClick={handleGuestLogin}
        className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Continue as Guest"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};