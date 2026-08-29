/* =========================================================
   STUDENT MANAGEMENT PAGE — FRONTEND ONLY
   All data below is placeholder JSON, kept in memory only.
   No localStorage, no fetch(), no backend calls.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // TODO: Replace this dummy data with GET /api/students
  let students = [
    { id: 'STU-1001', name: 'Ananya Rao', gender: 'Female', phone: '9845012345', email: 'ananya.rao@example.com', dob: '2004-03-12', course: 'B.Tech CSE', year: '2nd Year', address: '14 Lake View Rd, Bengaluru', parentName: 'Suresh Rao', parentPhone: '9845098765', room: '204', status: 'Active' },
    { id: 'STU-1002', name: 'Vikram Iyer', gender: 'Male', phone: '9900112233', email: 'vikram.iyer@example.com', dob: '2003-11-02', course: 'B.Sc Physics', year: '3rd Year', address: '22 MG Road, Chennai', parentName: 'Ramesh Iyer', parentPhone: '9900198765', room: '118', status: 'Active' },
    { id: 'STU-1003', name: 'Farhan Sheikh', gender: 'Male', phone: '9811223344', email: 'farhan.sheikh@example.com', dob: '2004-07-19', course: 'B.Com', year: '1st Year', address: '9 Park Street, Hyderabad', parentName: 'Aslam Sheikh', parentPhone: '9811298765', room: '—', status: 'Active' },
    { id: 'STU-1004', name: 'Priya Nair', gender: 'Female', phone: '9822334455', email: 'priya.nair@example.com', dob: '2002-01-25', course: 'M.Tech ECE', year: '2nd Year', address: '5 Marine Drive, Kochi', parentName: 'Mohan Nair', parentPhone: '9822398765', room: '311', status: 'Active' },
    { id: 'STU-1005', name: 'Rohan Deshmukh', gender: 'Male', phone: '9833445566', email: 'rohan.d@example.com', dob: '2003-09-08', course: 'B.Tech Mech', year: '3rd Year', address: '18 FC Road, Pune', parentName: 'Anil Deshmukh', parentPhone: '9833498765', room: '204', status: 'Inactive' },
    { id: 'STU-1006', name: 'Sneha Kulkarni', gender: 'Female', phone: '9844556677', email: 'sneha.k@example.com', dob: '2004-05-30', course: 'B.Sc Physics', year: '1st Year', address: '31 Camp Area, Nagpur', parentName: 'Vijay Kulkarni', parentPhone: '9844598765', room: '311', status: 'Active' },
    { id: 'STU-1007', name: 'Aditya Verma', gender: 'Male', phone: '9855667788', email: 'aditya.verma@example.com', dob: '2002-12-14', course: 'B.Tech CSE', year: '4th Year', address: '7 Civil Lines, Lucknow', parentName: 'Sanjay Verma', parentPhone: '9855698765', room: '118', status: 'Alumni' },
    { id: 'STU-1008', name: 'Meera Pillai', gender: 'Female', phone: '9866778899', email: 'meera.pillai@example.com', dob: '2004-02-17', course: 'B.Com', year: '2nd Year', address: '12 Beach Road, Kozhikode', parentName: 'Ravi Pillai', parentPhone: '9866798765', room: '—', status: 'Active' },
    { id: 'STU-1009', name: 'Karan Malhotra', gender: 'Male', phone: '9877889900', email: 'karan.m@example.com', dob: '2003-06-21', course: 'M.Tech ECE', year: '1st Year', address: '3 Rajouri Garden, Delhi', parentName: 'Deepak Malhotra', parentPhone: '9877898765', room: '204', status: 'Active' },
    { id: 'STU-1010', name: 'Isha Bhatt', gender: 'Other', phone: '9888990011', email: 'isha.bhatt@example.com', dob: '2004-10-03', course: 'B.Tech Mech', year: '2nd Year', address: '27 Navrangpura, Ahmedabad', parentName: 'Nilesh Bhatt', parentPhone: '9888998765', room: '311', status: 'Active' },
    { id: 'STU-1011', name: 'Devansh Joshi', gender: 'Male', phone: '9899001122', email: 'devansh.j@example.com', dob: '2003-04-11', course: 'B.Sc Physics', year: '3rd Year', address: '41 Vaishali Nagar, Jaipur', parentName: 'Rakesh Joshi', parentPhone: '9899098765', room: '118', status: 'Active' },
    { id: 'STU-1012', name: 'Tanya Kapoor', gender: 'Female', phone: '9800112244', email: 'tanya.kapoor@example.com', dob: '2004-08-27', course: 'B.Com', year: '1st Year', address: '16 Sector 21, Chandigarh', parentName: 'Ashok Kapoor', parentPhone: '9800198766', room: '—', status: 'Active' }
  ];

  let filteredStudents = [...students];
  let sortState = { key: 'id', dir: 'asc' };
  let genderFilter = 'all';
  let editingId = null;
  let deleteTargetId = null;

  const tbody = document.getElementById('studentTableBody');
  const emptyState = document.getElementById('studentEmptyState');
  const studentCount = document.getElementById('studentCount');
  const searchInput = document.getElementById('studentSearch');
  const statusFilter = document.getElementById('statusFilter');
  const courseFilter = document.getElementById('courseFilter');

  // Populate course filter dynamically from data
  const courses = [...new Set(students.map(s => s.course))].sort();
  courseFilter.innerHTML = '<option value="all">All Courses</option>' +
    courses.map(c => `<option value="${c}">${c}</option>`).join('');

  const statusTagClass = { Active: 'tag-teal', Inactive: 'tag-slate', Alumni: 'tag-amber' };

  function initials(name){
    return name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
  }

  function applyFilters(){
    const q = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const course = courseFilter.value;

    filteredStudents = students.filter(s => {
      const matchesQuery = !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || s.status === status;
      const matchesCourse = course === 'all' || s.course === course;
      const matchesGender = genderFilter === 'all' || s.gender === genderFilter;
      return matchesQuery && matchesStatus && matchesCourse && matchesGender;
    });

    applySort();
    render();
  }

  function applySort(){
    const { key, dir } = sortState;
    filteredStudents.sort((a, b) => {
      let av = a[key === 'room' ? 'room' : key];
      let bv = b[key === 'room' ? 'room' : key];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function render(){
    studentCount.textContent = `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`;

    if (filteredStudents.length === 0){
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filteredStudents.map(s => `
      <tr>
        <td class="cell-id">${s.id}</td>
        <td>
          <div class="name-cell">
            <span class="avatar-chip">${initials(s.name)}</span>
            <span class="cell-primary">${s.name}</span>
          </div>
        </td>
        <td>${s.gender}</td>
        <td>${s.phone}</td>
        <td class="cell-sub">${s.email}</td>
        <td>${s.course}</td>
        <td>${s.year}</td>
        <td>${s.room}</td>
        <td><span class="key-tag ${statusTagClass[s.status] || 'tag-slate'}">${s.status}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-icon" title="View" data-action="view" data-id="${s.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon" title="Edit" data-action="edit" data-id="${s.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon" title="Delete" data-action="delete" data-id="${s.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ---- Search / filters ----
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  courseFilter.addEventListener('change', applyFilters);

  document.querySelectorAll('.filter-pill[data-gender]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill[data-gender]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      genderFilter = pill.dataset.gender;
      applyFilters();
    });
  });

  // ---- Sorting ----
  document.querySelectorAll('#studentTable thead th[data-sort]').forEach(th => {
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

  // ---- Add / Edit form ----
  const studentForm = document.getElementById('studentForm');
  const studentModalTitle = document.getElementById('studentModalTitle');

  const formFields = {
    studentId: document.getElementById('f_studentId'),
    name: document.getElementById('f_name'),
    gender: document.getElementById('f_gender'),
    dob: document.getElementById('f_dob'),
    phone: document.getElementById('f_phone'),
    email: document.getElementById('f_email'),
    course: document.getElementById('f_course'),
    year: document.getElementById('f_year'),
    address: document.getElementById('f_address'),
    parentName: document.getElementById('f_parentName'),
    parentPhone: document.getElementById('f_parentPhone')
  };

  function resetForm(){
    studentForm.reset();
    Object.values(formFields).forEach(f => f.closest('.form-field')?.classList.remove('invalid'));
    editingId = null;
  }

  document.getElementById('addStudentBtn').addEventListener('click', () => {
    resetForm();
    studentModalTitle.textContent = 'Add Student';
    openModal('studentModalOverlay');
  });

  function populateForm(s){
    formFields.studentId.value = s.id;
    formFields.name.value = s.name;
    formFields.gender.value = s.gender;
    formFields.dob.value = s.dob;
    formFields.phone.value = s.phone;
    formFields.email.value = s.email;
    formFields.course.value = s.course;
    formFields.year.value = s.year;
    formFields.address.value = s.address;
    formFields.parentName.value = s.parentName;
    formFields.parentPhone.value = s.parentPhone;
  }

  function validateStudentForm(){
    let valid = true;
    function check(field, condition){
      const wrap = field.closest('.form-field');
      wrap.classList.toggle('invalid', !condition);
      if (!condition) valid = false;
    }
    check(formFields.studentId, formFields.studentId.value.trim().length > 0);
    check(formFields.name, formFields.name.value.trim().length > 0);
    check(formFields.gender, formFields.gender.value !== '');
    check(formFields.phone, /^\d{10}$/.test(formFields.phone.value.trim()));
    check(formFields.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formFields.email.value.trim()));
    check(formFields.course, formFields.course.value.trim().length > 0);
    check(formFields.year, formFields.year.value !== '');
    return valid;
  }

  studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStudentForm()) return;

    const data = {
      id: formFields.studentId.value.trim(),
      name: formFields.name.value.trim(),
      gender: formFields.gender.value,
      dob: formFields.dob.value,
      phone: formFields.phone.value.trim(),
      email: formFields.email.value.trim(),
      course: formFields.course.value.trim(),
      year: formFields.year.value,
      address: formFields.address.value.trim(),
      parentName: formFields.parentName.value.trim(),
      parentPhone: formFields.parentPhone.value.trim()
    };

    if (editingId){
      // TODO: Replace with PUT /api/students/:id
      const idx = students.findIndex(s => s.id === editingId);
      students[idx] = { ...students[idx], ...data };
      showToast('Student updated successfully.', 'success');
    } else {
      // TODO: Replace with POST /api/students
      students.push({ ...data, room: '—', status: 'Active' });
      showToast('Student added successfully.', 'success');
      const updatedCourses = [...new Set(students.map(s => s.course))].sort();
      courseFilter.innerHTML = '<option value="all">All Courses</option>' +
        updatedCourses.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    closeModal('studentModalOverlay');
    applyFilters();
  });

  // ---- View modal ----
  function openView(s){
    document.getElementById('viewAvatar').textContent = initials(s.name);
    document.getElementById('viewName').textContent = s.name;
    document.getElementById('viewId').textContent = s.id;
    const rows = [
      ['Gender', s.gender], ['Date of Birth', s.dob || '—'],
      ['Phone', s.phone], ['Email', s.email],
      ['Course', s.course], ['Year', s.year],
      ['Assigned Room', s.room], ['Status', s.status],
      ['Parent Name', s.parentName || '—'], ['Parent Phone', s.parentPhone || '—'],
      ['Address', s.address || '—']
    ];
    document.getElementById('viewDetails').innerHTML = rows.map(([label, value]) => `
      <div class="vd-item"><div class="vd-label">${label}</div><div class="vd-value">${value}</div></div>
    `).join('');
    openModal('viewModalOverlay');
  }

  // ---- Table action delegation ----
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const student = students.find(s => s.id === id);
    if (!student) return;

    if (btn.dataset.action === 'view'){
      openView(student);
    } else if (btn.dataset.action === 'edit'){
      resetForm();
      editingId = id;
      studentModalTitle.textContent = 'Edit Student';
      populateForm(student);
      openModal('studentModalOverlay');
    } else if (btn.dataset.action === 'delete'){
      deleteTargetId = id;
      document.getElementById('confirmText').textContent =
        `This will permanently remove ${student.name} (${student.id}) from student records. This action cannot be undone.`;
      openModal('confirmModalOverlay');
    }
  });

  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (!deleteTargetId) return;
    // TODO: Replace with DELETE /api/students/:id
    students = students.filter(s => s.id !== deleteTargetId);
    deleteTargetId = null;
    closeModal('confirmModalOverlay');
    applyFilters();
    showToast('Student deleted.', 'success');
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
