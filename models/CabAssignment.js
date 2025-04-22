const mongoose = require('mongoose');

const TripDetailSchema = new mongoose.Schema({
    location: {
        from: { type: String },
        to: { type: String },
        totalDistance: { type: Number }
    },
    fuel: {
        type: {
            type: String,
            enum: ["Cash", "Card"]
        },
        receiptImage: { type: [String] },
        transactionImage: { type: [String] },
        amount: { type: [Number] }
    },
    fastTag: {
        paymentMode: {
            type: String,
            enum: ["Online Deduction", "Cash", "Card"]
        },
        amount: { type: [Number] },
        cardDetails: { type: String }
    },
    tyrePuncture: {
        image: { type: [String] },
        repairAmount: { type: [Number] }
    },
    vehicleServicing: {
        requiredService: { type: Boolean, default: false },
        details: { type: String },
        image: { type: [String] },
        receiptImage: { type: [String] },
        amount: { type: [Number] },
        meter: { type: [Number] },
        kmTravelled: { type: Number },
        totalKm: { type: Number }
    },
    otherProblems: {
        image: { type: [String] },
        details: { type: String },
        amount: { type: [Number] }
    }
}, { _id: false }); // Prevents subdocument _id creation


const CabAssignmentSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver', // Reference to the Driver model
        required: true
    },
    cab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CabDetails', // Reference to the Cab model
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now // Timestamp when assigned
    },
    status: {
        type: String,
        enum: ['assigned', 'ongoing', 'completed'], // Status of the assignment
        default: 'assigned' // Default status when assigned
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin", // Tracks which admin assigned the cab
        required: true,
    },
    tripDetails: TripDetailSchema,
}, { timestamps: true });

module.exports = mongoose.model('CabAssignment', CabAssignmentSchema);

