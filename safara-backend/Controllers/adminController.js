const { google } = require("googleapis");
require("dotenv").config();
const axios = require("axios");
const GoogleAuthConfig = require("../Models/googleAuthConfigModel.js");

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

const getValidMeetAuth = async () => {
  const oauth2Client = getOAuth2Client();
  let googleAuth = await GoogleAuthConfig.findOne();

  if (!googleAuth) {
    googleAuth = new GoogleAuthConfig();
    await googleAuth.save();
  }

  const refreshToken = googleAuth.getDecryptedRefreshToken();
  if (!refreshToken) {
    throw { code: "NO_TOKEN", message: "No refresh token. Please reconnect Google Meet." };
  }

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (credentials.refresh_token && credentials.refresh_token !== refreshToken) {
      googleAuth.setTokens(credentials.access_token, credentials.refresh_token, credentials.expiry_date);
    } else {
      googleAuth.accessToken = credentials.access_token;
      googleAuth.expiresAt = new Date(credentials.expiry_date);
      googleAuth.lastRefreshed = new Date();
      googleAuth.status = "connected";
      googleAuth.lastError = null;
    }
    await googleAuth.save();

    return oauth2Client;
  } catch (err) {
    if (err.code === "invalid_grant") {
      googleAuth.setExpired("Refresh token expired", "invalid_grant");
      await googleAuth.save();
      throw { code: "TOKEN_EXPIRED", message: "Token expired. Please reconnect Google Meet." };
    }
    throw err;
  }
};

const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date(expiresAt) <= new Date(Date.now() + 5 * 60 * 1000);
};

const getGoogleAuthStatus = async (req, res) => {
  try {
    const googleAuth = await getGoogleAuthConfig();
    const hasEnvCredentials = !!(CLIENT_ID && CLIENT_SECRET);
    const hasStoredTokens = !!googleAuth.encryptedRefreshToken;

    let connectionStatus = "disconnected";
    let message = "Not connected";
    let canConnect = hasEnvCredentials;
    let needsReconnect = false;

    if (googleAuth.status === "connected" && googleAuth.expiresAt && !isTokenExpired(googleAuth.expiresAt)) {
      connectionStatus = "connected";
      message = "Google Meet integration active";
    } else if (googleAuth.status === "expired") {
      connectionStatus = "expired";
      message = "Token expired - needs reconnect";
      needsReconnect = true;
    } else if (hasEnvCredentials && hasStoredTokens) {
      try {
        const auth = await getValidMeetAuth();
        const calendar = google.calendar({ version: "v3", auth });
        await calendar.events.list({ calendarId: "primary", maxResults: 1 });
        connectionStatus = "connected";
        message = "Google Calendar connected";
      } catch (err) {
        if (err.code === "TOKEN_EXPIRED") {
          connectionStatus = "expired";
          message = "Token expired - needs reconnect";
          needsReconnect = true;
        } else {
          connectionStatus = "error";
          message = "Connection test failed";
        }
      }
    } else if (!hasEnvCredentials) {
      connectionStatus = "not_configured";
      message = "Google credentials not configured";
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
        error: "Google OAuth credentials not configured.",
        code: "NOT_CONFIGURED",
      });
    }

    const authUrl = createAuthUrl();

    res.json({
      success: true,
      authUrl,
      message: "Redirecting to Google OAuth consent screen.",
    });
  } catch (error) {
    console.error("Initiate Google Reconnect Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleGoogleCallback = async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (error) {
    console.error("Google OAuth Error:", error);
    return res.redirect(`${frontendUrl}/dashboard/admin/systemHealth?googleError=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/dashboard/admin/systemHealth?googleError=no_code`);
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

    let googleAuth = await GoogleAuthConfig.findOne();
    if (!googleAuth) {
      googleAuth = new GoogleAuthConfig();
    }

    const refreshTokenToStore = tokens.refresh_token;
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
    console.log("Google Meet OAuth connected successfully");

    res.redirect(`${frontendUrl}/dashboard/admin/systemHealth?googleSuccess=true`);
  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    res.redirect(`${frontendUrl}/dashboard/admin/systemHealth?googleError=${encodeURIComponent(error.message)}`);
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

    let googleAuth = await GoogleAuthConfig.findOne();
    if (googleAuth) {
      googleAuth.status = "connected";
      googleAuth.lastError = null;
      await googleAuth.save();
    }

    res.json({
      success: true,
      status: "connected",
      message: "Google Calendar API connected",
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
      if (error.code === "invalid_grant" || error.code === "TOKEN_EXPIRED") {
        googleAuth.setExpired("Refresh token expired", "invalid_grant");
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
    let googleAuth = await GoogleAuthConfig.findOne();

    if (!googleAuth || !googleAuth.encryptedRefreshToken) {
      return res.json({
        success: true,
        message: "No Google Meet account was connected",
      });
    }

    const refreshToken = googleAuth.getDecryptedRefreshToken();
    if (refreshToken) {
      try {
        await axios.post("https://oauth2.googleapis.com/revoke", null, {
          params: { token: refreshToken },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch (revokeErr) {
        console.warn("Token revocation warning:", revokeErr.message);
      }
    }

    googleAuth.clearTokens();
    await googleAuth.save();

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
  getGoogleAuthStatus,
  initiateGoogleReconnect,
  handleGoogleCallback,
  testGoogleConnection,
  disconnectGoogleAccount,
  getValidMeetAuth,
  getOAuth2Client,
};