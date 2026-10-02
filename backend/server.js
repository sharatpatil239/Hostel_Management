const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const { protect } = require("./middleware/authMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Default welcome route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Hostel Management System API"
    });
});

// Authentication Routes (POST /api/auth/register, POST /api/auth/login, GET /api/auth/me)
app.use("/api/auth", require("./routes/authRoutes"));

// Management API Routes (All protected by JWT authMiddleware)
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/fees", require("./routes/feeRoutes"));

// Protected Dashboard API (GET /api/dashboard)
app.get("/api/dashboard", protect, async (req, res, next) => {
    try {
        const Student = require("./models/Student");
        const Room = require("./models/Room");
        const Fee = require("./models/Fee");

        const [students, rooms, fees] = await Promise.all([
            Student.find(),
            Room.find(),
            Fee.find()
        ]);

        const totalStudents = students.length;
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(
            r => r.status === "Full" || (r.capacity && r.occupied >= r.capacity)
        ).length;
        const availableRooms = rooms.filter(
            r => r.status === "Available" || r.occupied === 0
        ).length;

        const pendingFees = fees
            .filter(f => f.status === "Pending")
            .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const pendingCount = fees.filter(f => f.status === "Pending").length;

        // Floor-wise Occupancy
        const floorMap = {};
        rooms.forEach(r => {
            const floor = r.floor || "Ground Floor";
            if (!floorMap[floor]) {
                floorMap[floor] = { floor, occupied: 0, total: 0 };
            }
            floorMap[floor].occupied += Number(r.occupied) || 0;
            floorMap[floor].total += Number(r.capacity) || 0;
        });

        const floorOccupancy = Object.values(floorMap);

        return res.status(200).json({
            success: true,
            data: {
                summary: [
                    { label: "Total Students", value: totalStudents, foot: "Registered residents", tint: "var(--brass-tint)" },
                    { label: "Total Rooms", value: totalRooms, foot: `Across ${floorOccupancy.length || 1} floor${floorOccupancy.length !== 1 ? 's' : ''}`, tint: "var(--teal-tint)" },
                    { label: "Occupied Rooms", value: occupiedRooms, foot: `${totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0}% occupancy`, tint: "var(--amber-tint)" },
                    { label: "Available Rooms", value: availableRooms, foot: "Ready for allocation", tint: "var(--teal-tint)" },
                    { label: "Pending Fees", value: `₹${pendingFees.toLocaleString("en-IN")}`, foot: `${pendingCount} student${pendingCount !== 1 ? 's' : ''} pending`, tint: "var(--rust-tint)" }
                ],
                floorOccupancy: floorOccupancy.length ? floorOccupancy : [
                    { floor: "Ground Floor", occupied: 0, total: 0 }
                ]
            }
        });
    } catch (error) {
        next(error);
    }
});

// Central error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || process.env.port || 5000;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
