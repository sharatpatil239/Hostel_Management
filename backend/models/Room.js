const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true
    },

    capacity: {
        type: Number,
        required: true
    },

    occupied: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["Available", "Full"],
        default: "Available"
    }
});

module.exports = mongoose.model("Room", roomSchema);