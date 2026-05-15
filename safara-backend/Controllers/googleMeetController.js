const { google } = require("googleapis");
require("dotenv").config();
const GoogleAuthConfig = require("../Models/googleAuthConfigModel.js");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || (process.env.NODE_ENV === "production" ? "https://api.safaralearningcenter.com" : "http://localhost:4000");
const FRONTEND_URL = process.env.FRONTEND_URL || (process.env.NODE_ENV === "production" ? "https://www.safaralearningcenter.com" : "http://localhost:5173");
const REDIRECT_URI = `${BASE_URL}/auth/google-meet/callback`;

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

const getMeetAuthStatus = async (req, res) => {
  try {
    let config = await GoogleAuthConfig.findOne();

    if (!config) {
      config = new GoogleAuthConfig();
      await config.save();
    }

    const hasCredentials = !!(CLIENT_ID && CLIENT_SECRET);
    const hasStoredToken = !!config.encryptedRefreshToken;
    const isConnected = config.status === "connected" && hasStoredToken;
    const isExpired = config.status === "expired" || config.status === "action_required";

    let connectionStatus = "disconnected";
    let message = "Not connected";

    if (isConnected) {
      connectionStatus = "connected";
      message = "Google Meet integration active";
    } else if (isExpired) {
      connectionStatus = "expired";
      message = "Token expired - needs reconnect";
    } else if (!hasCredentials) {
      connectionStatus = "not_configured";
      message = "Google credentials not configured in server";
    } else if (hasStoredToken) {
      try {
        const auth = await getValidMeetAuth();
        const calendar = google.calendar({ version: "v3", auth });
        await calendar.events.list({ calendarId: "primary", maxResults: 1 });
        connectionStatus = "connected";
        message = "Google Calendar connected";
      } catch (err) {
        connectionStatus = err.code === "TOKEN_EXPIRED" ? "expired" : "error";
        message = err.code === "TOKEN_EXPIRED" ? "Token expired - needs reconnect" : "Connection test failed";
      }
    }

    res.json({
      success: true,
      status: {
        connection: connectionStatus,
        message,
        needsReconnect: isExpired || connectionStatus === "error",
        canConnect: hasCredentials,
        hasStoredTokens: hasStoredToken,
        connectedAt: config.connectedAt,
        lastRefreshed: config.lastRefreshed,
        expiresAt: config.expiresAt,
        lastError: config.lastError,
        connectedEmail: config.metadata?.email || null,
        redirectUri: REDIRECT_URI,
        envConfigured: {
          clientId: !!CLIENT_ID,
          clientSecret: !!CLIENT_SECRET,
        },
      },
    });
  } catch (error) {
    console.error("Get Google Meet Auth Status Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const connectMeet = async (req, res) => {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        error: "Google OAuth credentials not configured. Please set CLIENT_ID and CLIENT_SECRET in .env",
        code: "NOT_CONFIGURED",
      });
    }

    const authUrl = createAuthUrl();

    res.json({
      success: true,
      authUrl,
      redirectUri: REDIRECT_URI,
      message: "Redirecting to Google OAuth consent screen",
    });
  } catch (error) {
    console.error("Connect Meet Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleMeetCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error("Google OAuth Error:", error);
    return res.redirect(`${FRONTEND_URL}/dashboard/admin/google-meet?googleError=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/dashboard/admin/google-meet?googleError=no_code`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokens);

    let userInfo = null;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      userInfo = await oauth2.userinfo.get();
    } catch (err) {
      console.warn("Could not fetch user info:", err.message);
    }

    let config = await GoogleAuthConfig.findOne();
    if (!config) {
      config = new GoogleAuthConfig();
    }

    const refreshTokenToStore = tokens.refresh_token;
    if (refreshTokenToStore) {
      config.setTokens(tokens.access_token, refreshTokenToStore, tokens.expiry_date);
    } else {
      config.accessToken = tokens.access_token;
      config.expiresAt = new Date(tokens.expiry_date);
      config.lastRefreshed = new Date();
      config.status = "connected";
      config.connectedAt = new Date();
    }

    if (userInfo?.data?.email) {
      config.metadata = {
        ...config.metadata,
        email: userInfo.data.email,
        scope: tokens.scope,
        tokenType: tokens.token_type,
      };
    }

    await config.save();
    console.log("Google Meet OAuth connected successfully");

    res.redirect(`${FRONTEND_URL}/dashboard/admin/google-meet?googleSuccess=true`);
  } catch (error) {
    console.error("Google Meet OAuth Callback Error:", error);
    res.redirect(`${FRONTEND_URL}/dashboard/admin/google-meet?googleError=${encodeURIComponent(error.message)}`);
  }
};

const getValidMeetAuth = async () => {
  const oauth2Client = getOAuth2Client();
  let config = await GoogleAuthConfig.findOne();

  if (!config) {
    config = new GoogleAuthConfig();
    await config.save();
  }

  const refreshToken = config.getDecryptedRefreshToken();

  if (!refreshToken) {
    throw {
      code: "TOKEN_EXPIRED",
      message: "Google Meet not connected. Please go to Google Meet settings and click 'Reconnect'.",
    };
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    config.accessToken = credentials.access_token;
    config.expiresAt = new Date(credentials.expiry_date);
    config.lastRefreshed = new Date();
    config.status = "connected";
    config.lastError = null;
    await config.save();

    return oauth2Client;
  } catch (err) {
    if (err.code === "invalid_grant" || err.message?.includes("invalid_grant")) {
      config.setExpired("Refresh token expired or revoked", "invalid_grant");
      config.setActionRequired("Please reconnect Google Meet integration", "invalid_grant");
      await config.save();
      throw {
        code: "TOKEN_EXPIRED",
        message: "Google Meet authorization expired. Please reconnect.",
      };
    }
    throw err;
  }
};

const testMeetConnection = async (req, res) => {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        status: "not_configured",
        error: "Google OAuth credentials not configured",
      });
    }

    const auth = await getValidMeetAuth();
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

    let config = await GoogleAuthConfig.findOne();
    if (config) {
      config.status = "connected";
      config.lastError = null;
      await config.save();
    }

    res.json({
      success: true,
      status: "connected",
      message: "Google Calendar API connected",
      testResults: {
        calendarAccess: true,
        primaryCalendar: !!calendarList.data.items?.find((c) => c.id === "primary"),
        upcomingEventsCount: upcomingEvents.data.items?.length || 0,
        expiresAt: config?.expiresAt,
      },
      redirectUri: REDIRECT_URI,
    });
  } catch (error) {
    console.error("Test Google Meet Connection Error:", error);

    let config = await GoogleAuthConfig.findOne();
    if (config) {
      if (error.code === "invalid_grant" || error.code === "TOKEN_EXPIRED") {
        config.setExpired("Refresh token expired", "invalid_grant");
      } else {
        config.setActionRequired(error.message, error.code || "CONNECTION_FAILED");
      }
      await config.save();
    }

    res.status(error.code === "TOKEN_EXPIRED" ? 401 : 500).json({
      success: false,
      status: error.code === "TOKEN_EXPIRED" ? "expired" : "error",
      error: error.message,
      hint: error.code === "TOKEN_EXPIRED" ? "Please reconnect your Google account" : "Check server credentials",
      redirectUri: REDIRECT_URI,
    });
  }
};

const disconnectMeet = async (req, res) => {
  try {
    let config = await GoogleAuthConfig.findOne();

    if (!config || !config.encryptedRefreshToken) {
      return res.json({
        success: true,
        message: "No Google Meet account was connected",
      });
    }

    const refreshToken = config.getDecryptedRefreshToken();
    if (refreshToken) {
      try {
        const axios = require("axios");
        await axios.post(
          "https://oauth2.googleapis.com/revoke",
          null,
          {
            params: { token: refreshToken },
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }
        );
      } catch (revokeErr) {
        console.warn("Token revocation warning:", revokeErr.message);
      }
    }

    config.clearTokens();
    await config.save();

    console.log("Google Meet disconnected");

    res.json({
      success: true,
      message: "Google Meet integration disconnected",
    });
  } catch (error) {
    console.error("Disconnect Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMeetAuthStatus,
  connectMeet,
  handleMeetCallback,
  getValidMeetAuth,
  testMeetConnection,
  disconnectMeet,
};