/* ============================================================
   Demo data: every person, ID and number here is generated.
   Seeded PRNG so the demo looks the same on every visit.
   Shared by the HR back office and the Employee Portal demos.
   ============================================================ */
(function () {
    'use strict';

    let seed = 20241;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
    const pad = (n, w = 2) => String(n).padStart(w, '0');

    const FIRST = ['Andrea', 'Bea', 'Carlo', 'Dana', 'Elijah', 'Faith', 'Gabriel', 'Hannah', 'Ivan', 'Jasmine', 'Kevin', 'Lara', 'Miguel', 'Nina', 'Oscar', 'Paula', 'Quinn', 'Rafael', 'Sofia', 'Tristan', 'Uma', 'Vince', 'Wendy', 'Xavier', 'Yna', 'Zack', 'Alyssa', 'Bryan', 'Celine', 'Dominic', 'Erika', 'Francis', 'Gwen', 'Harvey', 'Isabel', 'Joshua', 'Kim', 'Leo', 'Mika', 'Nathan', 'Olivia', 'Patrick', 'Rina', 'Sam', 'Tina', 'Victor', 'Joy', 'Mark'];
    const LAST = ['Abad', 'Bautista', 'Castro', 'Dela Rosa', 'Estrada', 'Flores', 'Garcia', 'Herrera', 'Ignacio', 'Jimenez', 'Lim', 'Mendoza', 'Navarro', 'Ocampo', 'Pascual', 'Quinto', 'Ramos', 'Santos', 'Torres', 'Uy', 'Valdez', 'Villanueva', 'Yap', 'Zamora', 'Aquino', 'Cruz', 'Domingo', 'Reyes', 'Salazar', 'Tan'];

    const DEPARTMENTS = [
        { code: 'CS-A', name: 'Customer Support A', color: '#dbeafe' },
        { code: 'CS-B', name: 'Customer Support B', color: '#dcfce7' },
        { code: 'TECH', name: 'Technical Support', color: '#fef3c7' },
        { code: 'BO', name: 'Back Office', color: '#fce7f3' },
        { code: 'QA', name: 'Quality Assurance', color: '#ede9fe' },
        { code: 'IT', name: 'IT & Systems', color: '#e0f2fe' },
        { code: 'HR', name: 'Human Resources', color: '#ffedd5' },
    ];
    const POSITIONS = {
        'CS-A': ['Customer Service Rep', 'Senior CSR', 'Team Leader'],
        'CS-B': ['Customer Service Rep', 'Senior CSR', 'Team Leader'],
        TECH: ['Technical Support Rep', 'Tier 2 Specialist', 'Team Leader'],
        BO: ['Data Associate', 'Billing Associate', 'Supervisor'],
        QA: ['QA Analyst', 'QA Lead'],
        IT: ['Systems Developer', 'IT Support', 'Network Admin'],
        HR: ['HR Associate', 'Recruiter', 'HR Supervisor'],
    };
    const SHIFTS = [
        { code: 'AM', label: '6:00 AM – 3:00 PM', start: '06:00', end: '15:00' },
        { code: 'MID', label: '2:00 PM – 11:00 PM', start: '14:00', end: '23:00' },
        { code: 'GY', label: '10:00 PM – 7:00 AM', start: '22:00', end: '07:00' },
        { code: 'DAY', label: '8:00 AM – 5:00 PM', start: '08:00', end: '17:00' },
    ];
    const SITES = ['Main Site', 'North Hub', 'Work from Home'];
    const STATUSES = ['Regular', 'Regular', 'Regular', 'Probationary', 'Probationary', 'Project-based'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const fmt = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    /* ---------- Employees ---------- */
    const employees = [];
    const used = new Set();
    for (let i = 0; i < 128; i++) {
        let first, last;
        do { first = pick(FIRST); last = pick(LAST); } while (used.has(first + last));
        used.add(first + last);
        const dept = i < 4 ? DEPARTMENTS[[5, 6, 6, 0][i]] : pick(DEPARTMENTS);
        const hired = addDays(today, -int(40, 2400));
        const status = (today - hired) / 864e5 < 180 ? 'Probationary' : pick(STATUSES);
        employees.push({
            id: 24000 + i * 7 + int(0, 6),
            first, last,
            name: `${last}, ${first}`,
            display: `${first} ${last}`,
            initials: first[0] + last[0],
            dept: dept.code,
            deptName: dept.name,
            position: pick(POSITIONS[dept.code]),
            shift: pick(SHIFTS),
            site: pick(SITES),
            status,
            hired: iso(hired),
            birthday: `${pad(int(1, 12))}-${pad(int(1, 28))}`,
            email: `${first}.${last}`.toLowerCase().replace(/\s+/g, '') + '@acmestaffing.demo',
            mobile: `09${int(10, 99)} ${int(100, 999)} ${int(1000, 9999)}`,
            sl: int(0, 50) / 10 + 2, vl: int(0, 70) / 10 + 3,
            slUsed: int(0, 40) / 10, vlUsed: int(0, 50) / 10,
            points: rand() < 0.7 ? 0 : int(1, 9),
            hmo: rand() < 0.8,
        });
    }
    // Fixed demo accounts used by the login screens
    employees[0].first = 'Alex'; employees[0].last = 'Rivera'; employees[0].name = 'Rivera, Alex'; employees[0].display = 'Alex Rivera'; employees[0].initials = 'AR'; employees[0].position = 'Systems Developer'; employees[0].id = 24001;
    employees[3].first = 'Jamie'; employees[3].last = 'Cruz'; employees[3].name = 'Cruz, Jamie'; employees[3].display = 'Jamie Cruz'; employees[3].initials = 'JC'; employees[3].position = 'Team Leader'; employees[3].id = 24022; employees[3].status = 'Regular';
    employees.forEach((e) => { e.email = `${e.first}.${e.last}`.toLowerCase().replace(/\s+/g, '') + '@acmestaffing.demo'; });

    const byId = (id) => employees.find((e) => String(e.id) === String(id));
    const active = employees.slice(0, 118);
    const resigned = employees.slice(118).map((e, i) => ({ ...e, resignedOn: iso(addDays(today, -int(5, 300))), reason: pick(['Career growth', 'Relocation', 'Further studies', 'Health reasons', 'End of contract']), clearance: pick(['Cleared', 'Pending', 'Cleared']) }));

    /* ---------- Attendance (last 45 days) ---------- */
    function minutesToTime(m) {
        m = ((m % 1440) + 1440) % 1440;
        const h = Math.floor(m / 60), mm = m % 60;
        const ap = h >= 12 ? 'PM' : 'AM';
        return `${((h + 11) % 12) + 1}:${pad(mm)} ${ap}`;
    }
    const attendance = {};   // id -> [{date, in, out, status, late}]
    active.forEach((e) => {
        const rows = [];
        for (let d = 44; d >= 0; d--) {
            const date = addDays(today, -d);
            const dow = date.getDay();
            if (dow === 0 || dow === 6) { rows.push({ date: iso(date), status: 'RD' }); continue; }
            const r = rand();
            const [sh, sm] = e.shift.start.split(':').map(Number);
            const start = sh * 60 + sm;
            if (r < 0.04) { rows.push({ date: iso(date), status: 'A' }); continue; }
            if (r < 0.09) { rows.push({ date: iso(date), status: 'L', leave: pick(['VL', 'SL']) }); continue; }
            const late = r < 0.2 ? int(1, 35) : 0;
            const inM = start - int(0, 15) + (late ? late + 15 : 0);
            const outM = start + 540 + int(0, 20);
            rows.push({ date: iso(date), in: minutesToTime(inM), out: d === 0 ? '' : minutesToTime(outM), status: late ? 'LT' : 'P', late });
        }
        attendance[e.id] = rows;
    });

    /* ---------- Requests ---------- */
    let reqId = 9100;
    const leaveTypes = ['Vacation Leave', 'Sick Leave', 'Emergency Leave', 'Birthday Leave', 'Bereavement Leave'];
    const reasonsLeave = ['Family event out of town', 'Fever and flu', 'Medical check-up', 'Personal errands', 'Birthday', 'Child is sick', 'Government ID appointment'];
    const mk = (kind, n, build) => Array.from({ length: n }, () => {
        const e = pick(active);
        const applied = addDays(today, -int(0, 30));
        return { id: ++reqId, kind, emp: e.id, name: e.name, dept: e.dept, applied: iso(applied), ...build(e, applied) };
    }).sort((a, b) => b.applied.localeCompare(a.applied));

    const requests = {
        leave: mk('leave', 34, (e, a) => {
            const from = addDays(a, int(1, 14));
            const days = int(1, 3);
            return { type: pick(leaveTypes), from: iso(from), to: iso(addDays(from, days - 1)), days, reason: pick(reasonsLeave), supervisor: pick(['Approved', 'Approved', 'Approved', 'Pending', 'Declined']), hr: pick(['Not posted', 'Not posted', 'Posted']) };
        }),
        adjustments: mk('adjustments', 22, (e, a) => {
            const d = addDays(a, -int(0, 3));
            return { date: iso(d), field: pick(['Time in', 'Time out', 'Time in and out']), time: minutesToTime(int(300, 1380)), reason: pick(['Forgot to log in', 'Biometric did not read', 'Power interruption', 'System outage']), supervisor: pick(['Approved', 'Approved', 'Pending']), hr: pick(['Pending', 'Pending', 'Approved', 'Denied']) };
        }),
        overtime: mk('overtime', 26, (e, a) => ({ date: a ? iso(a) : '', hours: int(1, 4), reason: pick(['Queue backlog', 'Client escalation', 'Month-end reports', 'System migration']), supervisor: pick(['Approved', 'Approved', 'Pending', 'Declined']) })),
        eeo: mk('eeo', 9, (e, a) => ({ date: iso(a), time: minutesToTime(int(600, 1300)), reason: pick(['Family emergency', 'Feeling unwell', 'Child pickup – emergency']), proof: rand() < 0.7, hr: pick(['Awaiting HR', 'Awaiting HR', 'Done']) })),
        movement: mk('movement', 12, (e, a) => {
            const to = pick(SHIFTS.filter((s) => s.code !== e.shift.code));
            return { change: pick(['Shift change', 'Department transfer', 'Position change']), from: e.shift.code, to: to.code, effective: iso(addDays(a, int(3, 20))), hr: pick(['Pending', 'Pending', 'Acknowledged']) };
        }),
        hso: mk('hso', 8, (e, a) => ({ from: iso(addDays(a, 5)), to: iso(addDays(a, 35)), setup: pick(['Laptop + headset', 'Own PC']), internet: pick(['Fiber 100 Mbps', 'Fiber 200 Mbps', 'DSL 50 Mbps']), hr: pick(['Awaiting HR', 'Acknowledged']) })),
        transfer: mk('transfer', 6, (e, a) => ({ fromSite: e.site, toSite: pick(SITES.filter((s) => s !== e.site)), effective: iso(addDays(a, int(7, 21))), hr: pick(['Awaiting HR', 'Acknowledged']) })),
    };

    /* ---------- Infractions ---------- */
    const infractions = Array.from({ length: 30 }, (_, i) => {
        const e = pick(active);
        const cat = pick(['A', 'A', 'B', 'C']);
        return { id: 700 + i, emp: e.id, name: e.name, dept: e.dept, date: iso(addDays(today, -int(1, 120))), category: cat, offense: pick({ A: ['Tardiness (3 lates in a cut-off)', 'Missed log', 'Unauthorized break overbreak'], B: ['Absent without leave', 'Dress code violation'], C: ['Policy breach – data handling', 'Insubordination'] }[cat]), points: { A: 1, B: 3, C: 6 }[cat], status: pick(['Served', 'Issued', 'Issued', 'For NTE']) };
    }).sort((a, b) => b.date.localeCompare(a.date));

    /* ---------- Admin ---------- */
    const announcements = [
        { id: 1, title: 'Holiday schedule for the year-end break', body: 'Operations run on a skeleton schedule. Check the posted roster with your team leader.', posted: iso(addDays(today, -2)), audience: 'All employees', popup: true },
        { id: 2, title: 'HMO enrollment for new regulars', body: 'Newly regularized employees: submit your dependents form to HR by the end of the month.', posted: iso(addDays(today, -9)), audience: 'Regular employees', popup: false },
        { id: 3, title: 'Biometric maintenance this Saturday', body: 'Use the portal time-adjustment form for any logs missed during the maintenance window.', posted: iso(addDays(today, -16)), audience: 'All employees', popup: false },
    ];
    const editHistory = Array.from({ length: 24 }, (_, i) => {
        const e = pick(active);
        return { at: iso(addDays(today, -int(1, 20))) + ` ${pad(int(8, 19))}:${pad(int(0, 59))}`, by: pick(['hr.associate', 'hr.supervisor', 'recruiter.1']), emp: e.name, field: pick(['Shift', 'Department', 'Position', 'Mobile number', 'Employment status', 'Leave credits (VL)', 'Time in']), from: pick(['AM', 'CS-A', '—', 'Probationary', '5.0', '9:12 AM']), to: pick(['MID', 'TECH', 'Regular', '6.5', '8:58 AM']) };
    }).sort((a, b) => b.at.localeCompare(a.at));

    /* ---------- Payslips (portal) ---------- */
    const payslips = Array.from({ length: 6 }, (_, i) => {
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() > 15 ? 15 : 0);
        const cut = addDays(end, -15 * i);
        const basic = 11250, ot = int(0, 2400), nd = int(400, 1600), late = int(0, 350);
        const sss = 675, ph = 281.25, hdmf = 100, tax = 0;
        const gross = basic + ot + nd - late;
        return { period: `${fmt(iso(addDays(cut, -14)))} – ${fmt(iso(cut))}`, payDate: fmt(iso(addDays(cut, 5))), basic, ot, nd, late, sss, ph, hdmf, tax, gross, net: gross - sss - ph - hdmf - tax };
    });

    window.DemoData = {
        company: 'Acme Staffing Co.',
        today, iso, fmt, addDays, pad,
        DEPARTMENTS, SHIFTS, SITES,
        employees: active, allEmployees: employees, resigned, byId,
        attendance, requests, infractions, announcements, editHistory, payslips,
        blacklisted: [
            { name: 'Doe, John', reason: 'Falsified documents', date: iso(addDays(today, -400)), by: 'HR Supervisor' },
            { name: 'Roe, Richard', reason: 'Abandonment of work', date: iso(addDays(today, -220)), by: 'HR Supervisor' },
            { name: 'Smith, Jane', reason: 'Gross misconduct', date: iso(addDays(today, -95)), by: 'HR Associate' },
        ],
        hrUser: { name: 'Demo HR', username: 'hr.demo' },
        portalUser: byId(24022),
    };
})();
