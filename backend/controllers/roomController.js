const Room = require("../models/Room");
const mongoose = require("mongoose");

// Helper to look up room by MongoDB _id or roomNumber
const findRoom = async (identifier) => {
    if (mongoose.isValidObjectId(identifier)) {
        const room = await Room.findById(identifier);
        if (room) return room;
    }
    return await Room.findOne({ roomNumber: String(identifier) });
};

// CREATE: POST /api/rooms
const addRoom = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.roomNumber && payload.number) {
            payload.roomNumber = String(payload.number);
        }

        if (!payload.roomNumber || payload.capacity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Room number and capacity are required"
            });
        }

        const existingRoom = await Room.findOne({ roomNumber: payload.roomNumber });
        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: "A room with this room number already exists"
            });
        }

        const room = await Room.create(payload);
        return res.status(201).json({
            success: true,
            data: room
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create room"
        });
    }
};

// READ ALL: GET /api/rooms
const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ roomNumber: 1 });
        return res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch rooms"
        });
    }
};

// READ ONE: GET /api/rooms/:id
const getRoom = async (req, res) => {
    try {
        const room = await findRoom(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: room
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch room"
        });
    }
};

// UPDATE: PUT /api/rooms/:id
const updateRoom = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (!payload.roomNumber && payload.number) {
            payload.roomNumber = String(payload.number);
        }

        let room;
        if (mongoose.isValidObjectId(req.params.id)) {
            room = await Room.findByIdAndUpdate(
                req.params.id,
                payload,
                { returnDocument: 'after', runValidators: true }
            );
        }
        if (!room) {
            room = await Room.findOneAndUpdate(
                { roomNumber: String(req.params.id) },
                payload,
                { returnDocument: 'after', runValidators: true }
            );
        }

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: room
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to update room"
        });
    }
};

// DELETE: DELETE /api/rooms/:id
const deleteRoom = async (req, res) => {
    try {
        let room;
        if (mongoose.isValidObjectId(req.params.id)) {
            room = await Room.findByIdAndDelete(req.params.id);
        }
        if (!room) {
            room = await Room.findOneAndDelete({ roomNumber: String(req.params.id) });
        }

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Room deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete room"
        });
    }
};

module.exports = {
    addRoom,
    getRooms,
    getRoom,
    updateRoom,
    deleteRoom
};