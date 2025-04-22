// models/ServicingAssignment.js
const mongoose = require("mongoose");

const servicingAssignmentSchema = new mongoose.Schema({
  cab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CabDetails",
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  serviceDate: {
    type: Date,
    default: Date.now, 
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  receiptImage: {
    type: String,
  },
  servicingAmount: {
    type: Number,
  },
  notes: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model("ServicingAssignment", servicingAssignmentSchema);
