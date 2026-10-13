"""
Data Integration & Synthesis Engine for AI Student Success Platform.
Simulates 7 disconnected enterprise campus silos, cleanses & integrates
them into a unified 360-degree student master dataset.
"""

import os
import random
import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

DEPARTMENTS = [
    "Computer Science & Engineering",
    "Artificial Intelligence & Data Science",
    "Information Technology",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Management & Business Analytics"
]

FIRST_NAMES = [
    "Aarav", "Ananya", "Rohan", "Sneha", "Aditya", "Pooja", "Vikram", "Neha",
    "Rahul", "Priya", "Karthik", "Divya", "Siddharth", "Ishita", "Arjun", "Tanvi",
    "Gaurav", "Shreya", "Nikhil", "Meera", "Varun", "Rhea", "Manish", "Swati",
    "Abhishek", "Kavya", "Pranav", "Anjali", "Harsh", "Aditi", "Suresh", "Bhavna",
    "Rishabh", "Deepika", "Kunal", "Simran", "Akash", "Payal", "Yash", "Nandini"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Mehta", "Singh",
    "Gupta", "Rao", "Deshmukh", "Chakraborty", "Joshi", "Bose", "Kulkarni",
    "Mishra", "Pillai", "Agarwal", "Bhat", "Chopra", "Shetty", "Saxena", "Menon"
]

def generate_multi_source_datasets(n_students: int = 350, seed: int = 42):
    """
    Generates realistic synthetic data simulating 7 isolated campus systems.
    """
    random.seed(seed)
    np.random.seed(seed)
    os.makedirs(DATA_DIR, exist_ok=True)

    student_ids = [f"STU-2024-{1000 + i}" for i in range(n_students)]
    names = [f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}" for _ in range(n_students)]
    depts = [random.choice(DEPARTMENTS) for _ in range(n_students)]
    semesters = [random.choice([4, 6, 8]) for _ in range(n_students)]  # Pre-final / Final year focus

    # Latent student capability factor (-2 to +2) to ensure realistic cross-system correlations
    latent_ability = np.random.normal(0, 1, n_students)
    latent_effort = np.random.normal(0, 1, n_students)

    # 1. ACADEMIC SYSTEM
    cgpa = np.clip(7.0 + 1.2 * latent_ability + 0.5 * latent_effort + np.random.normal(0, 0.4, n_students), 4.2, 9.9)
    cgpa = np.round(cgpa, 2)
    internal_marks = np.clip(np.round(cgpa * 10 + np.random.normal(0, 3, n_students), 1), 40.0, 99.0)
    
    # Backlogs correlate inversely with CGPA and effort
    backlog_prob = np.clip(0.35 - (cgpa - 6.0) * 0.15, 0.02, 0.8)
    active_backlogs = [int(np.random.choice([0, 1, 2, 3, 4], p=[0.75, 0.15, 0.06, 0.03, 0.01])) if p < 0.2 
                       else int(np.random.choice([0, 1, 2, 3, 5], p=[0.4, 0.3, 0.15, 0.1, 0.05]))
                       for p in backlog_prob]
    history_backlogs = [b + int(np.random.choice([0, 1, 2])) for b in active_backlogs]

    df_academic = pd.DataFrame({
        "student_id": student_ids,
        "full_name": names,
        "department": depts,
        "semester": semesters,
        "cgpa": cgpa,
        "internal_exam_score": internal_marks,
        "active_backlogs": active_backlogs,
        "history_backlogs": history_backlogs
    })

    # 2. ATTENDANCE SYSTEM (Biometric / RFID)
    att_base = np.clip(76 + 10 * latent_effort + np.random.normal(0, 7, n_students), 48.0, 99.5)
    overall_att = np.round(att_base, 1)
    lab_att = np.clip(np.round(overall_att + np.random.normal(2, 3, n_students), 1), 45.0, 100.0)
    core_att = np.clip(np.round(overall_att - np.random.normal(1, 2, n_students), 1), 40.0, 100.0)
    consecutive_absent = [int(np.random.choice([0, 1, 2, 4, 7], p=[0.6, 0.2, 0.1, 0.07, 0.03])) if a > 75 
                          else int(np.random.choice([2, 4, 6, 9], p=[0.2, 0.4, 0.3, 0.1])) 
                          for a in overall_att]

    df_attendance = pd.DataFrame({
        "student_id": student_ids,
        "overall_attendance_pct": overall_att,
        "core_subject_att_pct": core_att,
        "lab_attendance_pct": lab_att,
        "consecutive_unexcused_absences": consecutive_absent
    })

    # 3. LMS SYSTEM (Moodle / Canvas / Blackboard)
    logins_weekly = np.clip(np.round(8 + 4 * latent_effort + np.random.normal(0, 2, n_students)), 1, 25).astype(int)
    hours_lms = np.clip(np.round(18 + 10 * latent_effort + np.random.normal(0, 4, n_students), 1), 2.0, 50.0)
    assign_rate = np.clip(np.round(75 + 15 * latent_effort + np.random.normal(0, 8, n_students), 1), 30.0, 100.0)
    quiz_avg = np.clip(np.round(68 + 12 * latent_ability + np.random.normal(0, 6, n_students), 1), 35.0, 99.0)
    late_sub = np.clip(np.round(3 - 1.5 * latent_effort + np.random.normal(0, 1.5, n_students)), 0, 10).astype(int)

    df_lms = pd.DataFrame({
        "student_id": student_ids,
        "weekly_lms_logins": logins_weekly,
        "monthly_lms_hours": hours_lms,
        "assignment_completion_rate": assign_rate,
        "quiz_average_score": quiz_avg,
        "late_submissions_count": late_sub
    })

    # 4. ENGAGEMENT & CO-CURRICULAR
    hackathons = [int(np.random.choice([0, 1, 2, 3, 5], p=[0.45, 0.3, 0.15, 0.07, 0.03])) for _ in range(n_students)]
    clubs = [int(np.random.choice([0, 1, 2, 3], p=[0.3, 0.45, 0.2, 0.05])) for _ in range(n_students)]
    certifications = [int(np.random.choice([0, 1, 2, 3, 4], p=[0.35, 0.35, 0.18, 0.08, 0.04])) for _ in range(n_students)]
    leadership = [random.choice([1, 0, 0, 0, 0]) for _ in range(n_students)]

    df_engagement = pd.DataFrame({
        "student_id": student_ids,
        "hackathons_participated": hackathons,
        "active_clubs_count": clubs,
        "industry_certifications": certifications,
        "holds_leadership_role": leadership
    })

    # 5. PLACEMENT & EMPLOYABILITY SYSTEM
    aptitude = np.clip(np.round(62 + 15 * latent_ability + np.random.normal(0, 8, n_students), 1), 30.0, 99.0)
    # Coding score has some divergence: some high CGPA students have low coding, some low CGPA have high coding!
    coding_special = np.random.normal(0, 1, n_students)
    coding = np.clip(np.round(58 + 10 * latent_ability + 12 * coding_special + np.random.normal(0, 7, n_students), 1), 20.0, 98.0)
    mock_interview = np.clip(np.round(65 + 12 * latent_ability + 5 * latent_effort + np.random.normal(0, 6, n_students), 1), 32.0, 96.0)
    resume_score = np.clip(np.round(60 + 8 * latent_effort + np.random.normal(0, 8, n_students), 1), 35.0, 95.0)

    df_placement = pd.DataFrame({
        "student_id": student_ids,
        "aptitude_test_score": aptitude,
        "coding_assessment_score": coding,
        "mock_interview_score": mock_interview,
        "resume_readiness_score": resume_score
    })

    # 6. SKILLS ASSESSMENTS (1-5 Likert scale)
    tech_dsa = np.clip(np.round(coding / 20.0 + np.random.normal(0, 0.3, n_students), 1), 1.0, 5.0)
    comm_skill = np.clip(np.round(mock_interview / 20.0 + np.random.normal(0, 0.3, n_students), 1), 1.0, 5.0)
    teamwork = np.clip(np.round(3.2 + 0.5 * latent_effort + np.random.normal(0, 0.4, n_students), 1), 1.5, 5.0)

    df_skills = pd.DataFrame({
        "student_id": student_ids,
        "dsa_skill_rating": tech_dsa,
        "communication_rating": comm_skill,
        "teamwork_rating": teamwork
    })

    # 7. FEEDBACK & FACULTY MENTOR RATINGS
    faculty_rating = np.clip(np.round(3.0 + 0.6 * latent_effort + 0.4 * latent_ability + np.random.normal(0, 0.4, n_students), 1), 1.0, 5.0)
    student_satisfaction = np.clip(np.round(3.5 + np.random.normal(0, 0.6, n_students), 1), 1.5, 5.0)
    mentor_flags = [
        "Consistent performer" if f >= 4.2 else
        "Requires placement focus" if (c < 50 and g > 7.5) else
        "Attendance warning issued" if a < 75 else
        "Regular student"
        for f, c, g, a in zip(faculty_rating, coding, cgpa, overall_att)
    ]

    df_feedback = pd.DataFrame({
        "student_id": student_ids,
        "faculty_mentor_rating": faculty_rating,
        "student_satisfaction_index": student_satisfaction,
        "faculty_remark": mentor_flags
    })

    # Save all 7 disparate source tables
    df_academic.to_csv(os.path.join(DATA_DIR, "01_academic.csv"), index=False)
    df_attendance.to_csv(os.path.join(DATA_DIR, "02_attendance.csv"), index=False)
    df_lms.to_csv(os.path.join(DATA_DIR, "03_lms_activity.csv"), index=False)
    df_engagement.to_csv(os.path.join(DATA_DIR, "04_engagement.csv"), index=False)
    df_placement.to_csv(os.path.join(DATA_DIR, "05_placement.csv"), index=False)
    df_skills.to_csv(os.path.join(DATA_DIR, "06_skills.csv"), index=False)
    df_feedback.to_csv(os.path.join(DATA_DIR, "07_feedback.csv"), index=False)

    return {
        "academic": df_academic,
        "attendance": df_attendance,
        "lms": df_lms,
        "engagement": df_engagement,
        "placement": df_placement,
        "skills": df_skills,
        "feedback": df_feedback
    }


def integrate_student_data():
    """
    ETL Pipeline: Reads the 7 distinct datasets, validates schemas,
    resolves keys, handles anomalies, and constructs the unified 360-degree master table.
    """
    datasets = generate_multi_source_datasets()
    
    # Unified Join on student_id
    df_master = datasets["academic"]
    for name in ["attendance", "lms", "engagement", "placement", "skills", "feedback"]:
        df_master = df_master.merge(datasets[name], on="student_id", how="inner")

    # Data Quality Validation & Cleaning
    df_master["cgpa"] = df_master["cgpa"].fillna(df_master["cgpa"].median())
    df_master["overall_attendance_pct"] = df_master["overall_attendance_pct"].clip(0, 100)
    df_master["active_backlogs"] = df_master["active_backlogs"].fillna(0).astype(int)

    master_file = os.path.join(DATA_DIR, "integrated_student_360.csv")
    df_master.to_csv(master_file, index=False)
    return df_master


if __name__ == "__main__":
    df = integrate_student_data()
    print(f"Data Integration Pipeline Completed! Master Table Records: {len(df)}, Features: {df.shape[1]}")
