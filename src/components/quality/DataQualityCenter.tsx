import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Database,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { STANDARD_FIELDS } from '../../utils/columnMatcher';

export const DataQualityCenter: React.FC = () => {
  const { students, config, setActiveScreen, openStudent360 } = useApp();

  const totalStudents = students.length || 1;

  // Component completeness analysis across all 11 metrics
  const metricCompleteness = [
    { key: 'academicPerformance', label: 'Academic Performance (CGPA/Marks)', category: 'Academic' },
    { key: 'attendance', label: 'Attendance Percentage', category: 'Academic' },
    { key: 'assessmentCompletion', label: 'Assessment / CIA Marks', category: 'Academic' },
    { key: 'lmsActivity', label: 'LMS Activity & Portal Logins', category: 'Academic' },
    { key: 'academicTrend', label: 'Academic Trend / SGPA Delta', category: 'Academic' },
    { key: 'engagement', label: 'Co-curricular Engagement', category: 'Academic' },
    { key: 'technicalAssessment', label: 'Technical / Coding Score', category: 'Placement' },
    { key: 'aptitude', label: 'Aptitude & Cognitive Score', category: 'Placement' },
    { key: 'communication', label: 'Communication & Verbal Score', category: 'Placement' },
    { key: 'practicalSkills', label: 'Practical Skills & Capstone', category: 'Placement' },
    { key: 'mockInterview', label: 'Mock Interview / HR Score', category: 'Placement' },
  ].map((m) => {
    let recordedCount = 0;
    students.forEach((s) => {
      const val = (s.scores as any)[m.key];
      if (val !== null && val !== undefined) {
        recordedCount++;
      }
    });
    const completenessPct = Math.round((recordedCount / totalStudents) * 100);
    const missingCount = totalStudents - recordedCount;
    return {
      ...m,
      recordedCount,
      missingCount,
      completenessPct,
    };
  });

  // Coverage distribution counts
  const fullCoverageCount = students.filter((s) => s.scores.overallCoverage >= 80).length;
  const provisionalCoverageCount = students.filter(
    (s) => s.scores.overallCoverage >= 60 && s.scores.overallCoverage < 80
  ).length;
  const insufficientCoverageCount = students.filter((s) => s.scores.overallCoverage < 60).length;

  // Department-level coverage ranking
  const deptCoverage = config.departments.map((dept) => {
    const deptStudents = students.filter((s) => s.department === dept);
    const count = deptStudents.length || 1;
    const avgCov = Math.round(
      deptStudents.reduce((sum, s) => sum + s.scores.overallCoverage, 0) / count
    );
    const missingAnyCritical = deptStudents.filter(
      (s) => s.scores.attendance === null || s.scores.academicPerformance === null
    ).length;
    return {
      department: dept,
      studentCount: deptStudents.length,
      avgCoverage: avgCov,
      missingCriticalCount: missingAnyCritical,
    };
  });

  // Students with data quality warnings
  const studentsWithWarnings = students.filter((s) =>
    s.indicators.some((i) => i.type === 'DATA_QUALITY_WARNING')
  );

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Institutional Data Quality & Coverage Center</span>
          </h4>
          <p className="text-xs text-slate-500">
            Audit schema completeness, detect missing metric submissions, and ensure scores reflect verified empirical data.
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('import')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Upload Remedial Dataset</span>
        </button>
      </div>

      {/* Coverage Tier Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
            <span>High Coverage (≥ 80% Weight)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-950 mt-2">
            {fullCoverageCount}
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            {Math.round((fullCoverageCount / totalStudents) * 100)}% of cohort · Calculated Score active
          </div>
        </div>

        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>Provisional Coverage (60–79%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-950 mt-2">
            {provisionalCoverageCount}
          </div>
          <div className="text-xs text-amber-700 mt-1">
            {Math.round((provisionalCoverageCount / totalStudents) * 100)}% of cohort · Provisional advisory badge
          </div>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold">
            <span>Insufficient Records (&lt; 60%)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-950 mt-2">
            {insufficientCoverageCount}
          </div>
          <div className="text-xs text-rose-700 mt-1">
            {Math.round((insufficientCoverageCount / totalStudents) * 100)}% of cohort · Score withheld to avoid bias
          </div>
        </div>
      </div>

      {/* Metric-by-Metric Completeness Analysis */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Component Completeness & Missing Fields Frequency
          </h4>
          <p className="text-xs text-slate-500">
            Detailed audit across institutional metrics. Never converting missing records to zeroes preserves integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {metricCompleteness.map((m, i) => (
            <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between font-medium text-slate-800">
                <span className="truncate max-w-[200px]">{m.label}</span>
                <span className="font-mono tabular-nums text-slate-900 font-semibold">
                  {m.completenessPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full ${
                    m.completenessPct >= 85
                      ? 'bg-emerald-500'
                      : m.completenessPct >= 65
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${m.completenessPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{m.recordedCount} populated</span>
                <span>{m.missingCount} missing</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department-level Coverage Comparison */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">
          Departmental Data Ingestion Health
        </h4>
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-3 text-right">Cohort Size</th>
                <th className="py-2.5 px-3 text-right">Avg Coverage</th>
                <th className="py-2.5 px-3 text-right">Missing Attendance / CGPA</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {deptCoverage.map((d, i) => (
                <tr key={i} className="hover:bg-slate-50/60 font-sans">
                  <td className="py-2.5 px-4 font-medium text-slate-900">{d.department}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">{d.studentCount}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">{d.avgCoverage}%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">{d.missingCriticalCount}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        d.avgCoverage >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.avgCoverage >= 80 ? 'Healthy' : 'Needs Ingestion'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Students Requiring Record Reconciliation */}
      {studentsWithWarnings.length > 0 && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Students Flagged for Record Reconciliation ({studentsWithWarnings.length})
              </h4>
              <p className="text-xs text-slate-500">
                Records flagged with data quality warnings. Click any student to review missing fields.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-64">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Roll No</th>
                  <th className="py-2 px-4">Student Name</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3 text-center">Coverage</th>
                  <th className="py-2 px-4">Flagged Warning</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsWithWarnings.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{s.studentId}</td>
                    <td className="py-2 px-4 font-medium text-slate-800">{s.name}</td>
                    <td className="py-2 px-3 text-slate-600">{s.department}</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-700">
                      {s.scores.overallCoverage}%
                    </td>
                    <td className="py-2 px-4 text-slate-600">
                      {s.indicators.find((i) => i.type === 'DATA_QUALITY_WARNING')?.evidence || 'Incomplete fields'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => openStudent360(s.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
