/**
 * Banner prompting anonymous users to link their account.
 * Renders only for guest sessions.
 */

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { linkAccountWithGoogle } from "@/features/auth/utils/link-account";

export const GuestBanner = () => {
  const { user } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user?.isAnonymous) return null;

  const handleLinkAccount = async () => {
    try {
      setError(null);
      setIsLinking(true);
      await linkAccountWithGoogle();
    } catch (err) {
      console.error("Guest account link failed", err);
      setError("Linking failed. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-yellow-900">
          <span className="font-semibold">Guest Mode:</span> Your data is tied to this
          device. Sign in with Google to keep it across devices.
        </p>
        <button
          type="button"
          onClick={handleLinkAccount}
          className="rounded-md bg-yellow-900 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-800 disabled:opacity-70"
          disabled={isLinking}
        >
          {isLinking ? "Linking..." : "Save Progress"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
};
