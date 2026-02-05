/**
 * Settings feature routing configuration.
 * Handles all routes under /app/settings/* with sub-routes for each settings tab.
 */

import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import SettingsView from "../components/settings-view";
import StatusDisplaySettings from "../components/status-display-settings";
import ProfileSettings from "../components/profile-settings";
import AIFeaturesSettings from "../components/ai-features-settings";
import PrivacySettings from "../components/privacy-settings";
import NotificationSettings from "../components/notification-settings";

/**
 * Settings routes configuration.
 * Base route: /app/settings
 * Sub-routes: /app/settings/:tab
 */
export const SettingsRoutes = () => {
  return (
    <Routes>
      <Route element={<SettingsView />}>
        <Route index element={<Navigate to="status" replace />} />
        <Route path="status" element={<StatusDisplaySettings />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="ai-features" element={<AIFeaturesSettings />} />
        <Route path="privacy" element={<PrivacySettings />} />
        <Route path="notifications" element={<NotificationSettings />} />
      </Route>
    </Routes>
  );
};
