
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Import JWT
const Admin = require("../models/Admin"); // Assuming your Admin model is in models/Admin.js

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Function to generate a random password
const generateRandomPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Function to send email and create sub-admin
const sendSubAdminEmail = async (req, res) => {
  try {
    const { email, name, role, phone } = req.body;

    // Validate required fields
    if (!email || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email, name, and phone are required",
      });
    }

    // Generate a random password for the new sub-admin
    const password = generateRandomPassword();

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new sub-admin in the database
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: role || "sub-admin", // Default to "sub-admin" if role not provided
      phone,
    });

    // Save the sub-admin to the database
    await newAdmin.save();

    // Create a transporter for sending the email
    const transporter = createTransporter();

    // Define the email options
    const mailOptions = {
      from: `"Admin Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Sub-Admin Account Details",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; border-radius: 8px; width: 600px; margin: 0 auto;">
          <!-- Header with Company Logo and Name -->
          <div style="text-align: center;">
            <img src="https://media.licdn.com/dms/image/v2/D4D03AQGliPQEWM90Ag/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1732192083386?e=2147483647&v=beta&t=jZaZ72VS6diSvadKUEgQAOCd_0OKpVbeP44sEOrh-Og" 
                 alt="WTL Tourism Logo" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 10px;">
            <h1 style="color: #2c3e50; font-size: 24px; font-weight: bold;">WTL Tourism Pvt Ltd</h1>
          </div>
          
          <!-- Body Content -->
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2c3e50; font-size: 22px; text-align: center;">Welcome, ${name}!</h2>
            <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
              We're excited to have you as a sub-admin in the WTL Tourism team. Below are your login details:
            </p>
            
            <!-- User Details -->
            <div style="background-color: #f9fafb; padding: 10px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
            
            <!-- Instructions -->
            <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
              Please log in using the credentials provided above. After logging in, we recommend you change your password for security reasons.
            </p>
            
            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px;">
              <p style="color: #7f8c8d; font-size: 14px;">If you have any questions, feel free to contact our support team.</p>
            </div>
          </div>
        </div>
      `,
    };

    // Send the email with credentials
    const info = await transporter.sendMail(mailOptions);
 
    // Respond with success message
    return res.json({
      success: true,
      message: "Sub-admin created and email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Error creating sub-admin or sending email",
      error: error.message,
    });
  }
};

// Login function for sub-admin
const loginSubAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Find the admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Compare provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Create a JWT token (you can add expiration, for example, 1 hour)
    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: "1h", // token will expire in 1 hour
    });

    // Respond with success and the token
    return res.json({
      success: true,
      message: "Login successful",
      token, // Send the JWT token
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        status: admin.status,
      },
    });
  } catch (error) {
     return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = { sendSubAdminEmail, loginSubAdmin };



