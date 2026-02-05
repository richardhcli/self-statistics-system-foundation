/**
 * AuthProvider component to manage user authentication view
 * using Firebase Authentication.
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // This observer listens for login/logout events automatically
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  }, []);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};