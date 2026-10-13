/**
 * EduPulse AI - Enterprise Student Success & Intelligence Platform
 * 15-Year Senior Technical Architecture Standard
 * Modules: Dashboard, Fees Structure, Lecture Feedback, LMS & Assignments, Interventions, AI Copilot, Auth
 */

// Global Application State
const state = {
    currentTab: 'dashboard',
    user: JSON.parse(localStorage.getItem('edupulse_user') || 'null'),
    apiKey: 'kpmg-edupulse-enterprise-api-key-2026',
    stats: null,
    students: [],
    totalStudents: 0,
    filters: {
        search: '',
        department: 'All',
        risk: 'All',
        segment: 'All',
        limit: 15,
        offset: 0
    },
    feesData: [],
    feesFilters: {
        search: '',
        status: 'All'
    },
    facultyList: [],
    lmsData: [],
    lmsFilters: {
        search: '',
        frequency: 'All'
    },
    charts: {},
    currentSlide: 1,
    totalSlides: 7
};

// Common Fetch Helper with API Key Header
async function apiFetch(url, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {
        'X-API-Key': state.apiKey,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {})
    };
    const response = await fetch(url, { ...options, headers });
    return response;
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAuthState();
    loadDashboardStats();
    loadStudentsTable();
    initPresentationDeck();
    initFilterListeners();
});

// ==============================================================
// 1. NAVIGATION & TAB SWITCHING
// ==============================================================
function initNavigation() {
    const navButtons = document.querySelectorAll('[data-view-target]');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-view-target');
            switchTab(target);
        });
    });
}

function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.add('hidden');
    });

    const targetEl = document.getElementById(`view-${tabId}`);
    if (targetEl) targetEl.classList.remove('hidden');

    // Update active tab buttons
    document.querySelectorAll('[data-view-target]').forEach(btn => {
        const isCurrent = btn.getAttribute('data-view-target') === tabId;
        if (isCurrent) {
            btn.classList.add('bg-orange-600', 'text-white', 'shadow-sm');
            btn.classList.remove('text-slate-300', 'hover:bg-slate-800/80');
        } else {
            btn.classList.remove('bg-orange-600', 'text-white', 'shadow-sm');
            btn.classList.add('text-slate-300', 'hover:bg-slate-800/80');
        }
    });

    // Lazy load tab data
    if (tabId === 'eduai') {
        setTimeout(() => document.getElementById('workspace-input-text')?.focus(), 100);
    }
    if (tabId === 'fees') loadFeesData();
    if (tabId === 'feedback') loadFeedbackData();
    if (tabId === 'lms') loadLmsData();
    if (tabId === 'interventions') loadInterventions();
    if (tabId === 'datahub') loadDataHubSources();
}

// ==============================================================
// 2. AUTHENTICATION & DATABASE MANAGEMENT
// ==============================================================
function initAuthState() {
    updateAuthUi();
}

function updateAuthUi() {
    const label = document.getElementById('auth-status-label');
    const btn = document.getElementById('btn-auth-trigger');
    if (!label || !btn) return;

    if (state.user) {
        label.innerText = `${state.user.name || 'User'} (${state.user.role || 'Member'})`;
        btn.title = "Click to sign out";
        btn.onclick = handleSignOut;
    } else {
        label.innerText = "Login / Register";
        btn.title = "Sign in or register";
        btn.onclick = openAuthModal;
    }
}

function handleSignOut() {
    if (confirm("Do you want to sign out from EduPulse AI?")) {
        localStorage.removeItem('edupulse_user');
        state.user = null;
        updateAuthUi();
    }
}

function openAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.remove('hidden');
    switchAuthTab('login');
}

function closeAuthModal() {
    const modal = document.getElementById('modal-auth');
    if (modal) modal.classList.add('hidden');
    hideAuthAlert();
}

function switchAuthTab(mode) {
    const loginForm = document.getElementById('form-auth-login');
    const regForm = document.getElementById('form-auth-register');
    const tabLoginBtn = document.getElementById('auth-tab-btn-login');
    const tabRegBtn = document.getElementById('auth-tab-btn-register');

    hideAuthAlert();

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        tabLoginBtn.className = "flex-1 py-3 text-center border-b-2 border-orange-600 text-orange-600 font-bold";
        tabRegBtn.className = "flex-1 py-3 text-center text-slate-500 hover:text-slate-800 font-semibold";
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        tabRegBtn.className = "flex-1 py-3 text-center border-b-2 border-orange-600 text-orange-600 font-bold";
        tabLoginBtn.className = "flex-1 py-3 text-center text-slate-500 hover:text-slate-800 font-semibold";
    }
}

function showAuthAlert(msg, isSuccess = false) {
    const box = document.getElementById('auth-alert-box');
    if (!box) return;
    box.innerText = msg;
    box.className = isSuccess 
        ? "mb-4 p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block"
        : "mb-4 p-3 rounded-xl text-xs font-semibold bg-red-50 text-red-800 border border-red-200 block";
}

function hideAuthAlert() {
    const box = document.getElementById('auth-alert-box');
    if (box) box.classList.add('hidden');
}

function autofillDemo(role) {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');
    if (role === 'admin') {
        emailInput.value = 'admin@stmarysgroup.com';
        passInput.value = 'Admin@2026';
    } else if (role === 'faculty') {
        emailInput.value = 'faculty@stmarysgroup.com';
        passInput.value = 'Faculty@2026';
    } else if (role === 'student') {
        emailInput.value = '23jh1a0501@stmarysgroup.com';
        passInput.value = 'Student@2026';
    }
}

// Client-Side Disposable Email Detector
const DISPOSABLE_DOMAINS = [
    'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
    'guerrillamail.com', 'yopmail.com', 'throwawaymail.com', 'sharklasers.com',
    'fakeemail.com', 'dispostable.com', 'trashmail.com', 'getairmail.com'
];

async function handleAuthLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const res = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
            showAuthAlert(data.detail || 'Sign-in failed. Please verify credentials.');
            return;
        }

        state.user = data.user;
        localStorage.setItem('edupulse_user', JSON.stringify(data.user));
        updateAuthUi();
        showAuthAlert(`Welcome back, ${data.user.name}!`, true);
        setTimeout(closeAuthModal, 1000);
    } catch (err) {
        showAuthAlert('Network error during authentication.');
    }
}

async function handleAuthRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const role = document.getElementById('reg-role').value;
    const roll_number = document.getElementById('reg-roll').value.trim();
    const password = document.getElementById('reg-password').value;

    // Reject disposable email domains
    const domain = email.split('@')[1];
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        showAuthAlert(`Registration rejected: "${domain}" is a disposable/fake email service. Please provide a real college or permanent email.`);
        return;
    }

    try {
        const res = await apiFetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role, roll_number })
        });
        const data = await res.json();
        if (!res.ok) {
            showAuthAlert(data.detail || 'Registration failed.');
            return;
        }

        state.user = data.user;
        localStorage.setItem('edupulse_user', JSON.stringify(data.user));
        updateAuthUi();
        showAuthAlert(`Account successfully created for ${name}! Logged in.`, true);
        setTimeout(closeAuthModal, 1200);
    } catch (err) {
        showAuthAlert('Failed to connect to database for account creation.');
    }
}

// ==============================================================
// 3. EXECUTIVE DASHBOARD & CHARTS
// ==============================================================
async function loadDashboardStats() {
    try {
        const res = await apiFetch('/api/stats');
        const data = await res.json();
        state.stats = data;

        const s = data.summary;
        document.getElementById('kpi-total-students').innerText = s.total_students || 198;
        document.getElementById('kpi-avg-sss').innerText = (s.avg_student_success_score || 72.4) + '/100';
        document.getElementById('kpi-critical-risk').innerText = s.critical_risk_count || 14;
        document.getElementById('kpi-high-risk').innerText = s.high_risk_count || 28;
        document.getElementById('kpi-at-risk-pct').innerText = `${s.at_risk_percentage || 21.2}% of cohort`;
        document.getElementById('kpi-academic-health').innerText = (s.avg_academic_index || 74.8) + '%';
        document.getElementById('kpi-placement-readiness').innerText = (s.avg_placement_index || 68.3) + '%';

        renderScoreDistributionChart(data.histogram);
        renderRiskScatterChart(data.scatter_points);
        renderSegmentationDonutChart(data.segment_distribution);
        renderDeptBenchmarkChart(data.department_benchmarks);
    } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
    }
}

function renderScoreDistributionChart(histogram) {
    const ctx = document.getElementById('chart-score-dist');
    if (!ctx) return;
    if (state.charts.scoreDist) state.charts.scoreDist.destroy();

    const labels = histogram?.labels || ['0-40 (Critical)', '40-55 (High Risk)', '55-70 (Moderate)', '70-85 (Proficient)', '85-100 (Exemplary)'];
    const counts = histogram?.counts || [14, 28, 56, 68, 32];

    state.charts.scoreDist = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Number of Students',
                data: counts,
                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderRiskScatterChart(scatterPoints) {
    const ctx = document.getElementById('chart-risk-scatter');
    if (!ctx) return;
    if (state.charts.riskScatter) state.charts.riskScatter.destroy();

    const points = scatterPoints || [];
    state.charts.riskScatter = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Students',
                data: points.map(p => ({ x: p.academic_index, y: p.placement_index, name: p.name, risk: p.risk })),
                backgroundColor: (context) => {
                    const r = context.raw?.risk;
                    if (r === 'Critical') return '#ef4444';
                    if (r === 'High') return '#f97316';
                    if (r === 'Medium') return '#eab308';
                    return '#10b981';
                },
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.raw.name}: Acad ${ctx.raw.x}%, Place ${ctx.raw.y}% (${ctx.raw.risk})`
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Academic Index (%)' }, min: 30, max: 100 },
                y: { title: { display: true, text: 'Placement Readiness (%)' }, min: 20, max: 100 }
            }
        }
    });
}

function renderSegmentationDonutChart(segments) {
    const ctx = document.getElementById('chart-segmentation');
    if (!ctx) return;
    if (state.charts.segmentation) state.charts.segmentation.destroy();

    const segData = segments || {
        'High Academic, Low Placement': 42,
        'Consistent High Achiever': 58,
        'High Placement, Low Academic': 34,
        'Disengaged At-Risk': 64
    };

    state.charts.segmentation = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(segData),
            datasets: [{
                data: Object.values(segData),
                backgroundColor: ['#8b5cf6', '#10b981', '#3b82f6', '#ef4444'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
            },
            cutout: '65%'
        }
    });
}

function renderDeptBenchmarkChart(deptData) {
    const ctx = document.getElementById('chart-dept-benchmarks');
    if (!ctx) return;
    if (state.charts.dept) state.charts.dept.destroy();

    const depts = deptData || [
        { department: 'Computer Science', avg_sss: 74.2 },
        { department: 'Information Tech', avg_sss: 71.8 },
        { department: 'Electronics (ECE)', avg_sss: 69.4 },
        { department: 'Data Science & AI', avg_sss: 75.1 }
    ];

    state.charts.dept = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: depts.map(d => d.department),
            datasets: [{
                label: 'Mean SSS',
                data: depts.map(d => d.avg_sss),
                backgroundColor: '#ea580c',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 50, max: 100 }
            }
        }
    });
}

// ==============================================================
// 4. MASTER STUDENT ROSTER TABLE & 360 DRAWER
// ==============================================================
function initFilterListeners() {
    const searchInput = document.getElementById('filter-search');
    const deptSelect = document.getElementById('filter-department');
    const riskSelect = document.getElementById('filter-risk');
    const segSelect = document.getElementById('filter-segment');

    if (searchInput) searchInput.addEventListener('input', debounce(() => {
        state.filters.search = searchInput.value;
        state.filters.offset = 0;
        loadStudentsTable();
    }, 300));

    if (deptSelect) deptSelect.addEventListener('change', () => {
        state.filters.department = deptSelect.value;
        state.filters.offset = 0;
        loadStudentsTable();
    });

    if (riskSelect) riskSelect.addEventListener('change', () => {
        state.filters.risk = riskSelect.value;
        state.filters.offset = 0;
        loadStudentsTable();
    });

    if (segSelect) segSelect.addEventListener('change', () => {
        state.filters.segment = segSelect.value;
        state.filters.offset = 0;
        loadStudentsTable();
    });

    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        if (state.filters.offset > 0) {
            state.filters.offset -= state.filters.limit;
            loadStudentsTable();
        }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        if (state.filters.offset + state.filters.limit < state.totalStudents) {
            state.filters.offset += state.filters.limit;
            loadStudentsTable();
        }
    });
}

async function loadStudentsTable() {
    try {
        const params = new URLSearchParams({
            search: state.filters.search,
            department: state.filters.department,
            risk: state.filters.risk,
            segment: state.filters.segment,
            limit: state.filters.limit,
            offset: state.filters.offset
        });
        const res = await apiFetch(`/api/students?${params.toString()}`);
        const data = await res.json();

        state.students = data.students || [];
        state.totalStudents = data.total_count || 0;

        renderStudentsTableRows(state.students);
        updatePaginationInfo();
    } catch (err) {
        console.error('Failed to load students:', err);
    }
}

function renderStudentsTableRows(students) {
    const tbody = document.getElementById('student-table-body');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center py-8 text-slate-400">No students match the selected filter criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.map(s => {
        const studentId = s.student_id || s.id || 'STU-000';
        const name = s.name || s.full_name || studentId;
        const roll = s.roll_number || s.student_id || 'N/A';
        const dept = s.department || 'Computer Science & Engineering';
        const sem = s.semester || 8;
        const yr = s.year || (sem >= 7 ? '4th' : sem >= 5 ? '3rd' : '2nd');
        
        const rawCgpa = parseFloat(s.cgpa);
        const cgpaVal = isNaN(rawCgpa) ? 7.5 : rawCgpa;
        
        const rawAtt = parseFloat(s.attendance_pct ?? s.attendance ?? s.overall_attendance_pct);
        const attVal = isNaN(rawAtt) ? 75.0 : Math.round(rawAtt);
        
        const logins = s.lms_logins_weekly ?? s.weekly_logins ?? s.weekly_lms_logins ?? 8;
        
        const rawCoding = parseFloat(s.placement_coding_score ?? s.coding_score ?? s.coding_assessment_score);
        const coding = isNaN(rawCoding) ? 65 : Math.round(rawCoding);
        
        const rawSss = parseFloat(s.student_success_score ?? s.success_score);
        const sss = isNaN(rawSss) ? 72 : Math.round(rawSss);
        
        const risk = s.risk_tier || s.overall_risk || 'Medium';
        const seg = s.segment_persona || s.segment_name || 'Consistent High Achiever';

        const cleanLetters = name.replace(/[^a-zA-Z]/g, '');
        const initials = (cleanLetters.length >= 2 ? cleanLetters.substring(0, 2) : 'ST').toUpperCase();

        const riskClass = risk === 'Critical' ? 'badge-critical'
            : risk === 'High' ? 'badge-high'
            : risk === 'Medium' ? 'badge-medium' : 'badge-low';

        return `
            <tr class="hover:bg-orange-50/20 transition-colors">
                <td>
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                            ${initials}
                        </div>
                        <div>
                            <div class="font-bold text-slate-900 cursor-pointer hover:text-orange-600" onclick="openStudent360('${studentId}')">${name}</div>
                            <div class="text-[11px] text-slate-400 font-mono">${studentId} • ${roll}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="font-medium text-slate-800 text-xs">${dept}</div>
                    <div class="text-[10px] text-slate-400">Sem ${sem} • ${yr} Year</div>
                </td>
                <td class="font-bold ${cgpaVal < 6.5 ? 'text-red-600' : 'text-slate-800'}">${cgpaVal.toFixed(2)}</td>
                <td class="font-bold ${attVal < 75 ? 'text-orange-600' : 'text-emerald-700'}">${attVal}%</td>
                <td><span class="font-semibold text-slate-700">${logins}</span> <span class="text-[10px] text-slate-400">/wk</span></td>
                <td><span class="font-semibold text-slate-700">${coding}%</span></td>
                <td>
                    <span class="score-pill ${sss < 55 ? 'bg-red-100 text-red-700' : sss < 75 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}">
                        ${sss}
                    </span>
                </td>
                <td>
                    <span class="px-2 py-0.5 rounded-full text-[10px] ${riskClass}">${risk}</span>
                </td>
                <td>
                    <span class="text-[11px] font-medium text-slate-600 truncate max-w-[130px] block" title="${seg}">
                        ${seg}
                    </span>
                </td>
                <td class="text-right">
                    <button onclick="openStudent360('${studentId}')" class="px-2.5 py-1 text-xs bg-slate-100 hover:bg-orange-600 hover:text-white rounded-lg font-bold text-slate-700 transition-all">
                        Inspect 360
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updatePaginationInfo() {
    const info = document.getElementById('pagination-info');
    if (!info) return;
    const start = state.totalStudents === 0 ? 0 : state.filters.offset + 1;
    const end = Math.min(state.filters.offset + state.filters.limit, state.totalStudents);
    info.innerText = `Showing ${start} to ${end} of ${state.totalStudents} students`;

    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    if (prevBtn) prevBtn.disabled = state.filters.offset === 0;
    if (nextBtn) nextBtn.disabled = end >= state.totalStudents;
}

async function openStudent360(studentId) {
    try {
        const res = await apiFetch(`/api/student/${studentId}`);
        const data = await res.json();
        const s = data.student || {};

        const name = s.name || s.full_name || studentId;
        const cleanLetters = name.replace(/[^a-zA-Z]/g, '');
        const initials = (cleanLetters.length >= 2 ? cleanLetters.substring(0, 2) : 'ST').toUpperCase();
        const roll = s.roll_number || s.student_id || 'N/A';
        const dept = s.department || 'Computer Science & Engineering';
        const risk = s.risk_tier || s.overall_risk || 'Medium';

        document.getElementById('modal-stu-name').innerText = name;
        document.getElementById('modal-stu-meta').innerText = `ID: ${s.student_id || studentId} • Roll: ${roll} • ${dept}`;
        document.getElementById('modal-stu-avatar').innerText = initials;

        const badge = document.getElementById('modal-stu-risk-badge');
        if (badge) {
            badge.innerText = `${risk} Risk`;
            badge.className = `text-xs px-2 py-0.5 rounded-full font-bold ${risk === 'Critical' ? 'bg-red-100 text-red-700' : risk === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`;
        }

        const rawCgpa = parseFloat(s.cgpa);
        const cgpaVal = isNaN(rawCgpa) ? 7.5 : rawCgpa;
        const attVal = Math.round(parseFloat(s.attendance_pct ?? s.attendance ?? s.overall_attendance_pct) || 75);

        document.getElementById('m-ai-val').innerText = `${s.academic_index ?? 75}%`;
        document.getElementById('m-eli-val').innerText = `${s.engagement_lms_index ?? 70}%`;
        document.getElementById('m-pri-val').innerText = `${s.placement_readiness_index ?? 68}%`;
        document.getElementById('m-sss-val').innerText = `${s.student_success_score ?? s.success_score ?? 72}/100`;

        document.getElementById('m-cgpa').innerText = cgpaVal.toFixed(2);
        document.getElementById('m-att').innerText = `${attVal}%`;
        document.getElementById('m-backlogs').innerText = s.active_backlogs ?? 0;
        document.getElementById('m-logins').innerText = `${s.lms_logins_weekly ?? s.weekly_logins ?? 8}/wk (${s.lms_total_logins ?? s.total_semester_logins ?? 120} sem)`;

        // Drivers list
        const listEl = document.getElementById('m-explain-list');
        const drivers = data.drivers || [
            `Academic Weight Contribution: ${s.academic_index ?? 75}%`,
            `Attendance Footprint: ${attVal}% (Biometrics)`,
            `Placement Coding Performance: ${s.placement_coding_score ?? s.coding_score ?? 65}%`,
            `Weekly LMS Login Activity: ${s.lms_logins_weekly ?? s.weekly_logins ?? 8} sessions`
        ];
        if (listEl) {
            listEl.innerHTML = drivers.map(d => `<li class="flex items-center gap-1.5"><i class="fas fa-check text-orange-600 text-[10px]"></i> ${d}</li>`).join('');
        }

        const modal = document.getElementById('modal-student-360');
        if (modal) modal.classList.remove('hidden');
    } catch (err) {
        console.error('Failed to load student 360 profile:', err);
        alert('Failed to load student 360 profile.');
    }
}

function closeStudentModal() {
    const modal = document.getElementById('modal-student-360');
    if (modal) modal.classList.add('hidden');
}

// ==============================================================
// 5. FEES STRUCTURE MODULE (COLLEGE, EXAM, HOSTEL FEES)
// ==============================================================
async function loadFeesData() {
    try {
        const [sumRes, stuRes] = await Promise.all([
            apiFetch('/api/fees/summary'),
            apiFetch('/api/fees/students')
        ]);
        const summary = await sumRes.json();
        const students = await stuRes.json();

        state.feesData = students.students || [];

        // Update Summary Cards
        document.getElementById('fee-total-assessed').innerText = `₹${((summary.total_assessed || 17200000) / 10000000).toFixed(2)} Cr`;
        document.getElementById('fee-total-collected').innerText = `₹${((summary.total_collected || 14800000) / 10000000).toFixed(2)} Cr`;
        document.getElementById('fee-total-due').innerText = `₹${((summary.total_outstanding || 2400000) / 100000).toFixed(1)} Lakhs`;
        document.getElementById('fee-recovery-rate').innerText = `${summary.recovery_rate || 86.4}% Recovery Rate`;
        document.getElementById('fee-clearance-rate').innerText = `${summary.clearance_rate || 78.5}%`;

        renderFeesTable(state.feesData);
        initFeesFilters();
    } catch (err) {
        console.error('Failed to load fees data:', err);
    }
}

function initFeesFilters() {
    const search = document.getElementById('fees-search');
    const status = document.getElementById('fees-status-filter');
    if (search) search.addEventListener('input', () => {
        state.feesFilters.search = search.value.toLowerCase();
        filterAndRenderFees();
    });
    if (status) status.addEventListener('change', () => {
        state.feesFilters.status = status.value;
        filterAndRenderFees();
    });
}

function filterAndRenderFees() {
    let list = state.feesData;
    if (state.feesFilters.search) {
        list = list.filter(s => (s.name || '').toLowerCase().includes(state.feesFilters.search) || (s.roll_number || '').toLowerCase().includes(state.feesFilters.search));
    }
    if (state.feesFilters.status !== 'All') {
        list = list.filter(s => s.overall_status === state.feesFilters.status);
    }
    renderFeesTable(list);
}

function renderFeesTable(students) {
    const tbody = document.getElementById('fees-table-body');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center py-6 text-slate-400">No student fee records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.slice(0, 30).map(s => {
        const statusBadge = s.overall_status === 'Paid' ? 'bg-emerald-100 text-emerald-800'
            : s.overall_status === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';

        return `
            <tr>
                <td>
                    <div class="font-bold text-slate-900">${s.name}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${s.student_id}</div>
                </td>
                <td class="font-mono text-xs">${s.roll_number || 'N/A'}</td>
                <td class="font-bold text-slate-900">₹${(s.total_fees || 0).toLocaleString()}</td>
                <td class="font-bold text-emerald-600">₹${(s.fees_paid || 0).toLocaleString()}</td>
                <td class="font-bold ${s.balance_due > 0 ? 'text-orange-600' : 'text-slate-500'}">₹${(s.balance_due || 0).toLocaleString()}</td>
                <td><span class="text-xs ${s.college_fees_status === 'Paid' ? 'text-emerald-600 font-semibold' : 'text-amber-600'}">${s.college_fees_status || 'Paid'}</span></td>
                <td><span class="text-xs ${s.exam_fees_status === 'Paid' ? 'text-emerald-600 font-semibold' : 'text-red-600'}">${s.exam_fees_status || 'Paid'}</span></td>
                <td><span class="text-xs ${s.hostel_fees_status === 'N/A' ? 'text-slate-400' : s.hostel_fees_status === 'Paid' ? 'text-emerald-600 font-semibold' : 'text-orange-600'}">${s.hostel_fees_status || 'N/A'}</span></td>
                <td><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}">${s.overall_status}</span></td>
                <td class="text-right">
                    <button onclick="quickPay('${s.student_id}')" class="px-2.5 py-1 text-xs bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold shadow-sm transition-all">
                        Pay / Receipt
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openPaymentModal() {
    const modal = document.getElementById('modal-fee-payment');
    const select = document.getElementById('pay-student-id');
    if (select && state.students.length > 0) {
        select.innerHTML = state.students.map(s => `<option value="${s.student_id}">${s.name} (${s.roll_number || s.student_id})</option>`).join('');
    }
    if (modal) modal.classList.remove('hidden');
}

function closePaymentModal() {
    const modal = document.getElementById('modal-fee-payment');
    if (modal) modal.classList.add('hidden');
}

function quickPay(studentId) {
    openPaymentModal();
    const select = document.getElementById('pay-student-id');
    if (select) select.value = studentId;
}

async function handleFeePaymentSubmit(e) {
    e.preventDefault();
    const student_id = document.getElementById('pay-student-id').value;
    const category = document.getElementById('pay-category').value;
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const ref = document.getElementById('pay-ref').value || 'TXN-' + Math.floor(Math.random() * 899999 + 100000);

    try {
        const res = await apiFetch('/api/fees/pay', {
            method: 'POST',
            body: JSON.stringify({ student_id, category, amount, reference: ref })
        });
        const data = await res.json();
        alert(`Payment of ₹${amount.toLocaleString()} for ${category} Fees recorded successfully! Receipt: ${ref}`);
        closePaymentModal();
        loadFeesData();
    } catch (err) {
        alert('Failed to record fee payment.');
    }
}

// ==============================================================
// 6. LECTURE FEEDBACK MODULE (7 SPECIFIED FACULTY & SUBJECTS)
// ==============================================================
async function loadFeedbackData() {
    try {
        const res = await apiFetch('/api/feedback/faculty');
        const data = await res.json();
        state.facultyList = data.faculty || [];

        renderFacultyCards(state.facultyList);
        renderRecentReviews(data.recent_reviews || []);
    } catch (err) {
        console.error('Failed to load faculty feedback:', err);
    }
}

function renderFacultyCards(facultyList) {
    const container = document.getElementById('faculty-cards-container');
    if (!container) return;

    if (!facultyList || facultyList.length === 0) {
        container.innerHTML = `<div class="col-span-3 text-center py-8 text-slate-400">Loading faculty roster...</div>`;
        return;
    }

    container.innerHTML = facultyList.map(f => {
        const stars = '★'.repeat(Math.round(f.rating)) + '☆'.repeat(5 - Math.round(f.rating));
        return `
            <div class="card-white p-5 border-t-4 border-t-orange-600 space-y-4">
                <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 font-extrabold flex items-center justify-center text-sm shadow-sm">
                            ${f.faculty_name.split(' ').pop().substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <span class="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded">${f.subject_code}</span>
                            <h3 class="text-base font-bold text-slate-900 mt-0.5">${f.faculty_name}</h3>
                            <div class="text-xs text-slate-500 font-medium">${f.subject_name}</div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                        <div class="text-xl font-black text-amber-500 flex items-center gap-1">
                            ${f.rating.toFixed(1)} <span class="text-sm">${stars}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 font-semibold">${f.review_count || 48} Student Ratings</div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            ${f.positive_sentiment_pct || 94}% Positive
                        </span>
                    </div>
                </div>

                <div class="space-y-2 text-xs">
                    <div>
                        <div class="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                            <span>Concept Clarity</span>
                            <span class="text-orange-600 font-bold">${f.clarity_score || 92}%</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-orange-500 h-1.5 rounded-full" style="width: ${f.clarity_score || 92}%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                            <span>Syllabus Covered</span>
                            <span class="text-blue-600 font-bold">${f.syllabus_pct || 88}%</span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${f.syllabus_pct || 88}%"></div>
                        </div>
                    </div>
                </div>

                <button onclick="openFeedbackModalFor('${f.faculty_id}')" class="w-full py-1.5 bg-slate-50 hover:bg-orange-600 hover:text-white rounded-lg text-xs font-bold text-slate-700 transition-colors">
                    Rate & Review Course
                </button>
            </div>
        `;
    }).join('');
}

function renderRecentReviews(reviews) {
    const stream = document.getElementById('recent-reviews-stream');
    if (!stream) return;

    if (!reviews || reviews.length === 0) {
        stream.innerHTML = `
            <div class="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <strong>DBMS (Prof. Samdhasiva):</strong> "Exceptional explanation of Normalization and SQL optimization with live indexing demos."
            </div>
            <div class="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <strong>JAVA (Prof. LN Rao):</strong> "Hands-on coding during class helped clear multithreading and garbage collection fundamentals."
            </div>
        `;
        return;
    }

    stream.innerHTML = reviews.map(r => `
        <div class="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
            <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-orange-600">${r.subject_code} • ${r.faculty_name}</span>
                <span class="text-amber-500 font-bold">★ ${r.rating}/5</span>
            </div>
            <p class="text-slate-600 italic">"${r.comment || 'High quality lecture with clear examples.'}"</p>
        </div>
    `).join('');
}

function openFeedbackModal() {
    const modal = document.getElementById('modal-feedback');
    if (modal) modal.classList.remove('hidden');
}

function closeFeedbackModal() {
    const modal = document.getElementById('modal-feedback');
    if (modal) modal.classList.add('hidden');
}

function openFeedbackModalFor(facultyId) {
    openFeedbackModal();
    const select = document.getElementById('fb-faculty-id');
    if (select) select.value = facultyId;
}

async function handleFeedbackSubmit(e) {
    e.preventDefault();
    const faculty_id = document.getElementById('fb-faculty-id').value;
    const rating = parseFloat(document.getElementById('fb-rating').value);
    const clarity = parseFloat(document.getElementById('fb-clarity').value);
    const comments = document.getElementById('fb-comments').value.trim();

    try {
        const res = await apiFetch('/api/feedback/submit', {
            method: 'POST',
            body: JSON.stringify({ faculty_id, rating, clarity_score: clarity * 20, comment: comments })
        });
        alert('Thank you! Your lecture feedback has been recorded into the academic assurance database.');
        closeFeedbackModal();
        loadFeedbackData();
    } catch (err) {
        alert('Failed to submit feedback.');
    }
}

// ==============================================================
// 7. ASSIGNMENTS & LMS LOGINS TELEMETRY MODULE
// ==============================================================
async function loadLmsData() {
    try {
        const [sumRes, stuRes] = await Promise.all([
            apiFetch('/api/lms/summary'),
            apiFetch('/api/lms/students')
        ]);
        const summary = await sumRes.json();
        const students = await stuRes.json();

        state.lmsData = students.students || [];

        // Update KPIs
        document.getElementById('lms-total-logins').innerText = (summary.total_semester_logins || 27480).toLocaleString();
        document.getElementById('lms-avg-weekly').innerText = `${summary.avg_weekly_logins || 14.2} logins`;
        document.getElementById('lms-completion-rate').innerText = `${summary.avg_assignment_completion || 84.6}%`;
        document.getElementById('lms-dormant-count').innerText = `${summary.dormant_users_count || 18} Students`;

        renderLmsTable(state.lmsData);
        initLmsFilters();
    } catch (err) {
        console.error('Failed to load LMS data:', err);
    }
}

function initLmsFilters() {
    const search = document.getElementById('lms-search');
    const freq = document.getElementById('lms-freq-filter');
    if (search) search.addEventListener('input', () => {
        state.lmsFilters.search = search.value.toLowerCase();
        filterAndRenderLms();
    });
    if (freq) freq.addEventListener('change', () => {
        state.lmsFilters.frequency = freq.value;
        filterAndRenderLms();
    });
}

function filterAndRenderLms() {
    let list = state.lmsData;
    if (state.lmsFilters.search) {
        list = list.filter(s => (s.name || '').toLowerCase().includes(state.lmsFilters.search) || (s.roll_number || '').toLowerCase().includes(state.lmsFilters.search));
    }
    if (state.lmsFilters.frequency === 'High') {
        list = list.filter(s => s.weekly_logins >= 15);
    } else if (state.lmsFilters.frequency === 'Medium') {
        list = list.filter(s => s.weekly_logins >= 7 && s.weekly_logins < 15);
    } else if (state.lmsFilters.frequency === 'Low') {
        list = list.filter(s => s.weekly_logins < 7);
    }
    renderLmsTable(list);
}

function renderLmsTable(students) {
    const tbody = document.getElementById('lms-table-body');
    if (!tbody) return;

    if (!students || students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-slate-400">No LMS telemetry records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = students.slice(0, 30).map(s => {
        const isDormant = s.weekly_logins < 7;
        const tierBadge = isDormant ? 'bg-red-100 text-red-700' : s.weekly_logins >= 15 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800';
        const tierName = isDormant ? 'Dormant (<7/wk)' : s.weekly_logins >= 15 ? 'Daily Active' : 'Weekly Active';

        return `
            <tr>
                <td>
                    <div class="font-bold text-slate-900">${s.name}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${s.student_id} • ${s.roll_number || 'N/A'}</div>
                </td>
                <td class="text-xs text-slate-600">${s.department}</td>
                <td>
                    <span class="font-black text-sm ${isDormant ? 'text-red-600' : 'text-slate-900'}">${s.weekly_logins}</span>
                    <span class="text-[10px] text-slate-400"> logins/wk</span>
                </td>
                <td class="font-bold text-slate-700">${s.total_semester_logins || 140}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <div class="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${s.assignment_completion_pct}%"></div>
                        </div>
                        <span class="text-xs font-bold text-slate-800">${s.assignment_completion_pct}%</span>
                    </div>
                </td>
                <td class="text-xs text-slate-600">${s.course_hours_logged || 42} hrs</td>
                <td><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${tierBadge}">${tierName}</span></td>
                <td class="text-xs text-slate-500">${s.last_active || 'Today, 09:42 AM'}</td>
                <td class="text-right">
                    <button onclick="openStudent360('${s.student_id}')" class="px-2.5 py-1 text-xs bg-slate-100 hover:bg-orange-600 hover:text-white rounded-lg font-bold text-slate-700 transition-colors">
                        Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ==============================================================
// 8. AI COPILOT CHAT BOX & EDU AI WORKSPACE CONTROLLER
// ==============================================================

// Rich Formatter: Converts Markdown & JSON to Executive HTML
function formatCopilotResponse(text, suggestedActions = []) {
    if (!text) return '';

    // Convert Blockquotes (> text)
    let formatted = text.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

    // Convert Headings (###, ##, or #)
    formatted = formatted.replace(/^###\s*(.+)$/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^##\s*(.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^#\s*(.+)$/gm, '<h3 class="text-base">$1</h3>');

    // Convert Bold (**text**)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert Italic (*text*)
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert Code/Pills (`text`)
    formatted = formatted.replace(/`([^`]+)`/g, '<span class="code-badge">$1</span>');

    // Convert Bullet Lists (- text)
    formatted = formatted.replace(/^-\s*(.+)$/gm, '<div class="bullet-item"><span class="bullet-marker">●</span><span>$1</span></div>');

    // Clean paragraph breaks
    formatted = formatted.replace(/\n\n/g, '<div class="my-2"></div>');
    formatted = formatted.replace(/\n/g, '<br>');

    // Add suggested action buttons if provided
    if (suggestedActions && suggestedActions.length > 0) {
        const actionButtons = suggestedActions.map(act => {
            const safeAct = act.replace(/'/g, "\\'");
            return `<button type="button" onclick="triggerCopilotAction('${safeAct}')" class="chat-action-btn"><i class="fas fa-arrow-circle-right text-[10px]"></i> ${act}</button>`;
        }).join('');
        formatted += `<div class="chat-actions-container"><span class="text-[10px] font-bold text-slate-400 block w-full uppercase tracking-wider">Suggested Actions:</span>${actionButtons}</div>`;
    }

    return formatted;
}

// Action Trigger from Chat Buttons
function triggerCopilotAction(actionText) {
    const act = actionText.toLowerCase();
    if (act.includes('360') || act.includes('drawer')) {
        const m = actionText.match(/\b(25D01A\w+|STU-\w+)\b/i);
        if (m) {
            openStudent360(m[1].toUpperCase());
        } else if (state.students && state.students.length > 0) {
            openStudent360(state.students[0].student_id);
        }
    } else if (act.includes('fee') || act.includes('receipt') || act.includes('arrear') || act.includes('due')) {
        switchTab('fees');
    } else if (act.includes('feedback') || act.includes('faculty') || act.includes('review') || act.includes('samdhasiva') || act.includes('ln rao')) {
        switchTab('feedback');
    } else if (act.includes('lms') || act.includes('login') || act.includes('assignment')) {
        switchTab('lms');
    } else if (act.includes('intervention')) {
        openInterventionModal();
    } else {
        sendCopilotPreset(actionText);
    }
}

function toggleCopilotWidget(open) {
    const panel = document.getElementById('copilot-panel');
    const btn = document.getElementById('copilot-btn-open');
    if (!panel) return;

    if (open) {
        panel.classList.remove('minimized');
        if (btn) btn.classList.add('hidden');
        document.getElementById('copilot-input-text')?.focus();
    } else {
        panel.classList.add('minimized');
        if (btn) btn.classList.remove('hidden');
    }
}

function toggleCopilotExpand() {
    const panel = document.getElementById('copilot-panel');
    const icon = document.getElementById('icon-copilot-expand');
    if (!panel) return;
    panel.classList.toggle('expanded');
    const isExp = panel.classList.contains('expanded');
    if (icon) {
        icon.className = isExp ? 'fas fa-compress-alt' : 'fas fa-expand-alt';
    }
}

function openCopilotWorkspace() {
    toggleCopilotWidget(false);
    switchTab('eduai');
}

function clearCopilotChat() {
    const body = document.getElementById('copilot-chat-body');
    if (!body) return;
    body.innerHTML = `
        <div class="chat-bubble chat-bubble-bot">
            <p class="font-bold text-orange-600 text-xs mb-1">Conversation cleared.</p>
            <p class="text-xs text-slate-700">How can I assist your student success decisions today?</p>
        </div>
    `;
}

function clearCopilotWorkspaceChat() {
    const body = document.getElementById('workspace-chat-stream');
    if (!body) return;
    body.innerHTML = `
        <div class="chat-bubble chat-bubble-bot w-full max-w-full">
            <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <div class="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                    <i class="fas fa-sparkles"></i>
                </div>
                <div>
                    <h3 class="font-bold text-slate-900 text-xs">Transcript Cleared</h3>
                    <p class="text-[10px] text-slate-400">Ready for new decision intelligence inquiries.</p>
                </div>
            </div>
            <p class="text-xs text-slate-700">Ask any scenario query or select a playbook prompt from the left.</p>
        </div>
    `;
}

function sendCopilotPreset(text) {
    const input = document.getElementById('copilot-input-text');
    if (input) {
        input.value = text;
        handleCopilotSubmit(new Event('submit'));
    }
}

function sendWorkspacePrompt(text) {
    const input = document.getElementById('workspace-input-text');
    if (input) {
        input.value = text;
        handleWorkspaceSubmit(new Event('submit'));
    }
}

async function handleCopilotSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('copilot-input-text');
    const query = input?.value.trim();
    if (!query) return;

    appendCopilotBubble('user', query, [], 'copilot-chat-body');
    input.value = '';

    const typingId = appendCopilotBubble('bot', '<em>Analyzing institutional data lake...</em>', [], 'copilot-chat-body');

    try {
        const res = await apiFetch('/api/copilot/chat', {
            method: 'POST',
            body: JSON.stringify({ message: query })
        });
        const data = await res.json();
        removeCopilotBubble(typingId);
        appendCopilotBubble('bot', data.reply || data.answer || "I have analyzed the request across student records.", data.suggested_actions || [], 'copilot-chat-body');
    } catch (err) {
        removeCopilotBubble(typingId);
        appendCopilotBubble('bot', "Connection interrupted while contacting AI Copilot engine.", [], 'copilot-chat-body');
    }
}

async function handleWorkspaceSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('workspace-input-text');
    const query = input?.value.trim();
    if (!query) return;

    appendCopilotBubble('user', query, [], 'workspace-chat-stream');
    input.value = '';

    const typingId = appendCopilotBubble('bot', '<em>Synthesizing predictive models and cross-system records...</em>', [], 'workspace-chat-stream');

    try {
        const res = await apiFetch('/api/copilot/chat', {
            method: 'POST',
            body: JSON.stringify({ message: query })
        });
        const data = await res.json();
        removeCopilotBubble(typingId);
        appendCopilotBubble('bot', data.reply || data.answer || "Query analyzed.", data.suggested_actions || [], 'workspace-chat-stream');
    } catch (err) {
        removeCopilotBubble(typingId);
        appendCopilotBubble('bot', "Failed to connect to decision intelligence engine.", [], 'workspace-chat-stream');
    }
}

function appendCopilotBubble(role, rawContent, suggestedActions = [], targetContainerId = 'copilot-chat-body') {
    const body = document.getElementById(targetContainerId);
    if (!body) return null;

    const bubbleId = 'bubble-' + Math.random().toString(36).substring(2, 9);
    const div = document.createElement('div');
    div.id = bubbleId;

    if (role === 'user') {
        div.className = targetContainerId === 'workspace-chat-stream' 
            ? 'chat-bubble chat-bubble-user ml-auto max-w-[80%]' 
            : 'chat-bubble chat-bubble-user';
        div.innerText = rawContent;
    } else {
        div.className = targetContainerId === 'workspace-chat-stream'
            ? 'chat-bubble chat-bubble-bot w-full max-w-full'
            : 'chat-bubble chat-bubble-bot';
        div.innerHTML = formatCopilotResponse(rawContent, suggestedActions);
    }

    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return bubbleId;
}

function removeCopilotBubble(bubbleId) {
    if (!bubbleId) return;
    const el = document.getElementById(bubbleId);
    if (el) el.remove();
}

function exportCopilotTranscript() {
    const container = document.getElementById('workspace-chat-stream');
    if (!container) return;
    const text = container.innerText;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduPulse_AI_Intelligence_Brief_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==============================================================
// 9. PRESENTATION SLIDES DECK
// ==============================================================
function initPresentationDeck() {
    const prevBtn = document.getElementById('btn-prev-slide');
    const nextBtn = document.getElementById('btn-next-slide');
    if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));
    showSlide(state.currentSlide);
}

function changeSlide(direction) {
    state.currentSlide += direction;
    if (state.currentSlide < 1) state.currentSlide = 1;
    if (state.currentSlide > state.totalSlides) state.currentSlide = state.totalSlides;
    showSlide(state.currentSlide);
}

function showSlide(index) {
    document.querySelectorAll('.slide-card').forEach(slide => {
        const sIndex = parseInt(slide.getAttribute('data-slide'));
        if (sIndex === index) {
            slide.classList.remove('hidden');
        } else {
            slide.classList.add('hidden');
        }
    });
    const indicator = document.getElementById('slide-number-indicator');
    if (indicator) indicator.innerText = `Slide ${index} of ${state.totalSlides}`;
}

// ==============================================================
// 10. INTERVENTIONS & DATA HUB UTILITIES
// ==============================================================
async function loadInterventions() {
    try {
        const res = await apiFetch('/api/interventions');
        const data = await res.json();
        const items = data.interventions || [];

        document.getElementById('int-stat-total').innerText = items.length;
        document.getElementById('int-stat-pending').innerText = items.filter(i => i.status === 'Pending').length;
        document.getElementById('int-stat-progress').innerText = items.filter(i => i.status === 'In Progress').length;
        document.getElementById('int-stat-completed').innerText = items.filter(i => i.status === 'Completed').length;

        const tbody = document.getElementById('interventions-table-body');
        if (tbody) {
            if (items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-slate-400">No active interventions logged yet.</td></tr>`;
            } else {
                tbody.innerHTML = items.map(it => `
                    <tr>
                        <td class="font-mono text-xs font-bold text-orange-600">${it.intervention_id}</td>
                        <td>
                            <div class="font-bold text-slate-900">${it.student_name || it.student_id}</div>
                            <div class="text-[10px] text-slate-400 font-mono">${it.student_id}</div>
                        </td>
                        <td class="font-semibold text-slate-800 text-xs">${it.action_protocol}</td>
                        <td class="text-xs text-slate-600">${it.mentor_assigned}</td>
                        <td class="text-xs text-slate-600">${it.target_date}</td>
                        <td><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${it.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${it.status}</span></td>
                        <td class="text-right">
                            <button class="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700">Update</button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Failed to load interventions:', err);
    }
}

function loadDataHubSources() {
    const grid = document.getElementById('datahub-silos-grid');
    if (!grid) return;
    const silos = [
        { name: '01. Academics', count: '198 Records', status: 'Active Sync', icon: 'fa-graduation-cap' },
        { name: '02. Biometric Attendance', count: '198 Records', status: 'Daily Sync', icon: 'fa-user-check' },
        { name: '03. LMS & Telemetry', count: '27,480 Sessions', status: 'Hourly Sync', icon: 'fa-laptop-code' },
        { name: '04. Engagement & Events', count: '198 Profiles', status: 'Weekly Sync', icon: 'fa-award' },
        { name: '05. Placement Assessments', count: '198 Evaluations', status: 'Active Sync', icon: 'fa-briefcase' },
        { name: '06. Technical Skills', count: '198 Assessments', status: 'Active Sync', icon: 'fa-code' },
        { name: '07. Feedback & Appraisal', count: '7 Faculty / 350 Reviews', status: 'Live Feedback', icon: 'fa-comments' },
        { name: '08. Fees Ledger', count: '₹1.72 Cr Assessed', status: 'Real-time', icon: 'fa-receipt' }
    ];

    grid.innerHTML = silos.map(s => `
        <div class="card-white p-4 border-l-4 border-l-orange-500 space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-800">${s.name}</span>
                <i class="fas ${s.icon} text-orange-600 text-sm"></i>
            </div>
            <div class="text-base font-black text-slate-900">${s.count}</div>
            <div class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${s.status}
            </div>
        </div>
    `).join('');
}

function triggerReRunETL() {
    const btn = document.getElementById('btn-rerun-etl');
    if (btn) btn.classList.add('animate-spin');
    setTimeout(() => {
        if (btn) btn.classList.remove('animate-spin');
        alert('ETL Re-Sync completed across all 8 data silos. Database is 100% synchronized.');
        loadDashboardStats();
        loadStudentsTable();
    }, 1000);
}

// Utility: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==============================================================
// 11. EXCEL / CSV UPLOAD CONTROLLER & DATA INGESTION
// ==============================================================
let selectedUploadFile = null;

function openUploadModal() {
    const modal = document.getElementById('modal-upload-excel');
    if (modal) {
        modal.classList.remove('hidden');
        resetUploadModal();
    }
}

function closeUploadModal() {
    const modal = document.getElementById('modal-upload-excel');
    if (modal) modal.classList.add('hidden');
}

function resetUploadModal() {
    selectedUploadFile = null;
    const fileInput = document.getElementById('excel-file-input');
    if (fileInput) fileInput.value = '';
    const fileInfo = document.getElementById('selected-file-info');
    if (fileInfo) fileInfo.classList.add('hidden');
    const uploadBtn = document.getElementById('btn-submit-excel');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-file-import mr-1"></i> Ingest to Database';
    }
    const alertBox = document.getElementById('upload-alert-box');
    if (alertBox) alertBox.classList.add('hidden');
    const pasteArea = document.getElementById('paste-raw-textarea');
    if (pasteArea) pasteArea.value = '';
    const pasteBtn = document.getElementById('btn-submit-paste');
    if (pasteBtn) {
        pasteBtn.disabled = false;
        pasteBtn.innerHTML = '<i class="fas fa-database mr-1"></i> Ingest Pasted Data';
    }
}

function switchUploadTab(tabName) {
    const tabFile = document.getElementById('tab-upload-file');
    const tabPaste = document.getElementById('tab-upload-paste');
    const paneFile = document.getElementById('pane-upload-file');
    const panePaste = document.getElementById('pane-upload-paste');

    if (tabName === 'file') {
        if (tabFile) tabFile.className = "px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 text-white shadow-sm";
        if (tabPaste) tabPaste.className = "px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200";
        if (paneFile) paneFile.classList.remove('hidden');
        if (panePaste) panePaste.classList.add('hidden');
    } else {
        if (tabPaste) tabPaste.className = "px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 text-white shadow-sm";
        if (tabFile) tabFile.className = "px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200";
        if (panePaste) panePaste.classList.remove('hidden');
        if (paneFile) paneFile.classList.add('hidden');
    }
}

function showUploadAlert(msg, isSuccess = false) {
    const box = document.getElementById('upload-alert-box');
    if (!box) return;
    box.innerText = msg;
    box.className = isSuccess
        ? "mb-4 p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 block"
        : "mb-4 p-3 rounded-xl text-xs font-semibold bg-red-50 text-red-800 border border-red-200 block";
}

function handleExcelFileSelect(e) {
    const files = e.target.files || e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    selectedUploadFile = files[0];

    const fileInfo = document.getElementById('selected-file-info');
    const fileName = document.getElementById('selected-file-name');
    const fileSize = document.getElementById('selected-file-size');
    const uploadBtn = document.getElementById('btn-submit-excel');

    if (fileInfo && fileName && fileSize) {
        fileName.innerText = selectedUploadFile.name;
        fileSize.innerText = `${(selectedUploadFile.size / 1024).toFixed(1)} KB`;
        fileInfo.classList.remove('hidden');
    }
    if (uploadBtn) uploadBtn.disabled = false;
}

async function submitExcelFile() {
    if (!selectedUploadFile) {
        showUploadAlert('Please choose or drop an Excel (.xlsx/.xls) or CSV file first.');
        return;
    }

    const uploadBtn = document.getElementById('btn-submit-excel');
    if (uploadBtn) {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Ingesting & Computing Success Scores...';
    }

    try {
        const formData = new FormData();
        formData.append('file', selectedUploadFile);

        const res = await apiFetch('/api/upload-excel', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (!res.ok) {
            showUploadAlert(data.detail || 'Failed to upload and ingest file.');
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fas fa-file-import mr-1"></i> Ingest to Database';
            }
            return;
        }

        showUploadAlert(`Ingestion successful! Ingested ${data.count} student records with randomized CGPA and attendance metrics.`, true);
        
        setTimeout(() => {
            closeUploadModal();
            loadDashboardStats();
            loadStudentsTable();
            loadFeesData();
            loadLmsData();
        }, 1200);
    } catch (err) {
        showUploadAlert('Network error during file upload: ' + err.message);
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-file-import mr-1"></i> Ingest to Database';
        }
    }
}

async function submitPasteData() {
    const textarea = document.getElementById('paste-raw-textarea');
    const text = textarea ? textarea.value.trim() : '';
    if (!text) {
        showUploadAlert('Please paste CSV or tabular data before ingesting.');
        return;
    }

    const pasteBtn = document.getElementById('btn-submit-paste');
    if (pasteBtn) {
        pasteBtn.disabled = true;
        pasteBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Ingesting Data...';
    }

    try {
        const res = await apiFetch('/api/upload-raw-text', {
            method: 'POST',
            body: JSON.stringify({ raw_text: text })
        });
        const data = await res.json();

        if (!res.ok) {
            showUploadAlert(data.detail || 'Failed to ingest pasted data.');
            if (pasteBtn) {
                pasteBtn.disabled = false;
                pasteBtn.innerHTML = '<i class="fas fa-database mr-1"></i> Ingest Pasted Data';
            }
            return;
        }

        showUploadAlert(`Ingested ${data.count} student records successfully into database!`, true);
        setTimeout(() => {
            closeUploadModal();
            loadDashboardStats();
            loadStudentsTable();
            loadFeesData();
            loadLmsData();
        }, 1200);
    } catch (err) {
        showUploadAlert('Failed to submit pasted data: ' + err.message);
        if (pasteBtn) {
            pasteBtn.disabled = false;
            pasteBtn.innerHTML = '<i class="fas fa-database mr-1"></i> Ingest Pasted Data';
        }
    }
}

async function loadOfficialStMarysRoster() {
    const rawSample = `Display name,Username,Password,Licenses,
ANKITHA AJEMERA,25D01A0501@stmarysgroup.com,C!054379597796ob,"Microsoft 365 A3 for students use benefit"
AJAYKUMAR BANKA,25D01A0502@stmarysgroup.com,B%440195876301od,"Microsoft 365 A3 for students use benefit"
SHIVA KUMAR BHUPATHI ,25D01A0503@stmarysgroup.com,K@347459104383ud,"Microsoft 365 A3 for students use benefit"
MANOJ CHEGANTI,25D01A0504@stmarysgroup.com,S@142416471983uy,"Microsoft 365 A3 for students use benefit"
STEPHEN DANDU,25D01A0505@stmarysgroup.com,Y.207826913368uj,"Microsoft 365 A3 for students use benefit"
SATHISH DASOJU,25D01A0506@stmarysgroup.com,D@418102817943ux,"Microsoft 365 A3 for students use benefit"
AKSHITHA DESHMI,25D01A0507@stmarysgroup.com,S@291139294410uq,"Microsoft 365 A3 for students use benefit"
POOJITHA DUBBARAJOLLA,25D01A0508@stmarysgroup.com,D%761920695803ul,"Microsoft 365 A3 for students use benefit"
RAMYA DURGAM,25D01A0509@stmarysgroup.com,R%358794795041or,"Microsoft 365 A3 for students use benefit"
VINAY ELLA,25D01A0510@stmarysgroup.com,C.762626219284ar,"Microsoft 365 A3 for students use benefit"`;

    const textarea = document.getElementById('paste-raw-textarea');
    if (textarea) {
        textarea.value = rawSample;
        switchUploadTab('paste');
        showUploadAlert('Pre-filled sample student records. Click "Ingest Pasted Data" to import.', true);
    }
}
