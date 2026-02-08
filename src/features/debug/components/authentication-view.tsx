import React, { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { auth } from "@/lib/firebase";

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
};

const AuthenticationView: React.FC = () => {
  const { user, loading, hasTimedOut } = useAuth();
  const currentUser = auth.currentUser;

  const providerSummary = useMemo(() => {
    if (!currentUser?.providerData?.length) return "None";
    return currentUser.providerData
      .map((provider) =>
        JSON.stringify({
          providerId: provider.providerId,
          uid: provider.uid,
          displayName: provider.displayName,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          photoURL: provider.photoURL,
        })
      )
      .join("\n");
  }, [currentUser]);

  const rows = [
    { label: "Auth Loading", value: formatValue(loading) },
    { label: "Auth Timed Out", value: formatValue(hasTimedOut) },
    { label: "Auth User UID", value: formatValue(user?.uid) },
    { label: "Auth Display Name", value: formatValue(user?.displayName) },
    { label: "Auth Email", value: formatValue(user?.email) },
    { label: "Auth Photo URL", value: formatValue(user?.photoURL) },
    { label: "Auth Email Verified", value: formatValue(user?.emailVerified) },
    { label: "Auth Is Anonymous", value: formatValue(user?.isAnonymous) },
    { label: "Auth Provider ID", value: formatValue(user?.providerId) },
    { label: "Auth Tenant ID", value: formatValue(user?.tenantId) },
    { label: "Auth Last Sign In", value: formatValue(user?.metadata?.lastSignInTime) },
    { label: "Auth Created", value: formatValue(user?.metadata?.creationTime) },
    { label: "SDK User UID", value: formatValue(currentUser?.uid) },
    { label: "SDK Provider Data", value: providerSummary },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900">Authentication Diagnostics</h3>
              <p className="text-xs text-slate-500">Private auth state for the active session.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.map((row) => (
              <div
                key={row.label}
                className="bg-slate-50 border border-slate-200 p-3 rounded-xl"
              >
                <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">
                  {row.label}
                </span>
                <span className="font-mono text-[10px] break-all font-bold whitespace-pre-wrap">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationView;
