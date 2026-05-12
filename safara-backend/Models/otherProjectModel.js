const mongoose = require("mongoose");

const otherProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    img: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("otherProjectCollection", otherProjectSchema);
