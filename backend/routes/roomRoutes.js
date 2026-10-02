const express = require("express");
const {
    addRoom,
    getRooms,
    getRoom,
    updateRoom,
    deleteRoom
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all room routes with JWT authentication
router.use(protect);

router.post("/", addRoom);
router.get("/", getRooms);
router.get("/:id", getRoom);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

module.exports = router;