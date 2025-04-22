
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    profileImage: { type: String }, // Optional profile picture
    companyLogo: { type: String }, // Logo URL or file path
    companyInfo: { type: String },
    signature: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "subadmin" },
    assignedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Driver" }],
    phone: { type: String, required: true },
    status: { type: String, default: "Active" },
    assignedCabs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Cab" }],

    // OTP-based password reset fields
    resetOTP: {
      type: String,
      default: null,
    },
    resetOTPExpiry: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true, // Correct place for this option
  }
);

// Password comparison method
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Admin", AdminSchema);
