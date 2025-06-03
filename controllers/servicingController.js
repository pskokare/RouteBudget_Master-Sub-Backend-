
// const Servicing = require("../models/ServicingAssignment");
// const Cabassigment = require("../models/CabAssignment");

// // ✅ Assign servicing (admin only)
// exports.assignServicing = async (req, res) => {
//   try {
//     const { cabId, driverId, serviceDate } = req.body;

//     const newService = await new Servicing({
//       cab: cabId,
//       driver: driverId,
//       assignedBy: req.admin.id,
//       serviceDate,
//     }).save();

//     res.status(201).json({
//       message: "Cab assigned for servicing",
//       servicing: newService,
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };

// // ✅ Driver updates status with receipt and cost
// exports.updateServicingStatus = async (req, res) => {
//   try {
//     const servicing = await Servicing.findById(req.params.id);
//     if (!servicing) {
//       return res.status(404).json({ error: "Servicing not found" });
//     }

//     if (servicing.driver.toString() !== req.driver.id) {
//       return res.status(403).json({ error: "Unauthorized" });
//     }

//     // Update servicing details
//     servicing.receiptImage = req.file?.path || servicing.receiptImage;
//     servicing.servicingAmount = req.body.servicingCost || servicing.servicingAmount;
//     // servicing.status = "completed";

//     const cabAssignment = await Cabassigment.findOne({ cab: servicing.cab });
//     if (!cabAssignment) {
//       return res.status(404).json({ error: "Cab assignment not found" });
//     }

//     // ✅ Save last meter reading before reset
//     const meters = cabAssignment.tripDetails?.vehicleServicing?.meter || [];
//     const lastMeter = meters.length ? meters[meters.length - 1] : 0;

//     cabAssignment.tripDetails.vehicleServicing.meter = [];
//     cabAssignment.tripDetails.vehicleServicing.kmTravelled = 0;

//     // Save both in parallel
//     await Promise.all([servicing.save(), cabAssignment.save()]);

//     res.status(200).json({
//       message: "Servicing updated successfully",
//       servicing,
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };

// // ✅ Driver gets assigned (pending) servicings
// exports.getAssignedServicings = async (req, res) => {
//   try {
//     const services = await Servicing.find({
//       driver: req.driver.id,
//     })
//       .populate("cab")
//       .populate("driver");

//     res.status(200).json({ services });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };

// // ✅ Admin gets all assigned servicings
// exports.getAssignedServicingsAdmin = async (req, res) => {
//   try {
//     const services = await Servicing.find({
//       assignedBy: req.admin.id,
//     })
//       .populate("cab")
//       .populate("driver");

//     res.status(200).json({ services });
//   } catch (err) {
//     res.status(500).json({ error: "Server error", details: err.message });
//   }
// };



const Servicing = require("../models/ServicingAssignment");
const Cabassigment = require("../models/CabAssignment");

// ✅ Assign servicing (admin only)
exports.assignServicing = async (req, res) => {
  try {
    const { cabId, driverId, serviceDate } = req.body;

    const newService = await new Servicing({
      cab: cabId,
      driver: driverId,
      assignedBy: req.admin.id,
      serviceDate,
    }).save();

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

    // Update servicing details
    servicing.receiptImage = req.file?.path || servicing.receiptImage;
    servicing.servicingAmount = req.body.servicingCost || servicing.servicingAmount;
    
    const cabAssignment = await Cabassigment.findOne({ cab: servicing.cab });
    if (!cabAssignment) {
      return res.status(404).json({ error: "Cab assignment not found" });
    }

    // Save last meter reading before reset if not already saved
    if (cabAssignment.tripDetails?.vehicleServicing?.meter?.length > 0) {
      const lastMeterReading = cabAssignment.tripDetails.vehicleServicing.meter.slice(-1)[0];
      servicing.lastMeterReading = lastMeterReading;
    }

    // Reset meter readings and km travelled
    cabAssignment.tripDetails.vehicleServicing.meter = [];
    cabAssignment.tripDetails.vehicleServicing.kmTravelled = 0;

    // Save both in parallel
    await Promise.all([servicing.save(), cabAssignment.save()]);

    res.status(200).json({
      message: "Servicing updated successfully",
      servicing,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ✅ Reset meter readings for a cab in servicing
exports.resetServicingMeter = async (req, res) => {
  try {
    const servicing = await Servicing.findById(req.params.id);
    if (!servicing) {
      return res.status(404).json({ error: "Servicing assignment not found" });
    }

    const cabAssignment = await Cabassigment.findOne({ cab: servicing.cab });
    if (!cabAssignment) {
      return res.status(404).json({ error: "Cab assignment not found" });
    }

    // Check if meter needs to be reset
    if (cabAssignment.tripDetails?.vehicleServicing?.meter?.length > 0) {
      // Save last meter reading to servicing record
      const lastMeter = cabAssignment.tripDetails.vehicleServicing.meter.slice(-1)[0];
      servicing.lastMeterReading = lastMeter;
      
      // Reset meter readings
      cabAssignment.tripDetails.vehicleServicing.meter = [];
      cabAssignment.tripDetails.vehicleServicing.kmTravelled = 0;
      
      await Promise.all([servicing.save(), cabAssignment.save()]);
      
      return res.status(200).json({
        message: "Meter readings reset successfully",
        lastMeterReading: lastMeter
      });
    }

    res.status(200).json({
      message: "Meter readings already reset",
      lastMeterReading: servicing.lastMeterReading || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ✅ Driver gets assigned (pending) servicings
exports.getAssignedServicings = async (req, res) => {
  try {
    const services = await Servicing.find({
      driver: req.driver.id,
    })
      .populate("cab")
      .populate("driver");

    res.status(200).json({ services });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ✅ Admin gets all assigned servicings
exports.getAssignedServicingsAdmin = async (req, res) => {
  try {
    const services = await Servicing.find({
      assignedBy: req.admin.id,
    })
      .populate("cab")
      .populate("driver");

    res.status(200).json({ services });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};