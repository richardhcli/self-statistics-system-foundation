import { ProtectedRoute } from "@/routes";

import { useRoutes } from 'react-router-dom';

// Feature Imports (Bulletproof style)
import { LoginForm } from '@/features/auth';
// import { Dashboard } from '@/features/statistics';

export const Router = () => {
  const commonRoutes = [
    { path: '/auth/login', element: <LoginForm /> },
    { path: '/', element: <Navigate to="/dashboard" /> }
  ];

  const protectedRoutes = [
    {
      element: <ProtectedRoute />, // The Gatekeeper wraps all these
      children: [
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/profile', element: <div>Your Profile</div> },
      ],
    },
  ];

  // useRoutes is a cleaner way to define routes in JS object format
  const element = useRoutes([...commonRoutes, ...protectedRoutes]);

  return <>{element}</>;
};