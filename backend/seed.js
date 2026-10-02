const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");
const Student = require("./models/Student");
const Room = require("./models/Room");
const Fee = require("./models/Fee");
const migrateStudents = require("./migrate_students");

dotenv.config();

const seedDatabase = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is not defined in .env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB for seeding");

        // 1. Run student migration on existing documents
        await migrateStudents();

        // 2. Seed Default Admin User
        const adminEmail = "admin@hostel.com";
        const adminPassword = "password123";
        let admin = await Admin.findOne({ email: adminEmail });

        if (!admin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            admin = await Admin.create({
                name: "Admin User",
                email: adminEmail,
                password: hashedPassword
            });
            console.log(`✅ Default admin created:`);
            console.log(`   Email:    ${adminEmail}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            console.log(`ℹ️ Admin (${adminEmail}) already exists.`);
        }

        // 3. Seed Sample Rooms (if empty)
        const roomCount = await Room.countDocuments();
        if (roomCount === 0) {
            const sampleRooms = [
                { roomNumber: "101", floor: "Ground Floor", capacity: 2, occupied: 2, type: "Double Sharing", status: "Full" },
                { roomNumber: "102", floor: "Ground Floor", capacity: 3, occupied: 1, type: "Triple Sharing", status: "Partially Occupied" },
                { roomNumber: "103", floor: "Ground Floor", capacity: 1, occupied: 0, type: "Single Sharing", status: "Available" },
                { roomNumber: "118", floor: "Ground Floor", capacity: 3, occupied: 3, type: "Triple Sharing", status: "Full" },
                { roomNumber: "204", floor: "1st Floor", capacity: 3, occupied: 3, type: "Triple Sharing", status: "Full" },
                { roomNumber: "206", floor: "1st Floor", capacity: 2, occupied: 1, type: "Double Sharing", status: "Partially Occupied" },
                { roomNumber: "210", floor: "1st Floor", capacity: 2, occupied: 0, type: "Double Sharing", status: "Available" },
                { roomNumber: "215", floor: "1st Floor", capacity: 4, occupied: 2, type: "Dormitory", status: "Partially Occupied" },
                { roomNumber: "305", floor: "2nd Floor", capacity: 2, occupied: 0, type: "Double Sharing", status: "Available" },
                { roomNumber: "308", floor: "2nd Floor", capacity: 1, occupied: 1, type: "Single Sharing", status: "Full" },
                { roomNumber: "311", floor: "2nd Floor", capacity: 3, occupied: 2, type: "Triple Sharing", status: "Partially Occupied" },
                { roomNumber: "402", floor: "3rd Floor", capacity: 4, occupied: 0, type: "Dormitory", status: "Available" },
                { roomNumber: "407", floor: "3rd Floor", capacity: 2, occupied: 2, type: "Double Sharing", status: "Full" },
                { roomNumber: "410", floor: "3rd Floor", capacity: 3, occupied: 0, type: "Triple Sharing", status: "Under Maintenance" }
            ];
            await Room.insertMany(sampleRooms);
            console.log(`✅ Seeded ${sampleRooms.length} rooms`);
        } else {
            console.log(`ℹ️ Rooms collection already has ${roomCount} records`);
        }

        // 4. Seed Sample Students (if fewer than 5)
        const studentCount = await Student.countDocuments();
        if (studentCount < 5) {
            const sampleStudents = [
                {
                    studentId: "STU-1001",
                    name: "Ananya Rao",
                    gender: "Female",
                    dateOfBirth: new Date("2004-03-12"),
                    phone: "9845012345",
                    email: "ananya.rao@example.com",
                    course: "B.Tech",
                    department: "Computer Science & Engineering",
                    year: "2nd Year",
                    address: "14 Lake View Rd, Bengaluru",
                    guardian: { name: "Suresh Rao", relationship: "Father", phone: "9845098765" },
                    admissionDate: new Date("2024-08-01"),
                    room: "204",
                    status: "Active"
                },
                {
                    studentId: "STU-1002",
                    name: "Vikram Iyer",
                    gender: "Male",
                    dateOfBirth: new Date("2003-11-02"),
                    phone: "9900112233",
                    email: "vikram.iyer@example.com",
                    course: "B.Sc",
                    department: "Physics",
                    year: "3rd Year",
                    address: "22 MG Road, Chennai",
                    guardian: { name: "Ramesh Iyer", relationship: "Father", phone: "9900198765" },
                    admissionDate: new Date("2023-08-01"),
                    room: "118",
                    status: "Active"
                },
                {
                    studentId: "STU-1003",
                    name: "Farhan Sheikh",
                    gender: "Male",
                    dateOfBirth: new Date("2004-07-19"),
                    phone: "9811223344",
                    email: "farhan.sheikh@example.com",
                    course: "B.Com",
                    department: "Commerce",
                    year: "1st Year",
                    address: "9 Park Street, Hyderabad",
                    guardian: { name: "Aslam Sheikh", relationship: "Father", phone: "9811298765" },
                    admissionDate: new Date("2025-08-01"),
                    room: "—",
                    status: "Active"
                },
                {
                    studentId: "STU-1004",
                    name: "Priya Nair",
                    gender: "Female",
                    dateOfBirth: new Date("2002-01-25"),
                    phone: "9822334455",
                    email: "priya.nair@example.com",
                    course: "M.Tech",
                    department: "Electronics & Communication",
                    year: "2nd Year",
                    address: "5 Marine Drive, Kochi",
                    guardian: { name: "Mohan Nair", relationship: "Father", phone: "9822398765" },
                    admissionDate: new Date("2024-08-01"),
                    room: "311",
                    status: "Active"
                },
                {
                    studentId: "STU-1005",
                    name: "Rohan Deshmukh",
                    gender: "Male",
                    dateOfBirth: new Date("2003-09-08"),
                    phone: "9833445566",
                    email: "rohan.d@example.com",
                    course: "B.Tech",
                    department: "Mechanical Engineering",
                    year: "3rd Year",
                    address: "18 FC Road, Pune",
                    guardian: { name: "Anil Deshmukh", relationship: "Father", phone: "9833498765" },
                    admissionDate: new Date("2023-08-01"),
                    room: "204",
                    status: "Inactive"
                },
                {
                    studentId: "STU-1006",
                    name: "Sneha Kulkarni",
                    gender: "Female",
                    dateOfBirth: new Date("2004-05-30"),
                    phone: "9844556677",
                    email: "sneha.k@example.com",
                    course: "B.Sc",
                    department: "Physics",
                    year: "1st Year",
                    address: "31 Camp Area, Nagpur",
                    guardian: { name: "Vijay Kulkarni", relationship: "Father", phone: "9844598765" },
                    admissionDate: new Date("2025-08-01"),
                    room: "311",
                    status: "Active"
                },
                {
                    studentId: "STU-1007",
                    name: "Aditya Verma",
                    gender: "Male",
                    dateOfBirth: new Date("2002-12-14"),
                    phone: "9855667788",
                    email: "aditya.verma@example.com",
                    course: "B.Tech",
                    department: "Computer Science & Engineering",
                    year: "4th Year",
                    address: "7 Civil Lines, Lucknow",
                    guardian: { name: "Sanjay Verma", relationship: "Father", phone: "9855698765" },
                    admissionDate: new Date("2022-08-01"),
                    room: "118",
                    status: "Checked Out"
                },
                {
                    studentId: "STU-1008",
                    name: "Meera Pillai",
                    gender: "Female",
                    dateOfBirth: new Date("2004-02-17"),
                    phone: "9866778899",
                    email: "meera.pillai@example.com",
                    course: "B.Com",
                    department: "Commerce",
                    year: "2nd Year",
                    address: "12 Beach Road, Kozhikode",
                    guardian: { name: "Ravi Pillai", relationship: "Father", phone: "9866798765" },
                    admissionDate: new Date("2024-08-01"),
                    room: "—",
                    status: "Active"
                },
                {
                    studentId: "STU-1009",
                    name: "Karan Malhotra",
                    gender: "Male",
                    dateOfBirth: new Date("2003-06-21"),
                    phone: "9877889900",
                    email: "karan.m@example.com",
                    course: "M.Tech",
                    department: "Electronics & Communication",
                    year: "1st Year",
                    address: "3 Rajouri Garden, Delhi",
                    guardian: { name: "Deepak Malhotra", relationship: "Father", phone: "9877898765" },
                    admissionDate: new Date("2025-08-01"),
                    room: "204",
                    status: "Active"
                },
                {
                    studentId: "STU-1010",
                    name: "Isha Bhatt",
                    gender: "Other",
                    dateOfBirth: new Date("2004-10-03"),
                    phone: "9888990011",
                    email: "isha.bhatt@example.com",
                    course: "B.Tech",
                    department: "Mechanical Engineering",
                    year: "2nd Year",
                    address: "27 Navrangpura, Ahmedabad",
                    guardian: { name: "Nilesh Bhatt", relationship: "Father", phone: "9888998765" },
                    admissionDate: new Date("2024-08-01"),
                    room: "311",
                    status: "Active"
                },
                {
                    studentId: "STU-1011",
                    name: "Devansh Joshi",
                    gender: "Male",
                    dateOfBirth: new Date("2003-04-11"),
                    phone: "9899001122",
                    email: "devansh.j@example.com",
                    course: "B.Sc",
                    department: "Physics",
                    year: "3rd Year",
                    address: "41 Vaishali Nagar, Jaipur",
                    guardian: { name: "Rakesh Joshi", relationship: "Father", phone: "9899098765" },
                    admissionDate: new Date("2023-08-01"),
                    room: "118",
                    status: "Active"
                },
                {
                    studentId: "STU-1012",
                    name: "Tanya Kapoor",
                    gender: "Female",
                    dateOfBirth: new Date("2004-08-27"),
                    phone: "9800112244",
                    email: "tanya.kapoor@example.com",
                    course: "B.Com",
                    department: "Commerce",
                    year: "1st Year",
                    address: "16 Sector 21, Chandigarh",
                    guardian: { name: "Ashok Kapoor", relationship: "Father", phone: "9800198766" },
                    admissionDate: new Date("2025-08-01"),
                    room: "—",
                    status: "Active"
                }
            ];

            for (const s of sampleStudents) {
                const exists = await Student.findOne({ studentId: s.studentId });
                if (!exists) {
                    await Student.create(s);
                }
            }
            console.log(`✅ Seeded realistic Phase 2 student records`);
        } else {
            console.log(`ℹ️ Students collection already has ${studentCount} records`);
        }

        // 5. Seed Sample Fees (if empty)
        const feeCount = await Fee.countDocuments();
        if (feeCount === 0) {
            const allStudents = await Student.find();
            const studentMap = {};
            allStudents.forEach(s => {
                if (s.studentId) studentMap[s.studentId] = s;
            });

            const sampleFees = [
                { feeId: "FEE-01", studentId: "STU-1001", studentName: "Ananya Rao", room: "204", amount: 42000, dueDate: new Date("2026-08-10"), status: "Pending" },
                { feeId: "FEE-02", studentId: "STU-1002", studentName: "Vikram Iyer", room: "118", amount: 38000, dueDate: new Date("2026-07-15"), status: "Paid" },
                { feeId: "FEE-03", studentId: "STU-1004", studentName: "Priya Nair", room: "311", amount: 45000, dueDate: new Date("2026-07-28"), status: "Pending" },
                { feeId: "FEE-04", studentId: "STU-1005", studentName: "Rohan Deshmukh", room: "204", amount: 38000, dueDate: new Date("2026-06-30"), status: "Pending" },
                { feeId: "FEE-05", studentId: "STU-1006", studentName: "Sneha Kulkarni", room: "311", amount: 45000, dueDate: new Date("2026-08-05"), status: "Paid" },
                { feeId: "FEE-06", studentId: "STU-1007", studentName: "Aditya Verma", room: "118", amount: 38000, dueDate: new Date("2026-07-20"), status: "Paid" },
                { feeId: "FEE-07", studentId: "STU-1009", studentName: "Karan Malhotra", room: "204", amount: 42000, dueDate: new Date("2026-08-18"), status: "Pending" },
                { feeId: "FEE-08", studentId: "STU-1010", studentName: "Isha Bhatt", room: "311", amount: 45000, dueDate: new Date("2026-08-02"), status: "Paid" },
                { feeId: "FEE-09", studentId: "STU-1011", studentName: "Devansh Joshi", room: "118", amount: 38000, dueDate: new Date("2026-07-05"), status: "Pending" }
            ];

            const feeDocs = sampleFees.map(f => {
                const s = studentMap[f.studentId];
                return {
                    ...f,
                    student: s ? s._id : undefined
                };
            });

            await Fee.insertMany(feeDocs);
            console.log(`✅ Seeded ${feeDocs.length} fee records`);
        }

        console.log("\n=================================");
        console.log("Database seeding completed successfully!");
        console.log("Login credentials:");
        console.log(`  Email:    admin@hostel.com`);
        console.log(`  Password: password123`);
        console.log("=================================\n");

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
};

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
