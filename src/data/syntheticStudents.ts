import {
  InstitutionConfig,
  InterventionLog,
  MappingProfile,
  Student,
} from '../types';
import {
  computeStudentScores,
  determineMatrixQuadrant,
  evaluateSupportIndicators,
  generateSuggestedAction,
} from '../utils/scoringEngine';

export const DEFAULT_CONFIG: InstitutionConfig = {
  institutionName: 'Apex Institute of Technology & Science',
  identifierName: 'Roll Number',
  departments: [
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Information Technology',
    'Electrical & Electronics',
    'Data Science & AI',
  ],
  semesters: ['Semester 3', 'Semester 5', 'Semester 7'],
  gradingScale: 'CGPA_10',
  gradeNormalizationFormula: 'Normalized Academic Score = CGPA × 10 (0.00 – 10.00 scale mapped linearly to 0 – 100)',
  attendanceThreshold: 75,
  academicScoreThreshold: 50,
  placementScoreThreshold: 50,
  matrixCutoff: {
    academic: 65,
    placement: 60,
  },
  weights: {
    academic: {
      academicPerformance: 35,
      attendance: 20,
      assessmentCompletion: 15,
      lmsActivity: 10,
      academicTrend: 15,
      engagement: 5,
    },
    placement: {
      technicalAssessment: 30,
      aptitude: 25,
      communication: 20,
      practicalSkills: 15,
      mockInterview: 10,
    },
  },
  terminology: {
    departmentLabel: 'Department',
    semesterLabel: 'Semester',
    identifierLabel: 'Roll No',
    placementLabel: 'Placement',
  },
};

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Aryan', 'Bhavna', 'Chetan', 'Deepika', 'Dev', 'Diya',
  'Gaurav', 'Ishaan', 'Jaya', 'Karthik', 'Kavya', 'Manish', 'Meera', 'Naveen', 'Neha', 'Nikhil',
  'Pooja', 'Pranav', 'Rahul', 'Rhea', 'Rohan', 'Sakshi', 'Sameer', 'Shreya', 'Siddharth', 'Sneha',
  'Tanvi', 'Tarun', 'Varun', 'Vidya', 'Vikram', 'Yash', 'Zoya', 'Abhishek', 'Harini', 'Divya',
  'Sanjay', 'Preeti', 'Manoj', 'Anjali', 'Swati', 'Vipin', 'Kunal', 'Rashmi', 'Kishore', 'Priyanka'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Kulkarni', 'Joshi', 'Gupta', 'Singh',
  'Kumar', 'Rao', 'Bose', 'Chatterjee', 'Das', 'Mehta', 'Chopra', 'Malhotra', 'Deshmukh', 'Menon',
  'Pillai', 'Shetty', 'Hegde', 'Bhat', 'Agarwal', 'Pandey', 'Mishra', 'Tripathi', 'Thakur', 'Bhattacharya'
];

const MENTORS = [
  'Dr. Priya Sharma (CSE Lead Advisor)',
  'Prof. Arvind Narayanan (Career Services)',
  'Dr. Kavitha Rajan (ECE Academic Head)',
  'Prof. Rajesh Kumar (Mech Dept Coordinator)',
  'Dr. Sneha Kulkarni (Placement Trainer)',
  'Prof. Arun Mehta (Student Success Dean)',
];

function pseudoRandom(seed: number): () => number {
  let val = seed;
  return () => {
    val = (val * 9301 + 49297) % 233280;
    return val / 233280;
  };
}

export function generateSyntheticStudents(config: InstitutionConfig = DEFAULT_CONFIG): Student[] {
  const students: Student[] = [];
  const rand = pseudoRandom(42);

  const deptCodes: Record<string, string> = {
    'Computer Science & Engineering': 'CS',
    'Electronics & Communication': 'EC',
    'Mechanical Engineering': 'ME',
    'Information Technology': 'IT',
    'Electrical & Electronics': 'EE',
    'Data Science & AI': 'DS',
  };

  const semYears: Record<string, number> = {
    'Semester 3': 23,
    'Semester 5': 22,
    'Semester 7': 21,
  };

  let studentCounter = 1;

  config.departments.forEach((dept) => {
    const code = deptCodes[dept] || 'GEN';
    // Generate ~50 students per department = 300 total
    const countForDept = 50;

    for (let i = 0; i < countForDept; i++) {
      const semIndex = i % config.semesters.length;
      const sem = config.semesters[semIndex];
      const year = semYears[sem] || 22;
      const seqStr = String((i % 60) + 1).padStart(3, '0');
      const rollNo = `${year}${code}${seqStr}`;

      const fName = FIRST_NAMES[(i * 7 + studentCounter) % FIRST_NAMES.length];
      const lName = LAST_NAMES[(i * 13 + studentCounter) % LAST_NAMES.length];
      const fullName = `${fName} ${lName}`;

      // Introduce controlled incomplete records (~12% of cohort)
      const isIncomplete = i % 8 === 0;
      const isMissingPlacement = i % 10 === 0 && !isIncomplete;

      // Base profiles: mix of high performers, placement gap, academic gap, and balanced
      const profileArchetype = (i + studentCounter) % 5;

      let baseCgpa: number;
      let baseAtt: number;
      let baseTech: number;
      let baseApt: number;
      let baseComm: number;
      let basePract: number;
      let baseMock: number;

      if (profileArchetype === 0) {
        // High Academic, High Placement
        baseCgpa = 7.8 + rand() * 1.9; // 7.8 - 9.7
        baseAtt = 80 + rand() * 18;   // 80 - 98
        baseTech = 75 + rand() * 23;
        baseApt = 72 + rand() * 24;
        baseComm = 70 + rand() * 25;
        basePract = 78 + rand() * 20;
        baseMock = 70 + rand() * 25;
      } else if (profileArchetype === 1) {
        // High Academic, Low Placement (Skills Gap)
        baseCgpa = 8.0 + rand() * 1.7; // 8.0 - 9.7
        baseAtt = 85 + rand() * 14;   // 85 - 99
        baseTech = 42 + rand() * 18;  // 42 - 60 (struggles in coding/technical)
        baseApt = 45 + rand() * 15;
        baseComm = 38 + rand() * 18;  // soft skills gap
        basePract = 50 + rand() * 15;
        baseMock = 35 + rand() * 20;
      } else if (profileArchetype === 2) {
        // Low Academic, High Placement (Practical strength / Attendance issue)
        baseCgpa = 5.2 + rand() * 1.4; // 5.2 - 6.6
        baseAtt = 58 + rand() * 18;   // 58 - 76 (attendance alerts!)
        baseTech = 76 + rand() * 20;  // Great coding & projects
        baseApt = 70 + rand() * 22;
        baseComm = 68 + rand() * 25;
        basePract = 82 + rand() * 16;
        baseMock = 72 + rand() * 20;
      } else if (profileArchetype === 3) {
        // Low Academic, Low Placement (Comprehensive support needed)
        baseCgpa = 4.8 + rand() * 1.3; // 4.8 - 6.1
        baseAtt = 52 + rand() * 20;   // 52 - 72 (low attendance)
        baseTech = 36 + rand() * 18;
        baseApt = 40 + rand() * 16;
        baseComm = 42 + rand() * 16;
        basePract = 45 + rand() * 18;
        baseMock = 38 + rand() * 18;
      } else {
        // Mid-range / balanced
        baseCgpa = 6.4 + rand() * 1.6;
        baseAtt = 72 + rand() * 20;
        baseTech = 58 + rand() * 25;
        baseApt = 56 + rand() * 25;
        baseComm = 58 + rand() * 24;
        basePract = 62 + rand() * 22;
        baseMock = 55 + rand() * 25;
      }

      const rawCGPA = Math.round(baseCgpa * 100) / 100;
      const normalizedAcad = Math.min(100, Math.round(rawCGPA * 10 * 10) / 10);
      const attendance = Math.min(100, Math.round(baseAtt * 10) / 10);
      const assessmentCompletion = Math.min(100, Math.round((normalizedAcad * 0.8 + rand() * 20) * 10) / 10);
      const lmsActivity = Math.min(100, Math.round((attendance * 0.7 + rand() * 30) * 10) / 10);
      const academicTrend = Math.min(100, Math.round((45 + (rawCGPA - 6.0) * 8 + rand() * 15) * 10) / 10);
      const engagement = Math.min(100, Math.round((attendance * 0.6 + rand() * 40) * 10) / 10);

      const technicalAssessment = Math.min(100, Math.round(baseTech * 10) / 10);
      const aptitude = Math.min(100, Math.round(baseApt * 10) / 10);
      const communication = Math.min(100, Math.round(baseComm * 10) / 10);
      const practicalSkills = Math.min(100, Math.round(basePract * 10) / 10);
      const mockInterview = Math.min(100, Math.round(baseMock * 10) / 10);

      // Apply incomplete records condition
      const scoresInput = {
        academicPerformance: normalizedAcad,
        attendance: isIncomplete && i % 3 === 0 ? null : attendance,
        assessmentCompletion: isIncomplete ? null : assessmentCompletion,
        lmsActivity: isIncomplete && i % 2 === 0 ? null : lmsActivity,
        academicTrend: academicTrend,
        engagement: isIncomplete ? null : engagement,

        technicalAssessment: isMissingPlacement ? null : technicalAssessment,
        aptitude: isMissingPlacement || (isIncomplete && i % 4 === 0) ? null : aptitude,
        communication: communication,
        practicalSkills: practicalSkills,
        mockInterview: isMissingPlacement || isIncomplete ? null : mockInterview,
      };

      const scores = computeStudentScores(scoresInput, config.weights);
      const indicators = evaluateSupportIndicators(scores, config);
      const matrixQuadrant = determineMatrixQuadrant(scores, config.matrixCutoff);
      const recommendedAction = generateSuggestedAction(matrixQuadrant, scores, indicators);
      const assignedMentor = MENTORS[(studentCounter + i) % MENTORS.length];

      students.push({
        id: `stu-${studentCounter}`,
        studentId: rollNo,
        name: fullName,
        department: dept,
        semester: sem,
        rawCGPA,
        scores,
        indicators,
        matrixQuadrant,
        recommendedAction,
        assignedMentor,
        lastUpdated: '2026-10-10',
      });

      studentCounter++;
    }
  });

  return students;
}

export const INITIAL_INTERVENTIONS: InterventionLog[] = [
  {
    id: 'int-1',
    studentId: 'stu-2',
    studentName: 'Rahul Verma',
    studentRollNo: '22CS002',
    department: 'Computer Science & Engineering',
    actionTitle: 'Targeted Coding Lab & DSA Mentorship',
    category: 'PLACEMENT',
    status: 'IN_PROGRESS',
    assignedMentor: 'Dr. Priya Sharma (CSE Lead Advisor)',
    targetMetric: 'Technical Assessment Score',
    baselineValue: '44% (Critical Placement Gap)',
    currentValue: '58% (+14 pts in 3 weeks)',
    reviewDate: '2026-10-24',
    createdDate: '2026-09-18',
    notes: [
      {
        id: 'n-1',
        author: 'Dr. Priya Sharma',
        timestamp: '2026-09-18 10:30',
        content: 'Initial advising consultation completed. Rahul is academically strong (CGPA 8.7) but had high anxiety in live coding rounds.',
      },
      {
        id: 'n-2',
        author: 'Dr. Priya Sharma',
        timestamp: '2026-10-04 14:15',
        content: 'Completed 6 LeetCode medium modules with peer partner. Showed 14% improvement on Saturday benchmark.',
      },
    ],
  },
  {
    id: 'int-2',
    studentId: 'stu-53',
    studentName: 'Sneha Patel',
    studentRollNo: '22EC003',
    department: 'Electronics & Communication',
    actionTitle: 'Attendance Recovery & Subject Tutoring',
    category: 'ATTENDANCE',
    status: 'SCHEDULED',
    assignedMentor: 'Dr. Kavitha Rajan (ECE Academic Head)',
    targetMetric: 'Classroom Attendance %',
    baselineValue: '61% (< 75% threshold)',
    currentValue: '68% (Recovering)',
    reviewDate: '2026-10-28',
    createdDate: '2026-09-22',
    notes: [
      {
        id: 'n-3',
        author: 'Dr. Kavitha Rajan',
        timestamp: '2026-09-22 11:00',
        content: 'Medical leave certificate verified for 2 weeks in August. Bi-weekly attendance tracking agreement signed with parent acknowledgment.',
      },
    ],
  },
  {
    id: 'int-3',
    studentId: 'stu-105',
    studentName: 'Karthik Rao',
    studentRollNo: '22ME005',
    department: 'Mechanical Engineering',
    actionTitle: 'Mock Interview Retake & Soft Skills Clinic',
    category: 'PLACEMENT',
    status: 'COMPLETED',
    assignedMentor: 'Prof. Arvind Narayanan (Career Services)',
    targetMetric: 'Mock Interview Articulation',
    baselineValue: '38% (Low Verbal & GD)',
    currentValue: '72% (Cleared Tier-2 Standard)',
    reviewDate: '2026-10-08',
    createdDate: '2026-09-12',
    notes: [
      {
        id: 'n-4',
        author: 'Prof. Arvind Narayanan',
        timestamp: '2026-10-08 16:30',
        content: 'Completed 3 mock HR rounds and group discussion drill. Cleared final clearance checklist for campus recruitment drive.',
      },
    ],
  },
  {
    id: 'int-4',
    studentId: 'stu-158',
    studentName: 'Ananya Deshmukh',
    studentRollNo: '22IT008',
    department: 'Information Technology',
    actionTitle: 'Comprehensive Academic Advising Plan',
    category: 'ACADEMIC',
    status: 'PROPOSED',
    assignedMentor: 'Prof. Arun Mehta (Student Success Dean)',
    targetMetric: 'Academic Success & Midterm Completion',
    baselineValue: '48% Academic Success Score',
    currentValue: 'Awaiting first advisor session',
    reviewDate: '2026-10-20',
    createdDate: '2026-10-09',
    notes: [
      {
        id: 'n-5',
        author: 'Prof. Arun Mehta',
        timestamp: '2026-10-09 09:15',
        content: 'Identified during mid-semester gap matrix audit. Candidate has low coursework completion across two core engineering subjects.',
      },
    ],
  },
];

export const PRESET_MAPPING_PROFILES: MappingProfile[] = [
  {
    id: 'profile-anna-univ',
    name: 'Anna University Affiliated ERP Export',
    description: 'Pre-configured mapping for Tamil Nadu Anna University college management systems using Roll No, CGPA, and CIA marks.',
    createdAt: '2026-09-15',
    updatedAt: '2026-10-01',
    institutionFormat: 'Indian Engineering Autonomous / Affiliated Format',
    mappings: {
      'Roll No': 'student_id',
      'Candidate Name': 'name',
      'Branch': 'department',
      'Sem': 'semester',
      'CGPA': 'academic_performance',
      'Attendance %': 'attendance',
      'CIA Marks': 'assessment_completion',
      'Portal Logins': 'lms_activity',
      'Growth Index': 'academic_trend',
      'Technical Score': 'technical_assessment',
      'Aptitude %': 'aptitude',
      'Soft Skills': 'communication',
      'Mini Project': 'practical_skills',
      'Mock Drive Score': 'mock_interview',
    },
  },
  {
    id: 'profile-us-canvas',
    name: 'US Higher Ed / Canvas LMS Sync',
    description: 'Schema profile for institutions using Banner / PeopleSoft SIS alongside Canvas or Blackboard LMS.',
    createdAt: '2026-08-20',
    updatedAt: '2026-09-28',
    institutionFormat: 'US / Global Higher Ed Banner & Canvas Schema',
    mappings: {
      'Student ID': 'student_id',
      'Full Name': 'name',
      'Department Name': 'department',
      'Term': 'semester',
      'GPA': 'academic_performance',
      'Attendance Percentage': 'attendance',
      'Midterm %': 'assessment_completion',
      'Canvas Score': 'lms_activity',
      'Grade Trajectory': 'academic_trend',
      'Coding Benchmark': 'technical_assessment',
      'Quant & Logical': 'aptitude',
      'Verbal Score': 'communication',
      'Capstone Marks': 'practical_skills',
      'HR Round': 'mock_interview',
    },
  },
  {
    id: 'profile-messy-erp',
    name: 'Legacy Polytechnic Excel Workbook',
    description: 'Mappings for legacy spreadsheets with abbreviations like USN, Reg No, Attd %, and Term Work.',
    createdAt: '2026-09-02',
    updatedAt: '2026-10-05',
    institutionFormat: 'Legacy Polytechnic / Technical Board Format',
    mappings: {
      'USN': 'student_id',
      'Student Name': 'name',
      'Stream': 'department',
      'Semester': 'semester',
      'Aggregate %': 'academic_performance',
      'Present %': 'attendance',
      'Term Work': 'assessment_completion',
      'Moodle Score': 'lms_activity',
      'Sem-on-Sem Growth': 'academic_trend',
      'DSA Score': 'technical_assessment',
      'Reasoning Score': 'aptitude',
      'Interview Score': 'communication',
      'Lab Practical': 'practical_skills',
      'Mock Evaluation': 'mock_interview',
    },
  },
];

// Sample CSV texts for immediate download or 1-click test import
export const SAMPLE_CSV_ANNA_UNIV = `Roll No,Candidate Name,Branch,Sem,CGPA,Attendance %,CIA Marks,Portal Logins,Technical Score,Aptitude %,Soft Skills,Mini Project,Mock Drive Score
22CS101,Aarav Sharma,Computer Science & Engineering,Semester 5,8.85,92.5,88.0,84.0,82.0,78.5,85.0,90.0,80.0
22CS102,Aditi Verma,Computer Science & Engineering,Semester 5,8.95,95.0,91.0,89.0,48.0,52.0,42.0,60.0,45.0
22CS103,Akash Patel,Computer Science & Engineering,Semester 5,5.60,68.0,55.0,50.0,78.0,74.0,72.0,82.0,75.0
22CS104,Ananya Reddy,Computer Science & Engineering,Semester 5,5.20,62.0,48.0,44.0,40.0,45.0,46.0,50.0,42.0
22ME105,Bhavna Iyer,Mechanical Engineering,Semester 5,8.10,88.0,82.0,78.0,80.0,76.0,82.0,85.0,78.0
22ME106,Chetan Nair,Mechanical Engineering,Semester 5,7.90,84.0,79.0,70.0,44.0,48.0,40.0,55.0,38.0
22EC107,Deepika Kulkarni,Electronics & Communication,Semester 5,6.20,64.0,58.0,60.0,85.0,80.0,75.0,88.0,80.0
22EC108,Dev Joshi,Electronics & Communication,Semester 5,4.90,58.0,45.0,40.0,38.0,42.0,44.0,48.0,36.0
22IT109,Diya Gupta,Information Technology,Semester 5,8.70,90.0,86.0,82.0,88.0,84.0,80.0,86.0,82.0
22IT110,Gaurav Singh,Information Technology,Semester 5,8.40,89.0,83.0,76.0,50.0,54.0,45.0,58.0,44.0`;

export const SAMPLE_CSV_US_BANNER = `Student ID,Full Name,Department Name,Term,GPA,Attendance Percentage,Midterm %,Canvas Score,Coding Benchmark,Quant & Logical,Verbal Score,Capstone Marks,HR Round
STU-2026-001,Marcus Vance,Computer Science & Engineering,Semester 3,3.82,94.0,90.0,88.0,86.0,82.0,88.0,92.0,85.0
STU-2026-002,Chloe Bennett,Computer Science & Engineering,Semester 3,3.90,96.0,92.0,90.0,52.0,56.0,48.0,62.0,46.0
STU-2026-003,Liam O'Connor,Mechanical Engineering,Semester 3,2.45,67.0,54.0,52.0,80.0,76.0,74.0,84.0,78.0
STU-2026-004,Elena Rostova,Electronics & Communication,Semester 3,2.30,61.0,48.0,46.0,42.0,44.0,48.0,52.0,40.0
STU-2026-005,Aiden Chen,Data Science & AI,Semester 3,3.75,91.0,88.0,85.0,84.0,80.0,82.0,88.0,80.0
STU-2026-006,Sophia Martinez,Electrical & Electronics,Semester 3,3.60,88.0,84.0,80.0,46.0,50.0,44.0,56.0,42.0`;

export const SAMPLE_CSV_MESSY_ERP = `USN,Student Name,Stream,Semester,Aggregate %,Present %,Term Work,Moodle Score,DSA Score,Reasoning Score,Interview Score,Lab Practical,Mock Evaluation
1MS22CS001,Tanya Saxena,Computer Science & Engineering,Semester 7,85.5,91.0,86.0,80.0,84.0,80.0,86.0,90.0,82.0
1MS22CS002,Karan Malhotra,Computer Science & Engineering,Semester 7,86.0,93.0,88.0,82.0,46.0,50.0,40.0,58.0,44.0
1MS22ME003,Pooja Sen,Mechanical Engineering,Semester 7,61.0,66.0,56.0,52.0,76.0,72.0,70.0,80.0,74.0
1MS22EC004,Nitin Deshmukh,Electronics & Communication,Semester 7,50.0,59.0,48.0,45.0,38.0,42.0,45.0,50.0,38.0
1MS22DS005,Sana Khan,Data Science & AI,Semester 7,88.0,92.0,89.0,86.0,86.0,82.0,84.0,88.0,84.0`;
