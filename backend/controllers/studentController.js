const Student = require("../models/Student");
const Room = require("../models/Room");
const mongoose = require("mongoose");

// Helper to look up student by MongoDB _id or studentId
const findStudentByIdOrCustomId = async (identifier) => {
    if (!identifier) return null;
    if (mongoose.isValidObjectId(identifier)) {
        const student = await Student.findById(identifier);
        if (student) return student;
    }
    return await Student.findOne({ studentId: identifier.toUpperCase() });
};

// Normalize payload for backward compatibility and nested fields
const normalizeStudentPayload = (body) => {
    const payload = { ...body };

    // Normalize studentId to uppercase
    if (payload.studentId) {
        payload.studentId = payload.studentId.trim().toUpperCase();
    }

    // Normalize dateOfBirth / dob
    if (payload.dob && !payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dob);
    } else if (payload.dateOfBirth && typeof payload.dateOfBirth === "string") {
        payload.dateOfBirth = new Date(payload.dateOfBirth);
    }

    // Normalize admissionDate
    if (payload.admissionDate && typeof payload.admissionDate === "string") {
        payload.admissionDate = new Date(payload.admissionDate);
    }

    // Normalize guardian object from parentName / parentPhone / relationship
    if (!payload.guardian || typeof payload.guardian !== "object") {
        payload.guardian = {};
    }
    if (payload.parentName && !payload.guardian.name) {
        payload.guardian.name = payload.parentName.trim();
    }
    if (payload.parentPhone && !payload.guardian.phone) {
        payload.guardian.phone = payload.parentPhone.trim();
    }
    if (payload.guardianRelationship && !payload.guardian.relationship) {
        payload.guardian.relationship = payload.guardianRelationship.trim();
    }
    if (!payload.guardian.relationship) {
        payload.guardian.relationship = "Guardian";
    }

    // Normalize email & name
    if (payload.email) payload.email = payload.email.trim().toLowerCase();
    if (payload.name) payload.name = payload.name.trim();
    if (payload.phone) payload.phone = payload.phone.trim();
    if (payload.department) payload.department = payload.department.trim();
    if (payload.course) payload.course = payload.course.trim();
    if (payload.year) payload.year = payload.year.trim();

    return payload;
};

// @desc    Get all students with search, filters, and pagination
// @route   GET /api/students
// @access  Private (JWT)
const getStudents = async (req, res) => {
    try {
        const query = {};

        // 1. Backend Search (studentId, name, email, phone)
        if (req.query.search && req.query.search.trim()) {
            const term = req.query.search.trim();
            const regex = new RegExp(term, "i");
            query.$or = [
                { studentId: regex },
                { name: regex },
                { email: regex },
                { phone: regex },
                { course: regex },
                { department: regex },
                { room: regex }
            ];
        }

        // 2. Filter: Status
        if (req.query.status && req.query.status !== "all") {
            query.status = req.query.status;
        }

        // 3. Filter: Department
        if (req.query.department && req.query.department !== "all") {
            query.department = new RegExp(`^${req.query.department.trim()}$`, "i");
        }

        // 4. Filter: Course
        if (req.query.course && req.query.course !== "all") {
            query.course = new RegExp(`^${req.query.course.trim()}$`, "i");
        }

        // 5. Filter: Year
        if (req.query.year && req.query.year !== "all") {
            query.year = req.query.year.trim();
        }

        // 6. Filter: Gender
        if (req.query.gender && req.query.gender !== "all") {
            query.gender = req.query.gender.trim();
        }

        // 7. Filter: Unassigned to a room
        if (req.query.unassigned === "true") {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { room: { $exists: false } },
                    { room: "" },
                    { room: "—" },
                    { room: null }
                ]
            });
        }

        // Sort configuration
        const sortField = req.query.sort || "createdAt";
        const sortOrder = req.query.order === "asc" ? 1 : -1;
        const sort = { [sortField]: sortOrder };

        // Pagination
        const total = await Student.countDocuments(query);

        // If explicitly requested all records without paging (e.g. for dropdowns)
        if (req.query.all === "true" || req.query.limit === "0") {
            const students = await Student.find(query).sort(sort);
            return res.status(200).json({
                success: true,
                data: students,
                pagination: {
                    page: 1,
                    limit: total,
                    total,
                    pages: 1
                }
            });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const pages = Math.ceil(total / limit) || 1;
        const skip = (page - 1) * limit;

        const students = await Student.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            data: students,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch students from database"
        });
    }
};

// @desc    Get total count and summary of students
// @route   GET /api/students/count
// @access  Private (JWT)
const getStudentCount = async (req, res) => {
    try {
        const [total, active, inactive, checkedOut] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ status: "Active" }),
            Student.countDocuments({ status: "Inactive" }),
            Student.countDocuments({ status: { $in: ["Checked Out", "Alumni"] } })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                total,
                active,
                inactive,
                checkedOut
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch student counts"
        });
    }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private (JWT)
const getStudent = async (req, res) => {
    try {
        const student = await findStudentByIdOrCustomId(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with ID '${req.params.id}' not found`
            });
        }

        return res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch student details"
        });
    }
};

// @desc    Create a new student
// @route   POST /api/students
// @access  Private (JWT)
const addStudent = async (req, res) => {
    try {
        const payload = normalizeStudentPayload(req.body);

        // Required field validation
        if (!payload.studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required."
            });
        }
        if (!payload.name) {
            return res.status(400).json({
                success: false,
                message: "Student full name is required."
            });
        }
        if (!payload.gender) {
            return res.status(400).json({
                success: false,
                message: "Gender is required."
            });
        }
        if (!payload.email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required."
            });
        }
        if (!payload.phone) {
            return res.status(400).json({
                success: false,
                message: "Contact phone number is required."
            });
        }

        // Duplicate checks
        const existingStudentId = await Student.findOne({ studentId: payload.studentId });
        if (existingStudentId) {
            return res.status(400).json({
                success: false,
                message: `A student with ID '${payload.studentId}' already exists.`
            });
        }

        const existingEmail = await Student.findOne({ email: payload.email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: `A student with email '${payload.email}' already exists.`
            });
        }

        const student = await Student.create(payload);

        return res.status(201).json({
            success: true,
            message: "Student added successfully",
            data: student
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const firstError = Object.values(error.errors)[0]?.message || "Validation error";
            return res.status(400).json({
                success: false,
                message: firstError
            });
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0] || "field";
            return res.status(400).json({
                success: false,
                message: `A student with this ${field} already exists.`
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create student record"
        });
    }
};

// @desc    Update an existing student
// @route   PUT /api/students/:id
// @access  Private (JWT)
const updateStudent = async (req, res) => {
    try {
        const student = await findStudentByIdOrCustomId(req.params.id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with ID '${req.params.id}' not found`
            });
        }

        const payload = normalizeStudentPayload(req.body);

        // Check for duplicate studentId if changing
        if (payload.studentId && payload.studentId !== student.studentId) {
            const conflict = await Student.findOne({
                studentId: payload.studentId,
                _id: { $ne: student._id }
            });
            if (conflict) {
                return res.status(400).json({
                    success: false,
                    message: `Student ID '${payload.studentId}' is already used by another student.`
                });
            }
        }

        // Check for duplicate email if changing
        if (payload.email && payload.email !== student.email) {
            const conflict = await Student.findOne({
                email: payload.email,
                _id: { $ne: student._id }
            });
            if (conflict) {
                return res.status(400).json({
                    success: false,
                    message: `Email '${payload.email}' is already registered to another student.`
                });
            }
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            student._id,
            payload,
            { returnDocument: "after", runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Student record updated successfully",
            data: updatedStudent
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const firstError = Object.values(error.errors)[0]?.message || "Validation error";
            return res.status(400).json({
                success: false,
                message: firstError
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update student"
        });
    }
};

// @desc    Delete or safe-deactivate student
// @route   DELETE /api/students/:id
// @access  Private (JWT)
const deleteStudent = async (req, res) => {
    try {
        const student = await findStudentByIdOrCustomId(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Student with ID '${req.params.id}' not found`
            });
        }

        // Permanent deletion requested via ?permanent=true or body
        const isPermanent = req.query.permanent === "true" || (req.body && req.body.permanent === true);

        if (isPermanent) {
            // If student had a room assigned, adjust room occupancy count
            if (student.room && student.room !== "—") {
                const room = await Room.findOne({ roomNumber: student.room });
                if (room && room.occupied > 0) {
                    const newOccupied = Math.max(0, room.occupied - 1);
                    const newStatus = newOccupied === 0 ? "Available" : newOccupied < room.capacity ? "Partially Occupied" : "Full";
                    await Room.updateOne({ _id: room._id }, { $set: { occupied: newOccupied, status: newStatus } });
                }
            }

            await Student.findByIdAndDelete(student._id);

            return res.status(200).json({
                success: true,
                message: `Student ${student.name} (${student.studentId}) was permanently removed.`
            });
        }

        // Default: Safe Deactivation / Check-Out
        const newStatus = (req.body && req.body.status) || "Checked Out";
        const oldRoom = student.room;

        // If allocated to a room, unassign room and update room occupancy
        if (oldRoom && oldRoom !== "—") {
            const room = await Room.findOne({ roomNumber: oldRoom });
            if (room && room.occupied > 0) {
                const newOccupied = Math.max(0, room.occupied - 1);
                const roomStatus = newOccupied === 0 ? "Available" : newOccupied < room.capacity ? "Partially Occupied" : "Full";
                await Room.updateOne({ _id: room._id }, { $set: { occupied: newOccupied, status: roomStatus } });
            }
        }

        student.status = newStatus;
        student.room = "—";
        await student.save();

        return res.status(200).json({
            success: true,
            message: `Student ${student.name} (${student.studentId}) status updated to '${newStatus}'.`,
            data: student
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process student deletion"
        });
    }
};

module.exports = {
    getStudents,
    getStudentCount,
    getStudent,
    addStudent,
    updateStudent,
    deleteStudent
};