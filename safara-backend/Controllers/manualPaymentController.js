const mongoose = require("mongoose");
const courseModel = require("../Models/courseModel.js");
const ManualPaymentSubmission = require("../Models/manualPaymentModel.js");
const userModel = require("../Models/userModel.js");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.nodemailer_user || "safaralearningcenter@gmail.com",
    pass: process.env.nodemailer_pass || "lfoxxtejuaptbjrw",
  },
});

const sendNotificationEmail = async (userEmail, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.nodemailer_user || "safaralearningcenter@gmail.com",
      to: userEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error.message);
  }
};

// Student submits a manual payment request
const submitManualPayment = async (req, res) => {
  try {
    const { courseId, userId, method, transactionId, senderAccount, amountPaid, proofImageUrl } = req.body;

    if (!courseId || !userId || !method || !transactionId || !senderAccount || !amountPaid) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // Create the manual payment submission record
    const submission = new ManualPaymentSubmission({
      userId,
      courseId,
      method,
      transactionId,
      senderAccount,
      amountPaid,
      proofImageUrl: proofImageUrl || "",
      status: "pending",
    });

    await submission.save();

    // Add/update the student in the course's students array with pending status
    const course = await courseModel.findOneAndUpdate(
      {
        _id: courseId,
        "students.studentsId": userId,
      },
      {
        $set: {
          "students.$.paymentMethod": "manual",
          "students.$.paymentStatus": "pending",
          "students.$.paymentComplete": false,
          "students.$.paymentId": submission._id.toString(),
        },
      },
      { new: true }
    );

    if (!course) {
      await courseModel.findByIdAndUpdate(courseId, {
        $push: {
          students: {
            studentsId: userId,
            paymentId: submission._id.toString(),
            paymentMethod: "manual",
            paymentStatus: "pending",
            paymentComplete: false,
          },
        },
      });
    }

    res.status(201).json({
      message: "Manual payment submitted successfully. Awaiting admin approval.",
      submission,
    });
  } catch (error) {
    console.error("Error in submitManualPayment:", error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all manual payment requests, optionally filtered by status
const getManualPaymentRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const submissions = await ManualPaymentSubmission.find(filter)
      .populate("userId", "firstname lastname email phone img")
      .populate("courseId", "title price")
      .sort({ submittedAt: -1 });

    res.status(200).json(submissions);
  } catch (error) {
    console.error("Error in getManualPaymentRequests:", error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Approve a manual payment
const approveManualPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;

    const submission = await ManualPaymentSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "Payment submission not found." });
    }

    submission.status = "approved";
    submission.reviewedAt = new Date();
    submission.reviewNote = reviewNote || "";
    await submission.save();

    // Update the course student record
    await courseModel.findOneAndUpdate(
      {
        _id: submission.courseId,
        "students.studentsId": submission.userId,
      },
      {
        $set: {
          "students.$.paymentStatus": "approved",
          "students.$.paymentComplete": true,
        },
      }
    );

    // Notify the student
    const student = await userModel.findById(submission.userId);
    if (student && student.email) {
      await sendNotificationEmail(
        student.email,
        "Payment Approved - Course Access Granted",
        `
          <h2>Payment Approved</h2>
          <p>Dear ${student.firstname} ${student.lastname},</p>
          <p>Your manual payment of ${submission.amountPaid} BDT via ${submission.method} has been <strong>approved</strong>.</p>
          <p>You now have full access to your enrolled course. Happy learning!</p>
          <p>Best regards,<br/>Safara Academy</p>
        `
      );
    }

    res.status(200).json({ message: "Payment approved successfully.", submission });
  } catch (error) {
    console.error("Error in approveManualPayment:", error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Decline a manual payment
const declineManualPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewNote } = req.body;

    if (!reviewNote) {
      return res.status(400).json({ message: "A decline reason is required." });
    }

    const submission = await ManualPaymentSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "Payment submission not found." });
    }

    submission.status = "declined";
    submission.reviewedAt = new Date();
    submission.reviewNote = reviewNote;
    await submission.save();

    // Update the course student record
    await courseModel.findOneAndUpdate(
      {
        _id: submission.courseId,
        "students.studentsId": submission.userId,
      },
      {
        $set: {
          "students.$.paymentStatus": "declined",
          "students.$.paymentComplete": false,
        },
      }
    );

    // Notify the student
    const student = await userModel.findById(submission.userId);
    if (student && student.email) {
      await sendNotificationEmail(
        student.email,
        "Payment Declined - Action Required",
        `
          <h2>Payment Declined</h2>
          <p>Dear ${student.firstname} ${student.lastname},</p>
          <p>Your manual payment of ${submission.amountPaid} BDT via ${submission.method} has been <strong>declined</strong>.</p>
          <p><strong>Reason:</strong> ${reviewNote}</p>
          <p>Please submit a new payment request with corrected information.</p>
          <p>Best regards,<br/>Safara Academy</p>
        `
      );
    }

    res.status(200).json({ message: "Payment declined.", submission });
  } catch (error) {
    console.error("Error in declineManualPayment:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific student's manual payment status for a course
const getStudentManualPaymentStatus = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const submission = await ManualPaymentSubmission.findOne({ userId, courseId })
      .sort({ submittedAt: -1 });

    if (!submission) {
      return res.status(404).json({ message: "No manual payment found." });
    }

    res.status(200).json(submission);
  } catch (error) {
    console.error("Error in getStudentManualPaymentStatus:", error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Delete a manual payment
const deleteManualPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await ManualPaymentSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "Payment submission not found." });
    }

    // Remove from course student record
    await courseModel.findOneAndUpdate(
      {
        _id: submission.courseId,
        "students.studentsId": submission.userId,
      },
      {
        $pull: {
          students: { paymentId: id },
        },
      }
    );

    // Delete the submission
    await ManualPaymentSubmission.findByIdAndDelete(id);

    res.status(200).json({ message: "Payment submission deleted successfully." });
  } catch (error) {
    console.error("Error in deleteManualPayment:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitManualPayment,
  getManualPaymentRequests,
  approveManualPayment,
  declineManualPayment,
  getStudentManualPaymentStatus,
  deleteManualPayment,
};
