import type { ReactNode } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { ProtectedRoute } from "@/routes";

// Feature Imports (Bulletproof style)
import { LoginForm } from '@/features/auth';

interface RouterProps {
  children: ReactNode;
}

export const Router = ({ children }: RouterProps) => {
  const commonRoutes = [
    { path: '/auth/login', element: <LoginForm /> },
    { path: '/', element: <Navigate to="/dashboard" replace /> }
  ];

  const protectedRoutes = [
    {
      element: <ProtectedRoute />, // The Gatekeeper wraps all these
      children: [
        { path: '/dashboard/*', element: <>{children}</> },
        { path: '/profile', element: <div>Your Profile</div> },
      ],
    },
  ];

  // useRoutes is a cleaner way to define routes in JS object format
  const element = useRoutes([...commonRoutes, ...protectedRoutes]);

  return <>{element}</>;
};