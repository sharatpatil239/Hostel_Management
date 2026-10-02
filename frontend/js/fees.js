/* =========================================================
   FEE MANAGEMENT PAGE — AUTHENTICATED REAL DATA
   Protected by JWT auth, connects to /api/fees endpoints.
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

    let fees = [];
    let paymentHistory = {};
    let filteredFees = [];
    let sortState = { key: 'dueDate', dir: 'asc' };
    let statusFilter = 'all';
    let paymentTargetId = null;

    const tbody = document.getElementById('feeTableBody');
    const emptyState = document.getElementById('feeEmptyState');
    const feeCount = document.getElementById('feeCount');
    const searchInput = document.getElementById('feeSearch');
    const feeSummaryGrid = document.getElementById('feeSummaryGrid');

    const currency = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN');
    const today = new Date();

    function renderSummary() {
        if (!feeSummaryGrid) return;

        const totalCollected = fees
            .filter(f => f.status === 'Paid')
            .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const totalPending = fees
            .filter(f => f.status === 'Pending')
            .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        const paidCount = fees.filter(f => f.status === 'Paid').length;
        const pendingCount = fees.filter(f => f.status === 'Pending').length;
        const overdueCount = fees.filter(f => f.status === 'Pending' && new Date(f.dueDate) < today).length;
        const collectionRate = fees.length ? Math.round((paidCount / fees.length) * 100) : 0;

        const cards = [
            { label: 'Total Collected', value: currency(totalCollected), foot: `${paidCount} payment${paidCount !== 1 ? 's' : ''} received`, tint: 'var(--teal-tint)' },
            { label: 'Total Pending', value: currency(totalPending), foot: `${pendingCount} student${pendingCount !== 1 ? 's' : ''} pending`, tint: 'var(--rust-tint)' },
            { label: 'Overdue Payments', value: overdueCount, foot: 'Past due date', tint: 'var(--amber-tint)' },
            { label: 'Collection Rate', value: `${collectionRate}%`, foot: `${fees.length} total records`, tint: 'var(--brass-tint)' }
        ];

        feeSummaryGrid.innerHTML = cards.map(c => `
            <div class="stat-card" style="--tint:${c.tint}">
                <div class="stat-label">${c.label}</div>
                <div class="stat-value">${c.value}</div>
                <div class="stat-foot">${c.foot}</div>
            </div>
        `).join('');
    }

    function applyFilters() {
        const q = searchInput.value.trim().toLowerCase();

        filteredFees = fees.filter(f => {
            const stuName = (f.studentName || (f.student && f.student.name) || '').toLowerCase();
            const stuId = (f.studentId || (f.student && f.student.studentId) || '').toLowerCase();
            const feeNum = (f.feeId || f.id || '').toLowerCase();
            const rm = (f.room || (f.student && f.student.room) || '').toLowerCase();

            const matchesQuery = !q ||
                stuName.includes(q) ||
                stuId.includes(q) ||
                feeNum.includes(q) ||
                rm.includes(q);

            const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
            return matchesQuery && matchesStatus;
        });

        applySort();
        render();
    }

    function applySort() {
        const { key, dir } = sortState;
        filteredFees.sort((a, b) => {
            let av = a[key];
            let bv = b[key];
            if (key === 'amount') {
                av = Number(av) || 0;
                bv = Number(bv) || 0;
            } else if (key === 'dueDate') {
                av = new Date(av).getTime() || 0;
                bv = new Date(bv).getTime() || 0;
            } else {
                av = String(av || '').toLowerCase();
                bv = String(bv || '').toLowerCase();
            }
            if (av < bv) return dir === 'asc' ? -1 : 1;
            if (av > bv) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function formatDate(dStr) {
        if (!dStr) return '—';
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return dStr;
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function render() {
        feeCount.textContent = `${filteredFees.length} fee record${filteredFees.length !== 1 ? 's' : ''}`;

        if (filteredFees.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        tbody.innerHTML = filteredFees.map(f => {
            const studentName = f.studentName || (f.student && f.student.name) || 'Resident';
            const studentId = f.studentId || (f.student && f.student.studentId) || '—';
            const roomNum = f.room || (f.student && f.student.room) || '—';
            const isPaid = f.status === 'Paid';
            const isOverdue = !isPaid && new Date(f.dueDate) < today;

            return `
                <tr>
                    <td class="cell-id"><b>${f.feeId || f.id}</b></td>
                    <td>
                        <div class="name-cell">
                            <div>
                                <div class="cell-primary">${studentName}</div>
                                <div class="cell-sub">${studentId}</div>
                            </div>
                        </div>
                    </td>
                    <td>${roomNum}</td>
                    <td><b>${currency(f.amount)}</b></td>
                    <td>
                        <div>${formatDate(f.dueDate)}</div>
                        ${isOverdue ? '<span class="key-tag tag-rust" style="font-size:10px; padding:1px 6px;">Overdue</span>' : ''}
                    </td>
                    <td>
                        <span class="key-tag ${isPaid ? 'tag-teal' : 'tag-amber'}">
                            ${f.status}
                        </span>
                    </td>
                    <td>
                        <div class="row-actions">
                            ${!isPaid ? `
                                <button class="btn btn-ghost btn-sm" data-action="pay" data-id="${f._id || f.id}">
                                    Record Pay
                                </button>
                            ` : `
                                <button class="btn btn-ghost btn-icon" title="History" data-action="history" data-id="${f.feeId || f.id}">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Load fees from backend
    async function loadFees() {
        try {
            const response = await api.get('/api/fees');
            const data = response.data || [];
            fees = data.map(f => ({
                ...f,
                id: f.feeId || (f._id ? 'FEE-' + f._id.slice(-4).toUpperCase() : 'FEE')
            }));
            renderSummary();
            applyFilters();
        } catch (error) {
            showToast(error.message || 'Failed to load fee records from server', 'error');
        }
    }

    // Filter pills
    document.querySelectorAll('.filter-pill[data-status]').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill[data-status]').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            statusFilter = pill.dataset.status;
            applyFilters();
        });
    });

    searchInput.addEventListener('input', applyFilters);

    // Sorting
    document.querySelectorAll('#feeTable thead th[data-sort]').forEach(th => {
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

    // Modal helpers
    function openModal(id) { document.getElementById(id).classList.add('open'); }
    function closeModal(id) { document.getElementById(id).classList.remove('open'); }

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
    });

    // Record payment form
    const paymentForm = document.getElementById('paymentForm');
    const paymentDateInput = document.getElementById('p_date');
    if (paymentDateInput) {
        paymentDateInput.value = new Date().toISOString().split('T')[0];
    }

    // Table action delegation
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const fee = fees.find(f => (f._id === id || f.id === id || f.feeId === id));
        if (!fee) return;

        if (btn.dataset.action === 'pay') {
            paymentTargetId = fee._id || fee.id;
            document.getElementById('p_feeId').textContent = fee.feeId || fee.id;
            document.getElementById('p_student').textContent =
                (fee.studentName || (fee.student && fee.student.name) || 'Resident');
            document.getElementById('p_amount').textContent = currency(fee.amount);
            openModal('paymentModalOverlay');
        } else if (btn.dataset.action === 'history') {
            const historyTitle = document.getElementById('historyModalTitle');
            const historyList = document.getElementById('historyList');
            historyTitle.textContent = `Payment History — ${fee.feeId || fee.id}`;

            const records = paymentHistory[fee.feeId || fee.id] || [
                { date: formatDate(fee.dueDate), amount: fee.amount, method: 'Direct Payment' }
            ];

            historyList.innerHTML = records.map(r => `
                <div class="history-item">
                    <div>
                        <div class="h-date">${r.date}</div>
                        <div class="h-method">${r.method}</div>
                    </div>
                    <div class="h-amount">${currency(r.amount)}</div>
                </div>
            `).join('');
            openModal('historyModalOverlay');
        }
    });

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!paymentTargetId) return;

        const method = document.getElementById('p_method').value;
        const date = document.getElementById('p_date').value;

        try {
            await api.put(`/api/fees/${paymentTargetId}`, { status: 'Paid' });

            // Record in local history cache
            const targetFee = fees.find(f => (f._id === paymentTargetId || f.id === paymentTargetId));
            const feeKey = targetFee ? (targetFee.feeId || targetFee.id) : paymentTargetId;
            if (!paymentHistory[feeKey]) paymentHistory[feeKey] = [];
            paymentHistory[feeKey].push({
                date: formatDate(date),
                amount: targetFee ? targetFee.amount : 0,
                method
            });

            closeModal('paymentModalOverlay');
            showToast('Payment recorded successfully.', 'success');
            await loadFees();
        } catch (err) {
            showToast(err.message || 'Failed to record payment', 'error');
        }
    });

    function showToast(message, type = '') {
        const stack = document.getElementById('toastStack');
        if (!stack) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type ? 'toast-' + type : ''}`;
        toast.textContent = message;
        stack.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }

    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Initial load from backend
    await loadFees();
});
