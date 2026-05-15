const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: String,
  },
  encrypted: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["active", "error", "expired", "unknown"],
    default: "unknown",
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);

module.exports = SystemConfig;