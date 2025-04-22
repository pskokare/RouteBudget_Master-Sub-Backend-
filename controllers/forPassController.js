
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { Resend } = require("resend"); // ✅ Correct import
const User = require("../models/Admin");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY); // ✅ Instance

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Email
const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();

    // Set OTP expiry to 10 minutes from now
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    // Save OTP and expiry
    await User.findByIdAndUpdate(user._id, {
      resetOTP: otp,
      resetOTPExpiry: otpExpiry,
    });

    // Send OTP email
    await resend.emails.send({
      from: `"WTL Tourism Pvt. Ltd." <contact@worldtriplink.com>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 10px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://media.licdn.com/dms/image/v2/D4D03AQGliPQEWM90Ag/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1732192083386?e=2147483647&v=beta&t=jZaZ72VS6diSvadKUEgQAOCd_0OKpVbeP44sEOrh-Og" alt="WTL Tourism Pvt. Ltd." style="max-width: 130px;" />
          </div>
          <h2 style="color: #2c3e50; text-align: center;">Password Reset Request</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            You recently requested to reset your password for your account. Use the following One-Time Password (OTP) to complete your request:
          </p>
          <div style="background-color: #f0f4f8; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #1e90ff; letter-spacing: 10px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #555; font-size: 16px;">
            <strong >Note:</strong> This OTP will expire in <strong>2 minutes</strong>.
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            If you didn’t request this, please ignore this email. For further assistance, feel free to reach out to our support team.
          </p>
          <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            © 2025 WTL Tourism Pvt. Ltd. All rights reserved.<br />
            <a href="<contact@worldtriplink.com>" style="color: #1e90ff; text-decoration: none;">www.worldtriplink.com</a>
          </p>
        </div>
      `,
    });
    

    return res.status(200).json({ message: "OTP sent successfully to your email" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if OTP matches and is not expired
    if (user.resetOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    if (new Date() > new Date(user.resetOTPExpiry)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." })
    }

    // OTP is valid, allow user to reset password
    return res.status(200).json({ message: "OTP verified successfully" })
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

// Reset Password
const resetPassword = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password and clear OTP fields
    await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        resetOTP: null,
        resetOTPExpiry: null,
      },
      { new: true },
    )

    return res.status(200).json({ message: "Password reset successful" })
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" })
  }
}

module.exports = { sendOTP, verifyOTP, resetPassword }
