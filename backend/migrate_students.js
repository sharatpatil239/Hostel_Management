const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const migrateStudents = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI not set");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for student migration check");

        const collection = mongoose.connection.collection("students");
        const students = await collection.find().toArray();
        console.log(`Found ${students.length} existing student documents`);

        let migratedCount = 0;
        for (const s of students) {
            const updates = {};

            // 1. Ensure studentId exists
            if (!s.studentId) {
                const hex = s._id.toString().slice(-4).toUpperCase();
                updates.studentId = `STU-${hex}`;
            }

            // 2. Ensure gender exists
            if (!s.gender) {
                updates.gender = "Other";
            }

            // 3. Ensure dateOfBirth / dob
            if (!s.dateOfBirth) {
                if (s.dob) {
                    updates.dateOfBirth = new Date(s.dob);
                } else {
                    updates.dateOfBirth = new Date("2004-01-01");
                }
            }

            // 4. Ensure department exists
            if (!s.department) {
                if (s.course && s.course.includes("CSE")) {
                    updates.department = "Computer Science & Engineering";
                } else if (s.course && s.course.includes("Physics")) {
                    updates.department = "Physics";
                } else if (s.course && s.course.includes("Mech")) {
                    updates.department = "Mechanical Engineering";
                } else if (s.course && s.course.includes("ECE")) {
                    updates.department = "Electronics & Communication";
                } else if (s.course && s.course.includes("Com")) {
                    updates.department = "Commerce";
                } else {
                    updates.department = "General";
                }
            }

            // 5. Ensure course exists
            if (!s.course) {
                updates.course = "General Studies";
            }

            // 6. Ensure year exists
            if (!s.year) {
                updates.year = "1st Year";
            }

            // 7. Ensure guardian object exists
            if (!s.guardian || !s.guardian.name) {
                updates.guardian = {
                    name: s.parentName || "Guardian",
                    relationship: "Guardian",
                    phone: s.parentPhone || s.phone || "9800000000"
                };
            }

            // 8. Ensure admissionDate exists
            if (!s.admissionDate) {
                updates.admissionDate = s.createdAt || new Date("2025-08-01");
            }

            // 9. Ensure status exists and is standard
            if (!s.status) {
                updates.status = "Active";
            } else if (s.status === "Alumni") {
                // Keep Alumni or map to Checked Out as appropriate
                updates.status = "Checked Out";
            }

            // 10. Ensure room exists
            if (!s.room) {
                updates.room = "—";
            }

            if (Object.keys(updates).length > 0) {
                await collection.updateOne({ _id: s._id }, { $set: updates });
                migratedCount++;
            }
        }

        console.log(`✅ Successfully checked and migrated ${migratedCount} student records`);
        if (require.main === module) {
            await mongoose.connection.close();
        }
        return true;
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
};

if (require.main === module) {
    migrateStudents().then(() => process.exit(0));
}

module.exports = migrateStudents;
