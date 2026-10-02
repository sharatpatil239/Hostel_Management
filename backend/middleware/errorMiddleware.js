const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
};

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    
    // Friendly sanitization for sensitive or internal errors
    let message = err.message || "An unexpected server error occurred";
    if (err.name === "CastError") {
        message = "Invalid resource ID format";
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = {
    notFound,
    errorHandler
};
