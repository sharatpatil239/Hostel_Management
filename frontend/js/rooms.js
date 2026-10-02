/* =========================================================
   ROOM MANAGEMENT PAGE — AUTHENTICATED REAL DATA
   Protected by JWT auth, connects to /api/rooms endpoints.
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

    let rooms = [];
    let unassignedStudents = [];
    let filteredRooms = [];
    let sortState = { key: 'number', dir: 'asc' };
    let editingNumber = null;
    let deleteTargetNumber = null;
    let allocateTargetNumber = null;

    const tbody = document.getElementById('roomTableBody');
    const emptyState = document.getElementById('roomEmptyState');
    const roomCount = document.getElementById('roomCount');
    const searchInput = document.getElementById('roomSearch');
    const statusFilter = document.getElementById('roomStatusFilter');

    const statusTagClass = {
        'Available': 'tag-teal',
        'Partially Occupied': 'tag-amber',
        'Full': 'tag-rust',
        'Under Maintenance': 'tag-slate'
    };

    function applyFilters() {
        const q = searchInput.value.trim().toLowerCase();
        const status = statusFilter.value;

        filteredRooms = rooms.filter(r => {
            const num = (r.number || r.roomNumber || '').toLowerCase();
            const flr = (r.floor || '').toLowerCase();
            const matchesQuery = !q || num.includes(q) || flr.includes(q);
            const matchesStatus = status === 'all' || r.status === status;
            return matchesQuery && matchesStatus;
        });

        applySort();
        render();
    }

    function applySort() {
        const { key, dir } = sortState;
        filteredRooms.sort((a, b) => {
            let av = a[key === 'number' ? (a.number ? 'number' : 'roomNumber') : key] || 0;
            let bv = b[key === 'number' ? (b.number ? 'number' : 'roomNumber') : key] || 0;
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();
            if (av < bv) return dir === 'asc' ? -1 : 1;
            if (av > bv) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function render() {
        roomCount.textContent = `${filteredRooms.length} room${filteredRooms.length !== 1 ? 's' : ''}`;

        if (filteredRooms.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        tbody.innerHTML = filteredRooms.map(r => {
            const num = r.number || r.roomNumber;
            const pct = r.capacity ? Math.round((r.occupied / r.capacity) * 100) : 0;
            const isFull = r.occupied >= r.capacity || r.status === 'Full';
            const canAllocate = !isFull && r.status !== 'Under Maintenance';

            return `
                <tr>
                    <td class="cell-room-num"><b>${num}</b></td>
                    <td>${r.floor || 'Ground Floor'}</td>
                    <td>${r.type || 'Standard'}</td>
                    <td>${r.capacity}</td>
                    <td>
                        <div class="occupancy-cell">
                            <span>${r.occupied} / ${r.capacity}</span>
                            <div class="occ-micro-track">
                                <div class="occ-micro-fill ${pct >= 100 ? 'full' : pct > 50 ? 'med' : ''}" style="width:${pct}%"></div>
                            </div>
                        </div>
                    </td>
                    <td><span class="key-tag ${statusTagClass[r.status] || 'tag-slate'}">${r.status}</span></td>
                    <td>
                        <div class="row-actions">
                            ${canAllocate ? `
                                <button class="btn btn-ghost btn-sm" title="Allocate student" data-action="allocate" data-number="${num}">
                                    Allocate
                                </button>
                            ` : ''}
                            <button class="btn btn-ghost btn-icon" title="Edit" data-action="edit" data-number="${num}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="btn btn-ghost btn-icon" title="Delete" data-action="delete" data-number="${num}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Load rooms & unassigned students from backend
    async function loadRooms() {
        try {
            const [roomsRes, studentsRes] = await Promise.all([
                api.get('/api/rooms'),
                api.get('/api/students?unassigned=true').catch(() => ({ data: [] }))
            ]);

            const roomData = roomsRes.data || [];
            rooms = roomData.map(r => ({
                ...r,
                number: r.roomNumber || r.number
            }));

            const stuData = studentsRes.data || [];
            unassignedStudents = stuData.map(s => ({
                id: s._id || s.studentId,
                name: s.name,
                studentId: s.studentId
            }));

            applyFilters();
        } catch (error) {
            showToast(error.message || 'Failed to load rooms from server', 'error');
        }
    }

    // ---- Search / filters ----
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    // ---- Sorting ----
    document.querySelectorAll('#roomTable thead th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (sortState.key === key) {
                sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
            } else {
                sortState = { key, dir: 'asc' };
            }
            applySort();
            render();
        });
    });

    // ---- Modal helpers ----
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
    });

    // ---- Add / Edit form ----
    const roomForm = document.getElementById('roomForm');
    const roomModalTitle = document.getElementById('roomModalTitle');

    const formFields = {
        number: document.getElementById('f_roomNumber'),
        floor: document.getElementById('f_floor'),
        capacity: document.getElementById('f_capacity'),
        type: document.getElementById('f_type'),
        status: document.getElementById('f_status')
    };

    function resetForm() {
        roomForm.reset();
        formFields.number.disabled = false;
        Object.values(formFields).forEach(f => f.closest('.form-field')?.classList.remove('invalid'));
        editingNumber = null;
    }

    document.getElementById('addRoomBtn').addEventListener('click', () => {
        resetForm();
        roomModalTitle.textContent = 'Add Room';
        openModal('roomModalOverlay');
    });

    function populateForm(r) {
        const num = r.number || r.roomNumber;
        formFields.number.value = num;
        formFields.number.disabled = true; // room number is unique key
        formFields.floor.value = r.floor || 'Ground Floor';
        formFields.capacity.value = r.capacity || 2;
        formFields.type.value = r.type || 'Double Sharing';
        formFields.status.value = r.status || 'Available';
    }

    function validateRoomForm() {
        let valid = true;
        function check(field, condition) {
            const wrap = field.closest('.form-field');
            wrap.classList.toggle('invalid', !condition);
            if (!condition) valid = false;
        }
        check(formFields.number, formFields.number.value.trim().length > 0);
        check(formFields.floor, formFields.floor.value !== '');
        check(formFields.capacity, Number(formFields.capacity.value) > 0);
        check(formFields.type, formFields.type.value !== '');
        check(formFields.status, formFields.status.value !== '');
        return valid;
    }

    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateRoomForm()) return;

        const data = {
            roomNumber: formFields.number.value.trim(),
            floor: formFields.floor.value,
            capacity: Number(formFields.capacity.value),
            type: formFields.type.value,
            status: formFields.status.value
        };

        try {
            if (editingNumber) {
                await api.put(`/api/rooms/${editingNumber}`, data);
                showToast('Room updated successfully.', 'success');
            } else {
                await api.post('/api/rooms', { ...data, occupied: 0 });
                showToast('Room added successfully.', 'success');
            }
            closeModal('roomModalOverlay');
            await loadRooms();
        } catch (err) {
            showToast(err.message || 'Operation failed', 'error');
        }
    });

    // ---- Table action delegation ----
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const number = btn.dataset.number;
        const room = rooms.find(r => (r.number === number || r.roomNumber === number));
        if (!room) return;

        if (btn.dataset.action === 'allocate') {
            allocateTargetNumber = number;
            document.getElementById('allocRoomNum').textContent = number;
            const select = document.getElementById('allocStudentSelect');
            if (unassignedStudents.length === 0) {
                select.innerHTML = '<option value="">No unallocated students available</option>';
            } else {
                select.innerHTML = '<option value="">Choose a student...</option>' +
                    unassignedStudents.map(s => `<option value="${s.id}">${s.name} (${s.studentId || 'ID'})</option>`).join('');
            }
            openModal('allocateModalOverlay');
        } else if (btn.dataset.action === 'edit') {
            resetForm();
            editingNumber = number;
            roomModalTitle.textContent = 'Edit Room';
            populateForm(room);
            openModal('roomModalOverlay');
        } else if (btn.dataset.action === 'delete') {
            deleteTargetNumber = number;
            document.getElementById('confirmText').textContent =
                `This will permanently remove Room ${number}. Any residents will need to be reallocated.`;
            openModal('confirmModalOverlay');
        }
    });

    // ---- Allocate confirm ----
    document.getElementById('confirmAllocateBtn').addEventListener('click', async () => {
        const select = document.getElementById('allocStudentSelect');
        const studentId = select.value;
        const wrap = select.closest('.form-field');

        if (!studentId) {
            wrap.classList.add('invalid');
            return;
        }
        wrap.classList.remove('invalid');

        const room = rooms.find(r => (r.number === allocateTargetNumber || r.roomNumber === allocateTargetNumber));
        if (!room) return;

        try {
            // 1. Assign room to student
            await api.put(`/api/students/${studentId}`, { room: allocateTargetNumber });

            // 2. Increment occupied count in room
            const newOccupied = (room.occupied || 0) + 1;
            const newStatus = newOccupied >= room.capacity ? 'Full' : 'Partially Occupied';
            await api.put(`/api/rooms/${allocateTargetNumber}`, { occupied: newOccupied, status: newStatus });

            closeModal('allocateModalOverlay');
            showToast(`Allocated student to Room ${allocateTargetNumber}.`, 'success');
            await loadRooms();
        } catch (err) {
            showToast(err.message || 'Failed to allocate student', 'error');
        }
    });

    // ---- Delete confirm ----
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if (!deleteTargetNumber) return;
        try {
            await api.delete(`/api/rooms/${deleteTargetNumber}`);
            deleteTargetNumber = null;
            closeModal('confirmModalOverlay');
            showToast('Room deleted successfully.', 'success');
            await loadRooms();
        } catch (err) {
            showToast(err.message || 'Failed to delete room', 'error');
        }
    });

    // ---- Toasts ----
    function showToast(message, type = '') {
        const stack = document.getElementById('toastStack');
        if (!stack) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type ? 'toast-' + type : ''}`;
        toast.textContent = message;
        stack.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }

    // ---- Sidebar toggle ----
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Initial load from backend
    await loadRooms();
});
