import { Navigate, useRoutes } from "react-router-dom";
import { AuthView } from "@/features/auth";
import { ProtectedRoute } from "@/routes";
import { MainLayout } from "@/components/layout/main-layout";

// Feature routes
import { SettingsRoutes } from "@/features/settings/routes";
import { DebugRoutes } from "@/features/debug/routes";

// Feature components
import JournalFeature from "@/features/journal/components/journal-feature";
import { GraphView } from "@/features/visual-graph";
import { StatisticsView } from "@/features/statistics";
import { IntegrationView } from "@/features/integration";
import { BillingView } from "@/features/billing";

/**
 * Application routing configuration.
 * 
 * URL-based routing with nested routes:
 * - Public routes: /auth/login
 * - Protected routes: /app/* (require authentication)
 * 
 * Feature routing structure:
 * - Main features: journal, graph, statistics, integrations, billing
 * - Settings with sub-routes: /app/settings/:tab
 * - Debug with sub-routes: /app/debug/:tab
 */
export const AppRoutes = () => {
  const routes = useRoutes([
    // Public routes
    { path: "/auth/login", element: <AuthView /> },
    { path: "/", element: <Navigate to="/app" replace /> },

    // Protected routes under /app
    {
      path: "/app",
      element: <ProtectedRoute />,
      children: [
        // Default redirect
        { index: true, element: <Navigate to="journal" replace /> },

        // Main feature routes (simple - no sub-tabs)
        { path: "journal", element: <JournalFeature /> },
        { path: "graph", element: <GraphView /> },
        { path: "statistics", element: <StatisticsView /> },
        { path: "integrations", element: <IntegrationView /> },
        { path: "billing", element: <BillingView /> },

        // Feature routes with sub-routes
        { path: "settings/*", element: <SettingsRoutes /> },
        { path: "debug/*", element: <DebugRoutes /> },
      ],
    },

    // Catch-all - redirect to home
    { path: "*", element: <Navigate to="/app" replace /> },
  ]);

  return <>{routes}</>;
};