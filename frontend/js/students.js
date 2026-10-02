/* =========================================================
   STUDENT MANAGEMENT MODULE — PHASE 2
   Full backend integration: search, multi-field filtering,
   pagination, validation, editing, rich profiles & deactivation.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Guard page with backend authentication check
    const user = await api.checkAuth();
    if (!user) return;

    // 2. Wire up Logout
    const logoutBtn = document.getElementById('logoutLink');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            api.logout();
        });
    }

    // State
    let students = [];
    let currentPage = 1;
    let limit = 10;
    let totalRecords = 0;
    let totalPages = 1;
    let sortField = 'createdAt';
    let sortOrder = 'desc';
    let genderFilter = 'all';
    let editingId = null;
    let targetStudentId = null;

    // UI references
    const tbody = document.getElementById('studentTableBody');
    const emptyState = document.getElementById('studentEmptyState');
    const studentCount = document.getElementById('studentCount');
    const studentPager = document.getElementById('studentPager');
    const searchInput = document.getElementById('studentSearch');
    const statusFilter = document.getElementById('statusFilter');
    const departmentFilter = document.getElementById('departmentFilter');
    const courseFilter = document.getElementById('courseFilter');
    const yearFilter = document.getElementById('yearFilter');

    const statusTagClass = {
        Active: 'tag-teal',
        Inactive: 'tag-slate',
        'Checked Out': 'tag-amber',
        Alumni: 'tag-amber'
    };

    function initials(name) {
        if (!name) return '--';
        return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    }

    function formatDate(dateVal) {
        if (!dateVal) return '—';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function toInputDateFormat(dateVal) {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    }

    // Dynamic Filter Dropdowns Setup
    let departmentsPopulated = false;
    function updateFilterDropdowns(studentList) {
        if (departmentsPopulated) return;

        const depts = [...new Set(studentList.map(s => s.department).filter(Boolean))].sort();
        if (depts.length > 0) {
            departmentFilter.innerHTML = '<option value="all">All Departments</option>' +
                depts.map(d => `<option value="${d}">${d}</option>`).join('');
        }

        const courses = [...new Set(studentList.map(s => s.course).filter(Boolean))].sort();
        if (courses.length > 0) {
            courseFilter.innerHTML = '<option value="all">All Courses</option>' +
                courses.map(c => `<option value="${c}">${c}</option>`).join('');
        }

        departmentsPopulated = true;
    }

    // Core Data Fetcher from Backend API
    async function loadStudents() {
        try {
            const params = new URLSearchParams();
            params.set('page', currentPage);
            params.set('limit', limit);
            params.set('sort', sortField);
            params.set('order', sortOrder);

            const q = searchInput.value.trim();
            if (q) params.set('search', q);

            if (statusFilter.value !== 'all') params.set('status', statusFilter.value);
            if (departmentFilter.value !== 'all') params.set('department', departmentFilter.value);
            if (courseFilter.value !== 'all') params.set('course', courseFilter.value);
            if (yearFilter.value !== 'all') params.set('year', yearFilter.value);
            if (genderFilter !== 'all') params.set('gender', genderFilter);

            const response = await api.get(`/api/students?${params.toString()}`);
            students = response.data || [];

            if (response.pagination) {
                currentPage = response.pagination.page;
                totalPages = response.pagination.pages;
                totalRecords = response.pagination.total;
            } else {
                totalRecords = students.length;
                totalPages = Math.ceil(totalRecords / limit) || 1;
            }

            renderTable();
            renderPager();
            updateFilterDropdowns(students);
        } catch (error) {
            showToast(error.message || 'Failed to load students', 'error');
        }
    }

    // Render Table Rows
    function renderTable() {
        studentCount.textContent = `${totalRecords} student${totalRecords !== 1 ? 's' : ''}`;

        if (!students || students.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        tbody.innerHTML = students.map(s => {
            const idVal = s.studentId || s.id || '—';
            const roomVal = s.room || '—';
            const deptVal = s.department || s.course || '—';
            const courseVal = s.course ? `${s.course} (${s.department || 'Gen'})` : deptVal;

            return `
                <tr>
                    <td class="cell-id"><b>${idVal}</b></td>
                    <td>
                        <div class="name-cell">
                            <span class="avatar-chip">${initials(s.name)}</span>
                            <div>
                                <span class="cell-primary">${s.name}</span>
                            </div>
                        </div>
                    </td>
                    <td>${s.gender || '—'}</td>
                    <td>${s.phone || '—'}</td>
                    <td class="cell-sub">${s.email || '—'}</td>
                    <td>
                        <span class="cell-primary" style="font-size:12.5px;">${s.course || '—'}</span>
                        <div class="cell-sub" style="font-size:11px;">${s.department || ''}</div>
                    </td>
                    <td>${s.year || '—'}</td>
                    <td><b>${roomVal}</b></td>
                    <td>
                        <span class="key-tag ${statusTagClass[s.status] || 'tag-slate'}">
                            ${s.status || 'Active'}
                        </span>
                    </td>
                    <td>
                        <div class="row-actions">
                            <button class="btn btn-ghost btn-icon" title="View Profile" data-action="view" data-id="${s._id || s.studentId}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button class="btn btn-ghost btn-icon" title="Edit Student" data-action="edit" data-id="${s._id || s.studentId}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="btn btn-ghost btn-icon" title="Exit / Deactivate" data-action="delete" data-id="${s._id || s.studentId}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 22H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h5"/><polyline points="17 16 21 12 17 8"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Render Pagination Controls
    function renderPager() {
        if (!studentPager) return;

        if (totalPages <= 1) {
            studentPager.innerHTML = `<span style="font-size:12px; color:var(--slate);">Page 1 of 1</span>`;
            return;
        }

        let html = '';
        html += `<button class="pager-btn" ${currentPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} data-page="${currentPage - 1}" aria-label="Previous page">&lsaquo;</button>`;

        for (let p = 1; p <= totalPages; p++) {
            if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                html += `<button class="pager-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
            } else if (p === currentPage - 2 || p === currentPage + 2) {
                html += `<span style="padding:0 4px; color:var(--slate);">&hellip;</span>`;
            }
        }

        html += `<button class="pager-btn" ${currentPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} data-page="${currentPage + 1}" aria-label="Next page">&rsaquo;</button>`;
        studentPager.innerHTML = html;
    }

    // Pager Click Delegation
    studentPager.addEventListener('click', (e) => {
        const btn = e.target.closest('.pager-btn');
        if (!btn || btn.disabled) return;
        const page = parseInt(btn.dataset.page, 10);
        if (page && page !== currentPage) {
            currentPage = page;
            loadStudents();
        }
    });

    // Debounced Search Handler
    let searchDebounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            currentPage = 1;
            loadStudents();
        }, 300);
    });

    // Filter Change Handlers
    [statusFilter, departmentFilter, courseFilter, yearFilter].forEach(el => {
        el.addEventListener('change', () => {
            currentPage = 1;
            loadStudents();
        });
    });

    // Gender Filter Pills
    document.querySelectorAll('.filter-pill[data-gender]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-gender]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            genderFilter = pill.dataset.gender;
            currentPage = 1;
            loadStudents();
        });
    });

    // Table Header Sorting
    document.querySelectorAll('#studentTable thead th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (sortField === key) {
                sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = key;
                sortOrder = 'asc';
            }
            loadStudents();
        });
    });

    // Modal Helpers
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
    });

    // Form Elements
    const studentForm = document.getElementById('studentForm');
    const studentModalTitle = document.getElementById('studentModalTitle');
    const studentFormError = document.getElementById('studentFormError');
    const studentFormErrorText = document.getElementById('studentFormErrorText');
    const saveStudentBtn = document.getElementById('saveStudentBtn');

    const formFields = {
        studentId: document.getElementById('f_studentId'),
        name: document.getElementById('f_name'),
        gender: document.getElementById('f_gender'),
        dob: document.getElementById('f_dob'),
        email: document.getElementById('f_email'),
        phone: document.getElementById('f_phone'),
        address: document.getElementById('f_address'),
        course: document.getElementById('f_course'),
        department: document.getElementById('f_department'),
        year: document.getElementById('f_year'),
        guardianName: document.getElementById('f_guardianName'),
        guardianRelationship: document.getElementById('f_guardianRelationship'),
        guardianPhone: document.getElementById('f_guardianPhone'),
        admissionDate: document.getElementById('f_admissionDate'),
        status: document.getElementById('f_status')
    };

    function clearFormErrors() {
        studentFormError.style.display = 'none';
        Object.values(formFields).forEach(f => f.closest('.form-field')?.classList.remove('invalid'));
    }

    function showFormError(msg) {
        studentFormErrorText.textContent = msg;
        studentFormError.style.display = 'block';
    }

    function resetForm() {
        studentForm.reset();
        clearFormErrors();
        formFields.studentId.disabled = false;
        formFields.year.value = '1st Year';
        formFields.guardianRelationship.value = 'Father';
        formFields.status.value = 'Active';
        formFields.admissionDate.value = new Date().toISOString().split('T')[0];
        editingId = null;
    }

    document.getElementById('addStudentBtn').addEventListener('click', () => {
        resetForm();
        studentModalTitle.textContent = 'Add New Student';
        saveStudentBtn.textContent = 'Save Student';
        openModal('studentModalOverlay');
    });

    function populateForm(s) {
        formFields.studentId.value = s.studentId || '';
        formFields.studentId.disabled = true; // Key field preserved during edit
        formFields.name.value = s.name || '';
        formFields.gender.value = s.gender || '';
        formFields.dob.value = toInputDateFormat(s.dateOfBirth || s.dob);
        formFields.email.value = s.email || '';
        formFields.phone.value = s.phone || '';
        formFields.address.value = s.address || '';
        formFields.course.value = s.course || '';
        formFields.department.value = s.department || '';
        formFields.year.value = s.year || '1st Year';

        const g = s.guardian || {};
        formFields.guardianName.value = g.name || s.parentName || '';
        formFields.guardianRelationship.value = g.relationship || 'Guardian';
        formFields.guardianPhone.value = g.phone || s.parentPhone || '';

        formFields.admissionDate.value = toInputDateFormat(s.admissionDate);
        formFields.status.value = s.status || 'Active';
    }

    function validateFormClientSide() {
        clearFormErrors();
        let valid = true;

        function markInvalid(field) {
            field.closest('.form-field')?.classList.add('invalid');
            valid = false;
        }

        if (!formFields.studentId.value.trim()) markInvalid(formFields.studentId);
        if (!formFields.name.value.trim()) markInvalid(formFields.name);
        if (!formFields.gender.value) markInvalid(formFields.gender);

        const emailVal = formFields.email.value.trim();
        if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
            markInvalid(formFields.email);
        }

        const phoneVal = formFields.phone.value.trim();
        if (!phoneVal || !/^\+?[0-9\s\-()]{7,15}$/.test(phoneVal)) {
            markInvalid(formFields.phone);
        }

        if (!valid) {
            showFormError('Please fill in all required fields accurately.');
        }

        return valid;
    }

    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateFormClientSide()) return;

        const payload = {
            studentId: formFields.studentId.value.trim().toUpperCase(),
            name: formFields.name.value.trim(),
            gender: formFields.gender.value,
            dateOfBirth: formFields.dob.value || undefined,
            email: formFields.email.value.trim().toLowerCase(),
            phone: formFields.phone.value.trim(),
            address: formFields.address.value.trim(),
            course: formFields.course.value.trim(),
            department: formFields.department.value.trim(),
            year: formFields.year.value,
            guardian: {
                name: formFields.guardianName.value.trim(),
                relationship: formFields.guardianRelationship.value,
                phone: formFields.guardianPhone.value.trim()
            },
            admissionDate: formFields.admissionDate.value || undefined,
            status: formFields.status.value
        };

        saveStudentBtn.disabled = true;
        saveStudentBtn.textContent = 'Saving...';

        try {
            if (editingId) {
                await api.put(`/api/students/${editingId}`, payload);
                showToast('Student profile updated successfully.', 'success');
            } else {
                await api.post('/api/students', payload);
                showToast('Student registered successfully.', 'success');
            }
            closeModal('studentModalOverlay');
            await loadStudents();
        } catch (error) {
            showFormError(error.message || 'Failed to save student record.');
        } finally {
            saveStudentBtn.disabled = false;
            saveStudentBtn.textContent = editingId ? 'Update Student' : 'Save Student';
        }
    });

    // View Profile Modal
    async function openProfile(identifier) {
        try {
            const res = await api.get(`/api/students/${identifier}`);
            const s = res.data;
            if (!s) throw new Error('Student not found');

            document.getElementById('viewAvatar').textContent = initials(s.name);
            document.getElementById('viewName').textContent = s.name;
            document.getElementById('viewId').textContent = s.studentId || s.id;

            const g = s.guardian || {};

            const sections = [
                // 1. Personal Information
                { title: 'Personal Information', items: [
                    ['Student ID', s.studentId || '—'],
                    ['Full Name', s.name || '—'],
                    ['Gender', s.gender || '—'],
                    ['Date of Birth', formatDate(s.dateOfBirth || s.dob)]
                ]},
                // 2. Contact Information
                { title: 'Contact Information', items: [
                    ['Email', s.email || '—'],
                    ['Phone', s.phone || '—'],
                    ['Permanent Address', s.address || '—']
                ]},
                // 3. Academic Information
                { title: 'Academic Information', items: [
                    ['Course', s.course || '—'],
                    ['Department', s.department || 'General'],
                    ['Year of Study', s.year || '—']
                ]},
                // 4. Guardian Information
                { title: 'Guardian Information', items: [
                    ['Guardian Name', g.name || s.parentName || '—'],
                    ['Relationship', g.relationship || 'Guardian'],
                    ['Guardian Phone', g.phone || s.parentPhone || '—']
                ]},
                // 5. Hostel Information
                { title: 'Hostel Information', items: [
                    ['Admission Date', formatDate(s.admissionDate)],
                    ['Hostel Status', `<span class="key-tag ${statusTagClass[s.status] || 'tag-slate'}">${s.status || 'Active'}</span>`],
                    ['Allocated Room', s.room && s.room !== '—' ? `Room ${s.room}` : 'Not Allocated']
                ]}
            ];

            const container = document.getElementById('viewDetails');
            container.innerHTML = sections.map(sec => `
                <div class="view-section-title">${sec.title}</div>
                ${sec.items.map(([label, val]) => `
                    <div class="vd-item">
                        <div class="vd-label">${label}</div>
                        <div class="vd-value">${val}</div>
                    </div>
                `).join('')}
            `).join('');

            openModal('viewModalOverlay');
        } catch (err) {
            showToast(err.message || 'Failed to load student profile', 'error');
        }
    }

    // Action Buttons Delegation
    tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (!id) return;

        if (btn.dataset.action === 'view') {
            await openProfile(id);
        } else if (btn.dataset.action === 'edit') {
            try {
                const res = await api.get(`/api/students/${id}`);
                const student = res.data;
                resetForm();
                editingId = student._id || student.studentId;
                studentModalTitle.textContent = 'Edit Student Details';
                saveStudentBtn.textContent = 'Update Student';
                populateForm(student);
                openModal('studentModalOverlay');
            } catch (err) {
                showToast(err.message || 'Failed to fetch student data for editing', 'error');
            }
        } else if (btn.dataset.action === 'delete') {
            targetStudentId = id;
            const student = students.find(s => (s._id === id || s.studentId === id));
            const name = student ? student.name : id;
            document.getElementById('confirmText').textContent =
                `Managing exit for resident: ${name}. Safe deactivation preserves fee history.`;
            openModal('confirmModalOverlay');
        }
    });

    // Exit / Delete Action Handler
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    confirmActionBtn.addEventListener('click', async () => {
        if (!targetStudentId) return;

        const exitType = document.querySelector('input[name="exitType"]:checked')?.value || 'checkout';
        confirmActionBtn.disabled = true;
        confirmActionBtn.textContent = 'Processing...';

        try {
            if (exitType === 'permanent') {
                await api.delete(`/api/students/${targetStudentId}?permanent=true`);
                showToast('Student permanently removed from system.', 'success');
            } else {
                await api.delete(`/api/students/${targetStudentId}`);
                showToast('Student checked out and safely deactivated.', 'success');
            }
            closeModal('confirmModalOverlay');
            targetStudentId = null;
            await loadStudents();
        } catch (err) {
            showToast(err.message || 'Action failed', 'error');
        } finally {
            confirmActionBtn.disabled = false;
            confirmActionBtn.textContent = 'Confirm Action';
        }
    });

    // Toast Notification Utility
    function showToast(message, type = '') {
        const stack = document.getElementById('toastStack');
        if (!stack) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type ? 'toast-' + type : ''}`;
        toast.textContent = message;
        stack.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }

    // Sidebar Toggle (Mobile view)
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Initial load from backend
    await loadStudents();
});
