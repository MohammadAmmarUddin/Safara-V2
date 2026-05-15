const { google } = require("googleapis");
require("dotenv").config();
const GoogleAuthConfig = require("../Models/googleAuthConfigModel.js");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || "http://localhost:4000"}/api/admin/google-meet/callback`;

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

const getMeetAuthStatus = async () => {
  const config = await GoogleAuthConfig.findOne();
  
  if (!config) {
    return {
      connected: false,
      status: "not_configured",
      message: "Google Meet integration not set up",
      canConnect: !!(CLIENT_ID && CLIENT_SECRET),
    };
  }

  const hasStoredToken = !!config.encryptedRefreshToken;
  const isExpired = config.status === "expired" || config.status === "action_required";
  const isConnected = config.status === "connected" && hasStoredToken;

  return {
    connected: isConnected,
    status: config.status,
    message: isConnected 
      ? "Google Meet integration connected" 
      : isExpired 
        ? "Google Meet token expired - needs reconnect"
        : config.status === "disconnected"
          ? "Google Meet disconnected"
          : "Google Meet not configured",
    canConnect: !!(CLIENT_ID && CLIENT_SECRET),
    connectedAt: config.connectedAt,
    expiresAt: config.expiresAt,
    lastError: config.lastError,
  };
};

const connectMeet = async () => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured in server settings");
  }

  const authUrl = createAuthUrl();
  return { authUrl };
};

const handleMeetCallback = async (code) => {
  if (!code) {
    throw new Error("No authorization code received");
  }

  const tokens = await exchangeCodeForTokens(code);
  
  let config = await GoogleAuthConfig.findOne();
  if (!config) {
    config = new GoogleAuthConfig();
  }

  const refreshTokenToStore = tokens.refresh_token || config.getDecryptedRefreshToken();
  
  if (refreshTokenToStore) {
    config.setTokens(tokens.access_token, refreshTokenToStore, tokens.expiry_date);
  } else {
    config.accessToken = tokens.access_token;
    config.expiresAt = new Date(tokens.expiry_date);
    config.lastRefreshed = new Date();
    config.status = "connected";
    config.connectedAt = new Date();
  }

  if (tokens.scope) {
    config.metadata = { ...config.metadata, scope: tokens.scope };
  }

  await config.save();

  return {
    success: true,
    message: "Google Meet integration connected successfully",
  };
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
      code: "NO_MEET_TOKEN", 
      message: "Google Meet not connected. Please go to System Health and click 'Connect Google Meet'." 
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
      config.setExpired("Meet refresh token expired or revoked", "invalid_grant");
      config.setActionRequired("Please reconnect Google Meet integration", "invalid_grant");
      await config.save();
      throw { 
        code: "MEET_TOKEN_EXPIRED", 
        message: "Google Meet authorization expired. Please reconnect from System Health." 
      };
    }
    throw err;
  }
};

const testMeetConnection = async () => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      success: false,
      status: "not_configured",
      error: "Google OAuth credentials not configured",
    };
  }

  try {
    const auth = await getValidMeetAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const upcomingEvents = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      maxResults: 5,
      singleEvents: true,
      orderBy: "startTime",
    });

    return {
      success: true,
      status: "connected",
      message: "Google Meet integration working",
      testResults: {
        calendarAccess: true,
        upcomingEventsCount: upcomingEvents.data.items?.length || 0,
      },
    };
  } catch (err) {
    const config = await GoogleAuthConfig.findOne();
    if (config) {
      if (err.code === "invalid_grant" || err.message?.includes("invalid_grant")) {
        config.setExpired("Meet token expired", "invalid_grant");
        config.setActionRequired("Please reconnect Google Meet integration", "invalid_grant");
      } else {
        config.setActionRequired(err.message, err.code || "CONNECTION_FAILED");
      }
      await config.save();
    }

    return {
      success: false,
      status: err.code === "MEET_TOKEN_EXPIRED" ? "expired" : "error",
      error: err.message || "Connection test failed",
    };
  }
};

const disconnectMeet = async () => {
  let config = await GoogleAuthConfig.findOne();
  
  if (config) {
    const refreshToken = config.getDecryptedRefreshToken();
    if (refreshToken) {
      try {
        await require("axios").post("https://oauth2.googleapis.com/revoke", null, {
          params: { token: refreshToken },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch (revokeErr) {
        console.warn("Token revocation warning:", revokeErr.message);
      }
    }
    config.clearTokens();
    await config.save();
  }

  return { success: true, message: "Google Meet integration disconnected" };
};

module.exports = {
  getMeetAuthStatus,
  connectMeet,
  handleMeetCallback,
  getValidMeetAuth,
  testMeetConnection,
  disconnectMeet,
};