/* =========================================================
   DASHBOARD PAGE — AUTHENTICATED REAL DATA
   Protected by JWT auth via api.checkAuth(), fetches live stats.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Guard page with backend authentication check
    const user = await api.checkAuth();
    if (!user) return; // checkAuth handles redirection to login.html

    // 2. Wire up Logout
    const logoutBtn = document.getElementById('logoutLink');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            api.logout();
        });
    }

    // 3. UI references
    const statGrid = document.getElementById('statGrid');
    const occupancyWrap = document.getElementById('occupancyWrap');
    const activityList = document.getElementById('activityList');

    // Default static activity items (or can be dynamic from recent DB events)
    const recentActivity = [
        { type: 'brass', text: '<b>System</b> synchronized hostel database', time: 'Just now' },
        { type: 'teal', text: '<b>Admin session</b> authenticated securely via JWT', time: 'Live' },
        { type: 'brass', text: 'Resident records and room allocations loaded', time: 'Today' }
    ];

    const iconMap = {
        brass: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
        teal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        rust: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };

    function renderActivity(items) {
        if (!activityList) return;
        activityList.innerHTML = items.map(a => `
            <div class="activity-item">
                <div class="activity-dot ${a.type}">${iconMap[a.type] || iconMap.brass}</div>
                <div>
                    <div class="activity-text">${a.text}</div>
                    <div class="activity-time">${a.time}</div>
                </div>
            </div>
        `).join('');
    }

    function renderSummary(summaryData) {
        if (!statGrid) return;
        statGrid.innerHTML = summaryData.map(s => `
            <div class="stat-card" style="--tint:${s.tint}">
                <div class="stat-label">${s.label}</div>
                <div class="stat-value">${s.value}</div>
                <div class="stat-foot">${s.foot}</div>
            </div>
        `).join('');
    }

    function renderOccupancy(floors) {
        if (!occupancyWrap) return;
        occupancyWrap.innerHTML = floors.map(f => {
            const pct = f.total > 0 ? Math.round((f.occupied / f.total) * 100) : 0;
            const level = pct >= 85 ? 'high' : pct <= 60 ? 'low' : '';
            return `
                <div class="occ-row">
                    <div class="occ-label">${f.floor}</div>
                    <div class="occ-track"><div class="occ-fill ${level}" style="width:${pct}%"></div></div>
                    <div class="occ-value">${f.occupied}/${f.total}</div>
                </div>
            `;
        }).join('');
    }

    // 4. Fetch live dashboard data from backend
    try {
        const response = await api.get('/api/dashboard');
        const dash = response.data;

        if (dash) {
            if (dash.summary) renderSummary(dash.summary);
            if (dash.floorOccupancy) renderOccupancy(dash.floorOccupancy);
        }
        renderActivity(recentActivity);
    } catch (err) {
        console.error('Failed to load dashboard data from backend:', err);
    }

    // 5. Sidebar toggle (mobile view)
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
});
