const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: String,
        required: true,
        unique: true
    },

    floor: {
        type: String,
        default: "Ground Floor"
    },

    type: {
        type: String,
        default: "Double Sharing"
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
        enum: ["Available", "Partially Occupied", "Full", "Under Maintenance"],
        default: "Available"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Room", roomSchema);