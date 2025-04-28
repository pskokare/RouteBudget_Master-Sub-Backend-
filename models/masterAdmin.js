const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const masterAdminSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  // OTP-based password reset fields
  resetOTP: {
    type: String,
    default: null,
  },
  resetOTPExpiry: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

// Compare password method
masterAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('MasterAdmin', masterAdminSchema);  // Model name: 'MasterAdmin'
