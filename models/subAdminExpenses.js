const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  driver: { type: String, required: true },
  cabNumber: { type: String, required: true },
});

module.exports = mongoose.model("Expense", expenseSchema);
