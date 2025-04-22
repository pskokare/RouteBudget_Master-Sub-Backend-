const mongoose = require("mongoose");

const SubAdminSchema = new mongoose.Schema({
  subAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // Unique ID for sub-admin
  name: { type: String },
  permissions: {
    dashboard: { type: Boolean, default: false },
    subAdmin: { type: Boolean, default: false },
    driverManagement: { type: Boolean, default: false },
    cabManagement: { type: Boolean, default: false },
    rides: { type: Boolean, default: false },
    expenseManagement: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
  },
});

const SubAdmin = mongoose.model("SubAdminPermissions", SubAdminSchema);
module.exports = SubAdmin;
