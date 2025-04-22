const Servicing = require("../models/ServicingAssignment");

// ✅ Assign servicing (admin only)
exports.assignServicing = async (req, res) => {
    try {
        const { cabId, driverId, serviceDate } = req.body;

        const newService = new Servicing({
            cab: cabId,
            driver: driverId,
            assignedBy: req.admin.id,
            serviceDate,
        });

        await newService.save();

        res.status(201).json({
            message: "Cab assigned for servicing",
            servicing: newService,
        });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// ✅ Driver updates status with receipt and cost
exports.updateServicingStatus = async (req, res) => {
    try {
        const servicing = await Servicing.findById(req.params.id);

        if (!servicing) {
            return res.status(404).json({ error: "Servicing not found" });
        }

        if (servicing.driver.toString() !== req.driver.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        servicing.receiptImage = req.file?.path || servicing.receiptImage;
        servicing.servicingAmount = req.body.servicingCost || servicing.servicingCost;
        servicing.status = "completed";

        await servicing.save();

        res.status(200).json({
            message: "Servicing updated successfully",
            servicing,
        });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// ✅ Driver gets assigned servicings
exports.getAssignedServicings = async (req, res) => {
    try {
        const services = await Servicing.find({ driver: req.driver.id, status: "pending" }).populate("cab").populate('driver');

        res.status(200).json({ services });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
};

// ✅ Driver gets assigned servicings
exports.getAssignedServicingsAdmin = async (req, res) => {
    try {
        const services = await Servicing.find({ assignedBy: req.admin.id }).populate("cab").populate('driver');

        res.status(200).json({ services });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
};
