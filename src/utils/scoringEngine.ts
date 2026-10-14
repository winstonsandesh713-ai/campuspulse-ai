import {
  GradingScaleType,
  InstitutionConfig,
  MatrixQuadrantId,
  ScoringWeights,
  StudentScores,
  SupportIndicator,
} from '../types';

export function normalizeAcademicGrade(rawVal: number | null | undefined, scale: GradingScaleType): number | null {
  if (rawVal === null || rawVal === undefined || isNaN(rawVal)) {
    return null;
  }
  if (scale === 'CGPA_10') {
    // 10-point scale: 8.5 -> 85
    const normalized = rawVal * 10;
    return Math.min(100, Math.max(0, Math.round(normalized * 10) / 10));
  }
  if (scale === 'GPA_4') {
    // 4.0 scale: 3.2 -> 80
    const normalized = rawVal * 25;
    return Math.min(100, Math.max(0, Math.round(normalized * 10) / 10));
  }
  // PERCENTAGE_100
  return Math.min(100, Math.max(0, Math.round(rawVal * 10) / 10));
}

export function computeStudentScores(
  rawComponents: {
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
  },
  weights: ScoringWeights
): StudentScores {
  // Academic components & weights
  const academicItems = [
    { val: rawComponents.academicPerformance, w: weights.academic.academicPerformance },
    { val: rawComponents.attendance, w: weights.academic.attendance },
    { val: rawComponents.assessmentCompletion, w: weights.academic.assessmentCompletion },
    { val: rawComponents.lmsActivity, w: weights.academic.lmsActivity },
    { val: rawComponents.academicTrend, w: weights.academic.academicTrend },
    { val: rawComponents.engagement, w: weights.academic.engagement },
  ];

  let validAcademicWeight = 0;
  let totalAcademicWeightedVal = 0;

  academicItems.forEach((item) => {
    if (item.val !== null && item.val !== undefined && !isNaN(item.val)) {
      validAcademicWeight += item.w;
      totalAcademicWeightedVal += item.w * item.val;
    }
  });

  const academicCoverage = Math.round(validAcademicWeight);
  let academicSuccessScore: number | null = null;
  let academicStatus: 'INSUFFICIENT' | 'PROVISIONAL' | 'CALCULATED' = 'INSUFFICIENT';

  if (academicCoverage >= 80) {
    academicSuccessScore = Math.round((totalAcademicWeightedVal / validAcademicWeight) * 10) / 10;
    academicStatus = 'CALCULATED';
  } else if (academicCoverage >= 60) {
    academicSuccessScore = Math.round((totalAcademicWeightedVal / validAcademicWeight) * 10) / 10;
    academicStatus = 'PROVISIONAL';
  } else {
    // Below 60%: Insufficient data - do not manufacture a fake score
    academicSuccessScore = null;
    academicStatus = 'INSUFFICIENT';
  }

  // Placement components & weights
  const placementItems = [
    { val: rawComponents.technicalAssessment, w: weights.placement.technicalAssessment },
    { val: rawComponents.aptitude, w: weights.placement.aptitude },
    { val: rawComponents.communication, w: weights.placement.communication },
    { val: rawComponents.practicalSkills, w: weights.placement.practicalSkills },
    { val: rawComponents.mockInterview, w: weights.placement.mockInterview },
  ];

  let validPlacementWeight = 0;
  let totalPlacementWeightedVal = 0;

  placementItems.forEach((item) => {
    if (item.val !== null && item.val !== undefined && !isNaN(item.val)) {
      validPlacementWeight += item.w;
      totalPlacementWeightedVal += item.w * item.val;
    }
  });

  const placementCoverage = Math.round(validPlacementWeight);
  let placementReadinessScore: number | null = null;
  let placementStatus: 'INSUFFICIENT' | 'PROVISIONAL' | 'CALCULATED' = 'INSUFFICIENT';

  if (placementCoverage >= 80) {
    placementReadinessScore = Math.round((totalPlacementWeightedVal / validPlacementWeight) * 10) / 10;
    placementStatus = 'CALCULATED';
  } else if (placementCoverage >= 60) {
    placementReadinessScore = Math.round((totalPlacementWeightedVal / validPlacementWeight) * 10) / 10;
    placementStatus = 'PROVISIONAL';
  } else {
    placementReadinessScore = null;
    placementStatus = 'INSUFFICIENT';
  }

  const overallCoverage = Math.round((academicCoverage + placementCoverage) / 2);

  return {
    academicPerformance: rawComponents.academicPerformance,
    attendance: rawComponents.attendance,
    assessmentCompletion: rawComponents.assessmentCompletion,
    lmsActivity: rawComponents.lmsActivity,
    academicTrend: rawComponents.academicTrend,
    engagement: rawComponents.engagement,

    technicalAssessment: rawComponents.technicalAssessment,
    aptitude: rawComponents.aptitude,
    communication: rawComponents.communication,
    practicalSkills: rawComponents.practicalSkills,
    mockInterview: rawComponents.mockInterview,

    academicSuccessScore,
    placementReadinessScore,
    academicCoverage,
    placementCoverage,
    overallCoverage,
    academicStatus,
    placementStatus,
  };
}

export function evaluateSupportIndicators(
  scores: StudentScores,
  config: InstitutionConfig
): SupportIndicator[] {
  const indicators: SupportIndicator[] = [];

  // Attendance Support Rule
  if (scores.attendance !== null) {
    if (scores.attendance < config.attendanceThreshold) {
      indicators.push({
        id: 'flag-attendance',
        type: 'ATTENDANCE_SUPPORT',
        severity: scores.attendance < config.attendanceThreshold - 10 ? 'HIGH' : 'MEDIUM',
        title: 'Attendance Support Advisory',
        evidence: `Current attendance is ${scores.attendance}%, below institutional policy threshold of ${config.attendanceThreshold}%.`,
        currentValue: `${scores.attendance}%`,
        threshold: `${config.attendanceThreshold}%`,
        metricLabel: 'Classroom Attendance',
      });
    }
  } else {
    indicators.push({
      id: 'warn-att-missing',
      type: 'DATA_QUALITY_WARNING',
      severity: 'INFO',
      title: 'Missing Attendance Record',
      evidence: 'Attendance record is unrecorded for this semester. Data coverage reduced by 20%.',
      metricLabel: 'Attendance',
    });
  }

  // Academic Support Rule
  if (scores.academicSuccessScore !== null) {
    if (scores.academicSuccessScore < config.academicScoreThreshold) {
      indicators.push({
        id: 'flag-academic',
        type: 'ACADEMIC_SUPPORT',
        severity: scores.academicSuccessScore < 40 ? 'HIGH' : 'MEDIUM',
        title: 'Academic Milestone Advisory',
        evidence: `Academic Success Score of ${scores.academicSuccessScore}/100 falls below target threshold (${config.academicScoreThreshold}/100).`,
        currentValue: `${scores.academicSuccessScore}`,
        threshold: `${config.academicScoreThreshold}`,
        metricLabel: 'Academic Success',
      });
    }
  } else if (scores.academicStatus === 'INSUFFICIENT') {
    indicators.push({
      id: 'warn-acad-insufficient',
      type: 'DATA_QUALITY_WARNING',
      severity: 'INFO',
      title: 'Insufficient Academic Records',
      evidence: `Academic data coverage is only ${scores.academicCoverage}% (< 60% minimum). Score withheld to prevent false signals.`,
      metricLabel: 'Academic Coverage',
    });
  }

  // Placement Readiness Rule
  if (scores.placementReadinessScore !== null) {
    if (scores.placementReadinessScore < config.placementScoreThreshold) {
      indicators.push({
        id: 'flag-placement',
        type: 'PLACEMENT_GAP',
        severity: scores.placementReadinessScore < 45 ? 'HIGH' : 'MEDIUM',
        title: 'Career Readiness Skill Gap',
        evidence: `Placement Readiness Score of ${scores.placementReadinessScore}/100 is below the benchmark cutoff (${config.placementScoreThreshold}/100).`,
        currentValue: `${scores.placementReadinessScore}`,
        threshold: `${config.placementScoreThreshold}`,
        metricLabel: 'Placement Readiness',
      });
    }
  } else if (scores.placementStatus === 'INSUFFICIENT') {
    indicators.push({
      id: 'warn-place-insufficient',
      type: 'DATA_QUALITY_WARNING',
      severity: 'INFO',
      title: 'Incomplete Placement Benchmark',
      evidence: `Placement data coverage is ${scores.placementCoverage}% (< 60% minimum). Awaiting assessment records.`,
      metricLabel: 'Placement Coverage',
    });
  }

  // Missing critical component warnings
  if (scores.technicalAssessment === null && scores.placementCoverage > 0) {
    indicators.push({
      id: 'warn-tech-missing',
      type: 'DATA_QUALITY_WARNING',
      severity: 'INFO',
      title: 'Technical Assessment Missing',
      evidence: 'No coding benchmark or lab exam record submitted (30% placement weight).',
      metricLabel: 'Technical Assessment',
    });
  }

  if (scores.mockInterview === null && scores.placementCoverage > 0) {
    indicators.push({
      id: 'warn-mock-missing',
      type: 'DATA_QUALITY_WARNING',
      severity: 'INFO',
      title: 'Mock Interview Unrecorded',
      evidence: 'Student has not completed a scheduled campus mock interview drive.',
      metricLabel: 'Mock Interview',
    });
  }

  return indicators;
}

export function determineMatrixQuadrant(
  scores: StudentScores,
  cutoffs: { academic: number; placement: number }
): MatrixQuadrantId {
  // If either score is insufficient, place in INSUFFICIENT_DATA
  if (
    scores.academicSuccessScore === null ||
    scores.placementReadinessScore === null ||
    scores.overallCoverage < 60
  ) {
    return 'INSUFFICIENT_DATA';
  }

  const isAcademicHigh = scores.academicSuccessScore >= cutoffs.academic;
  const isPlacementHigh = scores.placementReadinessScore >= cutoffs.placement;

  if (isAcademicHigh && isPlacementHigh) {
    return 'HIGH_ACADEMIC_HIGH_PLACEMENT';
  }
  if (isAcademicHigh && !isPlacementHigh) {
    return 'HIGH_ACADEMIC_LOW_PLACEMENT';
  }
  if (!isAcademicHigh && isPlacementHigh) {
    return 'LOW_ACADEMIC_HIGH_PLACEMENT';
  }
  return 'LOW_ACADEMIC_LOW_PLACEMENT';
}

export function generateSuggestedAction(
  quadrant: MatrixQuadrantId,
  scores: StudentScores,
  indicators: SupportIndicator[]
): string {
  if (quadrant === 'INSUFFICIENT_DATA') {
    return 'Reconcile missing records: schedule mock interview and collect attendance sheet from department.';
  }

  const hasAttendanceFlag = indicators.some((i) => i.type === 'ATTENDANCE_SUPPORT');

  if (quadrant === 'HIGH_ACADEMIC_LOW_PLACEMENT') {
    if (scores.mockInterview !== null && scores.mockInterview < 50) {
      return 'Targeted soft-skills boot camp: Schedule mock interview retake and group discussion workshop.';
    }
    if (scores.technicalAssessment !== null && scores.technicalAssessment < 55) {
      return 'Technical sprint: Assign Data Structures & Algorithms lab project with industry mentor.';
    }
    return 'Bridge career gap: Enroll in placement aptitude training and schedule peer mock interview.';
  }

  if (quadrant === 'LOW_ACADEMIC_HIGH_PLACEMENT') {
    if (hasAttendanceFlag) {
      return 'Academic remediation: Bi-weekly attendance check-in and professor office hours for low-scoring courses.';
    }
    return 'Coursework support: Pair with academic teaching assistant for midterm exam revisions.';
  }

  if (quadrant === 'LOW_ACADEMIC_LOW_PLACEMENT') {
    return 'Comprehensive intervention plan: Assign dedicated faculty mentor, peer study group, and foundational skills track.';
  }

  // HIGH_ACADEMIC_HIGH_PLACEMENT
  return 'Advanced placement cohort: Recommend for marquee/tier-1 recruitment drives and competitive hackathons.';
}
