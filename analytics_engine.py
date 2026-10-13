"""
Analytics & AI Engine for Student Success Platform.
Calculates multidimensional Student Success Scores, dual-axis risk identification,
K-Means student segmentation personas, and explainable AI (XAI) driver breakdowns.
"""

import os
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def calculate_success_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes multidimensional indices and the composite Student Success Score (0-100).
    Weight formulation:
    - Academic Index (AI): 35%
    - Engagement & LMS Index (ELI): 25%
    - Placement Readiness Index (PRI): 30%
    - Feedback & Well-being Index (FWI): 10%
    """
    df = df.copy()

    # 1. ACADEMIC INDEX (AI) [0 - 100]
    cgpa_norm = (df["cgpa"] / 10.0) * 100.0
    backlog_penalty = (df["active_backlogs"] * 12.0) + (df["history_backlogs"] * 2.5)
    ai_raw = (0.55 * cgpa_norm) + (0.45 * df["internal_exam_score"]) - backlog_penalty
    df["academic_index"] = np.clip(ai_raw, 0, 100).round(1)

    # 2. ENGAGEMENT & LMS INDEX (ELI) [0 - 100]
    lms_active_norm = np.clip((df["weekly_lms_logins"] / 20.0 * 50.0) + (df["monthly_lms_hours"] / 40.0 * 50.0), 0, 100)
    co_curricular_norm = np.clip(
        (df["hackathons_participated"] * 18.0) + 
        (df["industry_certifications"] * 15.0) + 
        (df["active_clubs_count"] * 10.0) + 
        (df["holds_leadership_role"] * 12.0),
        0, 100
    )
    eli_raw = (
        0.40 * df["overall_attendance_pct"] +
        0.30 * df["assignment_completion_rate"] +
        0.15 * lms_active_norm +
        0.15 * co_curricular_norm
    )
    df["engagement_lms_index"] = np.clip(eli_raw, 0, 100).round(1)

    # 3. PLACEMENT READINESS INDEX (PRI) [0 - 100]
    skills_avg_100 = ((df["dsa_skill_rating"] + df["communication_rating"] + df["teamwork_rating"]) / 15.0) * 100.0
    pri_raw = (
        0.35 * df["coding_assessment_score"] +
        0.30 * df["aptitude_test_score"] +
        0.20 * df["mock_interview_score"] +
        0.15 * skills_avg_100
    )
    df["placement_readiness_index"] = np.clip(pri_raw, 0, 100).round(1)

    # 4. FEEDBACK & WELL-BEING INDEX (FWI) [0 - 100]
    faculty_norm = (df["faculty_mentor_rating"] / 5.0) * 100.0
    sat_norm = (df["student_satisfaction_index"] / 5.0) * 100.0
    fwi_raw = (0.60 * faculty_norm) + (0.40 * sat_norm)
    df["feedback_wellbeing_index"] = np.clip(fwi_raw, 0, 100).round(1)

    # COMPOSITE STUDENT SUCCESS SCORE (SSS) [0 - 100]
    sss_raw = (
        0.35 * df["academic_index"] +
        0.25 * df["engagement_lms_index"] +
        0.30 * df["placement_readiness_index"] +
        0.10 * df["feedback_wellbeing_index"]
    )
    df["student_success_score"] = np.clip(sss_raw, 0, 100).round(1)

    # SUCCESS TIER
    conditions_tier = [
        df["student_success_score"] >= 75.0,
        df["student_success_score"] >= 60.0,
        df["student_success_score"] >= 45.0
    ]
    tiers = ["Dean's List / High Ready", "Good Standing", "Watchlist / Borderline"]
    df["success_tier"] = np.select(conditions_tier, tiers, default="Critical Concern")

    return df


def identify_risks(df: pd.DataFrame) -> pd.DataFrame:
    """
    Identifies multidimensional risks:
    - Academic Risk (High, Medium, Low)
    - Placement Risk (High, Medium, Low)
    - Overall Risk Level (Critical, High, Medium, Low)
    """
    df = df.copy()

    # Academic Risk Logic
    def get_acad_risk(row):
        score = 0
        if row["active_backlogs"] >= 2: score += 3
        elif row["active_backlogs"] == 1: score += 1.5
        
        if row["cgpa"] < 6.0: score += 2.5
        elif row["cgpa"] < 7.0: score += 1.2
        
        if row["overall_attendance_pct"] < 65: score += 2.5
        elif row["overall_attendance_pct"] < 75: score += 1.2
        
        if row["academic_index"] < 50: score += 2.0
        elif row["academic_index"] < 65: score += 1.0

        if score >= 4.5: return "High"
        elif score >= 2.0: return "Medium"
        return "Low"

    # Placement Risk Logic
    def get_placement_risk(row):
        score = 0
        if row["coding_assessment_score"] < 42: score += 3.0
        elif row["coding_assessment_score"] < 58: score += 1.5
        
        if row["aptitude_test_score"] < 48: score += 2.5
        elif row["aptitude_test_score"] < 60: score += 1.2
        
        if row["mock_interview_score"] < 50: score += 2.0
        elif row["mock_interview_score"] < 62: score += 1.0
        
        if row["placement_readiness_index"] < 50: score += 2.0
        elif row["placement_readiness_index"] < 65: score += 1.0

        if score >= 4.5: return "High"
        elif score >= 2.0: return "Medium"
        return "Low"

    df["academic_risk"] = df.apply(get_acad_risk, axis=1)
    df["placement_risk"] = df.apply(get_placement_risk, axis=1)

    # Composite Overall Risk Flag
    def get_overall_risk(row):
        ar = row["academic_risk"]
        pr = row["placement_risk"]
        sss = row["student_success_score"]
        
        if (ar == "High" and pr == "High") or sss < 46.0 or row["active_backlogs"] >= 3:
            return "Critical"
        elif ar == "High" or pr == "High" or sss < 58.0:
            return "High"
        elif ar == "Medium" or pr == "Medium" or sss < 70.0:
            return "Medium"
        return "Low"

    df["overall_risk"] = df.apply(get_overall_risk, axis=1)
    return df


def perform_segmentation(df: pd.DataFrame, n_clusters: int = 5, seed: int = 42) -> pd.DataFrame:
    """
    K-Means clustering combined with actionable persona heuristics:
    1. High Academic - Low Placement
    2. High Placement - Low Academic
    3. Well-Rounded Achievers
    4. Disengaged High-Potential
    5. Critical Comprehensive Intervention
    """
    df = df.copy()
    features = ["academic_index", "engagement_lms_index", "placement_readiness_index", "feedback_wellbeing_index"]
    X = df[features].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    kmeans = KMeans(n_clusters=n_clusters, random_state=seed, n_init=10)
    df["cluster_id"] = kmeans.fit_predict(X_scaled)

    # Intelligent persona mapping matching challenge specification
    def assign_segment_persona(row):
        ai = row["academic_index"]
        pri = row["placement_readiness_index"]
        eli = row["engagement_lms_index"]
        sss = row["student_success_score"]

        # Case 1: High academic, low placement (Challenge Bonus feature specific)
        if ai >= 70 and pri < 55:
            return "High Academic, Low Placement"
        
        # Case 2: High placement, low academic
        if pri >= 70 and (ai < 60 or row["active_backlogs"] > 0):
            return "High Placement, Low Academic"
        
        # Case 3: Critical comprehensive intervention
        if sss < 50 or (row["academic_risk"] == "High" and row["placement_risk"] == "High"):
            return "Critical Comprehensive Intervention"
        
        # Case 4: Disengaged High-Potential
        if (row["aptitude_test_score"] >= 65 or pri >= 62) and (eli < 58 or row["overall_attendance_pct"] < 72):
            return "Disengaged High-Potential"
        
        # Case 5: Well-rounded achievers
        if sss >= 72 and ai >= 70 and pri >= 70:
            return "Well-Rounded Achievers"
        
        # Fallback to balanced standing
        if sss >= 60:
            return "Steady Developing Performer"
        return "At-Risk Targeted Support"

    df["segment_name"] = df.apply(assign_segment_persona, axis=1)

    # Segment action recommendations
    segment_actions = {
        "High Academic, Low Placement": "Enroll in intensive DSA coding bootcamp & 1-on-1 industry mock interview series.",
        "High Placement, Low Academic": "Attendance contract, faculty mentor academic check-ins & remedial backlog clearance.",
        "Critical Comprehensive Intervention": "Immediate Dean/HOD advisory conference, remedial study cohorts & psychological counseling.",
        "Disengaged High-Potential": "Pair with student mentor leader, assign capstone project leadership & gamified LMS milestones.",
        "Well-Rounded Achievers": "Fast-track for tier-1 campus placements, research fellowships & competitive hackathons.",
        "Steady Developing Performer": "Standard periodic faculty advising and elective skill enrichment.",
        "At-Risk Targeted Support": "Attendance monitoring and subject-specific tutoring support."
    }
    df["recommended_intervention"] = df["segment_name"].map(segment_actions)
    return df


def generate_explainable_drivers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes explainable positive and negative drivers contributing to each student's
    Success Score and risk classification relative to the institutional cohort mean.
    """
    df = df.copy()

    means = {
        "cgpa": df["cgpa"].mean(),
        "attendance": df["overall_attendance_pct"].mean(),
        "lms_assign": df["assignment_completion_rate"].mean(),
        "coding": df["coding_assessment_score"].mean(),
        "aptitude": df["aptitude_test_score"].mean(),
        "mock_interview": df["mock_interview_score"].mean(),
        "certifications": df["industry_certifications"].mean(),
    }

    def explain_row(row):
        drivers = []
        
        # Academic factors
        if row["active_backlogs"] > 0:
            impact = -1 * row["active_backlogs"] * 8.5
            drivers.append({"driver": f"{row['active_backlogs']} Active Backlog(s)", "impact": round(impact, 1), "type": "negative", "category": "Academic"})
        
        cgpa_diff = (row["cgpa"] - means["cgpa"]) * 7.0
        if abs(cgpa_diff) >= 3.0:
            d_type = "positive" if cgpa_diff > 0 else "negative"
            label = f"CGPA of {row['cgpa']:.2f} (Cohort avg: {means['cgpa']:.2f})"
            drivers.append({"driver": label, "impact": round(cgpa_diff, 1), "type": d_type, "category": "Academic"})

        # Attendance factors
        att_diff = (row["overall_attendance_pct"] - means["attendance"]) * 0.35
        if abs(att_diff) >= 2.5:
            d_type = "positive" if att_diff > 0 else "negative"
            label = f"Attendance at {row['overall_attendance_pct']}% (Cohort avg: {means['attendance']:.1f}%)"
            drivers.append({"driver": label, "impact": round(att_diff, 1), "type": d_type, "category": "Attendance"})

        # Placement / Coding factors
        coding_diff = (row["coding_assessment_score"] - means["coding"]) * 0.30
        if abs(coding_diff) >= 3.0:
            d_type = "positive" if coding_diff > 0 else "negative"
            label = f"Coding Score {row['coding_assessment_score']} (Cohort avg: {means['coding']:.1f})"
            drivers.append({"driver": label, "impact": round(coding_diff, 1), "type": d_type, "category": "Placement"})

        # LMS Assignment factor
        lms_diff = (row["assignment_completion_rate"] - means["lms_assign"]) * 0.25
        if abs(lms_diff) >= 2.5:
            d_type = "positive" if lms_diff > 0 else "negative"
            label = f"LMS Assignment Rate {row['assignment_completion_rate']}%"
            drivers.append({"driver": label, "impact": round(lms_diff, 1), "type": d_type, "category": "LMS"})

        # Certifications / Extracurriculars
        if row["industry_certifications"] >= 2:
            drivers.append({"driver": f"{row['industry_certifications']} Industry Certifications", "impact": round(row['industry_certifications'] * 3.5, 1), "type": "positive", "category": "Skills"})
        elif row["industry_certifications"] == 0:
            drivers.append({"driver": "Zero Industry Certifications", "impact": -4.0, "type": "negative", "category": "Skills"})

        # Sort drivers by absolute impact
        pos = [d for d in drivers if d["type"] == "positive"]
        neg = [d for d in drivers if d["type"] == "negative"]

        pos.sort(key=lambda x: abs(x["impact"]), reverse=True)
        neg.sort(key=lambda x: abs(x["impact"]), reverse=True)

        return pos[:3], neg[:3]

    driver_results = [explain_row(row) for _, row in df.iterrows()]
    df["top_positive_drivers"] = [r[0] for r in driver_results]
    df["top_negative_drivers"] = [r[1] for r in driver_results]

    return df


def run_full_analytics_pipeline():
    """
    Executes end-to-end data processing:
    Multi-source integration -> Scoring -> Dual-axis Risk -> Segmentation -> Explainability.
    Saves and returns the enriched dataframe.
    """
    master_file = os.path.join(DATA_DIR, "integrated_student_360.csv")
    if not os.path.exists(master_file):
        from data_engine import integrate_student_data
        df = integrate_student_data()
    else:
        df = pd.read_csv(master_file)

    df = calculate_success_scores(df)
    df = identify_risks(df)
    df = perform_segmentation(df)
    df = generate_explainable_drivers(df)

    processed_file = os.path.join(DATA_DIR, "processed_student_analytics.csv")
    df.to_csv(processed_file, index=False)
    return df


if __name__ == "__main__":
    df_result = run_full_analytics_pipeline()
    print(f"Analytics Pipeline Completed Successfully! Total Students: {len(df_result)}")
    print(f"Average Student Success Score: {df_result['student_success_score'].mean():.2f}")
    print("\nRisk Breakdown:\n", df_result['overall_risk'].value_counts())
    print("\nSegmentation Breakdown:\n", df_result['segment_name'].value_counts())
