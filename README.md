# CampusPulse AI — Adaptive Student Success Platform

> **"Keep your existing systems. CampusPulse adapts to your data and workflows, with minimal setup and manual effort."**

CampusPulse AI is an enterprise student success and placement readiness platform designed to solve the critical friction in higher-education software: forcing colleges to manually reformat or rename their existing spreadsheets and ERP exports. 

Instead, CampusPulse infers column aliases, normalizes disparate grading scales, validates data integrity, and calculates transparent, evidence-based success indicators without defaulting unrecorded metrics to artificial zeroes.

---

## 1. Features Actually Implemented

### A. Adaptive Data Integration Wizard (Core Feature)
- **Guided 4-Step Ingestion Pipeline**:
  - **Step 1: Upload & Sample Datasets**: Native CSV parsing with quotation, comma-escaping, and UTF-8 BOM header handling. Includes 3 ready-to-test sample datasets representing Indian Engineering ERPs (Roll No, CGPA, CIA Marks), US Higher Education SIS (Student ID, 4.0 GPA, Canvas Score), and legacy Polytechnic workbooks (USN, Aggregate %, Present %, DSA Score). Instant downloadable sample CSV templates.
  - **Step 2: Adaptive Column Mapping**: Heuristic alias recognition for identifiers, departments, semesters, academic scores, attendance, assessments, LMS activity, coding evaluations, and mock interview marks. Confidence grading (`HIGH`, `MEDIUM`, `AMBIGUOUS`, `UNMAPPED`) with explicit justification notes and user verification requirements for ambiguous columns.
  - **Step 3: Validation & Quality Pre-Check**: Pre-flight verification detecting missing identifiers, duplicates, and out-of-boundary percentages. Clear diagnostics table detailing exact row numbers, raw values, and actionable error messages.
  - **Step 4: Profile Memory & Execution**: Option to name and save custom institutional mapping profiles for recurring exports, and choice between "Merge / Upsert" and "Replace Entire Cohort".

### B. Transparent Success & Placement Scoring Engine
- **Academic Success Score (0–100)**:
  - Default weights: Academic Performance (35%), Attendance (20%), Assessment Completion (15%), LMS Activity (10%), Academic Trend (15%), Engagement (5%).
  - Configurable in Institutional Settings with live 100% sum verification.
- **Placement Readiness Score (0–100)**:
  - Default weights: Technical / Coding Assessment (30%), Aptitude & Cognitive (25%), Communication / Verbal (20%), Practical Skills / Capstone (15%), Mock Interview (10%).
- **Fair Missing-Data Handling (Zero-Penalty Principle)**:
  - Missing components are **never converted to zero**. Scores are proportionally evaluated over available valid component weights.
  - Display States:
    - `< 60%` component weight coverage: **Insufficient Data** (composite score withheld to avoid false failure signals).
    - `60% – 79%`: **Provisional Score** (calculated with transparent provisional badge).
    - `≥ 80%`: **Calculated Score** (full confidence with coverage percentage visible).

### C. Academic × Placement Gap Matrix
- **Interactive 2D Quadrant Segmentation**:
  - **Honours & Ready** (High Academic · High Placement): Marquee drive and hackathon candidates.
  - **Placement Skill Gap** (High Academic · Low Placement): Academically strong students requiring coding labs, group discussions, or mock interview drills.
  - **Academic Coursework Support** (Low Academic · High Placement): Hands-on talent requiring attendance monitoring and subject tutoring.
  - **Dual Support** (Low Academic · Low Placement): Multi-faceted faculty mentoring cohort.
  - **Incomplete Records Strip**: Identifies students with `< 60%` data coverage needing record reconciliation.
- **Dynamic Threshold Controls**: Real-time sliders for Academic and Placement cutoff benchmarks with instant quadrant reclassification.
- **Segment Drill-Down**: Click any quadrant to inspect the exact matching student cohort.

### D. Student 360 Profile & Advisory Tracker
- **Individual Student 360 View**:
  - Full demographic details, composite scores, and coverage progress bars.
  - Granular breakdown table of all 11 metrics showing raw source value, normalized 0–100 score, assigned weight, and contribution.
  - Evidence-backed support indicators showing exact observed values vs institutional thresholds (e.g., `Attendance: 64% < 75% policy threshold`).
  - Contextual recommended next action tailored to the student's exact weakness.
- **Intervention Management Workflow**:
  - Assign faculty mentor, set review dates, transition status (`Proposed`, `In Progress`, `Scheduled`, `Completed`, `Escalated`).
  - Add timestamped advisory notes with historical timeline view.
  - Observational before-and-after metric tracker with causality disclaimer.

### E. Institution Overview & Data Quality Center
- **Overview Dashboard**: High-level KPIs, quadrant distribution cards, and multi-department comparisons.
- **Data Quality Center**: Institutional data completeness audit, component-level frequency analysis of missing records, and department ingestion rankings.
- **Student Explorer**: High-density table with sorting, search, multi-attribute filtering (Department, Semester, Quadrant, Flags, Coverage), and CSV export.
- **Institution Adaptation Settings**: Customization of institution name, terminology, department catalog, grading scale normalization formula, threshold policies, and saved mapping profiles.

---

## 2. How to Run the App

### Requirements
- Node.js (v18+)
- npm or yarn

### Commands
```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Build for production
npm run build
```

---

## 3. Supported File Types & Parser Details

- **Supported File Types**:
  - `.csv` (Comma Separated Values), UTF-8 encoded with column headers.
  - Handles multiline values, quoted strings with commas, escaped quotes (`""`), and carriage returns (`CRLF` / `LF`).
- **Upcoming Connectors (Planned)**:
  - Excel `.xlsx` direct parser: Scheduled for subsequent sprint.
  - SIS API Webhooks (Canvas, Moodle, Ellucian Banner, PeopleSoft): In institutional roadmap.

---

## 4. Data Mapping & Scoring Methodology

### Normalization Formulas
- **10-Point CGPA**: `Normalized = CGPA * 10` (Maps 0.00–10.00 to 0–100).
- **4.0 GPA**: `Normalized = GPA * 25` (Maps 0.00–4.00 to 0–100).
- **Percentage (0–100)**: Direct linear mapping clamped to [0, 100].

### Composite Formula
$$\text{Composite Score} = \frac{\sum_{i \in \text{valid}} (\text{Weight}_i \times \text{Normalized Value}_i)}{\sum_{i \in \text{valid}} \text{Weight}_i}$$

---

## 5. Persistence Limitations

- **Prototype Sandbox Environment**:
  Demonstration records, custom mapping profiles, and advisory logs are persisted using the browser's `localStorage` sandbox.
- **Limitations**:
  - Storage is local to the current browser profile and does not synchronize across multiple users or different devices.
  - Clearing browser cookies or cache will restore the application to the default 300 synthetic students.
  - Institutional production deployments utilize PostgreSQL with row-level security and FERPA-compliant encryption.

---

## 6. Known Limitations & Testing Instructions

### Testing Instructions
1. **Test Adaptive Import**:
   - Navigate to **Adaptive Data Import** via the sidebar.
   - Click **"Load Into Wizard"** on the **Anna University ERP Format** card (or upload your own CSV).
   - In Step 2, observe how `Roll No` maps to `student_id`, `CIA Marks` maps to `assessment_completion`, and `Soft Skills` maps to `communication` with explicit reasons.
   - Test overriding a column to "Do Not Import (Exclude)".
   - Click **"Validate & Inspect Records"** to review the validation scoreboard and diagnostic log.
   - Click **"Confirm & Apply Import"** to merge into the active cohort.
2. **Test Dynamic Thresholds & Gap Matrix**:
   - Go to **Academic × Placement Matrix**.
   - Adjust the **Acad Cutoff** slider from 65 to 75 and observe the student quadrant counts and chart reclassify in real time.
   - Click on the **Placement Skill Gap** quadrant to filter students below, then click any row to open the Student 360 Profile.
3. **Test Student 360 Advisory Workflow**:
   - In the modal, review the component breakdown table and support indicators.
   - Change the intervention status to `IN_PROGRESS`, add an advisory note, and click **"Save Advisor Plan"**.
   - Verify that the intervention appears in the **Intervention Tracker**.
4. **Test Reset Demo Data**:
   - Click **"Reset Demo Data"** at the bottom of the sidebar to cleanly reset all records to the original 300 fictional students.
