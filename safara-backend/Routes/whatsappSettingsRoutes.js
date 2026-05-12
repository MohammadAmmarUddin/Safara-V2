const express = require("express");
const { getWhatsAppSettings, updateWhatsAppSettings } = require("../Controllers/whatsappSettingsController.js");

const router = express.Router();

router.get("/", getWhatsAppSettings);
router.put("/", updateWhatsAppSettings);

module.exports = router;
