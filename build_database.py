"""
Build Database & Enterprise Data Fabric for EduPulse AI
Ingests real student roster from St. Mary's Group of Institutions, generates correlated
academic, attendance, LMS, fees, placement, and lecture feedback datasets, and stores
them in a persistent SQLite database and CSV files.
"""

import os
import re
import json
import sqlite3
import random
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "student_success.db")
os.makedirs(DATA_DIR, exist_ok=True)

# 7 Dedicated Professors & Subjects specified by user
FACULTY_SUBJECTS = [
    {
        "code": "CS-301",
        "subject": "Database Management Systems (DBMS)",
        "short_subject": "DBMS",
        "faculty": "Prof. Samdhasiva",
        "department": "Computer Science & Engineering",
        "rating": 4.6,
        "clarity": 92,
        "syllabus_pct": 94,
        "doubt_resolution": 90,
        "sentiment": "Excellent",
        "sample_feedback": "Explains complex SQL indexing, normalization and B+ trees with clear industry examples."
    },
    {
        "code": "HS-302",
        "subject": "Industrial Economics & Management (IE)",
        "short_subject": "IE",
        "faculty": "Prof. Ramudu",
        "department": "Management & Business Analytics",
        "rating": 4.3,
        "clarity": 86,
        "syllabus_pct": 89,
        "doubt_resolution": 84,
        "sentiment": "Good",
        "sample_feedback": "Engaging real-world case studies on corporate balance sheets, cost analysis and project feasibility."
    },
    {
        "code": "CS-303",
        "subject": "Discrete Mathematics (DM)",
        "short_subject": "DM",
        "faculty": "Prof. Shateesh",
        "department": "Computer Science & Engineering",
        "rating": 4.1,
        "clarity": 82,
        "syllabus_pct": 86,
        "doubt_resolution": 81,
        "sentiment": "Good",
        "sample_feedback": "Thorough coverage of graph theory and recurrence relations; requires intensive practice problem sets."
    },
    {
        "code": "CS-304",
        "subject": "Java Programming & OOP (JAVA)",
        "short_subject": "JAVA",
        "faculty": "Prof. LN Rao",
        "department": "Information Technology",
        "rating": 4.8,
        "clarity": 96,
        "syllabus_pct": 98,
        "doubt_resolution": 95,
        "sentiment": "Outstanding",
        "sample_feedback": "Outstanding live coding drills on Collections framework, Multithreading, Streams API and Spring Boot basics."
    },
    {
        "code": "CS-305",
        "subject": "Software Engineering (SE)",
        "short_subject": "SE",
        "faculty": "Prof. Manohar",
        "department": "Computer Science & Engineering",
        "rating": 4.4,
        "clarity": 88,
        "syllabus_pct": 91,
        "doubt_resolution": 87,
        "sentiment": "Good",
        "sample_feedback": "Practical sprint planning exercises using Agile Scrum, JIRA workflows and architectural design patterns."
    },
    {
        "code": "CS-306",
        "subject": "Computer Organization & Architecture (COA)",
        "short_subject": "COA",
        "faculty": "Prof. Sampath",
        "department": "Electronics & Communication",
        "rating": 4.2,
        "clarity": 84,
        "syllabus_pct": 87,
        "doubt_resolution": 83,
        "sentiment": "Good",
        "sample_feedback": "Detailed pipeline instruction hazard breakdowns, cache mapping techniques and micro-architecture diagrams."
    },
    {
        "code": "TPO-307",
        "subject": "Campus Recruitment Training (CRT)",
        "short_subject": "CRT",
        "faculty": "Prof. Chakiri",
        "department": "Training & Placement Cell",
        "rating": 4.7,
        "clarity": 94,
        "syllabus_pct": 96,
        "doubt_resolution": 93,
        "sentiment": "Excellent",
        "sample_feedback": "High-intensity quantitative aptitude drills, speed math shortcuts and corporate interview body language coaching."
    }
]

DEPARTMENTS = [
    "Computer Science & Engineering",
    "Artificial Intelligence & Data Science",
    "Information Technology",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Management & Business Analytics"
]

def load_and_enrich_students():
    raw_path = os.path.join(DATA_DIR, "st_marys_students_raw.csv")
    if not os.path.exists(raw_path):
        raise FileNotFoundError("Raw student file missing!")

    raw_df = pd.read_csv(raw_path)
    # Clean column names
    raw_df.columns = [c.strip() for c in raw_df.columns]
    
    # Filter valid rows
    raw_df = raw_df[raw_df["Username"].notna() & raw_df["Display name"].notna()].copy()
    
    students = []
    seed = 42
    random.seed(seed)
    np.random.seed(seed)
    n = len(raw_df)

    latent_ability = np.random.normal(0, 1, n)
    latent_effort = np.random.normal(0, 1, n)

    for i, (_, row) in enumerate(raw_df.iterrows()):
        username = str(row["Username"]).strip()
        name = str(row["Display name"]).strip()
        pwd = str(row["Password"]).strip() if pd.notna(row["Password"]) else "StMarys@2026"
        
        # Extract student roll number (e.g. 25D01A0501 from 25D01A0501@stmarysgroup.com)
        match = re.search(r"([0-9A-Za-z]+)@", username)
        roll_no = match.group(1).upper() if match else f"25D01A{1000+i}"

        # Assign Department
        dept = DEPARTMENTS[i % len(DEPARTMENTS)]
        semester = random.choice([4, 6, 8])

        # 1. ACADEMIC DATA
        cgpa_raw = 7.1 + 1.25 * latent_ability[i] + 0.55 * latent_effort[i] + np.random.normal(0, 0.35)
        cgpa = float(np.round(np.clip(cgpa_raw, 4.4, 9.85), 2))
        internal_score = float(np.round(np.clip(cgpa * 10 + np.random.normal(0, 3.2), 42.0, 99.0), 1))
        
        backlog_p = np.clip(0.35 - (cgpa - 6.0) * 0.16, 0.02, 0.75)
        if backlog_p < 0.2:
            active_backlogs = int(np.random.choice([0, 1, 2], p=[0.82, 0.14, 0.04]))
        else:
            active_backlogs = int(np.random.choice([0, 1, 2, 3, 4], p=[0.42, 0.30, 0.16, 0.08, 0.04]))
        history_backlogs = active_backlogs + int(np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1]))

        # 2. ATTENDANCE DATA
        att_base = 75.0 + 11.5 * latent_effort[i] + np.random.normal(0, 6.0)
        overall_att = float(np.round(np.clip(att_base, 50.0, 99.0), 1))
        core_att = float(np.round(np.clip(overall_att - np.random.normal(1.2, 2.0), 45.0, 100.0), 1))
        lab_att = float(np.round(np.clip(overall_att + np.random.normal(2.0, 2.5), 52.0, 100.0), 1))
        consecutive_abs = int(np.random.choice([0, 1, 2, 4, 6], p=[0.65, 0.20, 0.08, 0.05, 0.02])) if overall_att >= 75 else int(np.random.choice([2, 4, 6, 8], p=[0.25, 0.45, 0.20, 0.10]))

        # 3. LMS & ASSIGNMENT DATA (Check number of times login)
        weekly_logins = int(np.clip(np.round(8 + 4.5 * latent_effort[i] + np.random.normal(0, 2)), 2, 28))
        total_semester_logins = int(np.clip(weekly_logins * 14 + random.randint(10, 40), 28, 380))
        monthly_lms_hours = float(np.round(np.clip(18.0 + 10.0 * latent_effort[i] + np.random.normal(0, 4.0), 4.0, 55.0), 1))
        assign_completion_rate = float(np.round(np.clip(74.0 + 16.0 * latent_effort[i] + np.random.normal(0, 7.5), 32.0, 100.0), 1))
        quiz_avg = float(np.round(np.clip(67.0 + 13.0 * latent_ability[i] + np.random.normal(0, 6.0), 38.0, 99.0), 1))
        late_submissions = int(np.clip(np.round(3.0 - 1.6 * latent_effort[i] + np.random.normal(0, 1.2)), 0, 9))

        # 4. ENGAGEMENT & CO-CURRICULAR
        hackathons = int(np.random.choice([0, 1, 2, 3, 5], p=[0.45, 0.30, 0.15, 0.07, 0.03]))
        clubs = int(np.random.choice([0, 1, 2, 3], p=[0.35, 0.42, 0.18, 0.05]))
        certs = int(np.random.choice([0, 1, 2, 3, 4], p=[0.38, 0.34, 0.17, 0.07, 0.04]))
        leadership = int(random.choice([1, 0, 0, 0, 0]))

        # 5. PLACEMENT DATA
        aptitude = float(np.round(np.clip(63.0 + 15.0 * latent_ability[i] + np.random.normal(0, 7.5), 32.0, 99.0), 1))
        coding_special = np.random.normal(0, 1)
        coding = float(np.round(np.clip(57.0 + 11.0 * latent_ability[i] + 13.0 * coding_special + np.random.normal(0, 6.5), 22.0, 98.5), 1))
        mock_interview = float(np.round(np.clip(64.0 + 12.0 * latent_ability[i] + 5.0 * latent_effort[i] + np.random.normal(0, 5.5), 34.0, 96.0), 1))
        resume_score = float(np.round(np.clip(62.0 + 8.5 * latent_effort[i] + np.random.normal(0, 7.0), 38.0, 96.0), 1))

        # 6. SKILLS
        dsa_rating = float(np.round(np.clip(coding / 20.0 + np.random.normal(0, 0.25), 1.0, 5.0), 1))
        comm_rating = float(np.round(np.clip(mock_interview / 20.0 + np.random.normal(0, 0.25), 1.0, 5.0), 1))
        teamwork_rating = float(np.round(np.clip(3.2 + 0.5 * latent_effort[i] + np.random.normal(0, 0.35), 1.5, 5.0), 1))

        # 7. FACULTY MENTOR APPRAISAL
        fac_rating = float(np.round(np.clip(3.1 + 0.6 * latent_effort[i] + 0.4 * latent_ability[i] + np.random.normal(0, 0.35), 1.2, 5.0), 1))
        sat_index = float(np.round(np.clip(3.6 + np.random.normal(0, 0.5), 1.8, 5.0), 1))
        remark = (
            "Consistent high performer" if fac_rating >= 4.3 else
            "Strong academic, requires hands-on coding drills" if (coding < 48 and cgpa >= 7.8) else
            "Attendance warning issued, skipping practical labs" if overall_att < 75 else
            "Active and regular in classes"
        )

        # 8. FEES STRUCTURE (College fees, Exam fees, Hostel fees)
        college_fees_total = 85000.0
        exam_fees_total = 2500.0
        is_hosteler = (i % 3 != 0)  # ~66% hostlers, 33% day scholars
        hostel_fees_total = 45000.0 if is_hosteler else 0.0

        fee_luck = random.random()
        if fee_luck < 0.65:
            # Fully cleared
            college_paid = college_fees_total
            exam_paid = exam_fees_total
            hostel_paid = hostel_fees_total
            payment_status = "Cleared"
        elif fee_luck < 0.88:
            # Partial paid
            college_paid = random.choice([40000.0, 50000.0, 60000.0])
            exam_paid = exam_fees_total if random.random() > 0.4 else 0.0
            hostel_paid = 25000.0 if is_hosteler else 0.0
            payment_status = "Partial"
        else:
            # Overdue
            college_paid = 25000.0
            exam_paid = 0.0
            hostel_paid = 10000.0 if is_hosteler else 0.0
            payment_status = "Overdue"

        college_due = college_fees_total - college_paid
        exam_due = exam_fees_total - exam_paid
        hostel_due = hostel_fees_total - hostel_paid
        total_due = college_due + exam_due + hostel_due

        receipt_no = f"STM-REC-2026-{10000 + i}"
        last_payment_date = random.choice(["2026-08-15", "2026-09-02", "2026-09-28", "2026-10-05"])

        # 9. MATHEMATICAL INDICES (SSS)
        # Academic Index (AI)
        cgpa_norm = (cgpa / 10.0) * 100.0
        backlog_penalty = (active_backlogs * 12.0) + (history_backlogs * 2.5)
        ai_raw = (0.55 * cgpa_norm) + (0.45 * internal_score) - backlog_penalty
        academic_index = float(np.round(np.clip(ai_raw, 0, 100), 1))

        # Engagement & LMS Index (ELI)
        lms_active_norm = np.clip((weekly_logins / 20.0 * 50.0) + (monthly_lms_hours / 40.0 * 50.0), 0, 100)
        co_curricular_norm = np.clip((hackathons * 18.0) + (certs * 15.0) + (clubs * 10.0) + (leadership * 12.0), 0, 100)
        eli_raw = (0.40 * overall_att) + (0.30 * assign_completion_rate) + (0.15 * lms_active_norm) + (0.15 * co_curricular_norm)
        engagement_lms_index = float(np.round(np.clip(eli_raw, 0, 100), 1))

        # Placement Readiness Index (PRI)
        skills_avg_100 = ((dsa_rating + comm_rating + teamwork_rating) / 15.0) * 100.0
        pri_raw = (0.35 * coding) + (0.30 * aptitude) + (0.20 * mock_interview) + (0.15 * skills_avg_100)
        placement_readiness_index = float(np.round(np.clip(pri_raw, 0, 100), 1))

        # Feedback & Well-being Index (FWI)
        fwi_raw = (0.60 * (fac_rating / 5.0 * 100.0)) + (0.40 * (sat_index / 5.0 * 100.0))
        feedback_wellbeing_index = float(np.round(np.clip(fwi_raw, 0, 100), 1))

        # Composite SSS (0-100)
        sss_raw = (0.35 * academic_index) + (0.25 * engagement_lms_index) + (0.30 * placement_readiness_index) + (0.10 * feedback_wellbeing_index)
        student_success_score = float(np.round(np.clip(sss_raw, 0, 100), 1))

        # Success Tier
        if student_success_score >= 75.0:
            success_tier = "Dean's List / High Ready"
        elif student_success_score >= 60.0:
            success_tier = "Good Standing"
        elif student_success_score >= 45.0:
            success_tier = "Watchlist / Borderline"
        else:
            success_tier = "Critical Concern"

        # Risk Classification (Dual Axis)
        acad_risk_score = 0
        if active_backlogs >= 2: acad_risk_score += 3.0
        elif active_backlogs == 1: acad_risk_score += 1.5
        if cgpa < 6.0: acad_risk_score += 2.5
        elif cgpa < 7.0: acad_risk_score += 1.2
        if overall_att < 65: acad_risk_score += 2.5
        elif overall_att < 75: acad_risk_score += 1.2
        if academic_index < 50: acad_risk_score += 2.0
        elif academic_index < 65: acad_risk_score += 1.0

        academic_risk = "High" if acad_risk_score >= 4.5 else "Medium" if acad_risk_score >= 2.0 else "Low"

        plac_risk_score = 0
        if coding < 42: plac_risk_score += 3.0
        elif coding < 58: plac_risk_score += 1.5
        if aptitude < 48: plac_risk_score += 2.5
        elif aptitude < 60: plac_risk_score += 1.2
        if mock_interview < 50: plac_risk_score += 2.0
        elif mock_interview < 62: plac_risk_score += 1.0
        if placement_readiness_index < 50: plac_risk_score += 2.0
        elif placement_readiness_index < 65: plac_risk_score += 1.0

        placement_risk = "High" if plac_risk_score >= 4.5 else "Medium" if plac_risk_score >= 2.0 else "Low"

        if (academic_risk == "High" and placement_risk == "High") or student_success_score < 46.0 or active_backlogs >= 3:
            overall_risk = "Critical"
        elif academic_risk == "High" or placement_risk == "High" or student_success_score < 58.0:
            overall_risk = "High"
        elif academic_risk == "Medium" or placement_risk == "Medium" or student_success_score < 70.0:
            overall_risk = "Medium"
        else:
            overall_risk = "Low"

        # Persona Segment
        if academic_index >= 70 and placement_readiness_index < 55:
            segment_name = "High Academic, Low Placement"
            rec_action = "Enroll in intensive DSA coding bootcamp & 1-on-1 industry mock interview series."
        elif placement_readiness_index >= 70 and (academic_index < 60 or active_backlogs > 0):
            segment_name = "High Placement, Low Academic"
            rec_action = "Attendance contract, faculty mentor academic check-ins & remedial backlog clearance."
        elif student_success_score < 50 or (academic_risk == "High" and placement_risk == "High"):
            segment_name = "Critical Comprehensive Intervention"
            rec_action = "Immediate Dean/HOD advisory conference, remedial study cohorts & counseling."
        elif (aptitude >= 65 or placement_readiness_index >= 62) and (engagement_lms_index < 58 or overall_att < 72):
            segment_name = "Disengaged High-Potential"
            rec_action = "Pair with student mentor leader, assign capstone project leadership & gamified LMS goals."
        elif student_success_score >= 72 and academic_index >= 70 and placement_readiness_index >= 70:
            segment_name = "Well-Rounded Achievers"
            rec_action = "Fast-track for tier-1 campus placements, research fellowships & competitive hackathons."
        elif student_success_score >= 60:
            segment_name = "Steady Developing Performer"
            rec_action = "Standard periodic faculty advising and elective skill enrichment."
        else:
            segment_name = "At-Risk Targeted Support"
            rec_action = "Attendance monitoring and subject-specific tutoring support."

        # Explainable AI (Drivers)
        pos_drivers = []
        neg_drivers = []
        if active_backlogs > 0:
            neg_drivers.append({"driver": f"{active_backlogs} Active Backlog(s)", "impact": round(-active_backlogs * 12.0, 1), "type": "negative", "category": "Academic"})
        if cgpa >= 7.5:
            pos_drivers.append({"driver": f"CGPA of {cgpa:.2f}", "impact": round((cgpa - 7.0) * 6.5, 1), "type": "positive", "category": "Academic"})
        elif cgpa < 6.5:
            neg_drivers.append({"driver": f"Below-average CGPA {cgpa:.2f}", "impact": round((cgpa - 7.0) * 6.5, 1), "type": "negative", "category": "Academic"})
        if coding >= 70:
            pos_drivers.append({"driver": f"Top Coding Assessment ({coding:.1f}/100)", "impact": round((coding - 58.0) * 0.35, 1), "type": "positive", "category": "Placement"})
        elif coding < 45:
            neg_drivers.append({"driver": f"Low Coding Assessment ({coding:.1f}/100)", "impact": round((coding - 58.0) * 0.35, 1), "type": "negative", "category": "Placement"})
        if overall_att >= 85:
            pos_drivers.append({"driver": f"High Attendance ({overall_att:.1f}%)", "impact": round((overall_att - 75.0) * 0.4, 1), "type": "positive", "category": "Attendance"})
        elif overall_att < 75:
            neg_drivers.append({"driver": f"Attendance Lag ({overall_att:.1f}%)", "impact": round((overall_att - 75.0) * 0.4, 1), "type": "negative", "category": "Attendance"})
        if certs >= 2:
            pos_drivers.append({"driver": f"{certs} Industry Certifications", "impact": round(certs * 4.0, 1), "type": "positive", "category": "Skills"})
        if assign_completion_rate < 60:
            neg_drivers.append({"driver": f"Low LMS Submission Rate ({assign_completion_rate:.1f}%)", "impact": -8.5, "type": "negative", "category": "LMS"})

        pos_drivers.sort(key=lambda x: abs(x["impact"]), reverse=True)
        neg_drivers.sort(key=lambda x: abs(x["impact"]), reverse=True)

        student_record = {
            "student_id": roll_no,
            "full_name": name,
            "email": username,
            "password": pwd,
            "department": dept,
            "semester": semester,
            "cgpa": cgpa,
            "internal_exam_score": internal_score,
            "active_backlogs": active_backlogs,
            "history_backlogs": history_backlogs,
            "overall_attendance_pct": overall_att,
            "core_subject_att_pct": core_att,
            "lab_attendance_pct": lab_att,
            "consecutive_unexcused_absences": consecutive_abs,
            "weekly_lms_logins": weekly_logins,
            "total_semester_logins": total_semester_logins,
            "monthly_lms_hours": monthly_lms_hours,
            "assignment_completion_rate": assign_completion_rate,
            "quiz_average_score": quiz_avg,
            "late_submissions_count": late_submissions,
            "hackathons_participated": hackathons,
            "active_clubs_count": clubs,
            "industry_certifications": certs,
            "holds_leadership_role": leadership,
            "coding_assessment_score": coding,
            "aptitude_test_score": aptitude,
            "mock_interview_score": mock_interview,
            "resume_readiness_score": resume_score,
            "dsa_skill_rating": dsa_rating,
            "communication_rating": comm_rating,
            "teamwork_rating": teamwork_rating,
            "faculty_mentor_rating": fac_rating,
            "student_satisfaction_index": sat_index,
            "faculty_remark": remark,
            # Fees
            "college_fees_total": college_fees_total,
            "college_fees_paid": college_paid,
            "college_fees_due": college_due,
            "exam_fees_total": exam_fees_total,
            "exam_fees_paid": exam_paid,
            "exam_fees_due": exam_due,
            "hostel_fees_total": hostel_fees_total,
            "hostel_fees_paid": hostel_paid,
            "hostel_fees_due": hostel_due,
            "total_fees_due": total_due,
            "payment_status": payment_status,
            "receipt_no": receipt_no,
            "last_payment_date": last_payment_date,
            # Indices
            "academic_index": academic_index,
            "engagement_lms_index": engagement_lms_index,
            "placement_readiness_index": placement_readiness_index,
            "feedback_wellbeing_index": feedback_wellbeing_index,
            "student_success_score": student_success_score,
            "success_tier": success_tier,
            "academic_risk": academic_risk,
            "placement_risk": placement_risk,
            "overall_risk": overall_risk,
            "segment_name": segment_name,
            "recommended_intervention": rec_action,
            "top_positive_drivers": json.dumps(pos_drivers[:3]),
            "top_negative_drivers": json.dumps(neg_drivers[:3])
        }
        students.append(student_record)

    df_master = pd.DataFrame(students)
    return df_master

def initialize_database():
    print("[DB] Initializing SQLite Database & Tables...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        student_id TEXT,
        api_key TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Students Master Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        student_id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT,
        department TEXT NOT NULL,
        semester INTEGER NOT NULL,
        cgpa REAL NOT NULL,
        internal_exam_score REAL,
        active_backlogs INTEGER DEFAULT 0,
        history_backlogs INTEGER DEFAULT 0,
        overall_attendance_pct REAL NOT NULL,
        core_subject_att_pct REAL,
        lab_attendance_pct REAL,
        weekly_lms_logins INTEGER,
        total_semester_logins INTEGER,
        monthly_lms_hours REAL,
        assignment_completion_rate REAL,
        quiz_average_score REAL,
        late_submissions_count INTEGER,
        hackathons_participated INTEGER,
        active_clubs_count INTEGER,
        industry_certifications INTEGER,
        coding_assessment_score REAL,
        aptitude_test_score REAL,
        mock_interview_score REAL,
        resume_readiness_score REAL,
        dsa_skill_rating REAL,
        communication_rating REAL,
        teamwork_rating REAL,
        faculty_mentor_rating REAL,
        student_satisfaction_index REAL,
        faculty_remark TEXT,
        college_fees_total REAL,
        college_fees_paid REAL,
        college_fees_due REAL,
        exam_fees_total REAL,
        exam_fees_paid REAL,
        exam_fees_due REAL,
        hostel_fees_total REAL,
        hostel_fees_paid REAL,
        hostel_fees_due REAL,
        total_fees_due REAL,
        payment_status TEXT,
        receipt_no TEXT,
        last_payment_date TEXT,
        academic_index REAL,
        engagement_lms_index REAL,
        placement_readiness_index REAL,
        feedback_wellbeing_index REAL,
        student_success_score REAL,
        success_tier TEXT,
        academic_risk TEXT,
        placement_risk TEXT,
        overall_risk TEXT,
        segment_name TEXT,
        recommended_intervention TEXT,
        top_positive_drivers TEXT,
        top_negative_drivers TEXT
    )
    """)

    # 3. Lecture Feedback Table (Specific 7 Faculty)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lecture_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        subject TEXT NOT NULL,
        short_subject TEXT NOT NULL,
        faculty TEXT NOT NULL,
        department TEXT NOT NULL,
        rating REAL NOT NULL,
        clarity INTEGER NOT NULL,
        syllabus_pct INTEGER NOT NULL,
        doubt_resolution INTEGER NOT NULL,
        sentiment TEXT NOT NULL,
        sample_feedback TEXT NOT NULL
    )
    """)

    # 4. Student Course Reviews Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_course_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        faculty_name TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        rating REAL NOT NULL,
        teaching_clarity REAL NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 5. Interventions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interventions (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        department TEXT NOT NULL,
        risk_type TEXT NOT NULL,
        action_type TEXT NOT NULL,
        assigned_mentor TEXT NOT NULL,
        target_date TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()

    # Seed Lecture Feedback Table
    cursor.execute("DELETE FROM lecture_feedback")
    for f in FACULTY_SUBJECTS:
        cursor.execute("""
        INSERT INTO lecture_feedback (code, subject, short_subject, faculty, department, rating, clarity, syllabus_pct, doubt_resolution, sentiment, sample_feedback)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (f["code"], f["subject"], f["short_subject"], f["faculty"], f["department"], f["rating"], f["clarity"], f["syllabus_pct"], f["doubt_resolution"], f["sentiment"], f["sample_feedback"]))
    conn.commit()

    # Enrich Students and insert
    df_students = load_and_enrich_students()
    print(f"[DB] Ingested {len(df_students)} students from St. Mary's roster.")

    # Clear and insert students to DB preserving schema constraints
    cursor.execute("DELETE FROM students")
    df_students.to_sql("students", conn, if_exists="append", index=False)

    # Seed Admin & Student Users
    cursor.execute("DELETE FROM users")
    # Admin
    cursor.execute("""
    INSERT INTO users (email, password, display_name, role, student_id, api_key)
    VALUES (?, ?, ?, ?, ?, ?)
    """, ("admin@stmarysgroup.com", "Admin@2026", "Principal / Chief Academic Administrator", "admin", "ADMIN-01", "kpmg-edupulse-admin-key-2026"))
    
    # Faculty Advisor
    cursor.execute("""
    INSERT INTO users (email, password, display_name, role, student_id, api_key)
    VALUES (?, ?, ?, ?, ?, ?)
    """, ("faculty@stmarysgroup.com", "Faculty@2026", "Prof. Samdhasiva (HOD & Mentor)", "faculty", "FAC-01", "kpmg-edupulse-faculty-key-2026"))

    # Add all students to users table
    for _, row in df_students.iterrows():
        cursor.execute("""
        INSERT INTO users (email, password, display_name, role, student_id, api_key)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (row["email"], row["password"], row["full_name"], "student", row["student_id"], f"api-key-{row['student_id'].lower()}"))

    # Initial interventions
    cursor.execute("DELETE FROM interventions")
    int_sample = [
        ("INT-001", "25D01A0501", "ANKITHA AJEMERA", "Computer Science & Engineering", "Placement Risk", "DSA Coding Bootcamp & 1-on-1 Mock Interview Series", "Prof. Samdhasiva", "2026-11-15", "In Progress", "High academic performance but needs competitive coding speed drills."),
        ("INT-002", "25D01A0505", "STEPHEN DANDU", "Mechanical Engineering", "Academic & Attendance Risk", "Attendance Monitoring & Remedial Lectures", "Prof. Manohar", "2026-11-05", "Pending", "Attendance fell below 68% in core engineering subjects."),
        ("INT-003", "25D01A0510", "VINAY ELLA", "Information Technology", "Fee Clearance & Academic Review", "Exam Fee Payment Advisory & Tutoring", "Prof. LN Rao", "2026-10-30", "Completed", "Scholarship grant processed; cleared backlog in Object Oriented Programming.")
    ]
    cursor.executemany("""
    INSERT INTO interventions (id, student_id, student_name, department, risk_type, action_type, assigned_mentor, target_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, int_sample)

    conn.commit()
    conn.close()

    # Save CSV copies to data/
    df_students.to_csv(os.path.join(DATA_DIR, "processed_student_analytics.csv"), index=False)
    df_students.to_csv(os.path.join(DATA_DIR, "integrated_student_360.csv"), index=False)
    
    # Save individual silo CSVs
    df_students[["student_id", "full_name", "department", "semester", "cgpa", "internal_exam_score", "active_backlogs", "history_backlogs"]].to_csv(os.path.join(DATA_DIR, "01_academic.csv"), index=False)
    df_students[["student_id", "overall_attendance_pct", "core_subject_att_pct", "lab_attendance_pct", "consecutive_unexcused_absences"]].to_csv(os.path.join(DATA_DIR, "02_attendance.csv"), index=False)
    df_students[["student_id", "weekly_lms_logins", "total_semester_logins", "monthly_lms_hours", "assignment_completion_rate", "quiz_average_score", "late_submissions_count"]].to_csv(os.path.join(DATA_DIR, "03_lms_activity.csv"), index=False)
    df_students[["student_id", "hackathons_participated", "active_clubs_count", "industry_certifications", "holds_leadership_role"]].to_csv(os.path.join(DATA_DIR, "04_engagement.csv"), index=False)
    df_students[["student_id", "aptitude_test_score", "coding_assessment_score", "mock_interview_score", "resume_readiness_score"]].to_csv(os.path.join(DATA_DIR, "05_placement.csv"), index=False)
    df_students[["student_id", "dsa_skill_rating", "communication_rating", "teamwork_rating"]].to_csv(os.path.join(DATA_DIR, "06_skills.csv"), index=False)
    df_students[["student_id", "faculty_mentor_rating", "student_satisfaction_index", "faculty_remark"]].to_csv(os.path.join(DATA_DIR, "07_feedback.csv"), index=False)
    df_students[["student_id", "college_fees_total", "college_fees_paid", "college_fees_due", "exam_fees_total", "exam_fees_paid", "exam_fees_due", "hostel_fees_total", "hostel_fees_paid", "hostel_fees_due", "total_fees_due", "payment_status"]].to_csv(os.path.join(DATA_DIR, "08_fees_structure.csv"), index=False)

    print(f"[DB] Master SQLite Database and 8 Silo CSV datasets created successfully at: {DB_PATH}")
    return df_students

if __name__ == "__main__":
    initialize_database()
