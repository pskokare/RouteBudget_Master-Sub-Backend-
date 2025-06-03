
const express = require("express");
const router = express.Router();
const Cab = require("../models/CabsDetails");
const Driver = require("../models/loginModel");
const Cabassigment = require('../models/CabAssignment')
const upload = require("../middleware/uploadFields");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const { driverAuthMiddleware } = require("../middleware/driverAuthMiddleware");


router.patch('/add', authMiddleware, isAdmin, upload, async (req, res) => {
    try {
        console.log("📝 Request Body:", req.body);
        console.log("📂 Uploaded Files:", req.files);

        const { cabNumber, insuranceNumber, insuranceExpiry, registrationNumber } = req.body;

        if (!cabNumber) {
            return res.status(400).json({ message: "Cab number is required" });
        }

        const existingCab = await Cab.findOne({ cabNumber });

        if (existingCab) {
            return res.status(400).json({ message: "Cab number already exists" });
        }

        const cabImage = req.files?.cabImage?.[0]?.path || null;

        const newCab = new Cab({
            cabNumber,
            insuranceNumber: insuranceNumber || '',
            insuranceExpiry: insuranceExpiry || null,
            registrationNumber: registrationNumber || '',
            cabImage: cabImage || '',
            addedBy: req.admin?.id || '',
        });

        await newCab.save();

        return res.status(201).json({ message: "New cab created successfully", cab: newCab });

    } catch (error) {
        console.error("🚨 Error creating cab:", error); 
        return res.status(500).json({
            message: "Error creating cab",
            error: error?.message || "Internal Server Error"
        });
    }
});


router.patch('/driver/add', driverAuthMiddleware, upload, async (req, res) => {
    try {
        console.log("📝 Request Body:", req.body);
        console.log("📂 Uploaded Files:", req.files);

        const { cabNumber, ...updateFields } = req.body;

        if (!cabNumber) {
            return res.status(400).json({ message: "Cab number is required" });
        }

        let existingCab = await Cab.findOne({ cabNumber });

        // Safely parse JSON
        const parseJSONSafely = (data, defaultValue = {}) => {
            if (!data) return defaultValue;
            try {
                return typeof data === "string" ? JSON.parse(data) : data;
            } catch (error) {
                console.error(`JSON Parsing Error for ${data}:`, error.message);
                return defaultValue;
            }
        };

        const calculateKmTravelled = (meterReadings) => {
            let totalMeters = 0;
            for (let i = 1; i < meterReadings.length; i++) {
                const diff = meterReadings[i] - meterReadings[i - 1];
                if (diff > 0) {
                    totalMeters += diff;
                }
            }
            return Math.round(totalMeters); // convert to KM
        };

        const parsedFuel = parseJSONSafely(updateFields.fuel);
        const parsedFastTag = parseJSONSafely(updateFields.fastTag);
        const parsedTyre = parseJSONSafely(updateFields.tyrePuncture);
        const parsedService = parseJSONSafely(updateFields.vehicleServicing);
        const parsedOther = parseJSONSafely(updateFields.otherProblems);

        // Handle Uploaded Images
        const uploadedImages = {
            fuel: {
                receiptImage: req.files?.receiptImage?.[0]?.path || existingCab?.fuel?.receiptImage,
                transactionImage: req.files?.transactionImage?.[0]?.path || existingCab?.fuel?.transactionImage,
            },
            tyrePuncture: {
                image: req.files?.punctureImage?.[0]?.path || existingCab?.tyrePuncture?.image,
            },
            vehicleServicing: {
                image: req.files?.vehicleServicingImage?.[0]?.path,
                receiptImage: req.files?.vehicleServicingReceiptImage?.[0]?.path,
            },
            otherProblems: {
                image: req.files?.otherProblemsImage?.[0]?.path || existingCab?.otherProblems?.image,
            },
            cabImage: req.files?.cabImage?.[0]?.path || existingCab?.cabImage,
        };

        // Update the existing meter readings and calculate kmTravelled if meter is given
        let updatedMeter = [...(existingCab?.vehicleServicing?.meter || [])];
        if (parsedService?.meter) {
            const newMeter = Number(parsedService.meter);
            if (!isNaN(newMeter)) {
                updatedMeter.push(newMeter);
            }
        }
        const kmTravelled = calculateKmTravelled(updatedMeter);

        // Construct vehicleServicing only if any data or image is passed
        let vehicleServicingData = existingCab?.vehicleServicing || {};
        if (
            parsedService ||
            uploadedImages.vehicleServicing.image ||
            uploadedImages.vehicleServicing.receiptImage
        ) {
            vehicleServicingData = {
                ...vehicleServicingData,
                ...parsedService,
                meter: updatedMeter,
                kmTravelled: kmTravelled,
                image: [
                    ...(existingCab?.vehicleServicing?.image || []),
                    ...(uploadedImages.vehicleServicing.image ? [uploadedImages.vehicleServicing.image] : [])
                ],
                receiptImage: [
                    ...(existingCab?.vehicleServicing?.receiptImage || []),
                    ...(uploadedImages.vehicleServicing.receiptImage ? [uploadedImages.vehicleServicing.receiptImage] : [])
                ],
                amount: [
                    ...(existingCab?.vehicleServicing?.amount || []),
                    ...(Array.isArray(parsedService?.amount)
                        ? parsedService.amount
                        : parsedService?.amount ? [parsedService.amount] : [])
                ],
                totalKm: parsedService?.totalKm || existingCab?.vehicleServicing?.totalKm,
            };
        }

        const updateData = {
            cabNumber,
            insuranceNumber: updateFields.insuranceNumber || existingCab?.insuranceNumber,
            insuranceExpiry: updateFields.insuranceExpiry || existingCab?.insuranceExpiry,
            registrationNumber: updateFields.registrationNumber || existingCab?.registrationNumber,
            location: { ...existingCab?.location, ...parseJSONSafely(updateFields.location) },
            fuel: { ...existingCab?.fuel, ...parsedFuel, ...uploadedImages.fuel },
            fastTag: { ...existingCab?.fastTag, ...parsedFastTag },
            tyrePuncture: { ...existingCab?.tyrePuncture, ...parsedTyre, ...uploadedImages.tyrePuncture },
            vehicleServicing: vehicleServicingData,
            otherProblems: { ...existingCab?.otherProblems, ...parsedOther, ...uploadedImages.otherProblems },
            cabImage: uploadedImages.cabImage,
            addedBy: req.admin?.id || existingCab?.addedBy,
        };

        if (!existingCab) {
            const newCab = new Cab(updateData);
            await newCab.save();
            return res.status(201).json({ message: "New cab created successfully", cab: newCab });
        } else {
            const updatedCab = await Cab.findOneAndUpdate(
                { cabNumber },
                { $set: updateData },
                { new: true, runValidators: true }
            );
            return res.status(200).json({ message: "Cab data updated successfully", cab: updatedCab });
        }
    } catch (error) {
        console.error("🚨 Error updating/creating cab:", error.message);
        res.status(500).json({ message: "Error updating/creating cab", error: error.message });
    }
});





// ✅ 2️⃣ Get All Cabs
router.get("/", authMiddleware, isAdmin, async (req, res) => {
    try {
        const cabs = await Cab.find({ addedBy: req.admin.id });
        res.status(200).json(cabs);
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

router.get("/driver", driverAuthMiddleware, async (req, res) => {
    try {

        const driver = await Driver.findById(req.driver.id );
        const adminsCab = await Cab.find({ addedBy: driver.addedBy });
        res.status(200).json({"Driver Detail":driver,"Cab Admin":adminsCab});
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

// ✅ 3️⃣ Get a Single Cab by ID
router.get("/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const cab = await Cab.findById(req.params.id).populate("addedBy", "name email");
        if (!cab) return res.status(404).json({ error: "Cab not found" });

        res.status(200).json(cab);
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
});


router.delete("/delete/:id", authMiddleware, isAdmin, async (req, res) => {
    try {
        const cab = await Cab.findById(req.params.id);
        if (!cab) return res.status(404).json({ error: "Cab not found" });

        await cab.deleteOne();
        res.status(200).json({ message: "Cab deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

module.exports = router;


