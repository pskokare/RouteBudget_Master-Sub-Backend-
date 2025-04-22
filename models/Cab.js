const mongoose = require("mongoose");

const CabSchema = new mongoose.Schema({
    cabNumber: {
       type:mongoose.Schema.Types.ObjectId,
       ref:'CabDetails'
    },
      
    location: {
        from: { type: String, required: true }, // Starting location
        to: { type: String, required: true }, // Destination location
        dateTime: { type: Date, default: Date.now }, // Auto-captured date & time
        totalDistance: { type: Number, required: false }, // Total calculated distance
    },
    fuel: {
        type: {
            type: String,
            enum: ["Cash", "Card"], // Payment types
            required: true,
        },
        receiptImage: { type: String }, // Image URL or file path
        transactionImage: { type: String }, // Image URL or file path (for Card)
        amount: { type: [Number], required: true },
    },
    fastTag: {
        paymentMode: {
            type: String,
            enum: ["Online Deduction", "Cash", "Card"], // FastTag payment modes
            required: true,
        },
        amount: { type: [Number] },
        cardDetails: { type: String },
    },
    tyrePuncture: {
        image: { type: String }, // Image of puncture
        repairAmount: { type: [Number] },
    },

    vehicleServicing: {
        requiredService: { type: Boolean, default: false }, // Whether servicing is required
        details: { type: String }, // Details based on distance
        image: { type: String }, // Image path or URL
    },
    

    otherProblems: {
        image: { type: String }, // Image of other problems
        details: { type: String }, // Details of other problems
        amount: { type: [Number] }, // Amount spent on other problems
    },
    
    Driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver"
    }, // Reference to Driver Model
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

const Cab = mongoose.model("Cab", CabSchema);

module.exports = Cab;

