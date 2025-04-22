const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalRides: Number,
  revenue: Number,
  customerSatisfaction: Number,
  fleetUtilization: Number,
});

module.exports = mongoose.model("Analytics", analyticsSchema);
