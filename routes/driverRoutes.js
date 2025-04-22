
const express = require("express");
const Driver = require("../models/loginModel");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// ✅ Get All Drivers Assigned to an Admin
router.get("/profile", authMiddleware, isAdmin, async (req, res) => {
    try {
        const adminId = req.admin._id; // Get logged-in admin's ID

        // Fetch only drivers assigned to this admin
        const drivers = await Driver.find({ addedBy: adminId });

        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// ✅ Update Driver Profile (Only Owner Admin or Super Admin)
router.put("/profile/:id", authMiddleware, async (req, res) => {
    try {
        const adminId = req.admin.id;
        const adminRole = req.admin.role;

        // Find the driver by ID
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Check if the admin updating is the one who added the driver OR is a super admin
        if (driver.addedBy.toString() !== adminId && adminRole !== "super-admin") {
            return res.status(403).json({ message: "Unauthorized: You can only update drivers you added" });
        }

        // Update the driver
        const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).select("-password");

        res.json({ message: "Driver profile updated successfully", updatedDriver });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// ✅ Delete Driver Profile & Remove Image from Cloudinary
router.delete("/profile/:id", authMiddleware, async (req, res) => {
    try {
        const adminId = req.admin.id;
        const adminRole = req.admin.role;

        // Find the driver by ID
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Check if the admin deleting is the one who added the driver OR is a super admin
        if (driver.addedBy.toString() !== adminId && adminRole !== "super-admin") {
            return res.status(403).json({ message: "Unauthorized: You can only delete drivers you added" });
        }

        // ✅ Delete the driver image from Cloudinary
        if (driver.imageId) {
            await cloudinary.uploader.destroy(driver.imageId);
        }

        // Delete driver from the database
        await Driver.findByIdAndDelete(req.params.id);

        res.json({ message: "Driver and image deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }


});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required" });
        }

        const driver = await Driver.findOne({ email });

        if (!driver) {
            return res.status(404).json({ message: "Driver with this email does not exist" });
        }

        // Let frontend know driver exists — proceed to set new password page
        res.status(200).json({ message: "Driver verified. Proceed to set new password", driverId: driver._id });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
router.post("/reset-password",  async (req, res) => {
    try {
      const { driverId, newPassword } = req.body;
  
      if (!driverId || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Invalid request. Password must be at least 6 characters." });
      }
  
      const driver = await Driver.findById(driverId);
  
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
  
      // Update password
      driver.password = newPassword;
      await driver.save();
  
      res.status(200).json({ message: "Password updated successfully. You can now log in." });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  );


module.exports = router;
