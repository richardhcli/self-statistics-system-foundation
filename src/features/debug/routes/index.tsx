/**
 * Debug feature routing configuration.
 * Handles all routes under /app/debug/* with sub-routes for debug panels.
 */

import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import DebugView from "../components/debug-view";
import DebugConsolePanel from "../components/debug-console-panel";
import DebugManualJournalEntryPanel from "../components/debug-manual-journal-entry-panel";
import DatastoresView from "../components/datastores-view";
import AuthenticationView from "../components/authentication-view";

/**
 * Debug routes configuration.
 * Base route: /app/debug
 * Sub-routes: /app/debug/:tab
 */
interface DebugRoutesProps {
  graphView: React.ReactNode;
}

export const DebugRoutes: React.FC<DebugRoutesProps> = ({ graphView }) => {
  return (
    <Routes>
      <Route element={<DebugView />}>
        <Route index element={<Navigate to="console" replace />} />
        <Route path="console" element={<DebugConsolePanel />} />
        <Route path="graph" element={graphView} />
        <Route path="manual-journal-entry" element={<DebugManualJournalEntryPanel />} />
        <Route path="datastores" element={<DatastoresView />} />
        <Route path="authentication" element={<AuthenticationView />} />
      </Route>
    </Routes>
  );
};
