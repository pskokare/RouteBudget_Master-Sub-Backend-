// const express = require("express");
// const router = express.Router();

// // Middlewares
// const upload = require("../middleware/uploadMiddleware");
// const { authMiddleware} = require("../middleware/authMiddleware");
// const { driverAuthMiddleware } = require("../middleware/driverAuthMiddleware");

// // Controller functions
// const {
//   assignServicing,
//   updateServicingStatus,
//   getAssignedServicings,
//   getAssignedServicingsAdmin
// } = require("../controllers/servicingController");

// // ✅ Admin assigns a servicing task to a driver
// router.post("/assign", authMiddleware, assignServicing);

// // ✅ Driver updates servicing status with receipt and cost
// router.put("/update/:id",
//   driverAuthMiddleware,
//   upload.single("receiptImage"),
//   updateServicingStatus
// );

// // ✅ Driver fetches all assigned servicing tasks
// router.get("/my-assignments", driverAuthMiddleware, getAssignedServicings);

// router.get('/',authMiddleware,getAssignedServicingsAdmin)

// module.exports = router;



const express = require("express");
const router = express.Router();

// Middlewares
const upload = require("../middleware/uploadMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");
const { driverAuthMiddleware } = require("../middleware/driverAuthMiddleware");

// Controller functions
const {
  assignServicing,
  updateServicingStatus,
  getAssignedServicings,
  getAssignedServicingsAdmin,
  resetServicingMeter
} = require("../controllers/servicingController");

// ✅ Admin assigns a servicing task to a driver
router.post("/assign", authMiddleware, assignServicing);

// ✅ Driver updates servicing status with receipt and cost
router.put("/update/:id",
  driverAuthMiddleware,
  upload.single("receiptImage"),
  updateServicingStatus
);

// ✅ Reset meter readings for servicing
router.put("/reset-meter/:id", authMiddleware, resetServicingMeter);

// ✅ Driver fetches all assigned servicing tasks
router.get("/my-assignments", driverAuthMiddleware, getAssignedServicings);

// ✅ Admin fetches all assigned servicings
router.get('/', authMiddleware, getAssignedServicingsAdmin);

module.exports = router;