const express = require('express');
const router = express.Router();
const { assignCab, getAssignCab, unassignCab,getAssignDriver,EditDriverProfile, completeTrip,assignTripToDriver,updateTripDetailsByDriver  } = require('../controllers/cabAssignmentController')
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const { driverAuthMiddleware } = require("../middleware/driverAuthMiddleware");
const upload  = require("../middleware/uploadFields")
// ✅ Assign a Cab to a Driver
router.post('/', authMiddleware,isAdmin ,assignCab)

// ✅ Get all assigned cabs with driver details
router.get('/', authMiddleware,isAdmin ,getAssignCab)

router.put('/', authMiddleware,isAdmin ,unassignCab)

router.get('/driver',driverAuthMiddleware,getAssignDriver);

router.put("/profile", driverAuthMiddleware,EditDriverProfile)

router.put("/complete/:id",  driverAuthMiddleware, completeTrip);

router.post('/new', authMiddleware, assignTripToDriver); // Subadmin assigns
router.patch('/update-trip', driverAuthMiddleware, upload, updateTripDetailsByDriver); // Driver updates trip

module.exports = router;
