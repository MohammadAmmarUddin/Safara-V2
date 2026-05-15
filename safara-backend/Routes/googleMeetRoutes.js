const express = require("express");
const router = express.Router();
const {
  getMeetAuthStatus,
  connectMeet,
  handleMeetCallback,
  testMeetConnection,
  disconnectMeet,
} = require("../Controllers/googleMeetController.js");

router.get("/status", getMeetAuthStatus);
router.get("/connect", connectMeet);
router.get("/callback", handleMeetCallback);
router.post("/test", testMeetConnection);
router.post("/disconnect", disconnectMeet);

module.exports = router;