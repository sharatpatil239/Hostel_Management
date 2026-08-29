/* =========================================================
   ROOM MANAGEMENT PAGE — FRONTEND ONLY
   All data below is placeholder JSON, kept in memory only.
   No localStorage, no fetch(), no backend calls.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // TODO: Replace this dummy data with GET /api/rooms
  let rooms = [
    { number: '101', floor: 'Ground Floor', capacity: 2, occupied: 2, type: 'Double Sharing', status: 'Full' },
    { number: '102', floor: 'Ground Floor', capacity: 3, occupied: 1, type: 'Triple Sharing', status: 'Partially Occupied' },
    { number: '103', floor: 'Ground Floor', capacity: 1, occupied: 0, type: 'Single Sharing', status: 'Available' },
    { number: '118', floor: 'Ground Floor', capacity: 3, occupied: 3, type: 'Triple Sharing', status: 'Full' },
    { number: '204', floor: '1st Floor', capacity: 3, occupied: 3, type: 'Triple Sharing', status: 'Full' },
    { number: '206', floor: '1st Floor', capacity: 2, occupied: 1, type: 'Double Sharing', status: 'Partially Occupied' },
    { number: '210', floor: '1st Floor', capacity: 2, occupied: 0, type: 'Double Sharing', status: 'Available' },
    { number: '215', floor: '1st Floor', capacity: 4, occupied: 2, type: 'Dormitory', status: 'Partially Occupied' },
    { number: '305', floor: '2nd Floor', capacity: 2, occupied: 0, type: 'Double Sharing', status: 'Available' },
    { number: '308', floor: '2nd Floor', capacity: 1, occupied: 1, type: 'Single Sharing', status: 'Full' },
    { number: '311', floor: '2nd Floor', capacity: 3, occupied: 2, type: 'Triple Sharing', status: 'Partially Occupied' },
    { number: '402', floor: '3rd Floor', capacity: 4, occupied: 0, type: 'Dormitory', status: 'Available' },
    { number: '407', floor: '3rd Floor', capacity: 2, occupied: 2, type: 'Double Sharing', status: 'Full' },
    { number: '410', floor: '3rd Floor', capacity: 3, occupied: 0, type: 'Triple Sharing', status: 'Under Maintenance' }
  ];

  // TODO: Replace this dummy data with GET /api/students?unassigned=true
  // (used only to populate the "Allocate Student" dropdown)
  const unassignedStudents = [
    { id: 'STU-1003', name: 'Farhan Sheikh' },
    { id: 'STU-1008', name: 'Meera Pillai' },
    { id: 'STU-1012', name: 'Tanya Kapoor' }
  ];

  let filteredRooms = [...rooms];
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

  function applyFilters(){
    const q = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;

    filteredRooms = rooms.filter(r => {
      const matchesQuery = !q || r.number.toLowerCase().includes(q) || r.floor.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || r.status === status;
      return matchesQuery && matchesStatus;
    });

    applySort();
    render();
  }

  function applySort(){
    const { key, dir } = sortState;
    const keyMap = { available: (r) => r.capacity - r.occupied };
    filteredRooms.sort((a, b) => {
      let av = keyMap[key] ? keyMap[key](a) : a[key];
      let bv = keyMap[key] ? keyMap[key](b) : b[key];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function capacityDots(capacity, occupied){
    let dots = '';
    for (let i = 0; i < capacity; i++){
      dots += `<span class="cap-dot ${i < occupied ? 'filled' : ''}"></span>`;
    }
    return dots;
  }

  function render(){
    roomCount.textContent = `${filteredRooms.length} room${filteredRooms.length !== 1 ? 's' : ''}`;

    if (filteredRooms.length === 0){
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filteredRooms.map(r => {
      const available = r.capacity - r.occupied;
      const canAllocate = available > 0 && r.status !== 'Under Maintenance';
      return `
      <tr>
        <td class="cell-primary">${r.number}</td>
        <td>${r.floor}</td>
        <td>
          <div class="capacity-meter">
            <div class="cap-dots">${capacityDots(r.capacity, r.occupied)}</div>
            <span class="cap-text">${r.capacity}</span>
          </div>
        </td>
        <td>${r.occupied}</td>
        <td>${available}</td>
        <td><span class="key-tag ${statusTagClass[r.status] || 'tag-slate'}">${r.status}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-icon" title="Edit Room" data-action="edit" data-num="${r.number}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon" title="Allocate Student" data-action="allocate" data-num="${r.number}" ${canAllocate ? '' : 'disabled'}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon" title="Delete Room" data-action="delete" data-num="${r.number}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  }

  // ---- Search / filters ----
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);

  // ---- Sorting ----
  document.querySelectorAll('#roomTable thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortState.key === key){
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
      } else {
        sortState = { key, dir: 'asc' };
      }
      applySort();
      render();
    });
  });

  // ---- Modal helpers ----
  function openModal(id){ document.getElementById(id).classList.add('open'); }
  function closeModal(id){ document.getElementById(id).classList.remove('open'); }

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  });

  // ---- Add / Edit room form ----
  const roomForm = document.getElementById('roomForm');
  const roomModalTitle = document.getElementById('roomModalTitle');
  const rf = {
    number: document.getElementById('r_number'),
    floor: document.getElementById('r_floor'),
    capacity: document.getElementById('r_capacity'),
    type: document.getElementById('r_type'),
    status: document.getElementById('r_status')
  };

  function resetForm(){
    roomForm.reset();
    Object.values(rf).forEach(f => f.closest('.form-field')?.classList.remove('invalid'));
    editingNumber = null;
  }

  document.getElementById('addRoomBtn').addEventListener('click', () => {
    resetForm();
    roomModalTitle.textContent = 'Add Room';
    rf.number.disabled = false;
    openModal('roomModalOverlay');
  });

  function validateRoomForm(){
    let valid = true;
    function check(field, condition){
      const wrap = field.closest('.form-field');
      wrap.classList.toggle('invalid', !condition);
      if (!condition) valid = false;
    }
    check(rf.number, rf.number.value.trim().length > 0);
    check(rf.floor, rf.floor.value !== '');
    check(rf.capacity, rf.capacity.value && Number(rf.capacity.value) >= 1 && Number(rf.capacity.value) <= 8);
    check(rf.type, rf.type.value !== '');
    check(rf.status, rf.status.value !== '');
    return valid;
  }

  roomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateRoomForm()) return;

    const capacity = Number(rf.capacity.value);

    if (editingNumber){
      // TODO: Replace with PUT /api/rooms/:number
      const idx = rooms.findIndex(r => r.number === editingNumber);
      const occupied = Math.min(rooms[idx].occupied, capacity);
      rooms[idx] = { ...rooms[idx], floor: rf.floor.value, capacity, type: rf.type.value, status: rf.status.value, occupied };
      showToast('Room updated successfully.', 'success');
    } else {
      // TODO: Replace with POST /api/rooms
      if (rooms.some(r => r.number === rf.number.value.trim())){
        showToast('A room with this number already exists.', 'error');
        return;
      }
      rooms.push({ number: rf.number.value.trim(), floor: rf.floor.value, capacity, occupied: 0, type: rf.type.value, status: rf.status.value });
      showToast('Room added successfully.', 'success');
    }

    closeModal('roomModalOverlay');
    applyFilters();
  });

  // ---- Table action delegation ----
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn || btn.disabled) return;
    const num = btn.dataset.num;
    const room = rooms.find(r => r.number === num);
    if (!room) return;

    if (btn.dataset.action === 'edit'){
      resetForm();
      editingNumber = num;
      roomModalTitle.textContent = `Edit Room ${num}`;
      rf.number.value = room.number;
      rf.number.disabled = true;
      rf.floor.value = room.floor;
      rf.capacity.value = room.capacity;
      rf.type.value = room.type;
      rf.status.value = room.status;
      openModal('roomModalOverlay');
    } else if (btn.dataset.action === 'delete'){
      deleteTargetNumber = num;
      document.getElementById('confirmText').textContent =
        `This will permanently remove Room ${num} from room records. This action cannot be undone.`;
      openModal('confirmModalOverlay');
    } else if (btn.dataset.action === 'allocate'){
      allocateTargetNumber = num;
      const available = room.capacity - room.occupied;
      document.getElementById('allocRoomNumber').textContent = `Room ${room.number}`;
      document.getElementById('allocRoomMeta').textContent = `${room.floor} · ${room.type}`;
      document.getElementById('allocRoomBeds').textContent = `${available} bed${available !== 1 ? 's' : ''} free`;
      const select = document.getElementById('a_student');
      select.innerHTML = '<option value="">Choose an unassigned student</option>' +
        unassignedStudents.map(s => `<option value="${s.id}">${s.name} (${s.id})</option>`).join('');
      select.closest('.form-field').classList.remove('invalid');
      openModal('allocateModalOverlay');
    }
  });

  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (!deleteTargetNumber) return;
    // TODO: Replace with DELETE /api/rooms/:number
    rooms = rooms.filter(r => r.number !== deleteTargetNumber);
    deleteTargetNumber = null;
    closeModal('confirmModalOverlay');
    applyFilters();
    showToast('Room deleted.', 'success');
  });

  document.getElementById('confirmAllocateBtn').addEventListener('click', () => {
    const select = document.getElementById('a_student');
    if (!select.value){
      select.closest('.form-field').classList.add('invalid');
      return;
    }
    // TODO: Replace with POST /api/rooms/:number/allocate { studentId }
    const idx = rooms.findIndex(r => r.number === allocateTargetNumber);
    if (idx > -1 && rooms[idx].occupied < rooms[idx].capacity){
      rooms[idx].occupied += 1;
      rooms[idx].status = rooms[idx].occupied >= rooms[idx].capacity ? 'Full' : 'Partially Occupied';
    }
    const studentIdx = unassignedStudents.findIndex(s => s.id === select.value);
    if (studentIdx > -1) unassignedStudents.splice(studentIdx, 1);

    closeModal('allocateModalOverlay');
    applyFilters();
    showToast('Student allocated to room.', 'success');
  });

  // ---- Toasts ----
  function showToast(message, type = ''){
    const stack = document.getElementById('toastStack');
    const toast = document.createElement('div');
    toast.className = `toast ${type ? 'toast-' + type : ''}`;
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  // ---- Sidebar toggle ----
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  sidebarToggle && sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Initial render
  applySort();
  render();
});
