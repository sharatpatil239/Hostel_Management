const express = require("express");

const {
    addFee,
    getFees,
    getFee,
    updateFee,
    deleteFee
} = require("../controllers/feeController");

const router = express.Router();

router.post("/", addFee);
router.get("/", getFees);
router.get("/:id", getFee);
router.put("/:id", updateFee);
router.delete("/:id", deleteFee);

module.exports = router;