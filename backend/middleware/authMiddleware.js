const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            if (!process.env.JWT_SECRET) {
                return res.status(500).json({
                    success: false,
                    message: "Server configuration error: JWT_SECRET is not configured"
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await Admin.findById(decoded.id).select("-password");

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found or no longer authorized"
                });
            }

            req.user = user;
            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token is invalid or expired"
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, authorization token is missing"
        });
    }
};

module.exports = { protect };
