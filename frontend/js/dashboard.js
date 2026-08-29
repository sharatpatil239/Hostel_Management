/* =========================================================
   DASHBOARD PAGE — FRONTEND ONLY
   All data below is placeholder JSON. Replace with real data
   fetched from backend APIs once available.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // TODO: Replace this dummy data with GET /api/dashboard/summary
  const dashboardSummary = [
    { label: 'Total Students', value: 186, foot: '+6 this month', tint: 'var(--brass-tint)' },
    { label: 'Total Rooms', value: 64, foot: 'Across 4 floors', tint: 'var(--teal-tint)' },
    { label: 'Occupied Rooms', value: 51, foot: '79.7% occupancy', tint: 'var(--amber-tint)' },
    { label: 'Available Rooms', value: 13, foot: 'Ready for allocation', tint: 'var(--teal-tint)' },
    { label: 'Pending Fees', value: '₹4.82L', foot: '38 students pending', tint: 'var(--rust-tint)' }
  ];

  // TODO: Replace this dummy data with GET /api/dashboard/occupancy
  const floorOccupancy = [
    { floor: 'Ground Floor', occupied: 14, total: 16 },
    { floor: '1st Floor', occupied: 15, total: 18 },
    { floor: '2nd Floor', occupied: 12, total: 16 },
    { floor: '3rd Floor', occupied: 10, total: 14 }
  ];

  // TODO: Replace this dummy data with GET /api/dashboard/activity
  const recentActivity = [
    { type: 'brass', text: '<b>Ananya Rao</b> was allocated to Room 204', time: '10 minutes ago' },
    { type: 'teal', text: '<b>Vikram Iyer</b> paid pending hostel fees', time: '42 minutes ago' },
    { type: 'rust', text: '<b>Room 118</b> fee payment marked overdue', time: '1 hour ago' },
    { type: 'brass', text: 'New student <b>Farhan Sheikh</b> registered', time: '3 hours ago' },
    { type: 'teal', text: '<b>Room 305</b> status updated to Available', time: 'Yesterday' }
  ];

  // ---- Render stat cards ----
  const statGrid = document.getElementById('statGrid');
  statGrid.innerHTML = dashboardSummary.map(s => `
    <div class="stat-card" style="--tint:${s.tint}">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-foot">${s.foot}</div>
    </div>
  `).join('');

  // ---- Render occupancy bars ----
  const occupancyWrap = document.getElementById('occupancyWrap');
  occupancyWrap.innerHTML = floorOccupancy.map(f => {
    const pct = Math.round((f.occupied / f.total) * 100);
    const level = pct >= 85 ? 'high' : pct <= 60 ? 'low' : '';
    return `
      <div class="occ-row">
        <div class="occ-label">${f.floor}</div>
        <div class="occ-track"><div class="occ-fill ${level}" style="width:${pct}%"></div></div>
        <div class="occ-value">${f.occupied}/${f.total}</div>
      </div>
    `;
  }).join('');

  // ---- Render recent activity ----
  const activityList = document.getElementById('activityList');
  const iconMap = {
    brass: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
    teal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    rust: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  activityList.innerHTML = recentActivity.map(a => `
    <div class="activity-item">
      <div class="activity-dot ${a.type}">${iconMap[a.type]}</div>
      <div>
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');

  // ---- Sidebar toggle (mobile) ----
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  sidebarToggle && sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  // ---- Logout ----
  document.getElementById('logoutLink').addEventListener('click', () => {
    // TODO: Replace with real session/token invalidation call when backend exists.
  });
});
