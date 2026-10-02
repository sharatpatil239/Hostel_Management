const express = require("express");
const {
    addStudent,
    getStudents,
    getStudent,
    getStudentCount,
    updateStudent,
    deleteStudent
} = require("../controllers/studentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all student routes with JWT authentication
router.use(protect);

router.get("/count", getStudentCount);
router.post("/", addStudent);
router.get("/", getStudents);
router.get("/:id", getStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;