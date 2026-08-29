const express = require("express");

const {
    addRoom,
    getRooms,
    getRoom,
    updateRoom,
    deleteRoom
} = require("../controllers/roomController");

const router = express.Router();

router.post("/", addRoom);
router.get("/", getRooms);
router.get("/:id", getRoom);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

module.exports = router;