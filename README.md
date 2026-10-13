# EduPulse AI: Enterprise Analytics & AI-Powered Student Success Platform
> **KPMG in India — Student Success Decision Intelligence Challenge (Challenge 04)**  
> **15-Year Senior Technical Standard Architecture** | Python FastAPI • SQLite • Node.js Express • Tailwind CSS • Plus Jakarta Sans

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%203.0-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![NodeJS](https://img.shields.io/badge/Frontend-Node.js%20Express-339933.svg?style=flat&logo=node.js)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-SQLite%203-003B57.svg?style=flat&logo=sqlite)](https://sqlite.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python)](https://python.org)
[![TailwindCSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)

---

## 🌟 Executive Overview & Problem Context
Colleges capture extensive data across attendance swipes, LMS logs, internal exams, university examinations, placements, and student feedback. However, these datasets reside in isolated silos, resulting in reactive, post-mortem interventions.

**EduPulse AI** bridges institutional data silos into an AI decision intelligence system that:
1. **Unifies 8 Disconnected Campus Silos** into a 360° student master view (Academics, Attendance, LMS, Engagement, Placements, Skills, Feedback, and Fees Structure).
2. Computes an explainable **Student Success Score (SSS)** ($0-100$).
3. Identifies **Dual-Axis At-Risk Vectors** (Academic Failure Risk vs. Placement Outcome Risk).
4. Delivers **AI Persona Segmentation** (e.g., *High Academic, Low Placement*).
5. Provides **Explainable AI Drivers (XAI)** identifying positive and negative factors for each student.
6. Integrates a **Financial Ledger & Fees Structure** (College Fees ₹85,000, Exam Fees ₹2,500, Hostel Fees ₹45,000).
7. Incorporates a dedicated **Lecture Feedback Module** for 7 faculty members and subjects.
8. Features **LMS Login & Assignment Telemetry** with dormant learner alerts ($<7$ logins/week).
9. Embeds a natural language **Edu AI Decision Intelligence Copilot** with actionable recommendations.
10. Implements **Database-Backed Authentication** with anti-disposable email validation.

---

## 📂 Project Directory Structure & Key Files

The entire project is structured under the workspace root:

```text
student-sucess/
│
├── app.py                         # Master Python FastAPI backend with API Key security & REST APIs
├── server.js                      # Node.js Express server & reverse proxy
├── package.json                   # Node.js configuration & Express dependencies
├── build_database.py              # Database builder & ETL ingestion pipeline
├── run.bat                        # Windows 1-click startup launcher
│
├── templates/
│   └── index.html                 # Single-Page Application (Executive Dashboard, Edu AI, Fees, Feedback, LMS)
│
├── static/
│   ├── css/
│   │   └── styles.css             # Enterprise design system (Pure white #ffffff, Orange headings #ea580c)
│   └── js/
│       └── app.js                 # Frontend application controller, Chart.js, Copilot & Excel Upload logic
│
├── data/
│   ├── student_success.db         # Real SQLite database containing all students, faculty, users & fees
│   ├── st_marys_students_raw.csv  # 198 enrolled St. Mary's student cohort roster
│   ├── 01_academic.csv            # Academic silo (CGPA, internals, active & historical backlogs)
│   ├── 02_attendance.csv          # Biometric attendance silo (Overall, core subject, and lab %)
│   ├── 03_lms_activity.csv        # LMS telemetry silo (Weekly logins, assignment completion rate)
│   ├── 04_engagement.csv          # Co-curricular silo (Hackathons, clubs, certifications)
│   ├── 05_placement.csv           # Placement readiness silo (Coding assessments, aptitude, mock interviews)
│   ├── 06_skills.csv              # Technical skill evaluations (DSA, communication, teamwork)
│   ├── 07_feedback.csv            # Faculty appraisals and student satisfaction ratings
│   └── 08_fees_structure.csv      # Institutional financial ledger (College, exam, hostel fees)
│
├── STUDENT_SUCCESS_SCORE_NOTE.md  # Deliverable 2: Scoring Framework Note & Mathematical Formulation
├── README.md                      # Comprehensive project documentation
└── .gitignore                     # Git ignore rules for Python, Node.js, and OS files
```

---

## 📐 Mathematical Formulation: Student Success Score (SSS)

$$\mathbf{SSS = 0.35 \times AI + 0.25 \times ELI + 0.30 \times PRI + 0.10 \times FWI}$$

### Sub-Index Weights:
1. **Academic Index ($AI$ — 35%):**
   $$AI = \text{clip}\left(0.55 \times (\text{CGPA} \times 10) + 0.45 \times \text{InternalScore} - [12.0 \times \text{ActiveBacklogs} + 2.5 \times \text{HistoryBacklogs}],\ 0,\ 100\right)$$
2. **Engagement & LMS Index ($ELI$ — 25%):**
   $$ELI = \text{clip}\left(0.40 \times \text{Attendance} + 0.30 \times \text{AssignmentRate} + 0.15 \times \min(100, \text{WeeklyLogins} \times 6) + 0.15 \times \text{CoCurricular},\ 0,\ 100\right)$$
3. **Placement Readiness Index ($PRI$ — 30%):**
   $$PRI = \text{clip}\left(0.35 \times \text{CodingScore} + 0.30 \times \text{AptitudeScore} + 0.20 \times \text{MockInterview} + 0.15 \times \text{SkillRatingScaled},\ 0,\ 100\right)$$
4. **Feedback & Well-being Index ($FWI$ — 10%):**
   $$FWI = \text{clip}\left(0.60 \times (\text{FacultyRating} \times 20) + 0.40 \times (\text{StudentSatisfaction} \times 20),\ 0,\ 100\right)$$

---

## 🏛️ Specialized Platform Modules

### 1. Fees Structure Module
- **College Fees**: ₹85,000 / year (Mandatory tuition, labs, library)
- **Exam Fees**: ₹2,500 / semester (Hall ticket clearance, evaluation)
- **Hostel Fees**: ₹45,000 / year (Boarding, amenities)
- Complete financial clearance status tracking (`Cleared`, `Partial`, `Overdue`) with one-click payment recording and receipt generation.

### 2. Lecture Feedback Module (Dedicated 7 Faculty)
- **Prof. Samdhasiva** — Database Management Systems (DBMS) • Rating: **4.6 / 5.0**
- **Prof. Ramudu** — Industrial Economics & Management (IE) • Rating: **4.3 / 5.0**
- **Prof. Shateesh** — Discrete Mathematics (DM) • Rating: **4.1 / 5.0**
- **Prof. LN Rao** — Java Programming & OOP (JAVA) • Rating: **4.8 / 5.0**
- **Prof. Manohar** — Software Engineering (SE) • Rating: **4.4 / 5.0**
- **Prof. Sampath** — Computer Organization & Architecture (COA) • Rating: **4.2 / 5.0**
- **Prof. Chakiri** — Campus Recruitment Training (CRT) • Rating: **4.7 / 5.0**

### 3. Assignments & LMS Logins Telemetry
- Weekly and semester login frequency counters.
- Assignment submission consistency and late submission flags.
- Real-time **Dormant Learner Alerts** for students with $<7$ logins/week.

### 4. Edu AI Decision Intelligence Console
- Natural language query interface supporting queries across students, faculty, fees, and telemetry.
- Formatted responses with highlighted data badges, actionable buttons, and diagnostic summaries.
- One-click intelligence export.

### 5. Authentication & Anti-Fake Email Engine
- Database-backed authentication with password hashing.
- Rejection of disposable/temporary domains (`mailinator.com`, `tempmail.com`, `guerrillamail.com`, etc.) to enforce valid institutional credentials.

---

## ⚡ How to Run Locally

### Option 1: 1-Click Launch (Windows)
Double-click `run.bat` or run in terminal:
```powershell
.\run.bat
```

### Option 2: Python FastAPI Backend
```bash
# 1. Install dependencies
pip install fastapi uvicorn pandas numpy scikit-learn jinja2 python-multipart openpyxl

# 2. Re-seed SQLite database (optional)
python build_database.py

# 3. Start server
python app.py
```
Open in browser: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

### Option 3: Node.js Express Frontend
```bash
npm install
npm start
```
Open in browser: **[http://127.0.0.1:3000](http://127.0.0.1:3000)**

---

## 📤 How to Push This Repository to GitHub

### Step 1: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Enter Repository name: `edupulse-ai-student-success`.
3. Choose **Public** or **Private**.
4. Leave *"Initialize with README"* **unchecked** (we already created a complete `README.md`).
5. Click **Create repository**.

### Step 2: Initialize Git and Push (Terminal Commands)
Open PowerShell in this folder (`c:\Users\vikra\Downloads\student-sucess`) and run:

```powershell
# 1. Initialize local repository
git init

# 2. Add all project files
git add .

# 3. Commit files
git commit -m "feat: complete KPMG Challenge 04 Student Success Platform"

# 4. Set default branch to main
git branch -M main

# 5. Connect to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/edupulse-ai-student-success.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🔐 Enterprise API Keys & Credentials

- **Master API Key**: `kpmg-edupulse-enterprise-api-key-2026`
- **Admin Login**: `admin@stmarysgroup.com` / `Admin@2026`
- **Faculty Login**: `faculty@stmarysgroup.com` / `Faculty@2026`
- **Student Login**: `25D01A0501@stmarysgroup.com` / `Student@2026`
