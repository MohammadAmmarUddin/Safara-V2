import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaSync,
  FaPlug,
  FaServer,
  FaEnvelope,
  FaCloud,
  FaCreditCard,
  FaGoogle,
  FaUnlink,
  FaTools,
} from "react-icons/fa";

const SystemHealth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [googleAuth, setGoogleAuth] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchGoogleAuthStatus = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/google-auth/status`);
      const data = await res.json();
      if (data.success) {
        setGoogleAuth(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch Google auth status:", err);
    }
  }, [baseUrl]);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/system-status`);
      const data = await res.json();
      if (data.success) {
        setSystemStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch system status:", err);
    }
  }, [baseUrl]);

  const refreshData = async () => {
    await Promise.all([fetchGoogleAuthStatus(), fetchSystemStatus()]);
    setLoading(false);
    setChecking(false);
  };

  useEffect(() => {
    refreshData();
  }, [fetchGoogleAuthStatus, fetchSystemStatus]);

  useEffect(() => {
    const success = searchParams.get("googleSuccess");
    const error = searchParams.get("googleError");

    if (success === "true") {
      Swal.fire({
        icon: "success",
        title: "Google Connected!",
        text: "Your Google account has been successfully connected.",
        timer: 3000,
        timerProgressBar: true,
      });
      setSearchParams({});
    } else if (error) {
      let errorMessage = "An error occurred during Google authentication.";
      if (error === "access_denied") {
        errorMessage = "You denied access to your Google account. Please try again.";
      } else if (error === "no_code") {
        errorMessage = "No authorization code received. Please try again.";
      }
      Swal.fire({
        icon: "error",
        title: "Google Auth Failed",
        text: errorMessage,
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleReconnect = async () => {
    setActionLoading("reconnect");
    try {
      const res = await fetch(`${baseUrl}/api/admin/google-auth/reconnect`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        Swal.fire({ icon: "error", title: "Failed", text: data.error });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to initiate reconnection" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestConnection = async () => {
    setActionLoading("test");
    try {
      const res = await fetch(`${baseUrl}/api/admin/google-auth/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Connection Successful",
          html: `
            <p>Google Calendar API is working properly!</p>
            <p><strong>Upcoming events:</strong> ${data.testResults?.upcomingEventsCount || 0}</p>
            <p><strong>Primary calendar:</strong> ${data.testResults?.primaryCalendar ? "Available" : "Not found"}</p>
          `,
        });
        refreshData();
      } else {
        Swal.fire({
          icon: "warning",
          title: "Connection Failed",
          text: data.error || "Unable to connect to Google Calendar",
          footer: data.hint ? `<a href="/dashboard/admin/systemHealth">${data.hint}</a>` : "",
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Connection test failed" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Disconnect Google Account?",
      text: "This will revoke access and disconnect your Google account from the system. You'll need to reconnect it later.",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Disconnect",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setActionLoading("disconnect");
    try {
      const res = await fetch(`${baseUrl}/api/admin/google-auth/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeOnly: false }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: "success", title: "Disconnected", text: data.message });
        refreshData();
      } else {
        Swal.fire({ icon: "error", title: "Failed", text: data.error });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Disconnect failed" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecheckHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${baseUrl}/api/admin/system/recheck`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: data.overall === "healthy" ? "success" : "warning",
          title: "Health Check Complete",
          text: `Overall Status: ${data.overall}`,
        });
        refreshData();
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Health check failed" });
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
      case "active":
      case "healthy":
      case "available":
        return <FaCheck className="text-green-500 text-lg" />;
      case "disconnected":
      case "error":
      case "unhealthy":
      case "not_configured":
        return <FaTimes className="text-red-500 text-lg" />;
      case "expired":
      case "action_required":
        return <FaExclamationTriangle className="text-yellow-500 text-lg" />;
      default:
        return <FaExclamationTriangle className="text-gray-400 text-lg" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "connected":
      case "active":
      case "healthy":
      case "available":
        return "badge-success";
      case "disconnected":
      case "not_configured":
        return "badge-error";
      case "expired":
      case "action_required":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
      case "active":
      case "healthy":
        return "bg-green-50 border-green-200";
      case "error":
      case "unhealthy":
        return "bg-red-50 border-red-200";
      case "expired":
      case "action_required":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:p-6">
      <Helmet>
        <title>System Health - Admin Dashboard</title>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <FaTools /> System Health & Settings
          </h1>
          <button
            onClick={handleRecheckHealth}
            disabled={checking}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <FaSync className={checking ? "animate-spin" : ""} />
            {checking ? "Checking..." : "Recheck Health"}
          </button>
        </div>

        {/* Google Auth Status Panel */}
        <div className={`rounded-xl border shadow-sm p-6 mb-6 ${getStatusColor(googleAuth?.connection)}`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaGoogle /> Google Authentication
          </h2>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <span className={`badge ${getStatusBadge(googleAuth?.connection)} badge-lg`}>
                {googleAuth?.connection?.replace("_", " ").toUpperCase() || "UNKNOWN"}
              </span>
              <span className="text-sm opacity-80">{googleAuth?.message || "Checking..."}</span>
            </div>

            {googleAuth?.needsReconnect && (
              <div className="alert alert-warning py-2 px-3 text-sm">
                <FaExclamationTriangle />
                <span>Token expired or action required</span>
              </div>
            )}
          </div>

          {/* Status Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div className="bg-white/50 p-3 rounded-lg">
              <div className="text-gray-500 mb-1">Client ID</div>
              <div className="font-medium">{googleAuth?.envConfigured?.clientId ? "Configured" : "Not Set"}</div>
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <div className="text-gray-500 mb-1">Client Secret</div>
              <div className="font-medium">{googleAuth?.envConfigured?.clientSecret ? "Configured" : "Not Set"}</div>
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <div className="text-gray-500 mb-1">Stored Token</div>
              <div className="font-medium">{googleAuth?.hasStoredTokens ? "Available" : "None"}</div>
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <div className="text-gray-500 mb-1">Last Connected</div>
              <div className="font-medium">
                {googleAuth?.connectedAt
                  ? new Date(googleAuth.connectedAt).toLocaleDateString()
                  : "Never"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {googleAuth?.canConnect && (
              <button
                onClick={handleReconnect}
                disabled={actionLoading === "reconnect"}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <FaPlug className={actionLoading === "reconnect" ? "animate-pulse" : ""} />
                {actionLoading === "reconnect" ? "Redirecting..." : "Reconnect Google Account"}
              </button>
            )}

            <button
              onClick={handleTestConnection}
              disabled={actionLoading === "test" || !googleAuth?.canConnect}
              className="btn btn-success btn-sm flex items-center gap-2"
            >
              <FaCheck className={actionLoading === "test" ? "animate-spin" : ""} />
              {actionLoading === "test" ? "Testing..." : "Test Connection"}
            </button>

            {googleAuth?.connection === "connected" && (
              <button
                onClick={handleDisconnect}
                disabled={actionLoading === "disconnect"}
                className="btn btn-error btn-outline btn-sm flex items-center gap-2"
              >
                <FaUnlink />
                {actionLoading === "disconnect" ? "Disconnecting..." : "Disconnect Account"}
              </button>
            )}
          </div>

          {googleAuth?.lastError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-sm">
              <div className="font-semibold text-red-700 mb-1">Last Error:</div>
              <div className="text-red-600">{googleAuth.lastError.message}</div>
              <div className="text-xs text-red-500 mt-1">Code: {googleAuth.lastError.code}</div>
            </div>
          )}
        </div>

        {/* API Status */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaServer /> API Services
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus?.api?.database?.status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Database (MongoDB)</span>
                {getStatusIcon(systemStatus?.api?.database?.status)}
              </div>
              <p className="text-sm opacity-80 mt-1">{systemStatus?.api?.database?.message || "Unknown"}</p>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus?.api?.calendar?.status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Google Calendar</span>
                {getStatusIcon(systemStatus?.api?.calendar?.status)}
              </div>
              <p className="text-sm opacity-80 mt-1">{systemStatus?.api?.calendar?.message || "Unknown"}</p>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus?.api?.email?.status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Email Service</span>
                {getStatusIcon(systemStatus?.api?.email?.status)}
              </div>
              <p className="text-sm opacity-80 mt-1">{systemStatus?.api?.email?.message || "Unknown"}</p>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus?.api?.cloudinary?.status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Cloudinary (Storage)</span>
                {getStatusIcon(systemStatus?.api?.cloudinary?.status)}
              </div>
              <p className="text-sm opacity-80 mt-1">{systemStatus?.api?.cloudinary?.message || "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaCreditCard /> Payment Systems
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus?.payment?.sslcommerz?.status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">SSLCommerz (Online)</span>
                {getStatusIcon(systemStatus?.payment?.sslcommerz?.status)}
              </div>
              <p className="text-sm opacity-80 mt-1">{systemStatus?.payment?.sslcommerz?.message || "Unknown"}</p>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus?.payment?.manual?.status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Manual (bKash/Nagad)</span>
                {getStatusIcon(systemStatus?.payment?.manual?.status)}
              </div>
              <p className="text-sm opacity-80 mt-1">{systemStatus?.payment?.manual?.message || "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* Auth Systems */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaEnvelope /> Authentication Systems
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus?.auth?.google?.status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Google OAuth</span>
                {getStatusIcon(systemStatus?.auth?.google?.status)}
              </div>
              <p className="text-sm opacity-80 mt-1">{systemStatus?.auth?.google?.message || "Unknown"}</p>
            </div>

            <div className={`p-4 rounded-lg border ${getStatusColor(systemStatus?.auth?.email?.status)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Email Login</span>
                {getStatusIcon(systemStatus?.auth?.email?.status)}
              </div>
              <p className="text-sm opacity-80 mt-1">{systemStatus?.auth?.email?.message || "Unknown"}</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="alert alert-info">
          <FaExclamationTriangle />
          <div>
            <h3 className="font-bold">Need Help?</h3>
            <div className="text-sm">
              If you encounter token expiration issues, click "Reconnect Google Account" to generate new tokens.
              This will redirect you to Google's consent screen to authorize the application.
            </div>
          </div>
        </div>

        {systemStatus?.timestamp && (
          <p className="text-center text-gray-400 text-sm mt-6">
            Last checked: {new Date(systemStatus.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default SystemHealth;