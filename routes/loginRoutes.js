const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware"); // ✅ Correct import
const { registerUser, loginUser } = require("../controllers/loginController");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

// Public routes
router.post(
    "/register",
    authMiddleware,
    upload.fields([
      { name: "profileImage", maxCount: 1 },
      { name: "licenseNoImage", maxCount: 1 },
      { name: "adharNoImage", maxCount: 1 },
    ]),
    registerUser
  );
  
// router.post("/login",authMiddleware,isAdmin, loginUser);
router.post("/login", loginUser);

module.exports = router;
