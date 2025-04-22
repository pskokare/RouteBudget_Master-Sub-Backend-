const express = require("express");
const Expense = require("../models/subAdminExpenses");

const router = express.Router();

// Add a new expense
router.post("/", async (req, res) => {
  try {
    const { type, amount, driver, cabNumber } = req.body;
    const newExpense = new Expense({ type, amount, driver, cabNumber });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an expense
router.delete("/:id", async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { type, amount, driver, cabNumber } = req.body;

    console.log("iN Put Backend")
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      { type, amount, driver, cabNumber },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
