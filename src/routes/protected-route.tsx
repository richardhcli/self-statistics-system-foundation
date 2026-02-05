import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading Auth...</div>; // Or a nice spinner
  }

  // If no user is found, redirect to the login page
  // 'replace' prevents the user from clicking "back" into a protected area
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // If user exists, render the child routes
  return <Outlet />;
};