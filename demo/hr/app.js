/* ============================================================
   HR Portal demo: a static, client-side copy of the HR back office.
   Hash router + small render helpers. Every write stays in memory.
   ============================================================ */
(function () {
    'use strict';

    const D = window.DemoData;
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = (s) => (s ? D.fmt(s) : '—');
    const todayIso = D.iso(D.today);

    /* ---------- Menu (mirrors the real sidebar groups) ---------- */
    const ICONS = {
        home: 'M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L22.5 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
        people: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z',
        requests: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
        setup: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
        reports: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
        admin: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    };
    const pendingCount = (k) => ({
        leave: () => D.requests.leave.filter((r) => r.supervisor === 'Approved' && r.hr === 'Not posted').length,
        adjustments: () => D.requests.adjustments.filter((r) => r.hr === 'Pending').length,
        eeo: () => D.requests.eeo.filter((r) => r.hr === 'Awaiting HR').length,
        movement: () => D.requests.movement.filter((r) => r.hr === 'Pending').length,
        hso: () => D.requests.hso.filter((r) => r.hr === 'Awaiting HR').length,
        transfer: () => D.requests.transfer.filter((r) => r.hr === 'Awaiting HR').length,
    }[k] || (() => 0))();

    const NAV = [
        { key: 'people', label: 'People', icon: 'people', items: [['employees', 'Employees'], ['attendance', 'Attendance'], ['infractions', 'Infractions'], ['resigned', 'Resigned'], ['blacklisted', 'Blacklisted']] },
        { key: 'requests', label: 'Requests', icon: 'requests', items: [['requests/leave', 'Leave', 'leave'], ['requests/adjustments', 'Time Adjustments', 'adjustments'], ['requests/overtime', 'Overtime'], ['requests/eeo', 'EEO', 'eeo'], ['requests/movement', 'Movement', 'movement'], ['requests/hso', 'HSO', 'hso'], ['requests/transfer', 'Site Transfer', 'transfer']] },
        { key: 'setup', label: 'Setup', icon: 'setup', items: [['setup/leave-credits', 'Leave Credits'], ['setup/protocols', 'Leave Protocols'], ['setup/insurance', 'HMO & Insurance']] },
        { key: 'reports', label: 'Trackers', icon: 'reports', items: [['reports/movement', 'Movement Tracker'], ['reports/points', 'Points Tracker'], ['reports/regular', 'Regular Tracker']] },
        { key: 'admin', label: 'Administration', icon: 'admin', items: [['admin/announcements', 'Announcements'], ['admin/edit-history', 'HR Edit History'], ['admin/monitoring', 'HRIS Monitoring']] },
    ];
    const svg = (d, cls = 'app-nav-icon') => `<svg class="${cls}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`;

    function renderNav(route) {
        const groupOf = (r) => NAV.find((g) => g.items.some(([p]) => r === p || r.startsWith(p + '/')) || (g.key === 'people' && r.startsWith('employee/')));
        const current = groupOf(route);
        let html = `<a href="#/dashboard" class="app-nav-link ${route === 'dashboard' ? 'is-active' : ''}">${svg(ICONS.home)}<span class="app-nav-label">Dashboard</span></a>`;
        NAV.forEach((g) => {
            const open = current === g;
            const total = g.items.reduce((n, it) => n + (it[2] ? pendingCount(it[2]) : 0), 0);
            html += `<div class="app-nav-group" data-group="${g.key}" data-open="${open}">
                <button type="button" class="app-nav-head ${open ? 'is-current' : ''}" aria-expanded="${open}">
                    ${svg(ICONS[g.icon])}<span class="app-nav-label">${g.label}</span>
                    ${total ? `<span class="app-nav-count" title="${total} requests waiting on HR">${total}</span>` : ''}
                    <svg class="app-nav-caret" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                </button>
                <div class="app-nav-panel"><div class="app-nav-panel-inner"><div class="app-nav-list">
                    ${g.items.map(([p, label, c]) => {
                        const n = c ? pendingCount(c) : 0;
                        const act = route === p || route.startsWith(p + '/') || (p === 'employees' && route.startsWith('employee/'));
                        return `<a href="#/${p}" class="app-nav-sub ${act ? 'is-active' : ''}"><span class="app-nav-label">${label}</span>${n ? `<span class="app-nav-count">${n}</span>` : ''}</a>`;
                    }).join('')}
                </div></div></div></div>`;
        });
        $('#appNav').innerHTML = html;
        $$('.app-nav-head').forEach((btn) => btn.addEventListener('click', () => {
            const grp = btn.closest('.app-nav-group');
            const willOpen = grp.dataset.open !== 'true';
            $$('.app-nav-group').forEach((g) => { g.dataset.open = 'false'; g.querySelector('.app-nav-head').setAttribute('aria-expanded', 'false'); });
            grp.dataset.open = String(willOpen);
            btn.setAttribute('aria-expanded', String(willOpen));
        }));
    }

    /* ---------- Small UI helpers ---------- */
    function toast(msg) {
        const t = document.createElement('div');
        t.className = 'hr-toast';
        t.setAttribute('role', 'status');
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2600);
    }
    const badge = (text) => {
        const map = { Approved: 'success', Posted: 'success', Acknowledged: 'success', Done: 'success', Served: 'success', Regular: 'success', Cleared: 'success', P: 'success',
            Pending: 'warning', 'Not posted': 'warning', 'Awaiting HR': 'warning', Issued: 'warning', Probationary: 'warning', LT: 'warning',
            Declined: 'danger', Denied: 'danger', 'For NTE': 'danger', A: 'danger', 'Project-based': 'info', L: 'info' };
        return `<span class="hr-badge hr-badge-${map[text] || 'neutral'}">${esc(text)}</span>`;
    };
    const statusLabel = { P: 'Present', LT: 'Late', A: 'Absent', L: 'On leave', RD: 'Rest day' };
    const empCell = (id, name, sub) => `<a class="demo-emp" href="#/employee/${id}"><span class="app-avatar demo-avatar" aria-hidden="true">${esc(name.split(', ').reverse().map((w) => w[0]).join(''))}</span><span><span class="hr-cell-name">${esc(name)}</span>${sub ? `<span class="hr-cell-muted demo-sub">${esc(sub)}</span>` : ''}</span></a>`;

    function modal(title, sub, body, actions) {
        const root = $('#modalRoot');
        root.innerHTML = `<div class="hr-modal-backdrop"><div class="hr-modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
            <div class="hr-modal-head"><div><h2 class="hr-modal-title" id="mTitle">${title}</h2>${sub ? `<p class="hr-modal-sub">${sub}</p>` : ''}</div>
            <button type="button" class="hr-icon-btn" data-close aria-label="Close">✕</button></div>
            <div class="hr-modal-scroll">${body}</div>
            <div class="hr-modal-foot"><button type="button" class="hr-btn" data-close>Cancel</button>${actions || ''}</div></div></div>`;
        const close = () => { root.innerHTML = ''; };
        $$('[data-close]', root).forEach((b) => b.addEventListener('click', close));
        $('.hr-modal-backdrop', root).addEventListener('click', (e) => { if (e.target.classList.contains('hr-modal-backdrop')) close(); });
        return { root, close };
    }

    /* ---------- Generic list: search, pills, sort, pager ---------- */
    function list(el, cfg) {
        const state = { q: '', pill: cfg.pills ? cfg.pills[0][0] : null, page: 1, sort: cfg.sort || null, dir: cfg.dir || 'asc' };
        const per = cfg.perPage || 15;
        function rows() {
            let r = cfg.rows();
            if (state.pill && cfg.pillFilter) r = r.filter((x) => cfg.pillFilter(x, state.pill));
            if (state.q) { const q = state.q.toLowerCase(); r = r.filter((x) => cfg.search(x).toLowerCase().includes(q)); }
            if (state.sort) {
                const col = cfg.cols.find((c) => c.key === state.sort);
                const val = col.sortVal || ((x) => x[col.key]);
                r = [...r].sort((a, b) => { const A = val(a), B = val(b); return (A > B ? 1 : A < B ? -1 : 0) * (state.dir === 'asc' ? 1 : -1); });
            }
            return r;
        }
        function draw() {
            const all = rows();
            const pages = Math.max(1, Math.ceil(all.length / per));
            state.page = Math.min(state.page, pages);
            const slice = all.slice((state.page - 1) * per, state.page * per);
            const pillCounts = cfg.pills && cfg.pillFilter ? cfg.pills.map(([k]) => cfg.rows().filter((x) => cfg.pillFilter(x, k)).length) : [];
            el.innerHTML = `
            ${cfg.intro ? `<p class="demo-intro">${cfg.intro}</p>` : ''}
            <div class="demo-toolbar">
                ${cfg.search ? `<div class="hr-search"><svg class="hr-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" width="16" height="16" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg><input class="hr-input" type="search" placeholder="${cfg.placeholder || 'Search name or ID'}" value="${esc(state.q)}" data-q aria-label="Search"></div>` : ''}
                ${cfg.tools || ''}
            </div>
            ${cfg.pills ? `<div class="hr-chips demo-pills">${cfg.pills.map(([k, label], i) => `<button type="button" class="hr-pill ${state.pill === k ? 'active' : ''}" data-pill="${k}">${label}${cfg.pillFilter ? ` <span class="hr-count">${pillCounts[i]}</span>` : ''}</button>`).join('')}</div>` : ''}
            <div class="hr-card hr-table-card">
                <div class="hr-table-scroll"><table class="hr-table">
                    <thead><tr>${cfg.cols.map((c) => `<th${c.right ? ' style="text-align:right"' : ''}>${c.sortable === false ? c.label : `<button type="button" class="hr-sort" data-sort="${c.key}">${c.label}${state.sort === c.key ? (state.dir === 'asc' ? ' ▲' : ' ▼') : ''}</button>`}</th>`).join('')}${cfg.actions ? '<th style="text-align:right">Actions</th>' : ''}</tr></thead>
                    <tbody>${slice.length ? slice.map((x) => `<tr class="${cfg.rowClass ? cfg.rowClass(x) : ''}">${cfg.cols.map((c) => `<td${c.right ? ' style="text-align:right"' : ''}>${c.render ? c.render(x) : esc(x[c.key])}</td>`).join('')}${cfg.actions ? `<td><div class="hr-row-actions demo-actions">${cfg.actions(x)}</div></td>` : ''}</tr>`).join('')
                        : `<tr><td colspan="${cfg.cols.length + (cfg.actions ? 1 : 0)}"><div class="hr-empty"><strong>No matching records</strong>Try another search or filter.</div></td></tr>`}</tbody>
                </table></div>
                <div class="hr-table-foot"><span class="hr-pager-info">${all.length ? `${(state.page - 1) * per + 1}–${Math.min(state.page * per, all.length)} of ${all.length}` : '0 results'}</span>
                    <div class="hr-pager"><button type="button" class="hr-pager-btn" data-pg="-1" ${state.page === 1 ? 'disabled' : ''}>Prev</button><span class="hr-pager-info">Page ${state.page} / ${pages}</span><button type="button" class="hr-pager-btn" data-pg="1" ${state.page === pages ? 'disabled' : ''}>Next</button></div></div>
            </div>`;
            const q = $('[data-q]', el);
            if (q) q.addEventListener('input', (e) => { state.q = e.target.value; state.page = 1; const pos = e.target.selectionStart; draw(); const n = $('[data-q]', el); n.focus(); n.setSelectionRange(pos, pos); });
            $$('[data-pill]', el).forEach((b) => b.addEventListener('click', () => { state.pill = b.dataset.pill; state.page = 1; draw(); }));
            $$('[data-sort]', el).forEach((b) => b.addEventListener('click', () => { const k = b.dataset.sort; state.dir = state.sort === k && state.dir === 'asc' ? 'desc' : 'asc'; state.sort = k; draw(); }));
            $$('[data-pg]', el).forEach((b) => b.addEventListener('click', () => { state.page += Number(b.dataset.pg); draw(); }));
            if (cfg.bind) cfg.bind(el, draw);
        }
        draw();
        return draw;
    }

    /* ==================== PAGES ==================== */
    const pages = {};

    pages.dashboard = (el) => {
        const emps = D.employees;
        const todayRows = emps.map((e) => D.attendance[e.id].at(-1));
        const workday = todayRows.some((r) => r.status !== 'RD');
        const present = todayRows.filter((r) => r.status === 'P' || r.status === 'LT').length;
        const late = todayRows.filter((r) => r.status === 'LT').length;
        const onLeave = todayRows.filter((r) => r.status === 'L').length;
        const pend = ['leave', 'adjustments', 'eeo', 'movement', 'hso', 'transfer'].reduce((n, k) => n + pendingCount(k), 0);
        // last 14 days attendance rate
        const days = [];
        for (let i = 13; i >= 0; i--) {
            const idx = 44 - i;
            const rs = emps.map((e) => D.attendance[e.id][idx]);
            if (rs[0].status === 'RD') continue;
            const p = rs.filter((r) => r.status === 'P').length, l = rs.filter((r) => r.status === 'LT').length;
            days.push({ date: rs[0].date, p, l, a: rs.length - p - l });
        }
        const max = emps.length;
        const byDept = D.DEPARTMENTS.map((d) => ({ ...d, n: emps.filter((e) => e.dept === d.code).length }));
        const regSoon = emps.filter((e) => e.status === 'Probationary').map((e) => ({ e, due: D.iso(D.addDays(new Date(e.hired + 'T00:00:00'), 180)) })).filter((x) => x.due >= todayIso).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);

        el.innerHTML = `
        <div class="demo-kpis">
            ${[['Active employees', emps.length, `${D.resigned.length} resigned this year`],
               ['Present today', workday ? present : '—', workday ? `${late} late · ${onLeave} on leave` : 'Rest day'],
               ['Waiting on HR', pend, 'requests across 6 queues'],
               ['Infraction points', D.infractions.filter((i) => i.status !== 'Served').reduce((n, i) => n + i.points, 0), 'open points, all employees']]
                .map(([l, v, s]) => `<div class="hr-card demo-kpi"><span class="hr-label">${l}</span><strong>${v}</strong><span class="hr-hint">${s}</span></div>`).join('')}
        </div>
        <div class="demo-grid-2">
            <section class="hr-card demo-pad">
                <div class="demo-card-head"><h2>Attendance, last 2 weeks</h2><span class="demo-legend"><i style="background:var(--hr-chart-2)"></i>On time <i style="background:var(--hr-chart-3)"></i>Late <i style="background:var(--hr-border-strong)"></i>Absent/leave</span></div>
                <div class="demo-bars" role="img" aria-label="Stacked daily attendance for the last two weeks">
                    ${days.map((d) => `<div class="demo-bar" title="${fmt(d.date)}: ${d.p} on time, ${d.l} late, ${d.a} absent or on leave">
                        <div class="demo-bar-stack"><span style="height:${(d.a / max) * 100}%;background:var(--hr-border-strong)"></span><span style="height:${(d.l / max) * 100}%;background:var(--hr-chart-3)"></span><span style="height:${(d.p / max) * 100}%;background:var(--hr-chart-2)"></span></div>
                        <span class="demo-bar-label">${d.date.slice(8)}</span></div>`).join('')}
                </div>
            </section>
            <section class="hr-card demo-pad">
                <div class="demo-card-head"><h2>Headcount by department</h2></div>
                ${byDept.map((d) => `<div class="demo-hbar"><span>${d.name}</span><div><i style="width:${(d.n / Math.max(...byDept.map((x) => x.n))) * 100}%"></i></div><strong>${d.n}</strong></div>`).join('')}
            </section>
        </div>
        <div class="demo-grid-2">
            <section class="hr-card demo-pad">
                <div class="demo-card-head"><h2>Request queues</h2></div>
                ${[['requests/leave', 'Leave to post', 'leave'], ['requests/adjustments', 'Time adjustments', 'adjustments'], ['requests/eeo', 'Emergency early out', 'eeo'], ['requests/movement', 'Movement', 'movement'], ['requests/hso', 'Home-site office', 'hso'], ['requests/transfer', 'Site transfer', 'transfer']]
                    .map(([r, l, k]) => `<a class="demo-queue" href="#/${r}"><span>${l}</span>${pendingCount(k) ? `<span class="hr-badge hr-badge-warning">${pendingCount(k)} waiting</span>` : '<span class="hr-badge hr-badge-success">Clear</span>'}</a>`).join('')}
            </section>
            <section class="hr-card demo-pad">
                <div class="demo-card-head"><h2>Due for regularization</h2></div>
                ${regSoon.length ? regSoon.map(({ e, due }) => `<div class="demo-queue">${empCell(e.id, e.name, e.position)}<span class="hr-cell-date">${fmt(due)}</span></div>`).join('') : '<div class="hr-empty"><strong>No one due soon</strong></div>'}
            </section>
        </div>`;
    };

    pages.employees = (el) => list(el, {
        rows: () => D.employees,
        pills: [['all', 'All'], ...D.DEPARTMENTS.map((d) => [d.code, d.code])],
        pillFilter: (e, p) => p === 'all' || e.dept === p,
        search: (e) => `${e.name} ${e.id} ${e.position}`,
        sort: 'name',
        tools: '<button type="button" class="hr-btn hr-btn-primary" data-add>+ Add employee</button><button type="button" class="hr-btn" data-export>Export CSV</button>',
        cols: [
            { key: 'id', label: 'ID', render: (e) => `<span class="hr-cell-id">${e.id}</span>` },
            { key: 'name', label: 'Employee', render: (e) => empCell(e.id, e.name, e.position) },
            { key: 'dept', label: 'Department', render: (e) => esc(e.deptName) },
            { key: 'shift', label: 'Shift', sortVal: (e) => e.shift.code, render: (e) => `<span class="hr-badge hr-badge-neutral">${e.shift.code}</span> <span class="hr-cell-muted">${e.shift.label}</span>` },
            { key: 'site', label: 'Site' },
            { key: 'status', label: 'Status', render: (e) => badge(e.status) },
            { key: 'hired', label: 'Hired', render: (e) => `<span class="hr-cell-date">${fmt(e.hired)}</span>` },
        ],
        actions: (e) => `<a class="hr-btn hr-btn-sm" href="#/employee/${e.id}">View</a>`,
        bind: (el, draw) => {
            $('[data-export]', el).addEventListener('click', () => {
                const csv = ['ID,Name,Department,Position,Shift,Site,Status,Hired', ...D.employees.map((e) => [e.id, `"${e.name}"`, e.deptName, e.position, e.shift.code, e.site, e.status, e.hired].join(','))].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = 'employees-demo.csv';
                a.click();
                toast('Exported ' + D.employees.length + ' employees');
            });
            $('[data-add]', el).addEventListener('click', () => {
                const m = modal('Add employee', 'Creates the employee record and opening leave credits', `
                    <div class="demo-form">
                        <label class="hr-label">First name<input class="hr-input" name="first" required></label>
                        <label class="hr-label">Last name<input class="hr-input" name="last" required></label>
                        <label class="hr-label">Department<select class="hr-input" name="dept">${D.DEPARTMENTS.map((d) => `<option value="${d.code}">${d.name}</option>`).join('')}</select></label>
                        <label class="hr-label">Shift<select class="hr-input" name="shift">${D.SHIFTS.map((s, i) => `<option value="${i}">${s.code} · ${s.label}</option>`).join('')}</select></label>
                    </div><p class="hr-error" data-err hidden>First and last name are required.</p>`,
                    '<button type="button" class="hr-btn hr-btn-primary" data-save>Save employee</button>');
                $('[data-save]', m.root).addEventListener('click', () => {
                    const v = (n) => $(`[name=${n}]`, m.root).value.trim();
                    if (!v('first') || !v('last')) { $('[data-err]', m.root).hidden = false; return; }
                    const dept = D.DEPARTMENTS.find((d) => d.code === v('dept'));
                    const id = Math.max(...D.allEmployees.map((e) => e.id)) + 1;
                    const e = { id, first: v('first'), last: v('last'), name: `${v('last')}, ${v('first')}`, display: `${v('first')} ${v('last')}`, dept: dept.code, deptName: dept.name, position: 'New hire', shift: D.SHIFTS[v('shift')], site: 'Main Site', status: 'Probationary', hired: todayIso, birthday: '01-01', email: '—', mobile: '—', sl: 0, vl: 0, slUsed: 0, vlUsed: 0, points: 0, hmo: false };
                    D.employees.unshift(e); D.allEmployees.push(e);
                    D.attendance[id] = D.attendance[D.employees[1].id].map((r) => ({ date: r.date, status: 'RD' }));
                    m.close(); draw(); toast(`Added ${e.display} (ID ${id})`);
                });
            });
        },
    });

    pages.employee = (el, id) => {
        const e = D.byId(id);
        if (!e) { el.innerHTML = '<div class="hr-empty"><strong>Employee not found</strong></div>'; return; }
        $('#pageTitle').textContent = e.display;
        const att = D.attendance[e.id] || [];
        const tab = (sessionStorage.getItem('emp-tab') || 'profile');
        const facts = (pairs) => `<dl class="demo-facts">${pairs.map(([k, v]) => `<div class="hr-tile"><dt class="hr-label">${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
        const svc = Math.floor((D.today - new Date(e.hired + 'T00:00:00')) / 864e5);
        const body = {
            profile: facts([['Employee ID', e.id], ['Email', esc(e.email)], ['Mobile', esc(e.mobile)], ['Birthday', esc(e.birthday)], ['Site', esc(e.site)], ['HMO', e.hmo ? badge('Approved').replace('Approved', 'Enrolled') : badge('Pending').replace('Pending', 'Not enrolled')]]),
            employment: facts([['Department', esc(e.deptName)], ['Position', esc(e.position)], ['Shift', `${e.shift.code} · ${e.shift.label}`], ['Status', badge(e.status)], ['Date hired', fmt(e.hired)], ['Length of service', `${Math.floor(svc / 365)}y ${Math.floor((svc % 365) / 30)}m`]]),
            leave: `<div class="demo-kpis">${[['Vacation leave', e.vl, e.vlUsed], ['Sick leave', e.sl, e.slUsed]].map(([l, c, u]) => `<div class="hr-card demo-kpi"><span class="hr-label">${l}</span><strong>${(c - u).toFixed(1)}</strong><span class="hr-hint">${c.toFixed(1)} credited · ${u.toFixed(1)} used</span></div>`).join('')}</div>`,
            attendance: `<div class="hr-table-scroll"><table class="hr-table"><thead><tr><th>Date</th><th>Time in</th><th>Time out</th><th>Remarks</th></tr></thead><tbody>${[...att].reverse().slice(0, 20).map((r) => `<tr class="${e.shift.code === 'GY' ? 'demo-gy' : ''}"><td class="hr-cell-date">${fmt(r.date)}</td><td>${r.in || '—'}</td><td>${r.out || (r.in ? '<span class="hr-cell-muted">no log yet</span>' : '—')}</td><td>${badge(r.status)} <span class="hr-cell-muted">${statusLabel[r.status]}${r.late ? ` · ${r.late} min` : ''}${r.leave ? ` · ${r.leave}` : ''}</span></td></tr>`).join('')}</tbody></table></div>`,
        };
        el.innerHTML = `
            <a href="#/employees" class="hr-btn hr-btn-ghost hr-btn-sm demo-back">← Employees</a>
            <section class="hr-card demo-pad demo-profile-head">
                <span class="app-avatar is-lg demo-avatar-xl">${e.initials}</span>
                <div><h2>${esc(e.display)}</h2><p class="hr-hint">${esc(e.position)} · ${esc(e.deptName)} · ID ${e.id}</p></div>
                <div class="demo-profile-tags">${badge(e.status)}<span class="hr-badge hr-badge-neutral">${e.shift.code}</span>${e.points ? `<span class="hr-badge hr-badge-danger">${e.points} pts</span>` : ''}</div>
            </section>
            <div class="hr-tabs" role="tablist">${[['profile', 'Profile'], ['employment', 'Employment'], ['leave', 'Leave credits'], ['attendance', 'Attendance']].map(([k, l]) => `<button type="button" role="tab" class="hr-tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
            <section class="hr-card demo-pad demo-tabbody">${body[tab]}</section>`;
        $$('[data-tab]', el).forEach((b) => b.addEventListener('click', () => { sessionStorage.setItem('emp-tab', b.dataset.tab); pages.employee(el, id); }));
    };

    pages.attendance = (el) => {
        const dates = D.attendance[D.employees[0].id].map((r) => r.date).filter((d, i, a) => a.indexOf(d) === i);
        let date = dates.filter((d) => D.attendance[D.employees[0].id].find((r) => r.date === d).status !== 'RD').at(-1);
        const wrap = document.createElement('div');
        el.innerHTML = `<p class="demo-intro">Daily attendance board. Remarks are computed from the employee's shift and logs; graveyard (GY) rows are shaded like in production. Pick another date to compare.</p>
            <div class="demo-toolbar"><label class="hr-label demo-inline">Date <select class="hr-input" data-date>${[...dates].reverse().map((d) => `<option value="${d}" ${d === date ? 'selected' : ''}>${fmt(d)}</option>`).join('')}</select></label></div>`;
        el.appendChild(wrap);
        const rowFor = (e) => D.attendance[e.id].find((r) => r.date === date) || { status: 'RD' };
        const redraw = list(wrap, {
            rows: () => D.employees.map((e) => ({ e, ...rowFor(e) })),
            pills: [['all', 'All'], ['P', 'Present'], ['LT', 'Late'], ['A', 'Absent'], ['L', 'On leave']],
            pillFilter: (x, p) => p === 'all' || x.status === p,
            search: (x) => `${x.e.name} ${x.e.id}`,
            rowClass: (x) => (x.e.shift.code === 'GY' ? 'demo-gy' : ''),
            cols: [
                { key: 'id', label: 'ID', sortVal: (x) => x.e.id, render: (x) => `<span class="hr-cell-id">${x.e.id}</span>` },
                { key: 'name', label: 'Employee', sortVal: (x) => x.e.name, render: (x) => empCell(x.e.id, x.e.name, x.e.deptName) },
                { key: 'shift', label: 'Shift', sortVal: (x) => x.e.shift.code, render: (x) => `${x.e.shift.code} <span class="hr-cell-muted">${x.e.shift.label}</span>` },
                { key: 'in', label: 'Time in', render: (x) => x.in || '—' },
                { key: 'out', label: 'Time out', render: (x) => x.out || '—' },
                { key: 'status', label: 'Remarks', render: (x) => `${badge(x.status)} <span class="hr-cell-muted">${statusLabel[x.status]}${x.late ? ` · ${x.late} min` : ''}${x.leave ? ` · ${x.leave}` : ''}</span>` },
            ],
            actions: (x) => `<button type="button" class="hr-btn hr-btn-sm" data-edit="${x.e.id}">Edit time</button>`,
            bind: (w, draw) => $$('[data-edit]', w).forEach((b) => b.addEventListener('click', () => {
                const e = D.byId(b.dataset.edit); const r = rowFor(e);
                const m = modal('Edit time', `${esc(e.display)} · ${fmt(date)}`, `<div class="demo-form"><label class="hr-label">Time in<input class="hr-input" name="in" value="${r.in || ''}" placeholder="8:00 AM"></label><label class="hr-label">Time out<input class="hr-input" name="out" value="${r.out || ''}" placeholder="5:00 PM"></label></div><p class="hr-hint">In production this re-runs the day finalizer: remarks, lates and leave refunds are recalculated, and the change is written to HR Edit History.</p>`, '<button type="button" class="hr-btn hr-btn-primary" data-save>Save</button>');
                $('[data-save]', m.root).addEventListener('click', () => {
                    r.in = $('[name=in]', m.root).value.trim(); r.out = $('[name=out]', m.root).value.trim();
                    if (r.in && (r.status === 'A' || r.status === 'RD')) { r.status = 'P'; r.late = 0; }
                    D.editHistory.unshift({ at: todayIso + ' ' + new Date().toTimeString().slice(0, 5), by: 'hr.demo', emp: e.name, field: 'Time in/out', from: '—', to: `${r.in || '—'} / ${r.out || '—'}` });
                    m.close(); draw(); toast('Attendance updated · logged to HR Edit History');
                });
            })),
        });
        $('[data-date]', el).addEventListener('change', (ev) => { date = ev.target.value; redraw(); });
    };

    pages.infractions = (el) => list(el, {
        intro: 'Category A offences add 1 point, B adds 3, C adds 6. Points roll into the Points Tracker and the employee portal dashboard.',
        rows: () => D.infractions,
        pills: [['all', 'All'], ['A', 'Category A'], ['B', 'Category B'], ['C', 'Category C']],
        pillFilter: (x, p) => p === 'all' || x.category === p,
        search: (x) => `${x.name} ${x.emp} ${x.offense}`,
        cols: [
            { key: 'date', label: 'Date', render: (x) => `<span class="hr-cell-date">${fmt(x.date)}</span>` },
            { key: 'name', label: 'Employee', render: (x) => empCell(x.emp, x.name, x.dept) },
            { key: 'category', label: 'Cat.', render: (x) => `<span class="hr-badge hr-badge-${{ A: 'info', B: 'warning', C: 'danger' }[x.category]}">${x.category}</span>` },
            { key: 'offense', label: 'Offence' },
            { key: 'points', label: 'Points', right: true },
            { key: 'status', label: 'Status', render: (x) => badge(x.status) },
        ],
        actions: (x) => (x.status !== 'Served' ? `<button type="button" class="hr-btn hr-btn-sm" data-serve="${x.id}">Mark served</button>` : ''),
        bind: (el, draw) => $$('[data-serve]', el).forEach((b) => b.addEventListener('click', () => { D.infractions.find((i) => i.id == b.dataset.serve).status = 'Served'; draw(); toast('Infraction marked as served'); })),
    });

    pages.resigned = (el) => list(el, {
        rows: () => D.resigned, search: (x) => `${x.name} ${x.id}`,
        cols: [
            { key: 'id', label: 'ID', render: (x) => `<span class="hr-cell-id">${x.id}</span>` },
            { key: 'name', label: 'Employee', render: (x) => `<span class="hr-cell-name">${esc(x.name)}</span>` },
            { key: 'deptName', label: 'Department' },
            { key: 'resignedOn', label: 'Last day', render: (x) => fmt(x.resignedOn) },
            { key: 'reason', label: 'Reason' },
            { key: 'clearance', label: 'Clearance', render: (x) => badge(x.clearance) },
        ],
    });

    pages.blacklisted = (el) => list(el, {
        intro: 'Applicants on this list are flagged when HR adds a new employee with the same name.',
        rows: () => D.blacklisted, search: (x) => x.name,
        cols: [{ key: 'name', label: 'Name' }, { key: 'reason', label: 'Reason' }, { key: 'date', label: 'Added', render: (x) => fmt(x.date) }, { key: 'by', label: 'Added by' }],
    });

    /* ---------- Requests ---------- */
    const reqCommon = [
        { key: 'applied', label: 'Applied', render: (x) => `<span class="hr-cell-date">${fmt(x.applied)}</span>` },
        { key: 'name', label: 'Employee', render: (x) => empCell(x.emp, x.name, x.dept) },
    ];
    function reqPage(kind, cfg) {
        return (el) => list(el, {
            rows: () => D.requests[kind],
            search: (x) => `${x.name} ${x.emp} ${x.id}`,
            sort: 'applied', dir: 'desc',
            ...cfg,
            cols: [...reqCommon, ...cfg.cols],
        });
    }
    const hrAction = (kind, field, done, label, msg, canAct = () => true) => ({
        actions: (x) => (!canAct(x) ? `<span class="hr-cell-muted">${x.supervisor === 'Pending' ? 'Awaiting supervisor' : 'No HR action'}</span>` : x[field] !== done ? `<button type="button" class="hr-btn hr-btn-sm hr-btn-success" data-act="${x.id}">${label}</button>` : `<button type="button" class="hr-btn hr-btn-sm hr-btn-ghost" data-undo="${x.id}">Undo</button>`),
        bind: (el, draw) => {
            $$('[data-act]', el).forEach((b) => b.addEventListener('click', () => { const r = D.requests[kind].find((q) => q.id == b.dataset.act); r._prev = r[field]; r[field] = done; draw(); renderNav(current); toast(msg); }));
            const waiting = { leave: 'Not posted', movement: 'Pending' }[kind] || 'Awaiting HR';
            $$('[data-undo]', el).forEach((b) => b.addEventListener('click', () => { const r = D.requests[kind].find((q) => q.id == b.dataset.undo); r[field] = r._prev || waiting; delete r._prev; draw(); renderNav(current); toast('Reverted'); }));
        },
    });

    pages['requests/leave'] = reqPage('leave', {
        intro: 'Leave approved by the supervisor waits here until HR posts it. Posting deducts leave credits and marks the attendance days as leave.',
        pills: [['topost', 'To post'], ['posted', 'Posted'], ['all', 'All']],
        pillFilter: (x, p) => p === 'all' || (p === 'topost' ? x.supervisor === 'Approved' && x.hr === 'Not posted' : x.hr === 'Posted'),
        cols: [
            { key: 'type', label: 'Type' },
            { key: 'from', label: 'Dates', render: (x) => `${fmt(x.from)}${x.days > 1 ? ` – ${fmt(x.to)}` : ''} <span class="hr-cell-muted">(${x.days}d)</span>` },
            { key: 'reason', label: 'Reason', render: (x) => `<span class="hr-cell-clamp">${esc(x.reason)}</span>` },
            { key: 'supervisor', label: 'Supervisor', render: (x) => badge(x.supervisor) },
            { key: 'hr', label: 'HR', render: (x) => badge(x.hr) },
        ],
        ...hrAction('leave', 'hr', 'Posted', 'Post', 'Leave posted · credits deducted', (x) => x.supervisor === 'Approved'),
    });
    pages['requests/adjustments'] = reqPage('adjustments', {
        pills: [['Pending', 'Pending'], ['Approved', 'Approved'], ['Denied', 'Denied'], ['all', 'All']],
        pillFilter: (x, p) => p === 'all' || x.hr === p,
        cols: [
            { key: 'date', label: 'Work date', render: (x) => fmt(x.date) },
            { key: 'field', label: 'Adjust' }, { key: 'time', label: 'New time' },
            { key: 'reason', label: 'Reason' },
            { key: 'supervisor', label: 'Supervisor', render: (x) => badge(x.supervisor) },
            { key: 'hr', label: 'HR', render: (x) => badge(x.hr) },
        ],
        actions: (x) => (x.hr === 'Pending' ? `<button type="button" class="hr-btn hr-btn-sm hr-btn-success" data-ok="${x.id}" title="Approve">✓</button><button type="button" class="hr-btn hr-btn-sm hr-btn-danger" data-no="${x.id}" title="Deny">✕</button>` : `<button type="button" class="hr-btn hr-btn-sm hr-btn-ghost" data-undo="${x.id}">Undo</button>`),
        bind: (el, draw) => {
            const set = (id, v, msg) => { D.requests.adjustments.find((q) => q.id == id).hr = v; draw(); renderNav(current); toast(msg); };
            $$('[data-ok]', el).forEach((b) => b.addEventListener('click', () => set(b.dataset.ok, 'Approved', 'Approved · attendance log updated')));
            $$('[data-no]', el).forEach((b) => b.addEventListener('click', () => set(b.dataset.no, 'Denied', 'Denied')));
            $$('[data-undo]', el).forEach((b) => b.addEventListener('click', () => set(b.dataset.undo, 'Pending', 'Reverted to pending')));
        },
    });
    pages['requests/overtime'] = reqPage('overtime', {
        intro: 'Read-only for HR: overtime is approved by supervisors in the employee portal.',
        pills: [['all', 'All'], ['Approved', 'Approved'], ['Pending', 'Pending'], ['Declined', 'Declined']],
        pillFilter: (x, p) => p === 'all' || x.supervisor === p,
        cols: [{ key: 'date', label: 'OT date', render: (x) => fmt(x.date) }, { key: 'hours', label: 'Hours', right: true }, { key: 'reason', label: 'Reason' }, { key: 'supervisor', label: 'Supervisor', render: (x) => badge(x.supervisor) }],
    });
    pages['requests/eeo'] = reqPage('eeo', {
        intro: 'Emergency early out. Marking one Done credits the remaining shift hours on the attendance record.',
        pills: [['Awaiting HR', 'Awaiting HR'], ['Done', 'Done'], ['all', 'All']],
        pillFilter: (x, p) => p === 'all' || x.hr === p,
        cols: [{ key: 'date', label: 'Date', render: (x) => fmt(x.date) }, { key: 'time', label: 'Left at' }, { key: 'reason', label: 'Reason' }, { key: 'proof', label: 'Proof', render: (x) => (x.proof ? '📎 attached' : '<span class="hr-cell-muted">none</span>') }, { key: 'hr', label: 'HR', render: (x) => badge(x.hr) }],
        ...hrAction('eeo', 'hr', 'Done', 'Done', 'Marked done · attendance updated'),
    });
    pages['requests/movement'] = reqPage('movement', {
        pills: [['Pending', 'Pending'], ['Acknowledged', 'Acknowledged'], ['all', 'All']],
        pillFilter: (x, p) => p === 'all' || x.hr === p,
        cols: [{ key: 'change', label: 'Change' }, { key: 'from', label: 'From → To', render: (x) => `${x.from} → <strong>${x.to}</strong>` }, { key: 'effective', label: 'Effective', render: (x) => fmt(x.effective) }, { key: 'hr', label: 'HR', render: (x) => badge(x.hr) }],
        ...hrAction('movement', 'hr', 'Acknowledged', 'Acknowledge', 'Acknowledged · employee record updated'),
    });
    pages['requests/hso'] = reqPage('hso', {
        intro: 'Home-site office (work from home) requests with the employee’s equipment and internet details.',
        pills: [['Awaiting HR', 'Awaiting HR'], ['Acknowledged', 'Acknowledged'], ['all', 'All']],
        pillFilter: (x, p) => p === 'all' || x.hr === p,
        cols: [{ key: 'from', label: 'Period', render: (x) => `${fmt(x.from)} – ${fmt(x.to)}` }, { key: 'setup', label: 'Setup' }, { key: 'internet', label: 'Internet' }, { key: 'hr', label: 'HR', render: (x) => badge(x.hr) }],
        ...hrAction('hso', 'hr', 'Acknowledged', 'Acknowledge', 'HSO acknowledged'),
    });
    pages['requests/transfer'] = reqPage('transfer', {
        pills: [['Awaiting HR', 'Awaiting HR'], ['Acknowledged', 'Acknowledged'], ['all', 'All']],
        pillFilter: (x, p) => p === 'all' || x.hr === p,
        cols: [{ key: 'fromSite', label: 'From site' }, { key: 'toSite', label: 'To site' }, { key: 'effective', label: 'Effective', render: (x) => fmt(x.effective) }, { key: 'hr', label: 'HR', render: (x) => badge(x.hr) }],
        ...hrAction('transfer', 'hr', 'Acknowledged', 'Acknowledge', 'Transfer acknowledged · site updated'),
    });

    /* ---------- Setup ---------- */
    pages['setup/leave-credits'] = (el) => list(el, {
        intro: 'Read-only list; Edit opens a form and nothing is written until Save.',
        rows: () => D.employees, search: (e) => `${e.name} ${e.id}`, sort: 'name',
        cols: [
            { key: 'id', label: 'ID', render: (e) => `<span class="hr-cell-id">${e.id}</span>` },
            { key: 'name', label: 'Employee', render: (e) => empCell(e.id, e.name, e.deptName) },
            { key: 'vl', label: 'VL credited', right: true, render: (e) => e.vl.toFixed(1) },
            { key: 'vlUsed', label: 'VL used', right: true, render: (e) => e.vlUsed.toFixed(1) },
            { key: 'sl', label: 'SL credited', right: true, render: (e) => e.sl.toFixed(1) },
            { key: 'slUsed', label: 'SL used', right: true, render: (e) => e.slUsed.toFixed(1) },
            { key: 'bal', label: 'Balance', right: true, sortVal: (e) => e.vl + e.sl - e.vlUsed - e.slUsed, render: (e) => `<strong>${(e.vl + e.sl - e.vlUsed - e.slUsed).toFixed(1)}</strong>` },
        ],
        actions: (e) => `<button type="button" class="hr-btn hr-btn-sm" data-edit="${e.id}">Edit</button>`,
        bind: (el, draw) => $$('[data-edit]', el).forEach((b) => b.addEventListener('click', () => {
            const e = D.byId(b.dataset.edit);
            const m = modal('Edit leave credits', esc(e.display), `<div class="demo-form"><label class="hr-label">VL credited<input class="hr-input" type="number" step="0.5" min="0" name="vl" value="${e.vl}"></label><label class="hr-label">SL credited<input class="hr-input" type="number" step="0.5" min="0" name="sl" value="${e.sl}"></label></div><p class="hr-error" data-err hidden>Credits must be zero or more.</p>`, '<button type="button" class="hr-btn hr-btn-primary" data-save>Save</button>');
            $('[data-save]', m.root).addEventListener('click', () => {
                const vl = parseFloat($('[name=vl]', m.root).value), sl = parseFloat($('[name=sl]', m.root).value);
                if (!(vl >= 0 && sl >= 0)) { $('[data-err]', m.root).hidden = false; return; }
                D.editHistory.unshift({ at: todayIso + ' ' + new Date().toTimeString().slice(0, 5), by: 'hr.demo', emp: e.name, field: 'Leave credits', from: `VL ${e.vl} / SL ${e.sl}`, to: `VL ${vl} / SL ${sl}` });
                e.vl = vl; e.sl = sl; m.close(); draw(); toast('Leave credits saved');
            });
        })),
    });
    pages['setup/protocols'] = (el) => list(el, {
        intro: 'Leave protocols set how many employees per department and shift may be on leave on the same day. The portal blocks applications once a slot is full.',
        rows: () => D.DEPARTMENTS.flatMap((d) => D.SHIFTS.slice(0, 3).map((s, i) => ({ dept: d.name, shift: s.code, max: 2 + ((d.code.length + i) % 3), used: (d.code.length * (i + 1)) % 3 }))),
        search: (x) => x.dept,
        cols: [{ key: 'dept', label: 'Department' }, { key: 'shift', label: 'Shift' }, { key: 'max', label: 'Max per day', right: true }, { key: 'used', label: 'Booked today', right: true, render: (x) => `${x.used} / ${x.max}` }],
    });
    pages['setup/insurance'] = (el) => list(el, {
        rows: () => D.employees.filter((e) => e.status === 'Regular'), search: (e) => e.name,
        pills: [['all', 'All'], ['yes', 'Enrolled'], ['no', 'Not enrolled']],
        pillFilter: (e, p) => p === 'all' || (p === 'yes') === e.hmo,
        cols: [{ key: 'name', label: 'Employee', render: (e) => empCell(e.id, e.name, e.deptName) }, { key: 'hmo', label: 'HMO', render: (e) => (e.hmo ? badge('Approved').replace('Approved', 'Enrolled') : badge('Pending').replace('Pending', 'Not enrolled')) }, { key: 'hired', label: 'Eligible since', render: (e) => fmt(D.iso(D.addDays(new Date(e.hired + 'T00:00:00'), 180))) }],
    });

    /* ---------- Trackers ---------- */
    pages['reports/movement'] = (el) => list(el, {
        rows: () => D.requests.movement.filter((r) => r.hr === 'Acknowledged').concat(D.requests.movement.filter((r) => r.hr !== 'Acknowledged')), search: (x) => x.name,
        rowClass: (x) => (x.effective === todayIso ? 'demo-today' : ''),
        cols: [{ key: 'effective', label: 'Effective', render: (x) => fmt(x.effective) }, { key: 'name', label: 'Employee', render: (x) => empCell(x.emp, x.name, x.dept) }, { key: 'change', label: 'Change' }, { key: 'to', label: 'New shift' }, { key: 'hr', label: 'Status', render: (x) => badge(x.hr) }],
    });
    pages['reports/points'] = (el) => list(el, {
        intro: 'Points per employee for the current year. 6+ points triggers a notice to explain (NTE).',
        rows: () => {
            const m = {};
            D.infractions.forEach((i) => { m[i.emp] = m[i.emp] || { emp: i.emp, name: i.name, dept: i.dept, points: 0, count: 0 }; m[i.emp].points += i.points; m[i.emp].count++; });
            return Object.values(m);
        },
        search: (x) => x.name, sort: 'points', dir: 'desc',
        cols: [{ key: 'name', label: 'Employee', render: (x) => empCell(x.emp, x.name, x.dept) }, { key: 'count', label: 'Infractions', right: true }, { key: 'points', label: 'Points', right: true, render: (x) => `<strong>${x.points}</strong>` }, { key: 'flag', label: 'Flag', sortable: false, render: (x) => (x.points >= 6 ? badge('For NTE') : '') }],
    });
    pages['reports/regular'] = (el) => list(el, {
        rows: () => D.employees.filter((e) => e.status === 'Probationary').map((e) => ({ ...e, due: D.iso(D.addDays(new Date(e.hired + 'T00:00:00'), 180)) })),
        search: (x) => x.name, sort: 'due',
        rowClass: (x) => (x.due <= todayIso ? 'demo-today' : ''),
        cols: [{ key: 'name', label: 'Employee', render: (x) => empCell(x.id, x.name, x.position) }, { key: 'hired', label: 'Hired', render: (x) => fmt(x.hired) }, { key: 'due', label: 'Regularization', render: (x) => `${fmt(x.due)} ${x.due <= todayIso ? badge('Pending').replace('Pending', 'Due') : ''}` }],
    });

    /* ---------- Admin ---------- */
    pages['admin/announcements'] = (el) => {
        el.innerHTML = `<div class="demo-toolbar"><button type="button" class="hr-btn hr-btn-primary" data-new>+ New announcement</button></div><div class="demo-ann"></div>`;
        const draw = () => {
            $('.demo-ann', el).innerHTML = D.announcements.map((a) => `<article class="hr-card demo-pad"><div class="demo-card-head"><h2>${esc(a.title)}</h2>${a.popup ? '<span class="hr-badge hr-badge-info">Pop-up</span>' : ''}</div><p>${esc(a.body)}</p><p class="hr-hint">${fmt(a.posted)} · ${esc(a.audience)}</p></article>`).join('');
        };
        draw();
        $('[data-new]', el).addEventListener('click', () => {
            const m = modal('New announcement', 'Shown on the employee portal dashboard', '<div class="demo-form demo-form-1"><label class="hr-label">Title<input class="hr-input" name="t"></label><label class="hr-label">Message<textarea class="hr-input demo-textarea" name="b"></textarea></label><label class="hr-label demo-inline"><input type="checkbox" class="hr-checkbox" name="p"> Show as pop-up</label></div><p class="hr-error" data-err hidden>Title and message are required.</p>', '<button type="button" class="hr-btn hr-btn-primary" data-save>Publish</button>');
            $('[data-save]', m.root).addEventListener('click', () => {
                const t = $('[name=t]', m.root).value.trim(), b = $('[name=b]', m.root).value.trim();
                if (!t || !b) { $('[data-err]', m.root).hidden = false; return; }
                D.announcements.unshift({ id: Date.now(), title: t, body: b, posted: todayIso, audience: 'All employees', popup: $('[name=p]', m.root).checked });
                m.close(); draw(); toast('Announcement published');
            });
        });
    };
    pages['admin/edit-history'] = (el) => list(el, {
        intro: 'Every HR change to employee data is written here with the old and new value.',
        rows: () => D.editHistory, search: (x) => `${x.emp} ${x.by} ${x.field}`, sort: 'at', dir: 'desc',
        cols: [{ key: 'at', label: 'When' }, { key: 'by', label: 'HR user' }, { key: 'emp', label: 'Employee' }, { key: 'field', label: 'Field' }, { key: 'from', label: 'Old', render: (x) => `<span class="hr-cell-muted">${esc(x.from)}</span>` }, { key: 'to', label: 'New', render: (x) => `<strong>${esc(x.to)}</strong>` }],
    });
    pages['admin/monitoring'] = (el) => {
        const missing = D.employees.filter((e) => !e.hmo).length;
        el.innerHTML = `<p class="demo-intro">Data-quality checks that run against the HR database and point HR to records that need fixing.</p>
        <div class="demo-kpis">${[['Missing HMO enrollment', missing], ['No shift assigned', 0], ['Logs without time out (yesterday)', 3], ['Duplicate employee names', 0]].map(([l, v]) => `<div class="hr-card demo-kpi"><span class="hr-label">${l}</span><strong>${v}</strong>${badge(v ? 'Pending' : 'Approved').replace(v ? 'Pending' : 'Approved', v ? 'Needs review' : 'OK')}</div>`).join('')}</div>`;
    };

    /* ==================== ROUTER ==================== */
    const TITLES = { dashboard: 'HR Dashboard', employees: 'Employees', attendance: 'Attendance', infractions: 'Manage Infractions', resigned: 'Resigned Employees', blacklisted: 'Blacklisted', 'requests/leave': 'Leave Applications', 'requests/adjustments': 'Time Adjustments', 'requests/overtime': 'Overtime Requests', 'requests/eeo': 'EEO Requests', 'requests/movement': 'Movement Requests', 'requests/hso': 'HSO Requests', 'requests/transfer': 'Site Transfer', 'setup/leave-credits': 'Leave Credits', 'setup/protocols': 'Leave Protocols', 'setup/insurance': 'HMO & Insurance', 'reports/movement': 'Movement Tracker', 'reports/points': 'Points Tracker', 'reports/regular': 'Regular Tracker', 'admin/announcements': 'Announcements', 'admin/edit-history': 'HR Edit History', 'admin/monitoring': 'HRIS Monitoring' };
    let current = 'dashboard';

    function loggedIn() { try { return sessionStorage.getItem('hr-demo-auth') === '1'; } catch (e) { return true; } }

    function route() {
        if (!loggedIn()) { $('#loginView').hidden = false; $('#appView').hidden = true; document.title = 'Sign in · HR Portal Demo'; return; }
        $('#loginView').hidden = true; $('#appView').hidden = false;
        const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
        let key = hash, arg;
        if (hash.startsWith('employee/')) { key = 'employee'; arg = hash.split('/')[1]; }
        if (!pages[key]) key = 'dashboard';
        current = hash;
        renderNav(hash);
        $('#pageTitle').textContent = TITLES[key] || 'Employee';
        document.title = `${TITLES[key] || 'Employee'} · HR Portal Demo`;
        const el = $('#page');
        el.innerHTML = '';
        pages[key](el, arg);
        $('#appSidebar').classList.remove('is-open-mobile');
        window.scrollTo(0, 0);
    }

    /* ---------- Shell wiring ---------- */
    $('#year').textContent = new Date().getFullYear();
    $('#loginForm').addEventListener('submit', (e) => { e.preventDefault(); try { sessionStorage.setItem('hr-demo-auth', '1'); } catch (x) {} location.hash = '#/dashboard'; route(); });
    $$('[data-logout]').forEach((b) => b.addEventListener('click', () => { try { sessionStorage.removeItem('hr-demo-auth'); } catch (x) {} $('#userMenu').hidden = true; route(); }));
    $('#themeBtn').addEventListener('click', () => { const d = document.documentElement.classList.toggle('dark'); try { localStorage.setItem('hr-demo-theme', d ? 'dark' : 'light'); } catch (e) {} });
    $('#userBtn').addEventListener('click', (e) => { e.stopPropagation(); const m = $('#userMenu'); m.hidden = !m.hidden; $('#userBtn').setAttribute('aria-expanded', String(!m.hidden)); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.app-user')) $('#userMenu').hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('#modalRoot').innerHTML = ''; $('#userMenu').hidden = true; } });
    $('#sidebarToggleBtn').addEventListener('click', () => {
        const html = document.documentElement;
        const c = html.dataset.sidebarCollapsed !== 'true';
        html.dataset.sidebarCollapsed = String(c);
        $('#sidebarToggleBtn').setAttribute('aria-expanded', String(!c));
    });
    $('#openMobile').addEventListener('click', () => $('#appSidebar').classList.add('is-open-mobile'));
    $('#closeMobile').addEventListener('click', () => $('#appSidebar').classList.remove('is-open-mobile'));
    $('#mobileBackdrop').addEventListener('click', () => $('#appSidebar').classList.remove('is-open-mobile'));
    window.addEventListener('hashchange', route);
    route();
})();
