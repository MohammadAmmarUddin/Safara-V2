const express = require("express");
const { getPaymentSettings, updatePaymentSettings } = require("../Controllers/paymentSettingsController.js");

const router = express.Router();

router.get("/", getPaymentSettings);
router.put("/", updatePaymentSettings);

module.exports = router;
