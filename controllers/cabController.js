const Cab = require("../models/CabsDetails");
const path = require("path");
const Driver = require("../models/loginModel")
const mongoose = require("mongoose");


const getCabs = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const {cabNumber} = req.body;

    // Corrected populate fields
    const cabs = await Cab.find({ cabNumber: cabNumber })

    res.status(200).json(cabs);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



const getCabById = async (req, res) => {
  try {
    const { cabNumber } = req.params;
    const adminId = req.admin.id; // Extract admin ID from token (set by middleware)

    // Find cab assigned to the requesting admin
    const cab = await Cab.findOne({ cabNumber, addedBy: adminId }).populate("Driver").populate('cabNumber');;

    if (!cab) {
      return res.status(404).json({ message: "Cab not found or unauthorized access" });
    }

    res.status(200).json(cab);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cab details", error: error.message });
  }
};



const addCab = async (req, res) => {
  try {

    const {
      cabNumber,
      location,
      totalDistance,
      dateTime,
      fuel,
      fastTag,
      tyrePuncture,
      vehicleServicing,
      otherProblems,
      Driver,
      addedBy,
    } = req.body;

    if (!cabNumber) {
      return res.status(400).json({ message: "Cab number is required" });
    }

    // Parse JSON strings safely
    const safeParse = (data) => {
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (err) {
        throw new Error(`Invalid JSON format in field`);
      }
    };

    const parsedLocation = safeParse(location);
    const parsedFuel = safeParse(fuel);
    const parsedFastTag = safeParse(fastTag);
    const parsedTyrePuncture = safeParse(tyrePuncture);
    const parsedVehicleServicing = safeParse(vehicleServicing);
    const parsedOtherProblems = safeParse(otherProblems);

    // Uploaded files mapping
    const uploadedImages = {
      fuel: {
        receiptImage: req.files?.receiptImage?.[0]?.path || null,
        transactionImage: req.files?.transactionImage?.[0]?.path || null,
      },
      tyrePuncture: {
        image: req.files?.punctureImage?.[0]?.path || null,
      },
      otherProblems: {
        image: req.files?.otherProblemsImage?.[0]?.path || null,
      },
      vehicleServicing: {
        image: req.files?.vehicleServicingImage?.[0]?.path || null, // ✅ Add this line
      },
    };

    // Check if cab already exists
    let existingCab = await Cab.findOne({ cabNumber });

    if (!existingCab) {
      // Create new cab entry
      const newCab = new Cab({
        cabNumber,
        location: {
          from: parsedLocation?.from,
          to: parsedLocation?.to,
          totalDistance,
          dateTime,
        },
        fuel: {
          type: parsedFuel?.type,
          amount: parsedFuel?.amount,
          receiptImage: uploadedImages.fuel.receiptImage,
          transactionImage: uploadedImages.fuel.transactionImage,
        },
        fastTag: {
          paymentMode: parsedFastTag?.paymentMode,
          amount: parsedFastTag?.amount,
          cardDetails: parsedFastTag?.cardDetails,
        },
        tyrePuncture: {
          image: uploadedImages.tyrePuncture.image,
          repairAmount: parsedTyrePuncture?.repairAmount,
        },
        vehicleServicing: {
          requiredService: parsedVehicleServicing?.requiredService,
          details: parsedVehicleServicing?.details,
          image: uploadedImages.vehicleServicing.image, // ✅ Include this
        },
        // vehicleServicing: {
        //   ...existingCab.vehicleServicing,
        //   ...parsedVehicleServicing,
        //   image: uploadedImages.vehicleServicing.image || existingCab.vehicleServicing?.image, // ✅ Add this
        // },
        
        otherProblems: {
          image: uploadedImages.otherProblems.image,
          details: parsedOtherProblems?.details,
          amount: parsedOtherProblems?.amount,
        },
        Driver,
        addedBy,
      });

      await newCab.save();
      return res.status(201).json({ message: "Cab added successfully", cab: newCab });
    }

    // Merge new values into existing cab
    const updatedData = {
      location: {
        ...existingCab.location,
        ...parsedLocation,
        totalDistance,
        dateTime,
      },
      fuel: {
        ...existingCab.fuel,
        ...parsedFuel,
        receiptImage: uploadedImages.fuel.receiptImage || existingCab.fuel?.receiptImage,
        transactionImage: uploadedImages.fuel.transactionImage || existingCab.fuel?.transactionImage,
      },
      fastTag: {
        ...existingCab.fastTag,
        ...parsedFastTag,
      },
      tyrePuncture: {
        ...existingCab.tyrePuncture,
        ...parsedTyrePuncture,
        image: uploadedImages.tyrePuncture.image || existingCab.tyrePuncture?.image,
      },
      vehicleServicing: {
        ...existingCab.vehicleServicing,
        ...parsedVehicleServicing,
      },
      otherProblems: {
        ...existingCab.otherProblems,
        ...parsedOtherProblems,
        image: uploadedImages.otherProblems.image || existingCab.otherProblems?.image,
      },
      Driver,
      addedBy,
    };

    const updatedCab = await Cab.findOneAndUpdate(
      { cabNumber },
      { $set: updatedData },
      { new: true, upsert: true, runValidators: false }
    );

    res.status(201).json({ message: "Cab updated successfully", cab: updatedCab });

  } catch (error) {
    res.status(500).json({ message: "Error adding cab", error: error.message });
  }
};






const updateCab = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id; // Assuming req.user is set via authentication middleware

  // ✅ Check if the cab exists
  const existingCab = await Cab.findById(id);
  if (!existingCab) {
    res.status(404);
    throw new Error("Cab not found");
  }

  // ✅ Ensure only the owner admin can update
  if (existingCab.addedBy.toString() !== adminId) {
    res.status(403);
    throw new Error("Unauthorized: You are not allowed to update this cab");
  }

  const updatedFields = { ...req.body };

  // ✅ Handle image uploads safely
  if (req.files) {
    if (req.files.receiptImage) {
      updatedFields.fuel = updatedFields.fuel || {};
      updatedFields.fuel.receiptImage = req.files.receiptImage[0].path;
    }
    if (req.files.transactionImage) {
      updatedFields.fuel = updatedFields.fuel || {};
      updatedFields.fuel.transactionImage = req.files.transactionImage[0].path;
    }
    if (req.files.punctureImage) {
      updatedFields.tyrePuncture = updatedFields.tyrePuncture || {};
      updatedFields.tyrePuncture.image = req.files.punctureImage[0].path;
    }
  }

  // ✅ Update cab details
  const updatedCab = await Cab.findByIdAndUpdate(id, updatedFields, { new: true });

  if (!updatedCab) {
    res.status(500);
    throw new Error("Failed to update cab");
  }

  res.status(200).json({ message: "Cab updated successfully", cab: updatedCab });
};


const deleteCab = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id; // Assuming req.user is set via authentication middleware

  // ✅ Check if the cab exists
  const cab = await Cab.findById(id);
  if (!cab) {
    res.status(404);
    throw new Error("Cab not found");
  }

  // ✅ Ensure only the owner admin can delete
  if (cab.addedBy.toString() !== adminId) {
    res.status(403);
    throw new Error("Unauthorized: You are not allowed to delete this cab");
  }

  // ✅ Delete the cab
  await cab.deleteOne();

  res.status(200).json({ message: "Cab deleted successfully", deletedCab: cab });
};



const cabList = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.admin.id); // Ensure ObjectId

    // Fetch cabs only added by this admin
    const cabs = await Cab.aggregate([
      {
        $match: { addedBy: adminId } // Ensure the logged-in admin only sees their own cabs
      },
      {
        $group: {
          _id: "$cabNumber", // Group by cab number
          totalDistance: {
            $sum: {
              $toDouble: {
                $ifNull: ["$location.totalDistance", "0"] // Handle missing values
              }
            }
          }
        }
      },
      {
        $match: { totalDistance: { $gt: 10000 } } // Filter AFTER summing
      },
      {
        $project: {
          _id: 0, // Remove _id
          cabNumber: "$_id", // Rename _id to cabNumber
          totalDistance: 1 // Keep totalDistance
        }
      },
      { $sort: { totalDistance: -1 } } // Sort by totalDistance in descending order
    ]);

    res.status(200).json({ success: true, data: cabs });
  } catch (error) {
     res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const cabExpensive = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { fromDate, toDate } = req.query;
 
    // Build dynamic query
    const query = { addedBy: adminId };

    // Add date filter if both dates are provided
    if (fromDate && toDate) {
      query.cabDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    // Fetch filtered cabs
    const cabs = await Cab.find(query);
 
    if (cabs.length === 0) {
      return res.status(404).json({ success: false, message: "No cabs found for the given criteria." });
    }

 
    // Calculate expenses per cab
    const expenses = cabs.map((cab) => {
      // Sum the amounts in each category (handle arrays properly)
      const totalExpense =
        (cab.fuel?.amount?.reduce((a, b) => a + b, 0) || 0) +
        (cab.fastTag?.amount?.reduce((a, b) => a + b, 0) || 0) +
        (cab.tyrePuncture?.repairAmount?.reduce((a, b) => a + (b || 0), 0) || 0) +
        (cab.otherProblems?.amount?.reduce((a, b) => a + b, 0) || 0);

      return {
        cabNumber: cab.cabNumber,
        cabDate: cab.cabDate,
        totalExpense,
        breakdown: {
          fuel: cab.fuel?.amount?.reduce((a, b) => a + b, 0) || 0,
          fastTag: cab.fastTag?.amount?.reduce((a, b) => a + b, 0) || 0,
          tyrePuncture: cab.tyrePuncture?.repairAmount?.reduce((a, b) => a + (b || 0), 0) || 0,
          otherProblems: cab.otherProblems?.amount?.reduce((a, b) => a + b, 0) || 0,
        },
      };
    });

    // Sort by highest total expense
    expenses.sort((a, b) => b.totalExpense - a.totalExpense);

 
    if (expenses.length === 0) {
      return res.status(404).json({ success: false, message: "No expenses found after calculation!" });
    }

    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
     res.status(500).json({ message: "Server Error", error: error.message });
  }
};
 
module.exports = { getCabs, getCabById, addCab, updateCab, deleteCab, cabList, cabExpensive };
