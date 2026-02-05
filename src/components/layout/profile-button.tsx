/**
 * Profile button component for user profile navigation.
 * Displays Google profile picture and navigates to profile settings on click.
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/auth-provider";

/**
 * Profile button showing user's Google profile picture.
 * Clicking navigates to /app/settings/profile
 *
 * @returns JSX.Element
 */
export const ProfileButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/app/settings/profile");
  };

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="profile-button flex-shrink-0 transition-transform hover:scale-110 focus:outline-none"
      title={user.displayName || "Profile"}
    >
      <img
        src={user.photoURL || "/default-avatar.png"}
        alt={user.displayName || "User"}
        className="w-10 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-sm"
      />
    </button>
  );
};
