/**
 * Debug feature routing configuration.
 * Handles all routes under /app/debug/* with sub-routes for debug panels.
 */

import { Navigate, Route, Routes } from "react-router-dom";
import DebugView from "../components/debug-view";
import { DeveloperGraphView } from "@/features/developer-graph";

/**
 * Debug routes configuration.
 * Base route: /app/debug
 * Sub-routes: /app/debug/:tab
 */
export const DebugRoutes = () => {
  return (
    <Routes>
      <Route element={<DebugView />}>
        <Route index element={<Navigate to="state" replace />} />
        <Route path="state" element={<div>Debug State Panel</div>} />
        <Route path="graph" element={<DeveloperGraphView />} />
      </Route>
    </Routes>
  );
};
