

const express = require("express");
const {
  adminLogin,
  registerAdmin,
  totalSubAdminCount,
  getAllSubAdmins,
  addNewSubAdmin,
  getSubAdminById,
  updateSubAdmin,
  deleteSubAdmin,
  toggleBlockStatus,
  totalDriver,
  totalCab,
  getAllExpenses
} = require("../controllers/adminController");
const { sendSubAdminEmail, loginSubAdmin } = require("../controllers/emailController");
const upload = require("../middleware/uploadMiddleware");
const { getAnalytics, addAnalytics } = require("../controllers/adminController");



const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", adminLogin);
router.get("/sub-admin-count", totalSubAdminCount);
router.get("/driver-count", totalDriver);
router.get("/cab-count", totalCab);
router.get("/getExpense", getAllExpenses);
// Toggle block/unblock sub-admin
// router.put("/toggle-block/:id", toggleBlockSubAdmin);
// router.post("/addNewSubAdmin", addNewSubAdmin);

router.get("/getAllSubAdmins", getAllSubAdmins);
router.post("/addNewSubAdmin", upload.fields([{ name: "profileImage", maxCount: 1 },{ name: "companyLogo", maxCount: 1 },{name: "signature", maxCount: 1}]), addNewSubAdmin);
router.get("/getSubAdmin/:id", getSubAdminById);
router.put("/updateSubAdmin/:id", updateSubAdmin);
router.delete("/deleteSubAdmin/:id", deleteSubAdmin);
router.put("/toggle-block/:id", toggleBlockStatus);


router.post("/send", sendSubAdminEmail);
router.post("/login", loginSubAdmin);





router.get("/", getAnalytics);
router.post("/", addAnalytics)

router.post(
  "/upload-profile",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded!" });
      }

      res.json({
        message: "File uploaded successfully!",
        fileUrl: req.file.path,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
