/**
 * LoginForm component for user authentication via Google Sign-In.
 */

import { loginWithGoogle } from "../utils/login-google";

export const LoginForm = () => {
  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      // On success, your AuthProvider (onAuthStateChanged) will 
      // automatically detect the user and redirect them.

      
    } catch (err) {
      // Handle login error
    }
  };

  return (
    <button onClick={handleLogin} className="google-btn">
      Sign in with Google
    </button>
  );
};