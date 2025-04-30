const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);

