
const CabAssignment = require('../models/CabAssignment');
const Driver = require('../models/loginModel');
const Cab = require('../models/CabsDetails');
const mongoose = require('mongoose');


const getFreeCabsForDriver = async (req, res) => {
  try {
    const driverId = req.driver._id;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const adminId = driver.addedBy;

    // Fetch all assignments and cabs added by this admin concurrently
    const [assignments, allCabs] = await Promise.all([
      CabAssignment.find({ assignedBy: adminId }),
      Cab.find({ addedBy: adminId })
    ]);

    const assignedCabIds = new Set(
      assignments
        .filter(assgn => assgn.status === "assigned" && assgn.cab?._id)
        .map(assgn => assgn.cab._id.toString())
    );

    const freeCabs = allCabs.filter(cab => !assignedCabIds.has(cab._id.toString()));

    res.status(200).json({ freeCabs });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching free cabs for driver",
      error: err.message
    });
  }
};

const freeCabDriver = async (req, res) => {
  try {
    const adminId = req.admin._id;

    // Fetch assignments, drivers, and cabs concurrently
    const [assignments, allDrivers, allCabs] = await Promise.all([
      CabAssignment.find({ assignedBy: adminId }),
      Driver.find({ addedBy: adminId }),
      Cab.find({ addedBy: adminId })
    ]);

    const assignedCabIds = new Set();
    const assignedDriverIds = new Set();

    assignments.forEach(assgn => {
      if (assgn.status === "assigned") {
        if (assgn.cab?._id) assignedCabIds.add(assgn.cab._id.toString());
        if (assgn.driver?._id) assignedDriverIds.add(assgn.driver._id.toString());
      }
    });

    const freeDrivers = allDrivers.filter(driver => !assignedDriverIds.has(driver._id.toString()));
    const freeCabs = allCabs.filter(cab => !assignedCabIds.has(cab._id.toString()));

    res.status(200).json({ freeDrivers, freeCabs });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching free cabs and drivers",
      error: err.message
    });
  }
};


const assignTripToDriver = async (req, res) => {
  try {
    const { driverId, cabNumber, assignedBy } = req.body;

    if (!driverId || !cabNumber || !assignedBy) {
      return res.status(400).json({ message: "Driver ID, Cab Number, and Assigned By are required" });
    }

    const cab = mongoose.Types.ObjectId.isValid(cabNumber)
      ? await Cab.findById(cabNumber)
      : await Cab.findOne({ cabNumber });

    if (!cab) return res.status(404).json({ message: "Cab not found" });

    const existingAssignment = await CabAssignment.findOne({
      $or: [
        { driver: driverId, status: { $ne: "completed" } },
        { cab: cab._id, status: { $ne: "completed" } }
      ]
    });

    if (existingAssignment) {
      return res.status(400).json({ message: "Driver or cab already has an active trip" });
    }

    const assignment = new CabAssignment({
      driver: driverId,
      cab: cab._id,
      assignedBy,
      status: "assigned",
    });

    await assignment.save();
    res.status(201).json({ message: "✅ Trip assigned to driver", assignment });
  } catch (error) {
    console.error("❌ Error assigning trip:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTripDetailsByDriver = async (req, res) => {
  try {
    const driverId = req.driver.id;

    const assignment = await CabAssignment.findOne({
      driver: driverId,
      status: { $ne: "completed" },
    }).select('tripDetails driver cab status');

    if (!assignment) {
      return res.status(404).json({ message: "No active trip found for this driver." });
    }

    const files = req.files || {};
    const body = req.body || {};
    const trip = assignment.tripDetails || {};

    // Utility: Sanitize keys
    const sanitizedBody = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k.trim(), v])
    );

    // Utility: Safe JSON parsing
    const parseJSON = (val) => {
      if (typeof val !== "string") return val || {};
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    };

    // Utility: Extract file paths
    const extractPaths = (field) =>
      Array.isArray(files[field]) ? files[field].map(f => f.path) : [];

    // Utility: Merge arrays
    const mergeArray = (existing = [], incoming) =>
      existing.concat(Array.isArray(incoming) ? incoming : [incoming]).filter(Boolean);

    // Utility: Calculate distance
    const calculateKm = (meters) =>
      meters.reduce((acc, curr, i, arr) =>
        i === 0 ? acc : acc + Math.max(0, curr - arr[i - 1]), 0
      );

    // === Process Fields ===

    if (sanitizedBody.location) {
      trip.location = { ...trip.location, ...parseJSON(sanitizedBody.location) };
    }

    if (sanitizedBody.fuel) {
      const fuel = parseJSON(sanitizedBody.fuel);
      trip.fuel = {
        ...trip.fuel,
        ...fuel,
        amount: mergeArray(trip.fuel?.amount, fuel.amount),
        receiptImage: mergeArray(trip.fuel?.receiptImage, extractPaths("receiptImage")),
        transactionImage: mergeArray(trip.fuel?.transactionImage, extractPaths("transactionImage")),
      };
    }

    if (sanitizedBody.fastTag) {
      const tag = parseJSON(sanitizedBody.fastTag);
      trip.fastTag = {
        ...trip.fastTag,
        ...tag,
        amount: mergeArray(trip.fastTag?.amount, tag.amount),
      };
    }

    if (sanitizedBody.tyrePuncture) {
      const tyre = parseJSON(sanitizedBody.tyrePuncture);
      trip.tyrePuncture = {
        ...trip.tyrePuncture,
        ...tyre,
        repairAmount: mergeArray(trip.tyrePuncture?.repairAmount, tyre.repairAmount),
        image: mergeArray(trip.tyrePuncture?.image, extractPaths("punctureImage")),
      };
    }

    if (sanitizedBody.vehicleServicing) {
      const service = parseJSON(sanitizedBody.vehicleServicing);
      const meters = mergeArray(trip.vehicleServicing?.meter, Number(service?.meter)).filter(n => !isNaN(n));
      trip.vehicleServicing = {
        ...trip.vehicleServicing,
        ...service,
        amount: mergeArray(trip.vehicleServicing?.amount, service.amount),
        meter: meters,
        kmTravelled: calculateKm(meters),
        image: mergeArray(trip.vehicleServicing?.image, extractPaths("vehicleServicingImage")),
        receiptImage: mergeArray(trip.vehicleServicing?.receiptImage, extractPaths("vehicleServicingReceiptImage")),
      };
    }

    if (sanitizedBody.otherProblems) {
      const other = parseJSON(sanitizedBody.otherProblems);
      trip.otherProblems = {
        ...trip.otherProblems,
        ...other,
        amount: mergeArray(trip.otherProblems?.amount, other.amount),
        image: mergeArray(trip.otherProblems?.image, extractPaths("otherProblemsImage")),
      };
    }

    assignment.tripDetails = trip;
    await assignment.save();

    res.status(200).json({
      message: "✅ Trip details updated successfully",
      assignment: { _id: assignment._id, tripDetails: assignment.tripDetails }
    });

  } catch (err) {
    console.error("❌ Trip update error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


const getAssignCab = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const assignments = await CabAssignment.find()
      .populate("cab")
      .populate("driver");

    const filteredAssignments = assignments.filter(
      (a) => a.cab && a.assignedBy.toString() === adminId.toString()
    );

    res.status(200).json(filteredAssignments);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Assign a cab to a driver
const assignCab = async (req, res) => {
  try {
    const { driverId, cabNumber, assignedBy } = req.body;

    if (!driverId || !cabNumber || !assignedBy) {
      return res.status(400).json({ message: 'Driver ID, Cab Number, and Assigned By are required' });
    }

    const cab = mongoose.Types.ObjectId.isValid(cabNumber)
      ? await Cab.findById(cabNumber)
      : await Cab.findOne({ cabNumber });

    if (!cab) return res.status(404).json({ message: 'Cab not found' });

    const existingDriverAssignment = await CabAssignment.findOne({
      driver: driverId,
      status: { $ne: "completed" }
    });
    if (existingDriverAssignment)
      return res.status(400).json({ message: 'This driver already has an active cab assigned' });

    const existingCabAssignment = await CabAssignment.findOne({
      cab: cab._id,
      status: { $ne: "completed" }
    });
    if (existingCabAssignment)
      return res.status(400).json({ message: 'This cab is already assigned to another driver' });

    const newAssignment = new CabAssignment({
      driver: driverId,
      cab: cab._id,
      assignedBy,
    //   status: "ongoing"
    });

    await newAssignment.save();
    res.status(201).json({ message: 'Cab assigned successfully', assignment: newAssignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Assign a cab to a driver
const driverAssignCab = async (req, res) => {
  try {
    const {cabNumber,assignedBy } = req.body;
    const driverId = req.driver.id;

    if (!driverId || !cabNumber || !assignedBy) {
      return res.status(400).json({ message: 'Driver ID, Cab Number, and Assigned By are required' });
    }

    const cab = mongoose.Types.ObjectId.isValid(cabNumber)
      ? await Cab.findById(cabNumber)
      : await Cab.findOne({ cabNumber });

    if (!cab) return res.status(404).json({ message: 'Cab not found' });

    const existingDriverAssignment = await CabAssignment.findOne({
      driver: driverId,
      status: { $ne: "completed" }
    });
    if (existingDriverAssignment)
      return res.status(400).json({ message: 'This driver already has an active cab assigned' });

    const existingCabAssignment = await CabAssignment.findOne({
      cab: cab._id,
      status: { $ne: "completed" }
    });
    if (existingCabAssignment)
      return res.status(400).json({ message: 'This cab is already assigned to another driver' });

    const newAssignment = new CabAssignment({
      driver: driverId,
      cab: cab._id,
      assignedBy
    });

    await newAssignment.save();
    res.status(201).json({ message: 'Cab assigned successfully', assignment: newAssignment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Mark a trip as completed (call this from driver or sub-admin when trip ends)
const completeTrip = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const assignment = await CabAssignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.status = "completed";
    await assignment.save();

    res.json({ message: "Trip marked as completed", assignment });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ✅ Unassign cab (only owner or super admin)
const unassignCab = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const adminRole = req.admin.role;

    const cabAssignment = await CabAssignment.findById(req.params.id);
    if (!cabAssignment) return res.status(404).json({ message: "Cab assignment not found" });

    if (cabAssignment.assignedBy.toString() !== adminId && adminRole !== "super-admin") {
      return res.status(403).json({ message: "Unauthorized: You can only unassign cabs assigned by you" });
    }

    await CabAssignment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Cab unassigned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Get all current (not completed) assignments for logged-in driver
const getAssignDriver = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const assignments = await CabAssignment.find({ driver: driverId, status: { $ne: "completed" } })
      .populate("cab")
      .populate("driver");

    if (!assignments.length) {
      return res.status(404).json({ message: "No active cab assignments found for this driver." });
    }

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Edit the logged-in driver's profile
const EditDriverProfile = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const updatedDriver = await Driver.findByIdAndUpdate(driverId, req.body, {
      new: true,
      runValidators: true
    }).select("-password");

    if (!updatedDriver) return res.status(404).json({ message: "Driver not found" });

    res.json({ message: "Profile updated successfully", updatedDriver });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getFreeCabsForDriver,
  freeCabDriver,
  assignCab,
  getAssignCab,
  unassignCab,
  EditDriverProfile,
  getAssignDriver,
  completeTrip,
  assignTripToDriver,
  updateTripDetailsByDriver,
  driverAssignCab
};
