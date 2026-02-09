/**
 * Main application layout wrapper.
 * Provides the header and main content area for the application.
 * Replaces previous combined app.tsx + provider pattern.
 */

import { Outlet } from "react-router-dom";
import Header from "./header";
import { useGlobalStoreSync } from "@/hooks/use-global-store-sync";
import { GuestBanner } from "@/components/notifications/guest-banner";

/**
 * Main layout component.
 * Wraps all protected routes with header and content area.
 * Renders nested routes via Outlet.
 *
 * @returns JSX.Element
 */
export const MainLayout = () => {
  useGlobalStoreSync();

  return (
    <div className="flex flex-col h-screen">
      <GuestBanner />
      <Header />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};