import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaVideo, FaPlug, FaCheck, FaTimes, FaSync, FaUnlink, FaCalendar } from "react-icons/fa";

const GoogleMeetSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [meetStatus, setMeetStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchMeetStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/admin/google-auth/status`);
      const data = await res.json();
      if (data.success) {
        setMeetStatus(data.status);
      }
    } catch (err) {
      console.error("Failed to fetch Meet status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetStatus();
  }, []);

  useEffect(() => {
    const success = searchParams.get("googleSuccess");
    const error = searchParams.get("googleError");

    if (success === "true") {
      Swal.fire({
        icon: "success",
        title: "Google Meet Connected!",
        text: "Your Google account has been successfully connected for scheduling meetings.",
        timer: 3000,
        timerProgressBar: true,
      });
      setSearchParams({});
      fetchMeetStatus();
    } else if (error) {
      let errorMessage = "Failed to connect Google account.";
      if (error === "access_denied") {
        errorMessage = "You denied access to your Google account. Please try again.";
      } else if (error === "no_code") {
        errorMessage = "No authorization code received. Please try again.";
      }
      Swal.fire({
        icon: "error",
        title: "Connection Failed",
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
        Swal.fire({ icon: "error", title: "Failed", text: data.error || "Could not start reconnection" });
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
          title: "Meeting API Working!",
          html: `
            <p>Google Calendar API is working properly.</p>
            <p><strong>Upcoming events:</strong> ${data.testResults?.upcomingEventsCount || 0}</p>
          `,
        });
        fetchMeetStatus();
      } else {
        Swal.fire({
          icon: "warning",
          title: "Connection Failed",
          text: data.error || "Unable to connect to Google Calendar",
          footer: data.hint ? `<a href="#">${data.hint}</a>` : "",
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
      title: "Disconnect Google Meet?",
      text: "This will remove access for scheduling meetings. You can reconnect anytime.",
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
        Swal.fire({ icon: "success", title: "Disconnected", text: "Google Meet integration has been disconnected." });
        fetchMeetStatus();
      } else {
        Swal.fire({ icon: "error", title: "Failed", text: data.error });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Disconnect failed" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "connected":
        return { bg: "bg-green-100", text: "text-green-700", label: "Connected" };
      case "expired":
        return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Expired" };
      case "disconnected":
        return { bg: "bg-red-100", text: "text-red-700", label: "Disconnected" };
      case "not_configured":
        return { bg: "bg-gray-100", text: "text-gray-700", label: "Not Configured" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", label: status || "Unknown" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const statusInfo = getStatusBadge(meetStatus?.connection);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Helmet>
        <title>Google Meet Settings - Admin</title>
      </Helmet>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FaVideo className="text-primary text-2xl" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">Google Meet Integration</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Connect Google to schedule meetings with students</p>
          </div>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className={`p-6 border-b border-gray-100 ${meetStatus?.connection === "connected" ? "bg-green-50" : meetStatus?.connection === "expired" ? "bg-yellow-50" : "bg-red-50"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${statusInfo.bg}`}>
                {meetStatus?.connection === "connected" ? (
                  <FaCheck className={`${statusInfo.text} text-2xl`} />
                ) : (
                  <FaTimes className={`${statusInfo.text} text-2xl`} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Google Meet Status</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.text} mt-1`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {meetStatus?.message || "Checking connection status..."}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Client ID</p>
              <p className={`font-semibold ${meetStatus?.envConfigured?.clientId ? "text-green-600" : "text-red-500"}`}>
                {meetStatus?.envConfigured?.clientId ? "Configured" : "Missing"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Client Secret</p>
              <p className={`font-semibold ${meetStatus?.envConfigured?.clientSecret ? "text-green-600" : "text-red-500"}`}>
                {meetStatus?.envConfigured?.clientSecret ? "Configured" : "Missing"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Token Status</p>
              <p className={`font-semibold ${meetStatus?.hasStoredTokens ? "text-green-600" : "text-red-500"}`}>
                {meetStatus?.hasStoredTokens ? "Available" : "None"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Last Connected</p>
              <p className="font-semibold text-gray-700">
                {meetStatus?.connectedAt ? new Date(meetStatus.connectedAt).toLocaleDateString() : "Never"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {meetStatus?.canConnect && (
              <button
                onClick={handleReconnect}
                disabled={actionLoading === "reconnect"}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <FaPlug className={actionLoading === "reconnect" ? "animate-pulse" : ""} />
                {actionLoading === "reconnect" ? "Redirecting..." : "Reconnect Google Meet"}
              </button>
            )}

            <button
              onClick={handleTestConnection}
              disabled={actionLoading === "test" || meetStatus?.connection !== "connected"}
              className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaCalendar className={actionLoading === "test" ? "animate-spin" : ""} />
              {actionLoading === "test" ? "Testing..." : "Test Meeting Creation"}
            </button>

            {meetStatus?.connection === "connected" && (
              <button
                onClick={handleDisconnect}
                disabled={actionLoading === "disconnect"}
                className="py-3 px-6 border-2 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <FaUnlink />
                {actionLoading === "disconnect" ? "Disconnecting..." : "Disconnect"}
              </button>
            )}
          </div>

          {meetStatus?.lastError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-semibold text-red-700 mb-1">Last Error:</p>
              <p className="text-red-600 text-sm">{meetStatus.lastError.message}</p>
              {meetStatus.lastError.code && (
                <p className="text-xs text-red-400 mt-1">Code: {meetStatus.lastError.code}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <FaCalendar className="text-blue-500" />
          How it works
        </h3>
        <ul className="text-sm text-blue-700 space-y-2 ml-6 list-disc">
          <li>Connect your Google account to enable meeting scheduling</li>
          <li>System automatically creates Google Meet links for course sessions</li>
          <li>Students receive meeting links via email notifications</li>
          <li>Tokens are automatically refreshed - no manual intervention needed</li>
          <li>If connection expires, click "Reconnect Google Meet" to restore access</li>
        </ul>
      </div>
    </div>
  );
};

export default GoogleMeetSettings;