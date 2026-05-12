const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema({
    bkash: {
        number: { type: String, default: "017XXXXXXXX" },
        name: { type: String, default: "Safara Academy" },
    },
    nagad: {
        number: { type: String, default: "017XXXXXXXX" },
        name: { type: String, default: "Safara Academy" },
    },
    rocket: {
        number: { type: String, default: "017XXXXXXXX" },
        name: { type: String, default: "Safara Academy" },
    },
    bank: {
        details: { type: String, default: "Bank: XYZ Bank, A/C: 123456789, Name: Safara Academy" },
    },
}, { timestamps: true });

const PaymentSettings = mongoose.model("PaymentSettings", paymentSettingsSchema);

module.exports = PaymentSettings;
