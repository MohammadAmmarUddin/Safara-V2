const mongoose = require("mongoose");
const crypto = require("crypto");

const googleAuthConfigSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["connected", "disconnected", "expired", "action_required"],
    default: "disconnected",
  },
  accessToken: {
    type: String,
    select: false,
  },
  refreshToken: {
    type: String,
    select: false,
  },
  encryptedRefreshToken: String,
  expiresAt: Date,
  lastRefreshed: Date,
  connectedAt: Date,
  disconnectedAt: Date,
  lastError: {
    message: String,
    code: String,
    timestamp: Date,
  },
  metadata: {
    scope: String,
    email: String,
    tokenType: String,
  },
}, { timestamps: true });

const ENCRYPTION_KEY = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || "default32charencryptionkey12345";

googleAuthConfigSchema.methods.encryptToken = function(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.padEnd(32)), iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { iv: iv.toString("hex"), data: encrypted };
};

googleAuthConfigSchema.methods.decryptToken = function(encryptedToken) {
  if (!encryptedToken || !encryptedToken.iv || !encryptedToken.data) {
    return null;
  }
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(ENCRYPTION_KEY.padEnd(32)),
      Buffer.from(encryptedToken.iv, "hex")
    );
    let decrypted = decipher.update(encryptedToken.data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Token decryption failed:", err.message);
    return null;
  }
};

googleAuthConfigSchema.methods.setTokens = function(accessToken, refreshToken, expiresAt) {
  const encrypted = this.encryptToken(refreshToken);
  this.encryptedRefreshToken = JSON.stringify(encrypted);
  this.accessToken = accessToken;
  this.refreshToken = refreshToken;
  this.expiresAt = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 3600000);
  this.lastRefreshed = new Date();
  this.status = "connected";
  this.connectedAt = new Date();
  this.disconnectedAt = null;
  this.lastError = null;
};

googleAuthConfigSchema.methods.clearTokens = function() {
  this.accessToken = null;
  this.refreshToken = null;
  this.encryptedRefreshToken = null;
  this.expiresAt = null;
  this.status = "disconnected";
  this.disconnectedAt = new Date();
  this.lastRefreshed = null;
};

googleAuthConfigSchema.methods.getDecryptedRefreshToken = function() {
  if (!this.encryptedRefreshToken) return null;
  try {
    const parsed = JSON.parse(this.encryptedRefreshToken);
    return this.decryptToken(parsed);
  } catch (err) {
    return null;
  }
};

googleAuthConfigSchema.methods.setExpired = function(errorMessage, errorCode) {
  this.status = "expired";
  this.lastError = {
    message: errorMessage,
    code: errorCode,
    timestamp: new Date(),
  };
};

googleAuthConfigSchema.methods.setActionRequired = function(errorMessage, errorCode) {
  this.status = "action_required";
  this.lastError = {
    message: errorMessage,
    code: errorCode,
    timestamp: new Date(),
  };
};

const GoogleAuthConfig = mongoose.model("GoogleAuthConfig", googleAuthConfigSchema);

module.exports = GoogleAuthConfig;