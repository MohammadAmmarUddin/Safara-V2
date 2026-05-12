const mongoose = require("mongoose");

const manualPaymentSchema = new mongoose.Schema({
    enrollmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "courseCollection",
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userCollection",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "courseCollection",
        required: true,
    },
    method: {
        type: String,
        enum: ["bkash", "nagad", "rocket", "bank"],
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
    },
    senderAccount: {
        type: String,
        required: true,
    },
    amountPaid: {
        type: Number,
        required: true,
    },
    proofImageUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "declined"],
        default: "pending",
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: {
        type: Date,
    },
    reviewNote: {
        type: String,
    },
}, { timestamps: true });

const ManualPaymentSubmission = mongoose.model("ManualPaymentSubmission", manualPaymentSchema);

module.exports = ManualPaymentSubmission;
