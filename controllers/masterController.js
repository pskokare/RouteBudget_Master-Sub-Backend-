const bcrypt = require('bcryptjs');
const MasterAdmin = require('../models/masterAdmin');  // Correct the model to MasterAdmin
const SubAdmin = require('../models/Admin');
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

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

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  

// 📩 Send OTP
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await MasterAdmin.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();

    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 mins validity

    await MasterAdmin.findByIdAndUpdate(user._id, {
      resetOTP: otp,
      resetOTPExpiry: expiry,
    });

    await resend.emails.send({
      from: `"WTL Tourism Pvt. Ltd." <contact@worldtriplink.com>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
          <h2>Password Reset Request</h2>
          <p>Your OTP is:</p>
          <div style="font-size: 32px; font-weight: bold; color: #1e90ff;">${otp}</div>
          <p>This OTP is valid for 10 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const user = await MasterAdmin.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetOTP !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date() > user.resetOTPExpiry)
      return res.status(400).json({ message: "OTP has expired" });

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🔐 Reset Password
exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await MasterAdmin.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(password, 12);

    await MasterAdmin.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetOTP: null,
      resetOTPExpiry: null,
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
