import { ConfidenceLevel, FieldDefinition, FieldMapping, StandardFieldKey } from '../types';

export const STANDARD_FIELDS: FieldDefinition[] = [
  {
    key: 'student_id',
    label: 'Student Identifier',
    category: 'core',
    description: 'Unique institutional identifier (Roll No, Register No, USN, Matriculation)',
    dataType: 'string',
    isRequired: true,
    aliases: [
      'roll no', 'rollno', 'roll number', 'roll_no', 'roll_num',
      'register no', 'reg no', 'regno', 'registration no', 'reg_no', 'register number', 'registration number',
      'student id', 'studentid', 'student_id', 'id', 'admission no', 'adm no', 'admission_no',
      'usn', 'enrolment no', 'enrollment no', 'enrolment_number', 'prn', 'hall ticket', 'matriculation no'
    ],
  },
  {
    key: 'name',
    label: 'Student Name',
    category: 'core',
    description: 'Full name of the student or candidate',
    dataType: 'string',
    isRequired: true,
    aliases: [
      'name', 'student name', 'candidate name', 'full name', 'fullname',
      'student_name', 'candidate_name', 'learner name', 'first and last name'
    ],
  },
  {
    key: 'department',
    label: 'Department / Branch',
    category: 'core',
    description: 'Academic department, stream, branch, or major discipline',
    dataType: 'string',
    isRequired: true,
    aliases: [
      'department', 'dept', 'branch', 'stream', 'program', 'course',
      'dept name', 'department name', 'major', 'discipline', 'specialization',
      'branch name', 'dept_name', 'academic stream'
    ],
  },
  {
    key: 'semester',
    label: 'Semester / Year',
    category: 'core',
    description: 'Current academic semester, term, or year level',
    dataType: 'string',
    isRequired: false,
    aliases: [
      'semester', 'sem', 'term', 'year', 'academic year', 'current semester',
      'sem_no', 'semester no', 'current sem', 'level', 'cohort year'
    ],
  },
  {
    key: 'academic_performance',
    label: 'Academic Performance (CGPA/Marks)',
    category: 'academic',
    description: 'Cumulative Grade Point Average (CGPA/SGPA/GPA) or aggregate marks %',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'cgpa', 'sgpa', 'gpa', 'academic score', 'marks %', 'percentage',
      'aggregate %', 'academic performance', 'overall gpa', 'cumulative gpa',
      'overall marks', 'total percentage', 'aggregate marks', 'academic_percentage'
    ],
  },
  {
    key: 'attendance',
    label: 'Attendance Percentage',
    category: 'academic',
    description: 'Classroom / laboratory cumulative attendance percentage (0–100%)',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'attendance', 'attendance %', 'attendance percentage', 'att %', 'attd',
      'attnd %', 'present %', 'attendance_rate', 'total attendance', 'class attendance',
      'biometric %', 'overall attendance'
    ],
  },
  {
    key: 'assessment_completion',
    label: 'Assessment Completion',
    category: 'academic',
    description: 'Internal tests, quizzes, assignments, and continuous assessment completion %',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'assessment completion', 'assessment %', 'internal marks', 'internals',
      'midterm %', 'quiz completion', 'continuous assessment', 'assignment completion',
      'cia marks', 'internal assessment', 'mid sem marks', 'term work'
    ],
  },
  {
    key: 'lms_activity',
    label: 'LMS Activity & Portal Engagement',
    category: 'academic',
    description: 'Learning management system activity (Moodle, Canvas, Blackboard, LMS logins)',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'lms activity', 'lms score', 'lms logins', 'canvas score', 'moodle score',
      'portal activity', 'lms engagement', 'elearning participation', 'virtual lab access',
      'portal logins %', 'online module completion'
    ],
  },
  {
    key: 'academic_trend',
    label: 'Academic Trend / Semester Growth',
    category: 'academic',
    description: 'Semester-on-semester progress trajectory, SGPA delta or grade trend (0–100 normalized)',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'academic trend', 'trend %', 'sem-on-sem growth', 'sgpa delta', 'progress trajectory',
      'growth index', 'grade trajectory', 'semester trend', 'academic progression'
    ],
  },
  {
    key: 'engagement',
    label: 'Co-curricular Engagement',
    category: 'academic',
    description: 'Class participation, seminars, tech clubs, and co-curricular involvement',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'engagement', 'class participation', 'co-curricular', 'club activity',
      'engagement score', 'extracurricular', 'seminar participation', 'student engagement'
    ],
  },
  {
    key: 'technical_assessment',
    label: 'Technical Assessment',
    category: 'placement',
    description: 'Coding test, algorithmic benchmark, domain technical screening (0–100%)',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'technical assessment', 'technical score', 'coding score', 'tech test',
      'technical marks', 'dsa score', 'coding benchmark', 'hackathon score',
      'technical screening', 'programming test'
    ],
  },
  {
    key: 'aptitude',
    label: 'Aptitude & Cognitive Assessment',
    category: 'placement',
    description: 'Quantitative, logical reasoning, and analytical problem-solving score',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'aptitude', 'quant aptitude', 'quant & logical', 'aptitude %', 'reasoning score',
      'cognitive score', 'general aptitude', 'analytical score', 'aptitude test'
    ],
  },
  {
    key: 'communication',
    label: 'Communication / Interview Assessment',
    category: 'placement',
    description: 'Verbal skills, group discussion (GD), presentation, and interview articulation',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'communication', 'communication score', 'soft skills', 'verbal score',
      'interview articulation', 'gd score', 'group discussion', 'language proficiency',
      'english score', 'presentation skills'
    ],
  },
  {
    key: 'practical_skills',
    label: 'Practical Skills & Projects',
    category: 'placement',
    description: 'Capstone project, lab practicals, portfolio evaluation, and mini-projects',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'practical skills', 'projects', 'capstone marks', 'mini project',
      'lab practical', 'project score', 'hands-on assessment', 'portfolio evaluation',
      'practical marks', 'project evaluation'
    ],
  },
  {
    key: 'mock_interview',
    label: 'Mock Interview / HR Readiness',
    category: 'placement',
    description: 'Campus placement mock drive performance, HR round readiness',
    dataType: 'number',
    isRequired: false,
    minVal: 0,
    maxVal: 100,
    aliases: [
      'mock interview', 'mock drive score', 'placement mock %', 'hr round',
      'mock evaluation', 'placement interview', 'technical mock', 'mock test'
    ],
  },
];

// Helper to sanitize strings for comparison
function cleanHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[_\-\/\.\(\)\[\]\:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Analyzes a source header and sample values to suggest the best matching standard field.
 * Enforces strict ambiguity checking to avoid unsafe automatic mapping.
 */
export function suggestFieldMapping(
  sourceColumn: string,
  sampleValues: string[] = []
): FieldMapping {
  const cleaned = cleanHeader(sourceColumn);

  // Exact match to standard field key or label
  for (const field of STANDARD_FIELDS) {
    if (cleaned === cleanHeader(field.key) || cleaned === cleanHeader(field.label)) {
      return {
        sourceColumn,
        targetField: field.key,
        confidence: 'HIGH',
        reason: `Exact match with standard target field "${field.label}".`,
        isConfirmed: true,
        sampleValues: sampleValues.slice(0, 3),
      };
    }
  }

  // Exact alias match
  const candidateMatches: { field: FieldDefinition; matchedAlias: string }[] = [];

  for (const field of STANDARD_FIELDS) {
    for (const alias of field.aliases) {
      const cleanedAlias = cleanHeader(alias);
      if (cleaned === cleanedAlias) {
        candidateMatches.push({ field, matchedAlias: alias });
      }
    }
  }

  if (candidateMatches.length === 1) {
    const match = candidateMatches[0];
    return {
      sourceColumn,
      targetField: match.field.key,
      confidence: 'HIGH',
      reason: `Direct recognized institutional alias for "${match.field.label}" (matched "${match.matchedAlias}").`,
      isConfirmed: true,
      sampleValues: sampleValues.slice(0, 3),
    };
  }

  if (candidateMatches.length > 1) {
    // Ambiguous exact alias
    return {
      sourceColumn,
      targetField: candidateMatches[0].field.key,
      confidence: 'AMBIGUOUS',
      reason: `Header matches multiple potential fields (${candidateMatches.map(c => c.field.label).join(', ')}). Manual verification required.`,
      isConfirmed: false,
      sampleValues: sampleValues.slice(0, 3),
    };
  }

  // Keyword / Partial Containment Match
  const partialMatches: { field: FieldDefinition; matchedKeyword: string; score: number }[] = [];

  // Check generic terms that cause false positives
  const isGenericScore = cleaned === 'score' || cleaned === 'marks' || cleaned === 'percentage' || cleaned === 'total' || cleaned === 'result';
  if (isGenericScore) {
    return {
      sourceColumn,
      targetField: 'academic_performance',
      confidence: 'AMBIGUOUS',
      reason: `Generic header "${sourceColumn}" could represent Academic Performance, Assessment, or Placement screening. Confirmation required.`,
      isConfirmed: false,
      sampleValues: sampleValues.slice(0, 3),
    };
  }

  for (const field of STANDARD_FIELDS) {
    for (const alias of field.aliases) {
      const cleanedAlias = cleanHeader(alias);
      // Containment check
      if (cleaned.includes(cleanedAlias) || cleanedAlias.includes(cleaned)) {
        if (cleanedAlias.length >= 3) {
          const score = cleanedAlias.length / Math.max(cleaned.length, cleanedAlias.length);
          partialMatches.push({ field, matchedKeyword: alias, score });
        }
      }
    }
  }

  // Deduplicate by field key and pick highest score
  const uniqueFields = new Map<StandardFieldKey, { field: FieldDefinition; matchedKeyword: string; score: number }>();
  for (const pm of partialMatches) {
    const existing = uniqueFields.get(pm.field.key);
    if (!existing || pm.score > existing.score) {
      uniqueFields.set(pm.field.key, pm);
    }
  }

  const sortedMatches = Array.from(uniqueFields.values()).sort((a, b) => b.score - a.score);

  if (sortedMatches.length === 1 && sortedMatches[0].score >= 0.5) {
    const top = sortedMatches[0];
    return {
      sourceColumn,
      targetField: top.field.key,
      confidence: 'MEDIUM',
      reason: `Partial keyword match with "${top.field.label}" (matched pattern "${top.matchedKeyword}").`,
      isConfirmed: false,
      sampleValues: sampleValues.slice(0, 3),
    };
  }

  if (sortedMatches.length > 1) {
    const top = sortedMatches[0];
    const second = sortedMatches[1];
    if (top.score - second.score > 0.3) {
      return {
        sourceColumn,
        targetField: top.field.key,
        confidence: 'MEDIUM',
        reason: `Likely match for "${top.field.label}" based on keyword "${top.matchedKeyword}".`,
        isConfirmed: false,
        sampleValues: sampleValues.slice(0, 3),
      };
    }

    return {
      sourceColumn,
      targetField: top.field.key,
      confidence: 'AMBIGUOUS',
      reason: `Ambiguous: header could map to "${top.field.label}" or "${second.field.label}". Please specify.`,
      isConfirmed: false,
      sampleValues: sampleValues.slice(0, 3),
    };
  }

  // If column name contains "id" or "code"
  if (cleaned.includes('id') || cleaned.includes('code') || cleaned.includes('num')) {
    return {
      sourceColumn,
      targetField: 'student_id',
      confidence: 'AMBIGUOUS',
      reason: `Header indicates an identifier or code, possibly Student Identifier.`,
      isConfirmed: false,
      sampleValues: sampleValues.slice(0, 3),
    };
  }

  // Default unmapped
  return {
    sourceColumn,
    targetField: 'IGNORE',
    confidence: 'UNMAPPED',
    reason: `Unrecognized source column. Set mapping manually or leave as unimported.`,
    isConfirmed: true,
    sampleValues: sampleValues.slice(0, 3),
  };
}
