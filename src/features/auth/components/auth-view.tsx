/**
 * Auth view component providing Google Sign-In interface.
 * Automatically redirects authenticated users to the dashboard.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/auth-provider";
import { LoginForm } from "./log-in-form";

/**
 * AuthLoadingScreen
 * Minimal auth loading view rendered while Firebase initializes.
 */
export const AuthLoadingScreen = ({ hasTimedOut }: { hasTimedOut: boolean }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading authentication...</p>
        {hasTimedOut && (
          <div className="mt-4 text-left text-xs text-gray-500 space-y-2">
            <p className="font-semibold text-gray-700">Auth is taking longer than expected.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check Firebase config and authorized domains.</li>
              <li>Verify network connectivity and ad-blockers.</li>
              <li>Reload to re-initialize authentication.</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Reload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Renders the authentication view with title, description, and login form.
 * Provides automatic redirect to dashboard when user successfully authenticates.
 * 
 * @returns {JSX.Element} The authentication view component
 */
export const AuthView = () => {
  console.log("[AuthView] Rendering");
  const { user, loading, hasTimedOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard when user logs in
  useEffect(() => {
    if (user) {
      console.log("[AuthView] User detected, redirecting to /app");
      navigate("/app", { replace: true });
    }
  }, [user, navigate]);

  // Show success feedback briefly before redirect
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to App...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <AuthLoadingScreen hasTimedOut={hasTimedOut} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Self-Statistics System
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in to track your personal development journey and visualize your growth over time.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};