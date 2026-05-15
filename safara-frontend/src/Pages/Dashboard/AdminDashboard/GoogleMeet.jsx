import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaSync,
  FaPlug,
  FaCopy,
  FaVideo,
  FaUser,
  FaEnvelope,
  FaInfoCircle,
} from "react-icons/fa";

const GoogleMeet = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [googleStatus, setGoogleStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchGoogleStatus = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/admin/google-meet/status`);
      const data = await res.json();
      if (data.success) {
        setGoogleStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch Google status:", err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchGoogleStatus();
    setLoading(false);
    setChecking(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const success = searchParams.get("googleSuccess");
    const error = searchParams.get("googleError");

    if (success === "true") {
      Swal.fire({
        icon: "success",
        title: "Connected!",
        text: "Google Meet integration connected successfully.",
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
      } else if (error === "redirect_uri_mismatch") {
        errorMessage = "Redirect URI mismatch. Please copy the URI below and add it to Google Cloud Console.";
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
      const res = await fetch(`${baseUrl}/api/admin/google-meet/connect`);
      const data = await res.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        Swal.fire({ icon: "error", title: "Failed", text: data.error || "Could not connect" });
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
      const res = await fetch(`${baseUrl}/api/admin/google-meet/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Connection Successful",
          html: `
            <p>Google Calendar API is working!</p>
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
      text: "This will revoke access. You will need to reconnect later.",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Disconnect",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setActionLoading("disconnect");
    try {
      const res = await fetch(`${baseUrl}/api/admin/google-meet/disconnect`, { method: "POST" });
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

  const copyRedirectUri = () => {
    if (googleStatus?.redirectUri) {
      navigator.clipboard.writeText(googleStatus.redirectUri);
      Swal.fire({ icon: "success", title: "Copied!", text: "Redirect URI copied to clipboard", timer: 1500 });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "expired":
      case "action_required":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "expired":
        return "Token Expired";
      case "action_required":
        return "Action Required";
      case "not_configured":
        return "Not Configured";
      default:
        return "Disconnected";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return <FaCheck className="text-white" />;
      case "expired":
      case "action_required":
        return <FaExclamationTriangle className="text-white" />;
      default:
        return <FaTimes className="text-white" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Helmet>
        <title>Google Meet Integration - Admin Dashboard</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <FaVideo className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Google Meet</h1>
              <p className="text-sm text-gray-500">Manage your Google Calendar integration</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={checking}
            className="btn btn-outline btn-primary btn-sm flex items-center gap-2"
          >
            <FaSync className={checking ? "animate-spin" : ""} />
            {checking ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className={`${googleStatus?.connection === "connected" ? "bg-green-500" : googleStatus?.connection === "expired" ? "bg-yellow-500" : "bg-red-500"} p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  {getStatusIcon(googleStatus?.connection)}
                </div>
                <div className="text-white">
                  <h2 className="text-xl font-bold">{getStatusText(googleStatus?.connection)}</h2>
                  <p className="text-sm text-white/80">{googleStatus?.message || "Checking..."}</p>
                </div>
              </div>
              {googleStatus?.connectedEmail && (
                <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
                  <FaUser className="text-white/80" />
                  <span className="text-white text-sm font-medium">{googleStatus.connectedEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FaEnvelope className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Client ID</p>
                <p className="font-semibold text-gray-900">{googleStatus?.envConfigured?.clientId ? "Configured" : "Not Set"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <FaCheck className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Token Status</p>
                <p className="font-semibold text-gray-900">{googleStatus?.hasStoredTokens ? "Available" : "None"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FaSync className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Last Sync</p>
                <p className="font-semibold text-gray-900">
                  {googleStatus?.lastRefreshed
                    ? new Date(googleStatus.lastRefreshed).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Redirect URI Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaInfoCircle className="text-primary" />
            <h3 className="font-semibold text-gray-900">Redirect URI</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Add this URI in Google Cloud Console → APIs &amp; Services → Credentials → OAuth 2.0 Client IDs
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg text-sm font-mono text-gray-700 break-all">
              {googleStatus?.redirectUri || "Not available"}
            </code>
            <button
              onClick={copyRedirectUri}
              className="btn btn-primary btn-sm flex items-center gap-2 justify-center"
            >
              <FaCopy />
              Copy URI
            </button>
          </div>
        </div>

        {/* Error Display */}
        {googleStatus?.lastError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">Last Error</p>
                <p className="text-sm text-red-600 mt-1">{googleStatus.lastError.message}</p>
                {googleStatus.lastError.code && (
                  <p className="text-xs text-red-500 mt-1">Error Code: {googleStatus.lastError.code}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {googleStatus?.canConnect && (
            <button
              onClick={handleReconnect}
              disabled={actionLoading === "reconnect"}
              className="btn btn-primary flex items-center gap-2"
            >
              <FaPlug className={actionLoading === "reconnect" ? "animate-pulse" : ""} />
              {actionLoading === "reconnect" ? "Redirecting..." : "Reconnect Google Meet"}
            </button>
          )}

          <button
            onClick={handleTestConnection}
            disabled={actionLoading === "test"}
            className="btn btn-success flex items-center gap-2"
          >
            <FaCheck className={actionLoading === "test" ? "animate-spin" : ""} />
            {actionLoading === "test" ? "Testing..." : "Test Connection"}
          </button>

          {googleStatus?.connection === "connected" && (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading === "disconnect"}
              className="btn btn-error btn-outline flex items-center gap-2"
            >
              <FaTimes />
              {actionLoading === "disconnect" ? "Disconnecting..." : "Disconnect"}
            </button>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <FaInfoCircle />
            How to Fix Common Issues
          </h4>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="font-medium text-gray-800 mb-2">redirect_uri_mismatch</p>
              <p className="text-sm text-gray-600">Copy the Redirect URI above and add it to your Google Cloud Console OAuth credentials.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="font-medium text-gray-800 mb-2">Token Expired</p>
              <p className="text-sm text-gray-600">Click "Reconnect Google Meet" to generate new tokens. This will redirect you to Google's consent screen.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="font-medium text-gray-800 mb-2">Connection Failed</p>
              <p className="text-sm text-gray-600">Ensure CLIENT_ID and CLIENT_SECRET are correctly set in your server .env file.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMeet;