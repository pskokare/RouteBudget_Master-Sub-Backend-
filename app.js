const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()
const createError = require("http-errors")
const cookieParser = require("cookie-parser")
const logger = require("morgan")
const path = require("path")
const bodyParser = require("body-parser")
const http = require ("http")
const {setupWebSocketServer} = require ("./routes/websocketRoutes")

const app = express()

const server = http.createServer(app)
// Enable CORS for all routes
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT" ,"PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/uploads", express.static("uploads")) // Serve uploaded files
app.use(express.json())
app.use(logger("dev"))
app.use(cookieParser())

// MongoDB Connection
mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => console.error(" MongoDB Connection Error:", err.message))

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Import Routes
const loginRoutes = require("./routes/loginRoutes")
const driverRoutes = require("./routes/driverRoutes")
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes")
const cabRoutes = require("./routes/cabRoutes")
const cabAssignRoutes = require("./routes/cabAssignmentRoutes")
const cabDetailsRoutes = require("./routes/cabsDetailsRoutes")
const subAdminPermissions = require("./routes/subAdminPermissions")
const expenseRoutes = require("./routes/subAdminExpenseRoute.js")
const analyticsRoutes = require("./routes/adminRoutes.js");


// Import email routes
const emailRoutes = require("./routes/adminRoutes.js")
const adminRoutes = require("./routes/adminRoutes")
const masterAdmin = require("./routes/masterRoutes")
const forpassRoutes = require("./routes/forPassRoutes")
const servicingRoutes = require("./routes/servicing.js")

// Routes of Subadmin
app.use("/api", loginRoutes)
app.use("/api/auth", forgotPasswordRoutes)
app.use("/api/cabs", cabRoutes)
app.use("/api/assigncab", cabAssignRoutes)
app.use("/api/cabDetails", cabDetailsRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/password", forpassRoutes)
app.use("/api/servicing", servicingRoutes)

//Routes of Driver
app.use("/api/driver", driverRoutes) 


//Routes of MasterAdmin
app.use("/api/master",masterAdmin)
app.use("/api/subAdminPermissions", subAdminPermissions)
app.use("/api/email", emailRoutes) // Use email routes with /api/email prefix
app.use("/api/analytics", analyticsRoutes);
app.use("/api/expenses", expenseRoutes)






setupWebSocketServer(server);

// Start Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))


