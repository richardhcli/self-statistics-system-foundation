/**
 * Auth view component providing Google Sign-In interface.
 * Automatically redirects authenticated users to the dashboard.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/auth-provider";
import { LoginForm } from "./log-in-form";

/**
 * Renders the authentication view with title, description, and login form.
 * Provides automatic redirect to dashboard when user successfully authenticates.
 * 
 * @returns {JSX.Element} The authentication view component
 */
export const AuthView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard when user logs in
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Show success feedback briefly before redirect
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
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