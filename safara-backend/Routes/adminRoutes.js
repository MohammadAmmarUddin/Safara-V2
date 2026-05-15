const express = require("express");
const {
  getGoogleAuthStatus,
  initiateGoogleReconnect,
  handleGoogleCallback,
  testGoogleConnection,
  disconnectGoogleAccount,
} = require("../Controllers/adminController.js");

const router = express.Router();

router.get("/google-auth/status", getGoogleAuthStatus);
router.post("/google-auth/reconnect", initiateGoogleReconnect);
router.get("/google-auth/callback", handleGoogleCallback);
router.post("/google-auth/test", testGoogleConnection);
router.post("/google-auth/disconnect", disconnectGoogleAccount);

module.exports = router;