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

async function runTests() {
    console.log('🧪 Starting Phase 1 Architecture Verification Tests...\n');
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
        // 1. Test Welcome Route
        const welcome = await request('GET', '/');
        assert(welcome.status === 200 && welcome.data.success === true, 'GET / returns 200 with success: true');

        // 2. Test Protected Routes Without Token (Should Return 401)
        const unauthStudents = await request('GET', '/api/students');
        assert(unauthStudents.status === 401 && unauthStudents.data.success === false, 'GET /api/students rejects missing token with 401');

        const unauthRooms = await request('GET', '/api/rooms');
        assert(unauthRooms.status === 401 && unauthRooms.data.success === false, 'GET /api/rooms rejects missing token with 401');

        const unauthFees = await request('GET', '/api/fees');
        assert(unauthFees.status === 401 && unauthFees.data.success === false, 'GET /api/fees rejects missing token with 401');

        const unauthDash = await request('GET', '/api/dashboard');
        assert(unauthDash.status === 401 && unauthDash.data.success === false, 'GET /api/dashboard rejects missing token with 401');

        const unauthMe = await request('GET', '/api/auth/me');
        assert(unauthMe.status === 401 && unauthMe.data.success === false, 'GET /api/auth/me rejects missing token with 401');

        // 3. Test Invalid Token
        const invalidTokenRes = await request('GET', '/api/students', null, 'invalid.jwt.token');
        assert(invalidTokenRes.status === 401, 'Invalid JWT token rejected with 401 without crashing');

        // 4. Test Login Validation
        const emptyLogin = await request('POST', '/api/auth/login', {});
        assert(emptyLogin.status === 400 && emptyLogin.data.success === false, 'POST /api/auth/login with empty body returns 400');

        const badPasswordLogin = await request('POST', '/api/auth/login', {
            email: 'admin@hostel.com',
            password: 'wrongpassword'
        });
        assert(badPasswordLogin.status === 401 && badPasswordLogin.data.success === false, 'POST /api/auth/login with wrong password returns 401');

        // 5. Test Valid Login
        const validLogin = await request('POST', '/api/auth/login', {
            email: 'admin@hostel.com',
            password: 'password123'
        });
        assert(validLogin.status === 200 && validLogin.data.success === true && !!validLogin.data.token, 'POST /api/auth/login returns 200 with JWT token');
        assert(!validLogin.data.password && !validLogin.data.data?.admin?.password, 'Login response does not expose password or hash');

        const token = validLogin.data.token;

        // 6. Test GET /api/auth/me With Token
        const meRes = await request('GET', '/api/auth/me', null, token);
        assert(meRes.status === 200 && meRes.data.success === true && meRes.data.data.email === 'admin@hostel.com', 'GET /api/auth/me returns 200 with authenticated profile');
        assert(!meRes.data.data.password, 'Profile does not leak password');

        // 7. Test Protected Management Routes With Valid Token
        const studentsRes = await request('GET', '/api/students', null, token);
        assert(studentsRes.status === 200 && studentsRes.data.success === true && Array.isArray(studentsRes.data.data), 'GET /api/students returns 200 and list of students');

        const roomsRes = await request('GET', '/api/rooms', null, token);
        assert(roomsRes.status === 200 && roomsRes.data.success === true && Array.isArray(roomsRes.data.data), 'GET /api/rooms returns 200 and list of rooms');

        const feesRes = await request('GET', '/api/fees', null, token);
        assert(feesRes.status === 200 && feesRes.data.success === true && Array.isArray(feesRes.data.data), 'GET /api/fees returns 200 and list of fee records');

        const dashRes = await request('GET', '/api/dashboard', null, token);
        assert(dashRes.status === 200 && dashRes.data.success === true && !!dashRes.data.data.summary, 'GET /api/dashboard returns 200 with live summary cards');

        // 8. Test Student CRUD
        const testTS = Date.now();
        const newStudent = {
            studentId: `TEST-${testTS}`,
            name: 'Test Student',
            email: `test.${testTS}@example.com`,
            phone: '9998887776',
            gender: 'Male',
            course: 'B.Tech',
            year: '1st Year'
        };
        const createStudentRes = await request('POST', '/api/students', newStudent, token);
        assert(createStudentRes.status === 201 && createStudentRes.data.success === true, 'POST /api/students creates student with 201');

        const studentId = createStudentRes.data?.data?._id;
        const updateStudentRes = await request('PUT', `/api/students/${studentId}`, { phone: '9998887770' }, token);
        assert(updateStudentRes.status === 200 && updateStudentRes.data?.data?.phone === '9998887770', 'PUT /api/students/:id updates student');

        const deleteStudentRes = await request('DELETE', `/api/students/${studentId}?permanent=true`, null, token);
        assert(deleteStudentRes.status === 200 && deleteStudentRes.data?.success === true, 'DELETE /api/students/:id deletes student');

        console.log(`\n=================================`);
        console.log(`Tests Complete: ${passed} passed, ${failed} failed`);
        console.log(`=================================\n`);

        process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
        console.error('Test execution error:', err);
        process.exit(1);
    }
}

runTests();
