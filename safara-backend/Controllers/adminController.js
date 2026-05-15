const { google } = require("googleapis");
require("dotenv").config();
const axios = require("axios");
const SystemConfig = require("../Models/systemConfigModel.js");
const GoogleAuthConfig = require("../Models/googleAuthConfigModel.js");
const User = require("../Models/userModel.js");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || "http://localhost:4000"}/api/admin/google-auth/callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const getOAuth2Client = () => {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

const createAuthUrl = () => {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    response_type: "code",
  });
};

const exchangeCodeForTokens = async (code) => {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

const getGoogleAuthConfig = async () => {
  let config = await GoogleAuthConfig.findOne().lean();
  if (!config) {
    config = new GoogleAuthConfig();
    await config.save();
    config = config.toObject();
  }
  return config;
};

const getValidAuth = async () => {
  const oauth2Client = getOAuth2Client();
  let googleAuth = await GoogleAuthConfig.findOne();

  if (!googleAuth) {
    googleAuth = new GoogleAuthConfig();
    await googleAuth.save();
  }

  const refreshToken = googleAuth.getDecryptedRefreshToken();
  const envRefreshToken = process.env.REFRESH_TOKEN;

  const tokenToUse = refreshToken || envRefreshToken;

  if (!tokenToUse) {
    throw { code: "NO_TOKEN", message: "No refresh token available. Please reconnect Google account." };
  }

  oauth2Client.setCredentials({
    refresh_token: tokenToUse,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (credentials.refresh_token && credentials.refresh_token !== tokenToUse) {
      googleAuth.setTokens(credentials.access_token, credentials.refresh_token, credentials.expiry_date);
      await googleAuth.save();
    } else {
      googleAuth.accessToken = credentials.access_token;
      googleAuth.expiresAt = new Date(credentials.expiry_date);
      googleAuth.lastRefreshed = new Date();
      googleAuth.status = "connected";
      googleAuth.lastError = null;
      await googleAuth.save();
    }

    return oauth2Client;
  } catch (err) {
    if (err.code === "invalid_grant" || err.message?.includes("invalid_grant")) {
      googleAuth.setExpired("Refresh token expired or revoked", "invalid_grant");
      googleAuth.setActionRequired("Please reconnect your Google account", "invalid_grant");
      await googleAuth.save();
      throw { code: "TOKEN_EXPIRED", message: "Refresh token expired. Please reconnect Google account." };
    }
    throw err;
  }
};

const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date(expiresAt) <= new Date(Date.now() + 5 * 60 * 1000);
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.user?._id) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const user = await User.findById(req.user.user._id).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: "Authentication failed" });
  }
};

const getGoogleAuthStatus = async (req, res) => {
  try {
    const googleAuth = await getGoogleAuthConfig();
    const hasEnvCredentials = !!(CLIENT_ID && CLIENT_SECRET);
    const hasStoredTokens = !!(googleAuth.encryptedRefreshToken || process.env.REFRESH_TOKEN);

    let connectionStatus = "disconnected";
    let message = "Not connected";
    let canConnect = hasEnvCredentials;
    let needsReconnect = false;

    if (googleAuth.status === "connected" && googleAuth.expiresAt && !isTokenExpired(googleAuth.expiresAt)) {
      connectionStatus = "connected";
      message = "Google account connected and active";
    } else if (googleAuth.status === "expired") {
      connectionStatus = "expired";
      message = googleAuth.lastError?.message || "Token expired - needs reconnect";
      needsReconnect = true;
    } else if (googleAuth.status === "action_required") {
      connectionStatus = "action_required";
      message = googleAuth.lastError?.message || "Action required - please reconnect";
      needsReconnect = true;
    } else if (hasEnvCredentials && hasStoredTokens) {
      try {
        const auth = await getValidAuth();
        const calendar = google.calendar({ version: "v3", auth });
        await calendar.events.list({ calendarId: "primary", maxResults: 1 });
        connectionStatus = "connected";
        message = "Google Calendar API connected";
      } catch (err) {
        if (err.code === "TOKEN_EXPIRED" || err.code === "invalid_grant") {
          connectionStatus = "expired";
          message = "Token expired - needs reconnect";
          needsReconnect = true;
        } else {
          connectionStatus = "error";
          message = err.message || "Connection test failed";
        }
      }
    } else if (!hasEnvCredentials) {
      connectionStatus = "not_configured";
      message = "Google OAuth not configured in server settings";
      canConnect = false;
    }

    res.json({
      success: true,
      status: {
        connection: connectionStatus,
        message,
        needsReconnect,
        canConnect,
        hasEnvCredentials,
        hasStoredTokens,
        connectedAt: googleAuth.connectedAt,
        lastRefreshed: googleAuth.lastRefreshed,
        expiresAt: googleAuth.expiresAt,
        lastError: googleAuth.lastError,
        envConfigured: {
          clientId: !!CLIENT_ID,
          clientSecret: !!CLIENT_SECRET,
          redirectUri: !!REDIRECT_URI,
        },
      },
    });
  } catch (error) {
    console.error("Get Google Auth Status Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const initiateGoogleReconnect = async (req, res) => {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        error: "Google OAuth credentials not configured. Please set CLIENT_ID and CLIENT_SECRET in .env file.",
        code: "NOT_CONFIGURED",
      });
    }

    const authUrl = createAuthUrl();

    res.json({
      success: true,
      authUrl,
      message: "Redirecting to Google OAuth consent screen. Please authorize and complete the flow.",
    });
  } catch (error) {
    console.error("Initiate Google Reconnect Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleGoogleCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error("Google OAuth Error:", error);
    return res.redirect(`${process.env.FRONTEND_URL || "https://safaraapp.netlify.app"}/dashboard/admin/systemHealth?googleError=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || "https://safaraapp.netlify.app"}/dashboard/admin/systemHealth?googleError=no_code`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      console.warn("No refresh token in response - may need to force re-consent");
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    let userInfo = null;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      userInfo = await oauth2.userinfo.get();
    } catch (err) {
      console.warn("Could not fetch user info:", err.message);
    }

    let googleAuth = await GoogleAuthConfig.findOne();
    if (!googleAuth) {
      googleAuth = new GoogleAuthConfig();
    }

    const refreshTokenToStore = tokens.refresh_token || process.env.REFRESH_TOKEN;
    if (refreshTokenToStore) {
      googleAuth.setTokens(tokens.access_token, refreshTokenToStore, tokens.expiry_date);
    } else {
      googleAuth.accessToken = tokens.access_token;
      googleAuth.expiresAt = new Date(tokens.expiry_date);
      googleAuth.lastRefreshed = new Date();
      googleAuth.status = "connected";
      googleAuth.connectedAt = new Date();
    }

    if (userInfo?.data?.email) {
      googleAuth.metadata = {
        ...googleAuth.metadata,
        email: userInfo.data.email,
        scope: tokens.scope,
        tokenType: tokens.token_type,
      };
    }

    await googleAuth.save();

    console.log("Google OAuth connected successfully at:", new Date().toISOString());

    res.redirect(`${process.env.FRONTEND_URL || "https://safaraapp.netlify.app"}/dashboard/admin/systemHealth?googleSuccess=true`);
  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    res.redirect(`${process.env.FRONTEND_URL || "https://safaraapp.netlify.app"}/dashboard/admin/systemHealth?googleError=${encodeURIComponent(error.message)}`);
  }
};

const testGoogleConnection = async (req, res) => {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        status: "not_configured",
        error: "Google OAuth credentials not configured",
      });
    }

    const auth = await getValidAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const calendarList = await calendar.calendarList.list({ maxResults: 5 });
    const upcomingEvents = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });

    let googleAuth = await GoogleAuthConfig.findOne();
    if (googleAuth) {
      googleAuth.status = "connected";
      googleAuth.lastError = null;
      await googleAuth.save();
    }

    res.json({
      success: true,
      status: "connected",
      message: "Google Calendar API connection successful",
      testResults: {
        calendarAccess: true,
        primaryCalendar: !!calendarList.data.items?.find(c => c.id === "primary"),
        upcomingEventsCount: upcomingEvents.data.items?.length || 0,
        expiresAt: googleAuth?.expiresAt,
      },
    });
  } catch (error) {
    console.error("Test Google Connection Error:", error);

    let googleAuth = await GoogleAuthConfig.findOne();
    if (googleAuth) {
      if (error.code === "invalid_grant" || error.message?.includes("invalid_grant")) {
        googleAuth.setExpired("Refresh token expired", "invalid_grant");
        googleAuth.setActionRequired("Please reconnect your Google account", "invalid_grant");
      } else {
        googleAuth.setActionRequired(error.message, error.code || "CONNECTION_FAILED");
      }
      await googleAuth.save();
    }

    res.status(error.code === "TOKEN_EXPIRED" ? 401 : 500).json({
      success: false,
      status: error.code === "TOKEN_EXPIRED" ? "expired" : "error",
      error: error.message,
      hint: error.code === "TOKEN_EXPIRED" ? "Please reconnect your Google account" : "Check server credentials",
    });
  }
};

const disconnectGoogleAccount = async (req, res) => {
  try {
    const { revokeOnly } = req.body;

    let googleAuth = await GoogleAuthConfig.findOne();

    if (!googleAuth && !process.env.REFRESH_TOKEN) {
      return res.json({
        success: true,
        message: "No Google account was connected",
      });
    }

    if (!revokeOnly) {
      if (googleAuth) {
        const refreshToken = googleAuth.getDecryptedRefreshToken() || process.env.REFRESH_TOKEN;
        if (refreshToken) {
          try {
            await axios.post("https://oauth2.googleapis.com/revoke", null, {
              params: { token: refreshToken },
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
          } catch (revokeErr) {
            console.warn("Token revocation failed (may already be revoked):", revokeErr.message);
          }
        }
        googleAuth.clearTokens();
        await googleAuth.save();
      }

      const systemConfig = await SystemConfig.findOne({ key: "google_refresh_token" });
      if (systemConfig) {
        systemConfig.status = "revoked";
        systemConfig.lastUpdated = new Date();
        await systemConfig.save();
      }
    } else if (googleAuth) {
      try {
        const refreshToken = googleAuth.getDecryptedRefreshToken();
        if (refreshToken) {
          await axios.post("https://oauth2.googleapis.com/revoke", null, {
            params: { token: refreshToken },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
        }
      } catch (revokeErr) {
        console.warn("Token revocation warning:", revokeErr.message);
      }
    }

    console.log("Google account disconnected at:", new Date().toISOString());

    res.json({
      success: true,
      message: revokeOnly ? "Token revoked successfully" : "Google account disconnected successfully",
    });
  } catch (error) {
    console.error("Disconnect Google Account Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSystemStatus = async (req, res) => {
  try {
    const googleAuth = await getGoogleAuthConfig();
    const hasEnvCredentials = !!(CLIENT_ID && CLIENT_SECRET);
    const hasStoredTokens = !!(googleAuth.encryptedRefreshToken || process.env.REFRESH_TOKEN);

    let googleStatus = "disconnected";
    let googleMessage = "Not connected";

    if (googleAuth.status === "connected" && googleAuth.expiresAt && !isTokenExpired(googleAuth.expiresAt)) {
      googleStatus = "active";
      googleMessage = "Google account connected";
    } else if (googleAuth.status === "expired") {
      googleStatus = "expired";
      googleMessage = googleAuth.lastError?.message || "Token expired";
    } else if (hasEnvCredentials && hasStoredTokens) {
      try {
        const auth = await getValidAuth();
        const calendar = google.calendar({ version: "v3", auth });
        await calendar.events.list({ calendarId: "primary", maxResults: 1 });
        googleStatus = "active";
        googleMessage = "Google Calendar API connected";
      } catch (err) {
        if (err.code === "TOKEN_EXPIRED" || err.code === "invalid_grant") {
          googleStatus = "expired";
          googleMessage = "Token expired - needs reconnect";
        } else {
          googleStatus = "error";
          googleMessage = err.message || "Connection failed";
        }
      }
    } else if (!hasEnvCredentials) {
      googleStatus = "missing";
      googleMessage = "Google credentials not configured";
    }

    const status = {
      auth: {
        google: { status: googleStatus, message: googleMessage },
        email: { status: "active", message: "Email auth working" },
        googleOAuth: {
          status: googleAuth.status,
          connected: googleAuth.status === "connected",
          expiresAt: googleAuth.expiresAt,
          connectedAt: googleAuth.connectedAt,
          lastError: googleAuth.lastError,
          canConnect: hasEnvCredentials,
          needsReconnect: ["expired", "action_required"].includes(googleAuth.status),
        },
      },
      payment: {
        sslcommerz: { status: "active", message: "SSLCommerz payment gateway available" },
        manual: { status: "active", message: "Manual payments enabled" },
      },
      api: {
        database: { status: "unknown", message: "" },
        calendar: { status: "unknown", message: "" },
        email: { status: "unknown", message: "" },
        cloudinary: { status: "unknown", message: "" },
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const { connection } = require("mongoose");
      if (connection.readyState === 1) {
        status.api.database = { status: "active", message: "MongoDB connected" };
      } else {
        status.api.database = { status: "error", message: "MongoDB disconnected" };
      }
    } catch {
      status.api.database = { status: "error", message: "Database connection failed" };
    }

    if (googleStatus === "active") {
      status.api.calendar = { status: "active", message: "Google Calendar accessible" };
    } else if (googleStatus === "expired") {
      status.api.calendar = { status: "error", message: "Token expired - click Reconnect" };
    }

    if (process.env.nodemailer_user && process.env.nodemailer_pass) {
      status.api.email = { status: "active", message: "Email service configured" };
    } else {
      status.api.email = { status: "missing", message: "Email credentials not found" };
    }

    if (process.env.cloudinary_cloud_name && process.env.cloudinary_api_key) {
      status.api.cloudinary = { status: "active", message: "Cloudinary configured" };
    } else {
      status.api.cloudinary = { status: "missing", message: "Cloudinary not configured" };
    }

    res.json({ success: true, status });
  } catch (error) {
    console.error("System status error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const recheckSystemHealth = async (req, res) => {
  const results = {
    database: { status: "unknown", message: "", time: Date.now() },
    googleCalendar: { status: "unknown", message: "", time: Date.now() },
    email: { status: "unknown", message: "", time: Date.now() },
    cloudinary: { status: "unknown", message: "", time: Date.now() },
    payments: { status: "unknown", message: "", time: Date.now() },
  };

  try {
    const { connection } = require("mongoose");
    if (connection.readyState === 1) {
      await connection.db.admin().ping();
      results.database = { status: "healthy", message: "MongoDB connected and responsive", time: Date.now() };
    } else {
      results.database = { status: "unhealthy", message: "MongoDB disconnected", time: Date.now() };
    }
  } catch (err) {
    results.database = { status: "unhealthy", message: err.message, time: Date.now() };
  }

  try {
    if (CLIENT_ID && CLIENT_SECRET && (process.env.REFRESH_TOKEN || await GoogleAuthConfig.findOne()?.getDecryptedRefreshToken())) {
      const auth = await getValidAuth();
      const calendar = google.calendar({ version: "v3", auth });
      await calendar.events.list({ calendarId: "primary", maxResults: 1 });
      results.googleCalendar = { status: "healthy", message: "Google Calendar API accessible", time: Date.now() };
    } else {
      results.googleCalendar = { status: "unconfigured", message: "Google credentials not set", time: Date.now() };
    }
  } catch (err) {
    results.googleCalendar = {
      status: err.code === "invalid_grant" ? "expired" : "unhealthy",
      message: err.code === "invalid_grant" ? "Token expired - needs reconnect" : err.message,
      time: Date.now(),
    };
  }

  results.email = {
    status: process.env.nodemailer_user ? "healthy" : "unconfigured",
    message: process.env.nodemailer_user ? "Email service configured" : "Email credentials not set",
    time: Date.now(),
  };

  results.cloudinary = {
    status: process.env.cloudinary_cloud_name ? "healthy" : "unconfigured",
    message: process.env.cloudinary_cloud_name ? "Cloudinary configured" : "Cloudinary not set",
    time: Date.now(),
  };

  results.payments = { status: "healthy", message: "Payment systems available", time: Date.now() };

  const overallHealthy = results.database.status === "healthy" && results.googleCalendar.status === "healthy";

  res.json({
    success: true,
    overall: overallHealthy ? "healthy" : "degraded",
    checks: results,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getSystemStatus,
  getGoogleAuthStatus,
  initiateGoogleReconnect,
  handleGoogleCallback,
  testGoogleConnection,
  disconnectGoogleAccount,
  recheckSystemHealth,
  getValidAuth,
  requireAdmin,
};