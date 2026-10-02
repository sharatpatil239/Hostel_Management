const express = require("express");
const {
    addFee,
    getFees,
    getFee,
    updateFee,
    deleteFee
} = require("../controllers/feeController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all fee routes with JWT authentication
router.use(protect);

router.post("/", addFee);
router.get("/", getFees);
router.get("/:id", getFee);
router.put("/:id", updateFee);
router.delete("/:id", deleteFee);

module.exports = router;