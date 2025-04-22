const express = require('express');
const { registerMasterAdmin, adminLogin} = require('../controllers/masterController');
const router = express.Router();

// Register Master Admin
router.post('/register-master-admin', registerMasterAdmin);

// Master Admin Login
router.post('/login-master-admin', adminLogin);




module.exports = router;
