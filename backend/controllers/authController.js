const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper to generate JWT from environment secret
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured in environment variables");
    }
    return jwt.sign({ id }, secret, { expiresIn: "1d" });
};

// @desc    Register a new admin
// @route   POST /api/auth/register
// @access  Public
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields: name, email, and password"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingAdmin = await Admin.findOne({ email: normalizedEmail });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "An administrator with this email already exists"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Admin.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const token = generateToken(admin._id);

        return res.status(201).json({
            success: true,
            message: "Admin registered successfully",
            token,
            data: {
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to register administrator"
        });
    }
};

// @desc    Authenticate admin & return token
// @route   POST /api/auth/login
// @access  Public
const loginAdmin = async (req, res) => {
    try {
        const identifier = req.body.email || req.body.username;
        const { password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email or username, and password"
            });
        }

        const trimmedIdentifier = identifier.trim();
        // Support login by email or username (name)
        const admin = await Admin.findOne({
            $or: [
                { email: trimmedIdentifier.toLowerCase() },
                { name: trimmedIdentifier }
            ]
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/username or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, admin.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email/username or password"
            });
        }

        const token = generateToken(admin._id);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: {
                token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Login failed"
        });
    }
};

// @desc    Get current authenticated admin profile
// @route   GET /api/auth/me
// @access  Private (Requires JWT)
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve user profile"
        });
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    getMe
};