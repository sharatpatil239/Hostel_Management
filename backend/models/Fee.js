const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
    feeId: {
        type: String
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },

    studentName: {
        type: String
    },

    studentId: {
        type: String
    },

    room: {
        type: String
    },

    amount: {
        type: Number,
        required: true
    },

    dueDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["Paid", "Pending"],
        default: "Pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Fee", feeSchema);
