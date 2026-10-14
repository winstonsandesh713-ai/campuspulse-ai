export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'AMBIGUOUS' | 'UNMAPPED';

export type StandardFieldKey =
  | 'student_id'
  | 'name'
  | 'department'
  | 'semester'
  | 'academic_performance'
  | 'attendance'
  | 'assessment_completion'
  | 'lms_activity'
  | 'academic_trend'
  | 'engagement'
  | 'technical_assessment'
  | 'aptitude'
  | 'communication'
  | 'practical_skills'
  | 'mock_interview';

export interface FieldDefinition {
  key: StandardFieldKey;
  label: string;
  category: 'core' | 'academic' | 'placement';
  description: string;
  dataType: 'string' | 'number';
  isRequired: boolean;
  minVal?: number;
  maxVal?: number;
  aliases: string[];
}

export interface FieldMapping {
  sourceColumn: string;
  targetField: StandardFieldKey | 'IGNORE';
  confidence: ConfidenceLevel;
  reason: string;
  isConfirmed: boolean;
  sampleValues: string[];
}

export interface MappingProfile {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  institutionFormat: string;
  mappings: Record<string, StandardFieldKey | 'IGNORE'>; // sourceColumn -> targetField
}

export interface RawImportRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface RowValidationError {
  rowNumber: number;
  identifier?: string;
  column: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
  rawVal?: string;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  duplicateRows: number;
  unmatchedRows: number;
  errors: RowValidationError[];
}

export interface StudentScores {
  // Raw 0-100 normalized component values (null if unrecorded/missing)
  academicPerformance: number | null;
  attendance: number | null;
  assessmentCompletion: number | null;
  lmsActivity: number | null;
  academicTrend: number | null;
  engagement: number | null;

  technicalAssessment: number | null;
  aptitude: number | null;
  communication: number | null;
  practicalSkills: number | null;
  mockInterview: number | null;

  // Aggregate composite scores
  academicSuccessScore: number | null;
  placementReadinessScore: number | null;

  // Coverage percentages (0-100)
  academicCoverage: number;
  placementCoverage: number;
  overallCoverage: number;

  // Data states
  academicStatus: 'INSUFFICIENT' | 'PROVISIONAL' | 'CALCULATED';
  placementStatus: 'INSUFFICIENT' | 'PROVISIONAL' | 'CALCULATED';
}

export interface SupportIndicator {
  id: string;
  type: 'ATTENDANCE_SUPPORT' | 'ACADEMIC_SUPPORT' | 'PLACEMENT_GAP' | 'DATA_QUALITY_WARNING';
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  evidence: string;
  currentValue?: number | string;
  threshold?: number | string;
  metricLabel: string;
}

export type MatrixQuadrantId =
  | 'HIGH_ACADEMIC_HIGH_PLACEMENT'
  | 'HIGH_ACADEMIC_LOW_PLACEMENT'
  | 'LOW_ACADEMIC_HIGH_PLACEMENT'
  | 'LOW_ACADEMIC_LOW_PLACEMENT'
  | 'INSUFFICIENT_DATA';

export interface Student {
  id: string; // Internal unique ID
  studentId: string; // Institutional Roll No / Reg No / ID
  name: string;
  department: string;
  semester: string | number;
  rawCGPA?: number;
  
  scores: StudentScores;
  indicators: SupportIndicator[];
  matrixQuadrant: MatrixQuadrantId;
  
  recommendedAction: string;
  assignedMentor?: string;
  lastUpdated: string;
}

export interface InterventionLog {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  department: string;
  actionTitle: string;
  category: 'ACADEMIC' | 'PLACEMENT' | 'ATTENDANCE' | 'ADVISORY';
  status: 'PROPOSED' | 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED' | 'ESCALATED';
  assignedMentor: string;
  targetMetric: string;
  baselineValue: string;
  currentValue?: string;
  reviewDate: string;
  createdDate: string;
  notes: Array<{
    id: string;
    author: string;
    timestamp: string;
    content: string;
  }>;
}

export interface ScoringWeights {
  academic: {
    academicPerformance: number; // 35
    attendance: number;          // 20
    assessmentCompletion: number;// 15
    lmsActivity: number;         // 10
    academicTrend: number;       // 15
    engagement: number;          // 5
  };
  placement: {
    technicalAssessment: number; // 30
    aptitude: number;            // 25
    communication: number;       // 20
    practicalSkills: number;     // 15
    mockInterview: number;       // 10
  };
}

export type GradingScaleType = 'CGPA_10' | 'GPA_4' | 'PERCENTAGE_100';

export interface InstitutionConfig {
  institutionName: string;
  identifierName: string; // e.g. "Roll Number", "Register Number", "Student ID"
  departments: string[];
  semesters: string[];
  gradingScale: GradingScaleType;
  gradeNormalizationFormula: string;
  attendanceThreshold: number; // e.g. 75
  academicScoreThreshold: number; // e.g. 50
  placementScoreThreshold: number; // e.g. 50
  matrixCutoff: {
    academic: number; // e.g. 65
    placement: number; // e.g. 60
  };
  weights: ScoringWeights;
  terminology: {
    departmentLabel: string; // "Department" | "Branch" | "School"
    semesterLabel: string; // "Semester" | "Year" | "Term"
    identifierLabel: string; // "Roll No" | "Reg No" | "Student ID"
    placementLabel: string; // "Placement" | "Career Services"
  };
}
