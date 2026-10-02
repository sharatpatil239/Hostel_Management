const Fee = require("../models/Fee");
const mongoose = require("mongoose");

// Helper to look up fee by MongoDB _id or feeId
const findFee = async (identifier) => {
    if (mongoose.isValidObjectId(identifier)) {
        const fee = await Fee.findById(identifier).populate("student");
        if (fee) return fee;
    }
    return await Fee.findOne({ feeId: identifier }).populate("student");
};

// CREATE: POST /api/fees
const addFee = async (req, res) => {
    try {
        const { amount, dueDate } = req.body;
        if (amount === undefined || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Amount and due date are required"
            });
        }

        const fee = await Fee.create(req.body);
        const populatedFee = await Fee.findById(fee._id).populate("student");

        return res.status(201).json({
            success: true,
            data: populatedFee || fee
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create fee record"
        });
    }
};

// READ ALL: GET /api/fees
const getFees = async (req, res) => {
    try {
        const fees = await Fee.find().populate("student").sort({ dueDate: 1 });
        return res.status(200).json({
            success: true,
            data: fees
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch fee records"
        });
    }
};

// READ ONE: GET /api/fees/:id
const getFee = async (req, res) => {
    try {
        const fee = await findFee(req.params.id);

        if (!fee) {
            return res.status(404).json({
                success: false,
                message: "Fee record not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: fee
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch fee record"
        });
    }
};

// UPDATE: PUT /api/fees/:id
const updateFee = async (req, res) => {
    try {
        let fee;
        if (mongoose.isValidObjectId(req.params.id)) {
            fee = await Fee.findByIdAndUpdate(
                req.params.id,
                req.body,
                { returnDocument: 'after', runValidators: true }
            ).populate("student");
        }
        if (!fee) {
            fee = await Fee.findOneAndUpdate(
                { feeId: req.params.id },
                req.body,
                { returnDocument: 'after', runValidators: true }
            ).populate("student");
        }

        if (!fee) {
            return res.status(404).json({
                success: false,
                message: "Fee record not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: fee
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update fee record"
        });
    }
};

// DELETE: DELETE /api/fees/:id
const deleteFee = async (req, res) => {
    try {
        let fee;
        if (mongoose.isValidObjectId(req.params.id)) {
            fee = await Fee.findByIdAndDelete(req.params.id);
        }
        if (!fee) {
            fee = await Fee.findOneAndDelete({ feeId: req.params.id });
        }

        if (!fee) {
            return res.status(404).json({
                success: false,
                message: "Fee record not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Fee record deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete fee record"
        });
    }
};

module.exports = {
    addFee,
    getFees,
    getFee,
    updateFee,
    deleteFee
};