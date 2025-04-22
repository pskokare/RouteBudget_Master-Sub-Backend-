const bcrypt = require('bcryptjs');
const MasterAdmin = require('../models/masterAdmin');  // Correct the model to MasterAdmin
const SubAdmin = require('../models/Admin');

// Register Master Admin (not regular admin)
exports.registerMasterAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // const masterAdminId = mongoose.Types.ObjectId('67d9d463bab97703a18d886d'); 

        // Check if Master Admin already exists
        let existingMasterAdmin = await MasterAdmin.findOne({ email });
        if (existingMasterAdmin) return res.status(400).json({ message: "Master Admin already registered" });

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const newMasterAdmin = new MasterAdmin({ name, email, password: hashedPassword});

        await newMasterAdmin.save();

        res.status(201).json({ message: "Master Admin registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Admin Login (for Master Admin)
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if Master Admin exists
        const masterAdmin = await MasterAdmin.findOne({ email });
        if (!masterAdmin) return res.status(404).json({ message: "Master Admin not found" });

        // Compare hashed password with entered password
        const isMatch = await bcrypt.compare(password, masterAdmin.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        res.status(200).json({ message: "Login successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


