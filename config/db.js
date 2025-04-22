
const mongoose = require("mongoose");
require("dotenv").config();


const connectDB = async () => {
    try {
        // await mongoose.connect(process.env.DB_URI, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true
        // });
        await mongoose.connect(process.env.DB_URI);
        console.log(" MongoDB Connected Successfully");
    } catch (error) {
        console.error(" MongoDB Connection Failed:", error);
        process.exit(1); 
    }
};

module.exports = connectDB;
