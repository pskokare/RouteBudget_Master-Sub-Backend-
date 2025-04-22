
const mongoose = require("mongoose");
const { image } = require("../config/cloudinary");

const CabSchema = new mongoose.Schema(
    {
        cabNumber: {
            type: String,
            unique: true,
        },
        insuranceNumber: {
            type: String,
        },
        insuranceExpiry: {
            type: Date,
        },
        registrationNumber: {
            type: String,
        },
        cabImage: {
            type: String, // Storing Cloudinary image URL
        },
        location: {
            from: { type: String, required: false }, // ✅ Made optional
            to: { type: String, required: false },   // ✅ Made optional
            totalDistance: { type: Number, required: false },
        },
        fuel: {
            type: {
                type: String,
                enum: ["Cash", "Card"], 
            },
            receiptImage: { type: [String] }, 
            transactionImage: { type: [String] }, 
            amount: { type: [Number], required: false }, // ✅ Made optional
        },
        fastTag: {
            paymentMode: {
                type: String,
                enum: ["Online Deduction", "Cash", "Card"], 
            },
            amount: { type: [Number] },
            cardDetails: { type: String },
        },
        tyrePuncture: {
            image: { type: [String] }, 
            repairAmount: { type: [Number] },
        },
  
        vehicleServicing: {
            requiredService: { type: Boolean, default: false }, 
            details: { type: String },                            
            image: { type: [String] }, 
            receiptImage: { type: [String] },  
            amount: { type: [Number] },          
            meter: { type: [Number] },               
            kmTravelled: {type: Number},
            totalKm: {type: Number},   
              
          },
        otherProblems: {
            image: { type: [String] },
            details: { type: String }, 
            amount: { type: [Number] },
        },
        Driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },

        cabDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("CabDetails", CabSchema);
