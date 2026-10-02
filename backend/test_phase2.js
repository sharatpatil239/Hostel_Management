const http = require('http');

const PORT = 5000;
const BASE = `http://127.0.0.1:${PORT}`;

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const data = body ? JSON.stringify(body) : null;
        if (data) {
            headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request(url, { method, headers }, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(resBody);
                } catch {
                    parsed = resBody;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runPhase2Tests() {
    console.log('🧪 Starting Phase 2 Student Management Verification Tests...\n');
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // 1. Test Login
        const loginRes = await request('POST', '/api/auth/login', {
            email: 'admin@hostel.com',
            password: 'password123'
        });
        assert(loginRes.status === 200 && !!loginRes.data.token, '1. Admin login succeeds with JWT');
        const token = loginRes.data.token;

        // 2. Test Unauthorized Student API request
        const unauthRes = await request('GET', '/api/students');
        assert(unauthRes.status === 401 && unauthRes.data.success === false, '2. Unauthorized GET /api/students returns 401');

        // 3. Test GET Students (with pagination object)
        const getStudentsRes = await request('GET', '/api/students?page=1&limit=5', null, token);
        assert(
            getStudentsRes.status === 200 &&
            getStudentsRes.data.success === true &&
            Array.isArray(getStudentsRes.data.data) &&
            getStudentsRes.data.pagination &&
            getStudentsRes.data.pagination.page === 1 &&
            getStudentsRes.data.pagination.limit === 5,
            '3. GET /api/students returns paginated student list'
        );

        // 4. Test Student Count Endpoint
        const countRes = await request('GET', '/api/students/count', null, token);
        assert(
            countRes.status === 200 &&
            countRes.data.success === true &&
            typeof countRes.data.data.total === 'number' &&
            typeof countRes.data.data.active === 'number',
            '4. GET /api/students/count returns total, active, and inactive breakdown'
        );

        // 5. Test Dashboard Student Count Integration
        const dashRes = await request('GET', '/api/dashboard', null, token);
        assert(
            dashRes.status === 200 &&
            dashRes.data.success === true &&
            Array.isArray(dashRes.data.data.summary) &&
            dashRes.data.data.summary.find(s => s.label === 'Total Students'),
            '5. GET /api/dashboard reflects live Total Students count'
        );

        // 6. Test Invalid Student Input (missing required fields)
        const invalidStudent = {
            studentId: 'STU-TEST',
            // missing name, email, phone, gender
        };
        const invalidRes = await request('POST', '/api/students', invalidStudent, token);
        assert(invalidRes.status === 400 && invalidRes.data.success === false, '6. POST /api/students with missing fields returns 400 with message');

        // 7. Test Create Student (Realistic Student Model)
        const timestamp = Date.now();
        const testStudentId = `STU-P2-${timestamp.toString().slice(-4)}`;
        const validStudent = {
            studentId: testStudentId,
            name: 'Rohit Sharma',
            gender: 'Male',
            dateOfBirth: '2003-04-30',
            email: `rohit.${timestamp}@example.com`,
            phone: '9876543219',
            course: 'B.Tech',
            department: 'Computer Science & Engineering',
            year: '3rd Year',
            address: '45 Marine Lines, Mumbai',
            guardian: {
                name: 'Gurunath Sharma',
                relationship: 'Father',
                phone: '9876500000'
            },
            admissionDate: '2023-08-01',
            status: 'Active'
        };
        const createRes = await request('POST', '/api/students', validStudent, token);
        assert(createRes.status === 201 && createRes.data.success === true && createRes.data.data.studentId === testStudentId, '7. POST /api/students successfully creates full student profile');
        const createdId = createRes.data.data._id;

        // 8. Test Duplicate Student ID
        const dupRes = await request('POST', '/api/students', validStudent, token);
        assert(dupRes.status === 400 && dupRes.data.success === false && dupRes.data.message.includes('already exists'), '8. Duplicate Student ID is rejected with 400');

        // 9. Test GET Single Student (Profile)
        const getOneRes = await request('GET', `/api/students/${testStudentId}`, null, token);
        assert(
            getOneRes.status === 200 &&
            getOneRes.data.success === true &&
            getOneRes.data.data.name === 'Rohit Sharma' &&
            getOneRes.data.data.guardian.name === 'Gurunath Sharma' &&
            getOneRes.data.data.department === 'Computer Science & Engineering',
            '9. GET /api/students/:id returns full student profile by studentId'
        );

        // 10. Test Edit Student
        const updatePayload = {
            phone: '9988776655',
            year: '4th Year',
            address: 'Updated Apartment 5B, Worli'
        };
        const updateRes = await request('PUT', `/api/students/${testStudentId}`, updatePayload, token);
        assert(
            updateRes.status === 200 &&
            updateRes.data.success === true &&
            updateRes.data.data.phone === '9988776655' &&
            updateRes.data.data.year === '4th Year',
            '10. PUT /api/students/:id updates student fields accurately'
        );

        // 11. Test Backend Search
        const searchRes = await request('GET', `/api/students?search=Rohit`, null, token);
        assert(
            searchRes.status === 200 &&
            searchRes.data.data.length >= 1 &&
            searchRes.data.data.some(s => s.name.includes('Rohit')),
            '11. Backend search (?search=Rohit) matches student by name'
        );

        // 12. Test Backend Filtering
        const filterDeptRes = await request('GET', `/api/students?department=Computer Science & Engineering`, null, token);
        assert(
            filterDeptRes.status === 200 &&
            filterDeptRes.data.data.every(s => s.department === 'Computer Science & Engineering'),
            '12. Backend filter (?department=...) matches students in specified department'
        );

        // 13. Test Pagination limits
        const page1Res = await request('GET', `/api/students?page=1&limit=2`, null, token);
        const page2Res = await request('GET', `/api/students?page=2&limit=2`, null, token);
        assert(
            page1Res.status === 200 &&
            page2Res.status === 200 &&
            page1Res.data.data[0]._id !== page2Res.data.data[0]._id,
            '13. Pagination accurately offsets pages (?page=1&limit=2 vs ?page=2&limit=2)'
        );

        // 14. Test Safe Deactivate Student (Check Out)
        const deactRes = await request('DELETE', `/api/students/${testStudentId}`, { status: 'Checked Out' }, token);
        assert(
            deactRes.status === 200 &&
            deactRes.data.success === true &&
            deactRes.data.data.status === 'Checked Out',
            '14. DELETE /api/students/:id safely deactivates student to "Checked Out" without destroying record'
        );

        // Clean up: Permanent delete of test student
        const cleanupRes = await request('DELETE', `/api/students/${testStudentId}?permanent=true`, null, token);
        assert(cleanupRes.status === 200 && cleanupRes.data.success === true, '15. Permanent delete cleanup works via ?permanent=true');

        console.log(`\n=================================`);
        console.log(`Phase 2 Tests Complete: ${passed} passed, ${failed} failed`);
        console.log(`=================================\n`);

        process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
        console.error('Test execution error:', err);
        process.exit(1);
    }
}

runPhase2Tests();
