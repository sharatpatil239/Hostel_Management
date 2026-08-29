const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect Database


// Middlewares
app.use(cors());
app.use(express.json());


// Routes
// app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/fees", require("./routes/feeRoutes"));

// Default Route

const PORT = process.env.PORT || 5000;
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
    app.get("/", (req, res) => {
    res.send("Welcome to Hostel Management System Backend!");
});
};

startServer();
