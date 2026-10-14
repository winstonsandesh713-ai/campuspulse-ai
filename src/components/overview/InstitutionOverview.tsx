import React from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Database,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const InstitutionOverview: React.FC = () => {
  const { students, config, setActiveScreen, setSelectedQuadrantFilter, openStudent360, interventions } = useApp();

  const totalStudents = students.length || 1;

  // Compute calculated averages ignoring nulls (missing records aren't zeroes!)
  let validAcademicCount = 0;
  let totalAcademicSum = 0;
  let validPlacementCount = 0;
  let totalPlacementSum = 0;
  let attendanceSupportCount = 0;
  let placementGapCount = 0;
  let totalCoverageSum = 0;

  students.forEach((s) => {
    if (s.scores.academicSuccessScore !== null) {
      validAcademicCount++;
      totalAcademicSum += s.scores.academicSuccessScore;
    }
    if (s.scores.placementReadinessScore !== null) {
      validPlacementCount++;
      totalPlacementSum += s.scores.placementReadinessScore;
    }
    if (s.indicators.some((ind) => ind.type === 'ATTENDANCE_SUPPORT')) {
      attendanceSupportCount++;
    }
    if (s.matrixQuadrant === 'HIGH_ACADEMIC_LOW_PLACEMENT' || s.indicators.some((ind) => ind.type === 'PLACEMENT_GAP')) {
      placementGapCount++;
    }
    totalCoverageSum += s.scores.overallCoverage;
  });

  const avgAcademicScore = validAcademicCount > 0 ? (totalAcademicSum / validAcademicCount).toFixed(1) : '—';
  const avgPlacementScore = validPlacementCount > 0 ? (totalPlacementSum / validPlacementCount).toFixed(1) : '—';
  const avgCohortCoverage = Math.round(totalCoverageSum / totalStudents);

  // Departmental breakdown
  const deptStats = config.departments.map((dept) => {
    const deptStudents = students.filter((s) => s.department === dept);
    const count = deptStudents.length || 1;

    let acadSum = 0;
    let acadCount = 0;
    let placeSum = 0;
    let placeCount = 0;
    let flagCount = 0;
    let covSum = 0;

    deptStudents.forEach((s) => {
      if (s.scores.academicSuccessScore !== null) {
        acadSum += s.scores.academicSuccessScore;
        acadCount++;
      }
      if (s.scores.placementReadinessScore !== null) {
        placeSum += s.scores.placementReadinessScore;
        placeCount++;
      }
      if (s.indicators.some((i) => i.severity === 'HIGH' || i.type === 'ATTENDANCE_SUPPORT')) {
        flagCount++;
      }
      covSum += s.scores.overallCoverage;
    });

    return {
      department: dept,
      studentCount: deptStudents.length,
      avgAcademic: acadCount > 0 ? (acadSum / acadCount).toFixed(1) : '—',
      avgPlacement: placeCount > 0 ? (placeSum / placeCount).toFixed(1) : '—',
      atRiskCount: flagCount,
      avgCoverage: Math.round(covSum / count),
    };
  });

  // Quadrant breakdown
  const quadrantBreakdown = {
    HIGH_ACADEMIC_HIGH_PLACEMENT: students.filter((s) => s.matrixQuadrant === 'HIGH_ACADEMIC_HIGH_PLACEMENT').length,
    HIGH_ACADEMIC_LOW_PLACEMENT: students.filter((s) => s.matrixQuadrant === 'HIGH_ACADEMIC_LOW_PLACEMENT').length,
    LOW_ACADEMIC_HIGH_PLACEMENT: students.filter((s) => s.matrixQuadrant === 'LOW_ACADEMIC_HIGH_PLACEMENT').length,
    LOW_ACADEMIC_LOW_PLACEMENT: students.filter((s) => s.matrixQuadrant === 'LOW_ACADEMIC_LOW_PLACEMENT').length,
    INSUFFICIENT_DATA: students.filter((s) => s.matrixQuadrant === 'INSUFFICIENT_DATA').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Value Proposition Card */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CampusPulse Institutional Intelligence</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {config.institutionName}
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Live cohort analytics calculated directly from your native institutional files. Missing records are
            tracked proportionally without distorting student success baselines.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveScreen('import')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import New Sheet</span>
          </button>
          <button
            onClick={() => setActiveScreen('matrix')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <span>Gap Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top Core KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Total Students */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {students.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across {config.departments.length} departments</div>
        </div>

        {/* Avg Academic Success */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Avg Academic Score</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {avgAcademicScore}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {validAcademicCount} records valid
          </div>
        </div>

        {/* Avg Placement Readiness */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Avg Placement Score</span>
            <Briefcase className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-teal-700 mt-2">
            {avgPlacementScore}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {validPlacementCount} records valid
          </div>
        </div>

        {/* Attendance Support Flags */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Attendance Advisories</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-2">
            {attendanceSupportCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Below {config.attendanceThreshold}% policy threshold
          </div>
        </div>

        {/* Placement Skill Gaps */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Placement Skill Gaps</span>
            <TrendingUp className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 mt-2">
            {placementGapCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            High Acad · Low Placement
          </div>
        </div>

        {/* Data Coverage */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Cohort Coverage</span>
            <Database className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {avgCohortCoverage}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Proportional valid weights
          </div>
        </div>
      </div>

      {/* Mid Section: Quadrant Snapshot & Interventions Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quadrant Snapshot (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Academic × Placement Cohort Distribution
              </h4>
              <p className="text-xs text-slate-500">
                Categorization based on current benchmark thresholds (Academic: {config.matrixCutoff.academic}, Placement: {config.matrixCutoff.placement}).
              </p>
            </div>
            <button
              onClick={() => setActiveScreen('matrix')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Full Matrix View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div
              onClick={() => {
                setSelectedQuadrantFilter('HIGH_ACADEMIC_HIGH_PLACEMENT');
                setActiveScreen('matrix');
              }}
              className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100/70 transition-colors"
            >
              <div className="text-[11px] font-semibold text-emerald-800">Honours & Ready</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-900 mt-1">
                {quadrantBreakdown.HIGH_ACADEMIC_HIGH_PLACEMENT}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                {Math.round((quadrantBreakdown.HIGH_ACADEMIC_HIGH_PLACEMENT / totalStudents) * 100)}% of cohort
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedQuadrantFilter('HIGH_ACADEMIC_LOW_PLACEMENT');
                setActiveScreen('matrix');
              }}
              className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100/70 transition-colors"
            >
              <div className="text-[11px] font-semibold text-amber-800">Placement Skill Gap</div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-900 mt-1">
                {quadrantBreakdown.HIGH_ACADEMIC_LOW_PLACEMENT}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                {Math.round((quadrantBreakdown.HIGH_ACADEMIC_LOW_PLACEMENT / totalStudents) * 100)}% of cohort
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedQuadrantFilter('LOW_ACADEMIC_HIGH_PLACEMENT');
                setActiveScreen('matrix');
              }}
              className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100/70 transition-colors"
            >
              <div className="text-[11px] font-semibold text-blue-800">Academic Support</div>
              <div className="text-xl font-bold font-mono tabular-nums text-blue-900 mt-1">
                {quadrantBreakdown.LOW_ACADEMIC_HIGH_PLACEMENT}
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5">
                {Math.round((quadrantBreakdown.LOW_ACADEMIC_HIGH_PLACEMENT / totalStudents) * 100)}% of cohort
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedQuadrantFilter('LOW_ACADEMIC_LOW_PLACEMENT');
                setActiveScreen('matrix');
              }}
              className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg cursor-pointer hover:bg-rose-100/70 transition-colors"
            >
              <div className="text-[11px] font-semibold text-rose-800">Dual Support</div>
              <div className="text-xl font-bold font-mono tabular-nums text-rose-900 mt-1">
                {quadrantBreakdown.LOW_ACADEMIC_LOW_PLACEMENT}
              </div>
              <div className="text-[10px] text-rose-700 mt-0.5">
                {Math.round((quadrantBreakdown.LOW_ACADEMIC_LOW_PLACEMENT / totalStudents) * 100)}% of cohort
              </div>
            </div>
          </div>
        </div>

        {/* Active Interventions Summary (1 col) */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span>Intervention Tracker</span>
              </h4>
              <button
                onClick={() => setActiveScreen('interventions')}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                View Tracker
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Staff advisor assignments and observational progress notes.
            </p>

            <div className="mt-4 space-y-2.5">
              {interventions.slice(0, 3).map((item) => (
                <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 truncate max-w-[140px]">{item.studentName}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 truncate">{item.actionTitle}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Mentor: {item.assignedMentor.split('(')[0]}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveScreen('interventions')}
            className="w-full mt-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
          >
            Manage All Active Interventions ({interventions.length})
          </button>
        </div>
      </div>

      {/* Department Comparisons Table */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Departmental Success & Readiness Comparison
            </h4>
            <p className="text-xs text-slate-500">
              Compare academic baseline, placement indicators, and data coverage across academic disciplines.
            </p>
          </div>
          <button
            onClick={() => setActiveScreen('explorer')}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Explore All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Department / Program</th>
                <th className="py-2.5 px-3 text-right">Cohort Size</th>
                <th className="py-2.5 px-3 text-right">Avg Academic Score</th>
                <th className="py-2.5 px-3 text-right">Avg Placement Score</th>
                <th className="py-2.5 px-3 text-right">Attendance Advisories</th>
                <th className="py-2.5 px-3 text-right">Data Coverage</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptStats.map((dept, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-medium text-slate-900">
                    {dept.department}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                    {dept.studentCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {dept.avgAcademic}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-teal-700">
                    {dept.avgPlacement}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-600 font-medium">
                    {dept.atRiskCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    {dept.avgCoverage}%
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => setActiveScreen('explorer')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Filter Students
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
