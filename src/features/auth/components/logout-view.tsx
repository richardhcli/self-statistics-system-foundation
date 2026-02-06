/**
 * Logout view component.
 * Provides a dedicated sign-out confirmation screen.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const LogoutView: React.FC = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      setError(null);
      setIsSigningOut(true);
      await signOut(auth);
      navigate("/auth/login", { replace: true });
    } catch (err) {
      console.error("[LogoutView] Sign-out failed", err);
      setError("Sign-out failed. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Sign out</h1>
        <p className="text-gray-600">You will be logged out of your account on this device.</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/app", { replace: true })}
            className="px-4 py-2 rounded-md border border-gray-200 text-gray-600 hover:text-gray-800"
            disabled={isSigningOut}
          >
            Cancel
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
};
