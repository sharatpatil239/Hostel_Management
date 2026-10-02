const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: [true, "Student ID is required"],
        unique: true,
        trim: true,
        uppercase: true
    },

    name: {
        type: String,
        required: [true, "Student full name is required"],
        trim: true
    },

    gender: {
        type: String,
        required: [true, "Gender is required"],
        enum: {
            values: ["Male", "Female", "Other"],
            message: "Gender must be Male, Female, or Other"
        }
    },

    dateOfBirth: {
        type: Date
    },

    email: {
        type: String,
        required: [true, "Email address is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please provide a valid email address"
        ]
    },

    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        match: [
            /^\+?[0-9\s\-()]{7,15}$/,
            "Please provide a valid contact phone number"
        ]
    },

    course: {
        type: String,
        trim: true,
        default: "General"
    },

    department: {
        type: String,
        trim: true,
        default: "General"
    },

    year: {
        type: String,
        trim: true,
        default: "1st Year"
    },

    address: {
        type: String,
        trim: true
    },

    guardian: {
        name: {
            type: String,
            trim: true
        },
        relationship: {
            type: String,
            trim: true,
            default: "Guardian"
        },
        phone: {
            type: String,
            trim: true
        }
    },

    admissionDate: {
        type: Date,
        default: Date.now
    },

    status: {
        type: String,
        enum: {
            values: ["Active", "Inactive", "Checked Out", "Alumni"],
            message: "Status must be Active, Inactive, or Checked Out"
        },
        default: "Active"
    },

    // Retained for room-allocation and fee compatibility
    room: {
        type: String,
        default: "—"
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Backward compatibility virtuals for earlier frontend builds
studentSchema.virtual("dob").get(function() {
    return this.dateOfBirth ? this.dateOfBirth.toISOString().split("T")[0] : "";
});

studentSchema.virtual("parentName").get(function() {
    return this.guardian ? this.guardian.name : "";
});

studentSchema.virtual("parentPhone").get(function() {
    return this.guardian ? this.guardian.phone : "";
});

// Normalization hook to translate legacy / alternative field names
studentSchema.pre("validate", function() {
    if (this.dob && !this.dateOfBirth) {
        this.dateOfBirth = new Date(this.dob);
    }
    if (!this.guardian) {
        this.guardian = {};
    }
    if (this.parentName && !this.guardian.name) {
        this.guardian.name = this.parentName;
    }
    if (this.parentPhone && !this.guardian.phone) {
        this.guardian.phone = this.parentPhone;
    }
});

module.exports = mongoose.model("Student", studentSchema);