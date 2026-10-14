import React, { useState } from 'react';
import {
  Grid2X2,
  Sliders,
  ChevronRight,
  User,
  ExternalLink,
  Info,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MatrixQuadrantId, Student } from '../../types';

export const GapMatrix: React.FC = () => {
  const { students, config, updateConfig, openStudent360, selectedQuadrantFilter, setSelectedQuadrantFilter } = useApp();

  const [academicThreshold, setAcademicThreshold] = useState<number>(config.matrixCutoff.academic);
  const [placementThreshold, setPlacementThreshold] = useState<number>(config.matrixCutoff.placement);
  const [activeSegment, setActiveSegment] = useState<MatrixQuadrantId | 'ALL'>(
    selectedQuadrantFilter || 'HIGH_ACADEMIC_LOW_PLACEMENT'
  );

  // Sync state if config changes externally (e.g. from Settings screen)
  React.useEffect(() => {
    setAcademicThreshold(config.matrixCutoff.academic);
    setPlacementThreshold(config.matrixCutoff.placement);
  }, [config.matrixCutoff.academic, config.matrixCutoff.placement]);

  // Handle immediate threshold adjustment
  const handleAcademicChange = (val: number) => {
    setAcademicThreshold(val);
    updateConfig({
      ...config,
      matrixCutoff: {
        academic: val,
        placement: placementThreshold,
      },
    });
  };

  const handlePlacementChange = (val: number) => {
    setPlacementThreshold(val);
    updateConfig({
      ...config,
      matrixCutoff: {
        academic: academicThreshold,
        placement: val,
      },
    });
  };

  // Group students by quadrant
  const quadrantCounts: Record<MatrixQuadrantId, Student[]> = {
    HIGH_ACADEMIC_HIGH_PLACEMENT: [],
    HIGH_ACADEMIC_LOW_PLACEMENT: [],
    LOW_ACADEMIC_HIGH_PLACEMENT: [],
    LOW_ACADEMIC_LOW_PLACEMENT: [],
    INSUFFICIENT_DATA: [],
  };

  students.forEach((s) => {
    quadrantCounts[s.matrixQuadrant].push(s);
  });

  const totalCount = students.length || 1;

  const filteredStudents =
    activeSegment === 'ALL'
      ? students
      : quadrantCounts[activeSegment] || [];

  return (
    <div className="space-y-6">
      {/* Matrix Controls & Threshold Settings Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Grid2X2 className="w-4 h-4 text-blue-600" />
            <span>Academic × Placement Readiness Gap Matrix</span>
          </h4>
          <p className="text-xs text-slate-500">
            Cross-domain student cohort segmentation based on calculated Academic Success vs Placement Readiness scores.
          </p>
        </div>

        {/* Dynamic Threshold Adjustment Sliders */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium whitespace-nowrap">Acad Cutoff:</span>
            <input
              type="range"
              min={50}
              max={85}
              value={academicThreshold}
              onChange={(e) => handleAcademicChange(Number(e.target.value))}
              className="w-20 accent-blue-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-slate-800 w-8">{academicThreshold}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-medium whitespace-nowrap">Placement Cutoff:</span>
            <input
              type="range"
              min={45}
              max={80}
              value={placementThreshold}
              onChange={(e) => handlePlacementChange(Number(e.target.value))}
              className="w-20 accent-teal-600 cursor-pointer"
            />
            <span className="font-mono font-bold text-slate-800 w-8">{placementThreshold}</span>
          </div>
        </div>
      </div>

      {/* 2D Interactive Visual Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quadrant 2: High Academic, Low Placement (Skills Gap - Critical Cohort) */}
        <div
          onClick={() => {
            setActiveSegment('HIGH_ACADEMIC_LOW_PLACEMENT');
            setSelectedQuadrantFilter('HIGH_ACADEMIC_LOW_PLACEMENT');
          }}
          className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative ${
            activeSegment === 'HIGH_ACADEMIC_LOW_PLACEMENT'
              ? 'border-amber-500 bg-amber-50/40 shadow-sm'
              : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase px-2 py-0.5 rounded bg-amber-100">
                Placement Skill Gap Cohort
              </span>
              <h5 className="text-sm font-semibold text-slate-900 mt-2">
                High Academic · Low Placement Readiness
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Academically strong (≥{config.matrixCutoff.academic}), but facing technical coding or soft skills barriers (&lt;{config.matrixCutoff.placement}).
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {quadrantCounts.HIGH_ACADEMIC_LOW_PLACEMENT.length}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {Math.round((quadrantCounts.HIGH_ACADEMIC_LOW_PLACEMENT.length / totalCount) * 100)}% of cohort
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-amber-900 font-medium flex items-center justify-between">
            <span>Primary Need: Mock interview drills & technical coding bootcamp</span>
            <ChevronRight className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        {/* Quadrant 1: High Academic, High Placement (Tier-1 Ready) */}
        <div
          onClick={() => {
            setActiveSegment('HIGH_ACADEMIC_HIGH_PLACEMENT');
            setSelectedQuadrantFilter('HIGH_ACADEMIC_HIGH_PLACEMENT');
          }}
          className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative ${
            activeSegment === 'HIGH_ACADEMIC_HIGH_PLACEMENT'
              ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
              : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-100">
                Placement & Honours Ready
              </span>
              <h5 className="text-sm font-semibold text-slate-900 mt-2">
                High Academic · High Placement Readiness
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Exceeding institutional standards in both coursework (≥{config.matrixCutoff.academic}) and career evaluations (≥{config.matrixCutoff.placement}).
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {quadrantCounts.HIGH_ACADEMIC_HIGH_PLACEMENT.length}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {Math.round((quadrantCounts.HIGH_ACADEMIC_HIGH_PLACEMENT.length / totalCount) * 100)}% of cohort
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-emerald-900 font-medium flex items-center justify-between">
            <span>Primary Need: Marquee recruitment opportunities & leadership tracks</span>
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Quadrant 4: Low Academic, Low Placement (Comprehensive Support) */}
        <div
          onClick={() => {
            setActiveSegment('LOW_ACADEMIC_LOW_PLACEMENT');
            setSelectedQuadrantFilter('LOW_ACADEMIC_LOW_PLACEMENT');
          }}
          className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative ${
            activeSegment === 'LOW_ACADEMIC_LOW_PLACEMENT'
              ? 'border-rose-500 bg-rose-50/40 shadow-sm'
              : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-800 tracking-wider uppercase px-2 py-0.5 rounded bg-rose-100">
                Comprehensive Support Cohort
              </span>
              <h5 className="text-sm font-semibold text-slate-900 mt-2">
                Low Academic · Low Placement Readiness
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Dual-domain advisory required (&lt;{config.matrixCutoff.academic} academic, &lt;{config.matrixCutoff.placement} placement).
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {quadrantCounts.LOW_ACADEMIC_LOW_PLACEMENT.length}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {Math.round((quadrantCounts.LOW_ACADEMIC_LOW_PLACEMENT.length / totalCount) * 100)}% of cohort
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-rose-900 font-medium flex items-center justify-between">
            <span>Primary Need: Multi-faceted faculty mentoring & remedial support</span>
            <ChevronRight className="w-4 h-4 text-rose-600" />
          </div>
        </div>

        {/* Quadrant 3: Low Academic, High Placement (Academic Support / Practical Talent) */}
        <div
          onClick={() => {
            setActiveSegment('LOW_ACADEMIC_HIGH_PLACEMENT');
            setSelectedQuadrantFilter('LOW_ACADEMIC_HIGH_PLACEMENT');
          }}
          className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative ${
            activeSegment === 'LOW_ACADEMIC_HIGH_PLACEMENT'
              ? 'border-blue-500 bg-blue-50/40 shadow-sm'
              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-800 tracking-wider uppercase px-2 py-0.5 rounded bg-blue-100">
                Academic Coursework Support
              </span>
              <h5 className="text-sm font-semibold text-slate-900 mt-2">
                Low Academic · High Placement Readiness
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                Strong hands-on technical or communication aptitude (≥{config.matrixCutoff.placement}), but low exam marks or attendance (&lt;{config.matrixCutoff.academic}).
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {quadrantCounts.LOW_ACADEMIC_HIGH_PLACEMENT.length}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {Math.round((quadrantCounts.LOW_ACADEMIC_HIGH_PLACEMENT.length / totalCount) * 100)}% of cohort
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-blue-900 font-medium flex items-center justify-between">
            <span>Primary Need: Attendance monitoring & subject-specific tutoring</span>
            <ChevronRight className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Incomplete / Insufficient Data Strip */}
      <div
        onClick={() => {
          setActiveSegment('INSUFFICIENT_DATA');
          setSelectedQuadrantFilter('INSUFFICIENT_DATA');
        }}
        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
          activeSegment === 'INSUFFICIENT_DATA'
            ? 'border-slate-800 bg-slate-900 text-white'
            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-200 text-slate-700">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold">
              Incomplete Record Reconciliation Cohort
            </div>
            <div className={`text-[11px] ${activeSegment === 'INSUFFICIENT_DATA' ? 'text-slate-300' : 'text-slate-500'}`}>
              Students with &lt;60% component coverage where scores are withheld to avoid false failure signals.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-lg font-bold font-mono tabular-nums">
              {quadrantCounts.INSUFFICIENT_DATA.length}
            </span>
            <span className={`text-xs ml-1 ${activeSegment === 'INSUFFICIENT_DATA' ? 'text-slate-400' : 'text-slate-500'}`}>
              ({Math.round((quadrantCounts.INSUFFICIENT_DATA.length / totalCount) * 100)}%)
            </span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Drill-Down Students Table for Active Segment */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Filtered Student Cohort ({filteredStudents.length} Students)
            </h4>
            <p className="text-xs text-slate-500">
              Click any student row to inspect granular component breakdown and record intervention notes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSegment('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeSegment === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Show All ({students.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Roll No / ID</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Academic Score</th>
                <th className="py-2.5 px-3 text-right">Placement Score</th>
                <th className="py-2.5 px-3 text-center">Data Coverage</th>
                <th className="py-2.5 px-4">Recommended Next Step</th>
                <th className="py-2.5 px-3 text-center w-20">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.slice(0, 15).map((student) => (
                <tr
                  key={student.id}
                  onClick={() => openStudent360(student.id)}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                    {student.studentId}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    {student.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {student.department}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {student.scores.academicSuccessScore !== null ? student.scores.academicSuccessScore : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-teal-700">
                    {student.scores.placementReadinessScore !== null ? student.scores.placementReadinessScore : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600">
                    {student.scores.overallCoverage}%
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 truncate max-w-xs">
                    {student.recommendedAction}
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-600 font-medium">
                    <ExternalLink className="w-3.5 h-3.5 mx-auto text-slate-400 hover:text-blue-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length > 15 && (
          <div className="text-center text-xs text-slate-500 py-1">
            Showing top 15 of {filteredStudents.length} records. Use Student Explorer for full search and multi-filtering.
          </div>
        )}
      </div>
    </div>
  );
};
