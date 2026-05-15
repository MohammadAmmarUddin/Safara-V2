const express = require("express");
const {
  getSystemStatus,
  getGoogleAuthStatus,
  initiateGoogleReconnect,
  handleGoogleCallback,
  testGoogleConnection,
  disconnectGoogleAccount,
  recheckSystemHealth,
} = require("../Controllers/adminController.js");

const router = express.Router();

router.get("/system-status", getSystemStatus);
router.get("/google-auth/status", getGoogleAuthStatus);
router.post("/google-auth/reconnect", initiateGoogleReconnect);
router.get("/google-auth/callback", handleGoogleCallback);
router.post("/google-auth/test", testGoogleConnection);
router.post("/google-auth/disconnect", disconnectGoogleAccount);
router.post("/system/recheck", recheckSystemHealth);

module.exports = router;