const Fee = require("../models/Fee");

// CREATE
const addFee = async (req, res) => {
    try {
        const fee = await Fee.create(req.body);
        res.status(201).json(fee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ ALL
const getFees = async (req, res) => {
    try {
        const fees = await Fee.find().populate("student");
        res.status(200).json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ ONE
const getFee = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id).populate("student");

        if (!fee) {
            return res.status(404).json({ message: "Fee not found" });
        }

        res.status(200).json(fee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE
const updateFee = async (req, res) => {
    try {
        const fee = await Fee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate("student");

        if (!fee) {
            return res.status(404).json({ message: "Fee not found" });
        }

        res.status(200).json(fee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE
const deleteFee = async (req, res) => {
    try {
        const fee = await Fee.findByIdAndDelete(req.params.id);

        if (!fee) {
            return res.status(404).json({ message: "Fee not found" });
        }

        res.status(200).json({ message: "Fee deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addFee,
    getFees,
    getFee,
    updateFee,
    deleteFee
};