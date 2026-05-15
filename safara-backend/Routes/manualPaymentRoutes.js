const express = require("express");
const {
  submitManualPayment,
  getManualPaymentRequests,
  approveManualPayment,
  declineManualPayment,
  getStudentManualPaymentStatus,
  deleteManualPayment,
} = require("../Controllers/manualPaymentController.js");
const ManualPaymentSubmission = require("../Models/manualPaymentModel.js");

const router = express.Router();

// Student submits a manual payment request
router.post("/submit", submitManualPayment);

// Admin: Get all manual payment requests (query: ?status=pending|approved|declined)
router.get("/requests", getManualPaymentRequests);

// Admin: Approve a manual payment
router.patch("/approve/:id", approveManualPayment);

// Admin: Decline a manual payment
router.patch("/decline/:id", declineManualPayment);

// Admin: Delete a manual payment
router.delete("/delete/:id", deleteManualPayment);

// Admin: Update a manual payment
router.patch("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, transactionId, senderAccount } = req.body;

    const submission = await ManualPaymentSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "Payment submission not found." });
    }

    if (amountPaid) submission.amountPaid = amountPaid;
    if (transactionId) submission.transactionId = transactionId;
    if (senderAccount) submission.senderAccount = senderAccount;
    await submission.save();

    res.status(200).json({ message: "Payment updated successfully.", submission });
  } catch (error) {
    console.error("Error in updateManualPayment:", error);
    res.status(500).json({ message: error.message });
  }
});

// Student: Get payment status for a specific course
router.get("/status/:userId/:courseId", getStudentManualPaymentStatus);

module.exports = router;
