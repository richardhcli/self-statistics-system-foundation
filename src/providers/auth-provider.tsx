import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  hasTimedOut: boolean;
}>({
  user: null,
  loading: true,
  hasTimedOut: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    console.log("[Auth] onAuthStateChanged listener registered");
    // This is the "Magic" line: it listens to Google/Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[Auth] Auth state resolved", { hasUser: Boolean(user) });
      setUser(user);
      setLoading(false);
    });

    const timeoutId = window.setTimeout(() => {
      console.warn("[Auth] Auth initialization timeout (8s)");
      setHasTimedOut(true);
      // Fail-open: allow UI to render even if auth listener never resolves.
      setLoading(false);
    }, 8000);

    return () => {
      unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, hasTimedOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);