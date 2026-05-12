const mongoose = require("mongoose");

const whatsappSettingsSchema = new mongoose.Schema({
    number: { type: String, default: "+8801558000555" },
    name: { type: String, default: "Safara Academy" },
    welcomeMessage: { type: String, default: "Hello! How can we help you?" },
}, { timestamps: true });

const WhatsAppSettings = mongoose.model("WhatsAppSettings", whatsappSettingsSchema);

module.exports = WhatsAppSettings;
