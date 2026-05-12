const PaymentSettings = require("../Models/paymentSettingsModel.js");

const getPaymentSettings = async (req, res) => {
    try {
        let settings = await PaymentSettings.findOne();
        if (!settings) {
            settings = await PaymentSettings.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePaymentSettings = async (req, res) => {
    try {
        let settings = await PaymentSettings.findOne();
        if (!settings) {
            settings = new PaymentSettings();
        }
        const { bkash, nagad, rocket, bank } = req.body;
        if (bkash) {
            settings.bkash.number = bkash.number || settings.bkash.number;
            settings.bkash.name = bkash.name || settings.bkash.name;
        }
        if (nagad) {
            settings.nagad.number = nagad.number || settings.nagad.number;
            settings.nagad.name = nagad.name || settings.nagad.name;
        }
        if (rocket) {
            settings.rocket.number = rocket.number || settings.rocket.number;
            settings.rocket.name = rocket.name || settings.rocket.name;
        }
        if (bank) {
            settings.bank.details = bank.details || settings.bank.details;
        }
        await settings.save();
        res.status(200).json({ message: "Payment settings updated successfully.", settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPaymentSettings, updatePaymentSettings };
