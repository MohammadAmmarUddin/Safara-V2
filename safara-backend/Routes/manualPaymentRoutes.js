const express = require("express");
const {
  submitManualPayment,
  getManualPaymentRequests,
  approveManualPayment,
  declineManualPayment,
  getStudentManualPaymentStatus,
} = require("../Controllers/manualPaymentController.js");

const router = express.Router();

// Student submits a manual payment request
router.post("/submit", submitManualPayment);

// Admin: Get all manual payment requests (query: ?status=pending|approved|declined)
router.get("/requests", getManualPaymentRequests);

// Admin: Approve a manual payment
router.patch("/approve/:id", approveManualPayment);

// Admin: Decline a manual payment
router.patch("/decline/:id", declineManualPayment);

// Student: Get payment status for a specific course
router.get("/status/:userId/:courseId", getStudentManualPaymentStatus);

module.exports = router;
