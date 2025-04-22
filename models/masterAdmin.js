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
}, { timestamps: true });

// Compare password method
masterAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('MasterAdmin', masterAdminSchema);  // Model name: 'MasterAdmin'
