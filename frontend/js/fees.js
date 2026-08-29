/* =========================================================
   FEE MANAGEMENT PAGE — FRONTEND ONLY
   All data below is placeholder JSON, kept in memory only.
   No localStorage, no fetch(), no backend calls.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // TODO: Replace this dummy data with GET /api/fees
  let fees = [
    { id: 'FEE-01', student: 'Ananya Rao', studentId: 'STU-1001', room: '204', amount: 42000, dueDate: '2026-08-10', status: 'Pending' },
    { id: 'FEE-02', student: 'Vikram Iyer', studentId: 'STU-1002', room: '118', amount: 38000, dueDate: '2026-07-15', status: 'Paid' },
    { id: 'FEE-03', student: 'Priya Nair', studentId: 'STU-1004', room: '311', amount: 45000, dueDate: '2026-07-28', status: 'Pending' },
    { id: 'FEE-04', student: 'Rohan Deshmukh', studentId: 'STU-1005', room: '204', amount: 38000, dueDate: '2026-06-30', status: 'Pending' },
    { id: 'FEE-05', student: 'Sneha Kulkarni', studentId: 'STU-1006', room: '311', amount: 45000, dueDate: '2026-08-05', status: 'Paid' },
    { id: 'FEE-06', student: 'Aditya Verma', studentId: 'STU-1007', room: '118', amount: 38000, dueDate: '2026-07-20', status: 'Paid' },
    { id: 'FEE-07', student: 'Karan Malhotra', studentId: 'STU-1009', room: '204', amount: 42000, dueDate: '2026-08-18', status: 'Pending' },
    { id: 'FEE-08', student: 'Isha Bhatt', studentId: 'STU-1010', room: '311', amount: 45000, dueDate: '2026-08-02', status: 'Paid' },
    { id: 'FEE-09', student: 'Devansh Joshi', studentId: 'STU-1011', room: '118', amount: 38000, dueDate: '2026-07-05', status: 'Pending' }
  ];

  // TODO: Replace this dummy data with GET /api/fees/:id/history
  const paymentHistory = {
    'FEE-02': [
      { date: '2026-07-14', amount: 38000, method: 'UPI' },
      { date: '2026-01-12', amount: 38000, method: 'Bank Transfer' }
    ],
    'FEE-05': [ { date: '2026-08-01', amount: 45000, method: 'Cash' } ],
    'FEE-06': [ { date: '2026-07-18', amount: 38000, method: 'Card' } ],
    'FEE-08': [ { date: '2026-08-01', amount: 45000, method: 'UPI' } ]
  };

  let filteredFees = [...fees];
  let sortState = { key: 'dueDate', dir: 'asc' };
  let statusFilter = 'all';
  let paymentTargetId = null;

  const tbody = document.getElementById('feeTableBody');
  const emptyState = document.getElementById('feeEmptyState');
  const feeCount = document.getElementById('feeCount');
  const searchInput = document.getElementById('feeSearch');
  const feeSummaryGrid = document.getElementById('feeSummaryGrid');

  const currency = (n) => '₹' + n.toLocaleString('en-IN');
  const today = new Date('2026-08-04');

  function renderSummary(){
    const totalCollected = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
    const totalPending = fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);
    const paidCount = fees.filter(f => f.status === 'Paid').length;
    const pendingCount = fees.filter(f => f.status === 'Pending').length;
    const overdueCount = fees.filter(f => f.status === 'Pending' && new Date(f.dueDate) < today).length;

    const cards = [
      { label: 'Total Collected', value: currency(totalCollected), foot: `${paidCount} payments received`, tint: 'var(--teal-tint)' },
      { label: 'Total Pending', value: currency(totalPending), foot: `${pendingCount} students pending`, tint: 'var(--rust-tint)' },
      { label: 'Overdue Payments', value: overdueCount, foot: 'Past due date', tint: 'var(--amber-tint)' },
      { label: 'Collection Rate', value: `${Math.round((paidCount / fees.length) * 100)}%`, foot: `${fees.length} total records`, tint: 'var(--brass-tint)' }
    ];

    feeSummaryGrid.innerHTML = cards.map(c => `
      <div class="stat-card" style="--tint:${c.tint}">
        <div class="stat-label">${c.label}</div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-foot">${c.foot}</div>
      </div>
    `).join('');
  }

  function applyFilters(){
    const q = searchInput.value.trim().toLowerCase();
    filteredFees = fees.filter(f => {
      const matchesQuery = !q || f.student.toLowerCase().includes(q) || f.room.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    applySort();
    render();
  }

  function applySort(){
    const { key, dir } = sortState;
    filteredFees.sort((a, b) => {
      let av = a[key], bv = b[key];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function render(){
    feeCount.textContent = `${filteredFees.length} record${filteredFees.length !== 1 ? 's' : ''}`;

    if (filteredFees.length === 0){
      tbody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = filteredFees.map(f => {
      const isOverdue = f.status === 'Pending' && new Date(f.dueDate) < today;
      return `
      <tr>
        <td>
          <div class="cell-primary">${f.student}</div>
          <div class="cell-sub">${f.studentId}</div>
        </td>
        <td>${f.room}</td>
        <td class="amount-cell">${currency(f.amount)}</td>
        <td class="due-cell ${isOverdue ? 'overdue' : ''}">${f.dueDate}${isOverdue ? ' (Overdue)' : ''}</td>
        <td><span class="key-tag ${f.status === 'Paid' ? 'tag-teal' : 'tag-rust'}">${f.status}</span></td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" data-action="pay" data-id="${f.id}" ${f.status === 'Paid' ? 'disabled' : ''}>Record Payment</button>
            <button class="btn btn-ghost btn-sm" data-action="history" data-id="${f.id}">View History</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
  }

  // ---- Search / filters ----
  searchInput.addEventListener('input', applyFilters);

  const filterButtons = {
    all: document.getElementById('filterAll'),
    Paid: document.getElementById('filterPaid'),
    Pending: document.getElementById('filterPending')
  };
  Object.entries(filterButtons).forEach(([key, btn]) => {
    btn.addEventListener('click', () => {
      Object.values(filterButtons).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statusFilter = key;
      applyFilters();
    });
  });

  // ---- Sorting ----
  document.querySelectorAll('#feeTable thead th[data-sort]').forEach(th => {
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

  // ---- Record payment form ----
  const paymentForm = document.getElementById('paymentForm');
  const pf = {
    student: document.getElementById('p_student'),
    amount: document.getElementById('p_amount'),
    method: document.getElementById('p_method'),
    date: document.getElementById('p_date'),
    notes: document.getElementById('p_notes')
  };

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn || btn.disabled) return;
    const id = btn.dataset.id;
    const fee = fees.find(f => f.id === id);
    if (!fee) return;

    if (btn.dataset.action === 'pay'){
      paymentTargetId = id;
      paymentForm.reset();
      Object.values(pf).forEach(f => f.closest('.form-field')?.classList.remove('invalid'));
      pf.student.value = `${fee.student} (${fee.studentId})`;
      pf.amount.value = currency(fee.amount);
      openModal('paymentModalOverlay');
    } else if (btn.dataset.action === 'history'){
      document.getElementById('historyModalTitle').textContent = `Payment History — ${fee.student}`;
      const history = paymentHistory[fee.id] || [];
      const historyList = document.getElementById('historyList');
      if (history.length === 0){
        historyList.innerHTML = `<div class="empty-state"><div class="e-title">No payments yet</div><div class="e-sub">This student has no recorded payment history.</div></div>`;
      } else {
        historyList.innerHTML = history.map(h => `
          <div class="hist-row">
            <div class="hist-left">
              <div class="h-title">${h.method}</div>
              <div class="h-sub">${h.date}</div>
            </div>
            <div class="hist-amount">${currency(h.amount)}</div>
          </div>
        `).join('');
      }
      openModal('historyModalOverlay');
    }
  });

  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    function check(field, condition){
      const wrap = field.closest('.form-field');
      wrap.classList.toggle('invalid', !condition);
      if (!condition) valid = false;
    }
    check(pf.method, pf.method.value !== '');
    check(pf.date, pf.date.value !== '');
    if (!valid) return;

    // TODO: Replace with POST /api/fees/:id/payments
    const idx = fees.findIndex(f => f.id === paymentTargetId);
    if (idx > -1){
      fees[idx].status = 'Paid';
      if (!paymentHistory[fees[idx].id]) paymentHistory[fees[idx].id] = [];
      paymentHistory[fees[idx].id].unshift({ date: pf.date.value, amount: fees[idx].amount, method: pf.method.value });
    }

    closeModal('paymentModalOverlay');
    renderSummary();
    applyFilters();
    showToast('Payment recorded successfully.', 'success');
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
  renderSummary();
  applySort();
  render();
});
