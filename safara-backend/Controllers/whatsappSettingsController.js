const WhatsAppSettings = require("../Models/whatsappSettingsModel.js");

const getWhatsAppSettings = async (req, res) => {
    try {
        let settings = await WhatsAppSettings.findOne();
        if (!settings) {
            settings = await WhatsAppSettings.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateWhatsAppSettings = async (req, res) => {
    try {
        let settings = await WhatsAppSettings.findOne();
        if (!settings) {
            settings = new WhatsAppSettings();
        }
        const { number, name, welcomeMessage } = req.body;
        if (number !== undefined) settings.number = number;
        if (name !== undefined) settings.name = name;
        if (welcomeMessage !== undefined) settings.welcomeMessage = welcomeMessage;
        await settings.save();
        res.status(200).json({ message: "WhatsApp settings updated successfully.", settings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getWhatsAppSettings, updateWhatsAppSettings };
