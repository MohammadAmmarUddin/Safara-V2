const { google } = require("googleapis");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { getValidMeetAuth } = require("../Controllers/googleMeetController.js");

const createMeet = async (req, res) => {
  const { summary, startTime, endTime } = req.body;

  if (!summary || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required fields: summary, startTime, and endTime" });
  }

  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    console.error("Missing Google OAuth credentials");
    return res.status(500).json({ 
      error: "Google Calendar API not configured. Please contact administrator.",
      code: "MISSING_CREDENTIALS"
    });
  }

  try {
    const auth = await getValidMeetAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    if (isNaN(startDateTime) || isNaN(endDateTime)) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (endDateTime <= startDateTime) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    const event = {
      summary: summary,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "Asia/Dhaka",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "Asia/Dhaka",
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    res.json({ meetLink: response.data.hangoutLink || response.data.htmlLink });
  } catch (error) {
    console.error("Google Meet Error:", JSON.stringify(error.response?.data || error));
    
    let errorMessage = "Failed to create Google Meet";
    let errorCode = error.code || error.response?.data?.error;
    let hint = "Please try again or contact administrator.";
    
    if (errorCode === "invalid_grant" || error.response?.data?.error === "invalid_grant") {
      errorMessage = "Google authorization expired. Please go to Admin Dashboard > System Health and reconnect your Google account.";
      errorCode = "TOKEN_EXPIRED";
      hint = "Go to Admin Dashboard > System Health and click 'Reconnect Google Account'";
    } else if (errorCode === "TOKEN_EXPIRED") {
      errorMessage = "Google authorization expired. Please go to Admin Dashboard > System Health and reconnect your Google account.";
      hint = "Go to Admin Dashboard > System Health and click 'Reconnect Google Account'";
    } else if (errorCode === "NO_TOKEN") {
      errorMessage = "Google account not connected. Please go to Admin Dashboard > System Health and connect your Google account.";
      errorCode = "NOT_CONNECTED";
      hint = "Go to Admin Dashboard > System Health and click 'Reconnect Google Account'";
    } else if (errorCode === "401" || error.response?.data?.error === "invalid_client") {
      errorMessage = "Google API credentials are invalid. Please check CLIENT_ID and CLIENT_SECRET.";
      errorCode = "invalid_credentials";
    } else if (error.response?.data?.error_description) {
      errorMessage = error.response.data.error_description;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage, code: errorCode, hint });
  }
};

const sendSchedule = async (req, res) => {
  const { usersData, meetLink, courseTitle } = req.body;

  if (!Array.isArray(usersData) || usersData.length === 0 || !meetLink) {
    return res.status(400).json({ error: "Invalid or missing usersData or meetLink" });
  }

  if (!process.env.nodemailer_user || !process.env.nodemailer_pass) {
    return res.status(500).json({ error: "Email service not configured. Please contact administrator." });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.nodemailer_user,
      pass: process.env.nodemailer_pass,
    },
  });

  const emailPromises = usersData.map((user) => {
    if (!user.email) {
      return Promise.resolve();
    }

    const mailOptions = {
      from: process.env.nodemailer_user,
      to: user.email,
      subject: `Your Scheduled Google Meet - ${courseTitle || "Course"}`,
      html: `
        <h2>Hello!</h2>
        <p>You have a scheduled class for your course <strong>${courseTitle || "Upcoming Course"}</strong>.</p>
        <p><strong>Meeting Details:</strong></p>
        <ul>
          <li><strong>Meeting Link:</strong> <a href="${meetLink}" target="_blank">Click here to join</a></li>
        </ul>
        <p>Please join on time.</p>
        <p>Best regards,<br/><strong>Safara Learning Center</strong></p>
      `,
    };

    return transporter.sendMail(mailOptions).catch((err) => {
      console.error(`Error sending email to ${user.email}:`, err.message);
    });
  });

  try {
    await Promise.all(emailPromises);
    res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error sending emails:", error.message);
    res.status(500).json({ error: "Error sending emails" });
  }
};

module.exports = { createMeet, sendSchedule };