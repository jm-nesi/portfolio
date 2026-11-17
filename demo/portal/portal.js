/* ============================================================
   Employee Portal demo: static copy of the self-service portal.
   Hash router; every submission stays in memory.
   ============================================================ */
(function () {
    'use strict';

    const D = window.DemoData;
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmt = (s) => (s ? D.fmt(s) : '—');
    const peso = (n) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const todayIso = D.iso(D.today);

    let me = null;
    const mine = { leave: [], adjustments: [], overtime: [] };

    const ICON = {
        home: 'M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L22.5 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
        calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
        send: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
        inbox: 'M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M2.25 13.5V6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v6.75m-19.5 0v4.5A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25v-4.5',
        folder: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
        megaphone: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
        palette: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z',
    };
    const svg = (d) => `<svg fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${d}"/></svg>`;
    const isApprover = () => me && /Leader|Supervisor|Lead/.test(me.position);
    const pendingApprovals = () => D.requests.leave.filter((r) => r.supervisor === 'Pending').length + D.requests.overtime.filter((r) => r.supervisor === 'Pending').length;

    function nav() {
        return [
            { label: 'Dashboard', icon: 'home', route: 'dashboard' },
            { label: 'Attendance', icon: 'calendar', route: 'attendance' },
            { label: 'Apply', icon: 'send', items: [['leave', 'Leave'], ['time-adjustment', 'Time adjustment'], ['overtime', 'Overtime']] },
            isApprover() && { label: 'Approvals', icon: 'inbox', items: [['approvals/leave', 'Leave requests', D.requests.leave.filter((r) => r.supervisor === 'Pending').length], ['approvals/overtime', 'Overtime requests', D.requests.overtime.filter((r) => r.supervisor === 'Pending').length]] },
            { label: 'My records', icon: 'folder', items: [['payslips', 'Payslips'], ['infractions', 'Infractions']] },
        ].filter(Boolean);
    }

    function renderRail(active) {
        const rail = $('#rail');
        rail.innerHTML = `
            <a href="#/dashboard" class="rail-logo" title="Employee Portal">A</a>
            <ul class="rail-list">
                ${nav().map((g, i) => `<li>
                    ${g.items
                        ? `<button type="button" class="rail-btn ${g.items.some(([r]) => r === active) ? 'is-active' : ''}" data-fly="f${i}" aria-expanded="false" aria-label="${g.label}">${svg(ICON[g.icon])}${g.items.some((x) => x[2]) ? '<span class="dot"></span>' : ''}</button>
                           <div class="flyout" id="f${i}" hidden><p class="flyout-title">${g.label}</p>${g.items.map(([r, l, n]) => `<a href="#/${r}" class="${r === active ? 'is-active' : ''}">${l}${n ? `<span class="count">${n}</span>` : ''}</a>`).join('')}</div>`
                        : `<a href="#/${g.route}" class="rail-btn ${active === g.route ? 'is-active' : ''}" aria-label="${g.label}">${svg(ICON[g.icon])}</a>`}
                    <span class="rail-tip">${g.label}</span></li>`).join('')}
            </ul>
            <div class="rail-foot">
                <div><button type="button" class="rail-btn" data-ann aria-label="Announcements">${svg(ICON.megaphone)}</button><span class="rail-tip">Announcements</span></div>
                <div><button type="button" class="rail-btn" data-fly="fTheme" aria-expanded="false" aria-label="Theme">${svg(ICON.palette)}</button><span class="rail-tip">Theme</span>
                    <div class="flyout up" id="fTheme" hidden><p class="flyout-title">Theme</p><div class="swatches">
                        ${[['light', 'Light', '#ffffff'], ['dark', 'Dark', '#131a27'], ['navy', 'Navy', '#1f1d50']].map(([k, l, c]) => `<button type="button" class="swatch" data-theme-pick="${k}" aria-pressed="${document.documentElement.dataset.theme === k}"><i style="background:${c}"></i>${l}</button>`).join('')}
                    </div></div></div>
                <div><button type="button" class="rail-avatar" data-fly="fAcct" aria-expanded="false" aria-label="Account">${me.initials}</button>
                    <div class="flyout up" id="fAcct" hidden><div style="padding:.5rem .75rem"><strong style="color:var(--theme-ink)">${esc(me.display)}</strong><p class="hint">Employee ID ${me.id}</p></div>
                    <a href="../hr/index.html">Open HR back-office demo</a><button type="button" class="item" data-logout>Sign out</button></div></div>
            </div>`;
        $$('[data-fly]', rail).forEach((b) => b.addEventListener('click', (e) => {
            e.stopPropagation();
            const f = $('#' + b.dataset.fly);
            const open = f.hidden;
            closeFlyouts();
            f.hidden = !open; b.setAttribute('aria-expanded', String(open));
        }));
        $$('.flyout a', rail).forEach((a) => a.addEventListener('click', () => { closeFlyouts(); rail.classList.remove('is-open'); }));
        $$('[data-theme-pick]', rail).forEach((b) => b.addEventListener('click', () => {
            document.documentElement.dataset.theme = b.dataset.themePick;
            try { localStorage.setItem('portal-demo-theme', b.dataset.themePick); } catch (e) {}
            $$('[data-theme-pick]', rail).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        }));
        $('[data-ann]', rail).addEventListener('click', showAnnouncement);
        $('[data-logout]', rail).addEventListener('click', () => { try { sessionStorage.removeItem('portal-demo-id'); } catch (e) {} me = null; route(); });
    }
    function closeFlyouts() { $$('.flyout').forEach((f) => { f.hidden = true; }); $$('[data-fly]').forEach((b) => b.setAttribute('aria-expanded', 'false')); }

    function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
    function modal(html) {
        const root = $('#modalRoot');
        root.innerHTML = `<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
        const close = () => { root.innerHTML = ''; };
        $('.modal-bg', root).addEventListener('click', (e) => { if (e.target.classList.contains('modal-bg') || e.target.closest('[data-close]')) close(); });
        return { root, close };
    }
    function showAnnouncement() {
        const a = D.announcements[0];
        modal(`<p class="label">Announcement · ${fmt(a.posted)}</p><h2>${esc(a.title)}</h2><p>${esc(a.body)}</p><div class="modal-foot"><button type="button" class="btn btn-primary" data-close>Got it</button></div>`);
    }
    const pill = (t) => `<span class="pill pill-${{ Approved: 'ok', Posted: 'ok', Present: 'ok', Pending: 'warn', Late: 'warn', 'Not posted': 'info', Declined: 'bad', Absent: 'bad', Leave: 'info', 'Rest day': 'muted', Submitted: 'warn' }[t] || 'muted'}">${esc(t)}</span>`;

    /* ==================== PAGES ==================== */
    const pages = {};

    pages.dashboard = (el) => {
        const att = D.attendance[me.id] || [];
        const t = att.at(-1) || {};
        const cut = att.filter((r) => r.date >= D.iso(new Date(D.today.getFullYear(), D.today.getMonth(), D.today.getDate() > 15 ? 16 : 1)));
        const worked = cut.filter((r) => r.status === 'P' || r.status === 'LT').length;
        const workdays = cut.filter((r) => r.status !== 'RD').length;
        const lates = cut.filter((r) => r.status === 'LT').length;
        const myInf = D.infractions.filter((i) => i.emp === me.id && i.status !== 'Served');
        const pts = myInf.reduce((n, i) => n + i.points, 0);
        const hr = new Date().getHours();
        el.innerHTML = `
        <div class="page-head"><div><h1>Good ${hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'}, ${esc(me.first)}</h1><p>${esc(me.position)} · ${esc(me.deptName)} · ${me.shift.code} shift (${me.shift.label})</p></div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap"><a class="btn" href="#/leave">Apply leave</a><a class="btn" href="#/time-adjustment">Time adjustment</a></div></div>
        <div class="grid grid-3">
            <div class="card card-hero"><span class="label">Server time</span><div class="clock" id="clock">--:--</div>
                <p style="margin:.25rem 0 1rem;color:rgba(255,255,255,.75)">${t.status === 'RD' ? 'Rest day today' : t.in ? `Timed in at <strong>${t.in}</strong>` : 'No time-in yet today'}</p>
                <button type="button" class="btn btn-gold" id="clockBtn" ${t.status === 'RD' ? 'disabled' : ''}>${t.in && !t.out ? 'Time out' : t.in ? 'Logged for today' : 'Time in'}</button></div>
            <div class="card"><h2>This cut-off</h2><span class="big">${worked} / ${workdays}</span><span class="label">days present</span>
                <div class="meter"><i style="width:${workdays ? (worked / workdays) * 100 : 0}%"></i></div>
                <div class="row"><span>Late</span><strong>${lates}</strong></div><div class="row"><span>Paid hours so far</span><strong>${worked * 8}</strong></div></div>
            <div class="card"><h2>Leave credits</h2>
                ${[['Vacation leave', me.vl, me.vlUsed], ['Sick leave', me.sl, me.slUsed]].map(([l, c, u]) => `<div class="row"><span>${l}</span><span><strong style="color:var(--theme-ink)">${(c - u).toFixed(1)}</strong> <span class="hint">left of ${c.toFixed(1)}</span></span></div>`).join('')}
                <div class="row"><span>Length of service</span><strong>${Math.floor((D.today - new Date(me.hired + 'T00:00:00')) / 31536e6)} yr</strong></div></div>
        </div>
        <div class="grid grid-2" style="margin-top:1rem">
            <div class="card"><h2>Points</h2>${pts ? `<span class="big">${pts}</span><span class="label">open infraction points</span>` : `<span class="big" style="color:var(--ok)">Clean record</span><span class="label">no open infraction points</span>`}</div>
            <div class="card"><h2>Announcements</h2>${D.announcements.slice(0, 3).map((a) => `<div class="row"><span>${esc(a.title)}</span><span class="hint">${fmt(a.posted)}</span></div>`).join('')}</div>
        </div>`;
        const tick = () => { const c = $('#clock'); if (!c) return clearInterval(timer); c.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }); };
        const timer = setInterval(tick, 1000); tick();
        $('#clockBtn').addEventListener('click', () => {
            const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            if (!t.in) { t.in = now; t.status = 'P'; toast('Time in recorded: ' + now); } else if (!t.out) { t.out = now; toast('Time out recorded: ' + now); } else return;
            pages.dashboard(el);
        });
    };

    let calOffset = 0;
    pages.attendance = (el) => {
        const att = D.attendance[me.id] || [];
        const byDate = Object.fromEntries(att.map((r) => [r.date, r]));
        const base = new Date(D.today.getFullYear(), D.today.getMonth() + calOffset, 1);
        const start = D.addDays(base, -base.getDay());
        const label = { P: 'Present', LT: 'Late', A: 'Absent', L: 'Leave', RD: 'Rest day' };
        let cells = '';
        for (let i = 0; i < 42; i++) {
            const d = D.addDays(start, i), iso = D.iso(d), r = byDate[iso];
            cells += `<div class="cal-day ${d.getMonth() !== base.getMonth() ? 'is-out' : ''} ${iso === todayIso ? 'is-today' : ''}"><b>${d.getDate()}</b>${r ? pill(label[r.status]) + (r.in ? `<span class="cal-logs">${r.in}<br>${r.out || '—'}</span>` : '') : ''}</div>`;
        }
        el.innerHTML = `<div class="page-head"><div><h1>Attendance</h1><p>Your logs and remarks by day. Missing a log? File a time adjustment.</p></div><a class="btn" href="#/time-adjustment">File time adjustment</a></div>
        <div class="card"><div class="cal-head"><h2>${base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button type="button" class="btn btn-sm" data-m="-1" ${calOffset <= -1 ? 'disabled' : ''}>‹ Prev</button><button type="button" class="btn btn-sm" data-m="0">Today</button><button type="button" class="btn btn-sm" data-m="1" ${calOffset >= 0 ? 'disabled' : ''}>Next ›</button></div>
            <div class="cal">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}${cells}</div>
            <div class="legend">${['Present', 'Late', 'Absent', 'Leave', 'Rest day'].map(pill).join('')}</div></div>`;
        $$('[data-m]', el).forEach((b) => b.addEventListener('click', () => { calOffset = b.dataset.m === '0' ? 0 : calOffset + Number(b.dataset.m); pages.attendance(el); }));
    };

    function applyPage(el, cfg) {
        el.innerHTML = `<div class="page-head"><div><h1>${cfg.title}</h1><p>${cfg.sub}</p></div></div>
        <div class="grid grid-2"><form class="card form" novalidate><h2>New request</h2>${cfg.fields}<p class="err" data-err hidden></p><div><button class="btn btn-primary" type="submit">Submit</button></div></form>
        <div class="card"><h2>My requests</h2><div class="table-wrap"><table><thead><tr>${cfg.head}</tr></thead><tbody data-list></tbody></table></div></div></div>`;
        const draw = () => { $('[data-list]', el).innerHTML = cfg.list().length ? cfg.list().map(cfg.row).join('') : '<tr><td colspan="9" class="empty">No requests yet.</td></tr>'; $$('[data-cancel]', el).forEach((b) => b.addEventListener('click', () => { cfg.cancel(b.dataset.cancel); draw(); toast('Request cancelled'); })); };
        draw();
        $('form', el).addEventListener('submit', (e) => {
            e.preventDefault();
            const f = Object.fromEntries(new FormData(e.target));
            const err = cfg.validate(f);
            const box = $('[data-err]', el);
            if (err) { box.textContent = err; box.hidden = false; return; }
            box.hidden = true; cfg.save(f); e.target.reset(); draw(); toast(cfg.ok);
        });
    }

    pages.leave = (el) => applyPage(el, {
        title: 'Leave', sub: `Vacation leave left: ${(me.vl - me.vlUsed).toFixed(1)} · Sick leave left: ${(me.sl - me.slUsed).toFixed(1)}. Your supervisor approves; HR posts it.`,
        fields: `<label class="field">Leave type<select class="input" name="type"><option>Vacation Leave</option><option>Sick Leave</option><option>Emergency Leave</option><option>Birthday Leave</option></select></label>
            <div class="form-2"><label class="field">From<input class="input" type="date" name="from" min="${todayIso}"></label><label class="field">To<input class="input" type="date" name="to" min="${todayIso}"></label></div>
            <label class="field">Reason<textarea class="input" name="reason" maxlength="300"></textarea></label><p class="hint">Leave protocols limit how many people on your team can be off the same day.</p>`,
        head: '<th>Type</th><th>Dates</th><th>Status</th><th></th>',
        list: () => mine.leave,
        row: (r) => `<tr><td>${esc(r.type)}</td><td>${fmt(r.from)}${r.to !== r.from ? ' – ' + fmt(r.to) : ''}</td><td>${pill(r.status)}</td><td>${r.status === 'Pending' ? `<button type="button" class="btn btn-sm btn-bad" data-cancel="${r.id}">Cancel</button>` : ''}</td></tr>`,
        validate: (f) => {
            if (!f.from || !f.to) return 'Pick the start and end dates.';
            if (f.to < f.from) return 'The end date is before the start date.';
            if (!f.reason.trim()) return 'Add a short reason.';
            const days = (new Date(f.to) - new Date(f.from)) / 864e5 + 1;
            const left = f.type === 'Sick Leave' ? me.sl - me.slUsed : me.vl - me.vlUsed;
            if (/Vacation|Sick/.test(f.type) && days > left) return `Not enough credits: ${days} day(s) requested, ${left.toFixed(1)} left.`;
            return '';
        },
        save: (f) => mine.leave.unshift({ id: Date.now(), ...f, status: 'Pending' }),
        cancel: (id) => { mine.leave = mine.leave.filter((r) => String(r.id) !== id); },
        ok: 'Leave submitted to your supervisor',
    });
    pages['time-adjustment'] = (el) => applyPage(el, {
        title: 'Time adjustment', sub: 'Fix a missed or wrong log. Supervisor approves, then HR applies it to your attendance.',
        fields: `<div class="form-2"><label class="field">Work date<input class="input" type="date" name="date" max="${todayIso}"></label><label class="field">Adjust<select class="input" name="field"><option>Time in</option><option>Time out</option><option>Time in and out</option></select></label></div>
            <label class="field">Correct time<input class="input" type="time" name="time"></label><label class="field">Reason<textarea class="input" name="reason"></textarea></label>`,
        head: '<th>Date</th><th>Adjust</th><th>Status</th><th></th>',
        list: () => mine.adjustments,
        row: (r) => `<tr><td>${fmt(r.date)}</td><td>${esc(r.field)} → ${esc(r.time)}</td><td>${pill(r.status)}</td><td>${r.status === 'Pending' ? `<button type="button" class="btn btn-sm btn-bad" data-cancel="${r.id}">Cancel</button>` : ''}</td></tr>`,
        validate: (f) => (!f.date ? 'Pick the work date.' : f.date > todayIso ? 'You can only adjust past or current days.' : !f.time ? 'Enter the correct time.' : !f.reason.trim() ? 'Add a short reason.' : ''),
        save: (f) => mine.adjustments.unshift({ id: Date.now(), ...f, status: 'Pending' }),
        cancel: (id) => { mine.adjustments = mine.adjustments.filter((r) => String(r.id) !== id); },
        ok: 'Time adjustment submitted',
    });
    pages.overtime = (el) => applyPage(el, {
        title: 'Overtime', sub: 'Request overtime before or on the day it is rendered.',
        fields: `<div class="form-2"><label class="field">Date<input class="input" type="date" name="date"></label><label class="field">Hours<input class="input" type="number" name="hours" min="1" max="8" step="0.5"></label></div><label class="field">Reason<textarea class="input" name="reason"></textarea></label>`,
        head: '<th>Date</th><th class="num">Hours</th><th>Status</th><th></th>',
        list: () => mine.overtime,
        row: (r) => `<tr><td>${fmt(r.date)}</td><td class="num">${esc(r.hours)}</td><td>${pill(r.status)}</td><td>${r.status === 'Pending' ? `<button type="button" class="btn btn-sm btn-bad" data-cancel="${r.id}">Cancel</button>` : ''}</td></tr>`,
        validate: (f) => (!f.date ? 'Pick the overtime date.' : !(f.hours >= 1 && f.hours <= 8) ? 'Hours must be between 1 and 8.' : !f.reason.trim() ? 'Add a short reason.' : ''),
        save: (f) => mine.overtime.unshift({ id: Date.now(), ...f, status: 'Pending' }),
        cancel: (id) => { mine.overtime = mine.overtime.filter((r) => String(r.id) !== id); },
        ok: 'Overtime request submitted',
    });

    function approvals(kind, title, cols, cells) {
        return (el) => {
            const draw = () => {
                const rows = D.requests[kind].filter((r) => r.supervisor === 'Pending');
                const done = D.requests[kind].filter((r) => r._byMe);
                el.innerHTML = `<div class="page-head"><div><h1>${title}</h1><p>Requests from your team waiting for your decision. HR sees the result in the back office.</p></div></div>
                <div class="card"><h2>Pending (${rows.length})</h2><div class="table-wrap"><table><thead><tr><th>Employee</th>${cols}<th></th></tr></thead><tbody>
                ${rows.length ? rows.map((r) => `<tr><td><strong style="color:var(--theme-ink)">${esc(r.name)}</strong><br><span class="hint">${fmt(r.applied)}</span></td>${cells(r)}<td style="white-space:nowrap"><button type="button" class="btn btn-sm btn-ok" data-ok="${r.id}">Approve</button> <button type="button" class="btn btn-sm btn-bad" data-no="${r.id}">Decline</button></td></tr>`).join('') : '<tr><td colspan="9" class="empty">All caught up.</td></tr>'}
                </tbody></table></div></div>
                ${done.length ? `<div class="card" style="margin-top:1rem"><h2>Decided this session</h2>${done.map((r) => `<div class="row"><span>${esc(r.name)}</span>${pill(r.supervisor)}</div>`).join('')}</div>` : ''}`;
                const set = (id, v) => { const r = D.requests[kind].find((q) => q.id == id); r.supervisor = v; r._byMe = true; renderRail(current); draw(); toast(v === 'Approved' ? 'Approved · sent to HR' : 'Declined · employee notified'); };
                $$('[data-ok]', el).forEach((b) => b.addEventListener('click', () => set(b.dataset.ok, 'Approved')));
                $$('[data-no]', el).forEach((b) => b.addEventListener('click', () => set(b.dataset.no, 'Declined')));
            };
            draw();
        };
    }
    pages['approvals/leave'] = approvals('leave', 'Leave requests', '<th>Type</th><th>Dates</th><th>Reason</th>', (r) => `<td>${esc(r.type)}</td><td>${fmt(r.from)} <span class="hint">(${r.days}d)</span></td><td>${esc(r.reason)}</td>`);
    pages['approvals/overtime'] = approvals('overtime', 'Overtime requests', '<th>Date</th><th class="num">Hours</th><th>Reason</th>', (r) => `<td>${fmt(r.date)}</td><td class="num">${r.hours}</td><td>${esc(r.reason)}</td>`);

    pages.payslips = (el) => {
        el.innerHTML = `<div class="page-head"><div><h1>Payslips</h1><p>Semi-monthly payslips. Amounts are sample figures.</p></div></div>
        <div class="card"><div class="table-wrap"><table><thead><tr><th>Pay period</th><th>Pay date</th><th class="num">Gross</th><th class="num">Net pay</th><th></th></tr></thead><tbody>
        ${D.payslips.map((p, i) => `<tr><td>${p.period}</td><td>${p.payDate}</td><td class="num">${peso(p.gross)}</td><td class="num"><strong style="color:var(--theme-ink)">${peso(p.net)}</strong></td><td><button type="button" class="btn btn-sm" data-slip="${i}">View</button></td></tr>`).join('')}
        </tbody></table></div></div>`;
        $$('[data-slip]', el).forEach((b) => b.addEventListener('click', () => {
            const p = D.payslips[b.dataset.slip];
            const r = (l, v, neg) => `<div class="row"><span>${l}</span><strong>${neg ? '−' : ''}${peso(v)}</strong></div>`;
            modal(`<p class="label">${esc(me.display)} · ID ${me.id}</p><h2>Payslip</h2><p class="hint">${p.period} · paid ${p.payDate}</p>
                <div class="slip" style="margin-top:1rem"><p class="label">Earnings</p>${r('Basic pay', p.basic)}${r('Overtime', p.ot)}${r('Night differential', p.nd)}${r('Late / undertime', p.late, true)}
                <p class="label" style="margin-top:.75rem">Deductions</p>${r('SSS', p.sss, true)}${r('PhilHealth', p.ph, true)}${r('Pag-IBIG', p.hdmf, true)}${r('Withholding tax', p.tax, true)}
                <div class="row net"><span>Net pay</span><strong>${peso(p.net)}</strong></div></div>
                <div class="modal-foot"><button type="button" class="btn" data-close>Close</button><button type="button" class="btn btn-primary" onclick="window.print()">Print</button></div>`);
        }));
    };

    pages.infractions = (el) => {
        const rows = D.infractions.filter((i) => i.emp === me.id);
        el.innerHTML = `<div class="page-head"><div><h1>Infractions</h1><p>Your infraction history and points.</p></div></div>
        <div class="card"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Offence</th><th class="num">Points</th><th>Status</th></tr></thead><tbody>
        ${rows.length ? rows.map((i) => `<tr><td>${fmt(i.date)}</td><td>${i.category}</td><td>${esc(i.offense)}</td><td class="num">${i.points}</td><td>${pill(i.status === 'Served' ? 'Approved' : 'Pending').replace(/Approved|Pending/, i.status)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty">Clean record. Nothing to show.</td></tr>'}
        </tbody></table></div></div>`;
    };

    /* ==================== ROUTER ==================== */
    let current = 'dashboard';
    function route() {
        if (!me) { try { me = D.byId(sessionStorage.getItem('portal-demo-id')) || null; } catch (e) {} }
        if (!me) { $('#loginView').hidden = false; $('#appView').hidden = true; document.title = 'Sign in · Employee Portal Demo'; return; }
        $('#loginView').hidden = true; $('#appView').hidden = false;
        let r = location.hash.replace(/^#\/?/, '') || 'dashboard';
        if (!pages[r] || (r.startsWith('approvals') && !isApprover())) r = 'dashboard';
        current = r;
        renderRail(r);
        const el = $('#page');
        pages[r](el);
        document.title = `${$('h1', el)?.textContent || 'Dashboard'} · Employee Portal Demo`;
        $('#rail').classList.remove('is-open');
        window.scrollTo(0, 0);
    }
    function login(id) {
        const e = D.byId(String(id).trim());
        if (!e) { $('#loginErr').hidden = false; return; }
        try { sessionStorage.setItem('portal-demo-id', e.id); } catch (x) {}
        me = e;
        if (!mine.leave.length) mine.leave.push({ id: 1, type: 'Vacation Leave', from: D.iso(D.addDays(D.today, -20)), to: D.iso(D.addDays(D.today, -19)), reason: 'Family event', status: 'Posted' });
        location.hash = '#/dashboard';
        route();
        showAnnouncement();
    }
    $('#loginForm').addEventListener('submit', (e) => { e.preventDefault(); login($('#loginId').value); });
    $$('[data-acct]').forEach((b) => b.addEventListener('click', () => login(b.dataset.acct)));
    $('#openRail').addEventListener('click', (e) => { e.stopPropagation(); $('#rail').classList.toggle('is-open'); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.flyout') && !e.target.closest('[data-fly]')) closeFlyouts(); if (!e.target.closest('#rail') && !e.target.closest('#openRail')) $('#rail').classList.remove('is-open'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeFlyouts(); $('#modalRoot').innerHTML = ''; } });
    window.addEventListener('hashchange', route);
    route();
})();
