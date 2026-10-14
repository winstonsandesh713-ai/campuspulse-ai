import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  UserCheck,
  Plus,
  Clock,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InterventionLog, Student } from '../../types';
import { STANDARD_FIELDS } from '../../utils/columnMatcher';

export const Student360Modal: React.FC = () => {
  const {
    activeStudentId,
    closeStudent360,
    students,
    config,
    interventions,
    addOrUpdateIntervention,
    updateStudentMentor,
  } = useApp();

  const [newNoteText, setNewNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<InterventionLog['status']>('IN_PROGRESS');
  const [selectedReviewDate, setSelectedReviewDate] = useState('2026-11-15');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  if (!activeStudentId) return null;

  const student = students.find((s) => s.id === activeStudentId || s.studentId === activeStudentId);
  if (!student) return null;

  // Find existing intervention for this student if any
  const existingIntervention = interventions.find(
    (int) => int.studentRollNo === student.studentId || int.studentId === student.id
  );

  const academicComponents = [
    { key: 'academicPerformance', label: 'Academic Performance (CGPA / Marks)', val: student.scores.academicPerformance, weight: config.weights.academic.academicPerformance },
    { key: 'attendance', label: 'Attendance Percentage', val: student.scores.attendance, weight: config.weights.academic.attendance, unit: '%' },
    { key: 'assessmentCompletion', label: 'Assessment / CIA Completion', val: student.scores.assessmentCompletion, weight: config.weights.academic.assessmentCompletion, unit: '%' },
    { key: 'lmsActivity', label: 'LMS Activity & Portal Logins', val: student.scores.lmsActivity, weight: config.weights.academic.lmsActivity, unit: '%' },
    { key: 'academicTrend', label: 'Academic Trend / Sem-on-Sem Growth', val: student.scores.academicTrend, weight: config.weights.academic.academicTrend },
    { key: 'engagement', label: 'Co-curricular Engagement', val: student.scores.engagement, weight: config.weights.academic.engagement, unit: '%' },
  ];

  const placementComponents = [
    { key: 'technicalAssessment', label: 'Technical / Coding Assessment', val: student.scores.technicalAssessment, weight: config.weights.placement.technicalAssessment, unit: '%' },
    { key: 'aptitude', label: 'Aptitude & Cognitive Score', val: student.scores.aptitude, weight: config.weights.placement.aptitude, unit: '%' },
    { key: 'communication', label: 'Communication & Verbal Articulation', val: student.scores.communication, weight: config.weights.placement.communication, unit: '%' },
    { key: 'practicalSkills', label: 'Practical Skills & Capstone Projects', val: student.scores.practicalSkills, weight: config.weights.placement.practicalSkills, unit: '%' },
    { key: 'mockInterview', label: 'Mock Interview / HR Readiness', val: student.scores.mockInterview, weight: config.weights.placement.mockInterview, unit: '%' },
  ];

  const handleSaveIntervention = (e: React.FormEvent) => {
    e.preventDefault();

    const mentorToAssign = selectedMentor || student.assignedMentor || 'Lead Faculty Advisor';
    updateStudentMentor(student.id, mentorToAssign);

    const log: InterventionLog = {
      id: existingIntervention ? existingIntervention.id : `int-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentRollNo: student.studentId,
      department: student.department,
      actionTitle: student.recommendedAction,
      category: student.matrixQuadrant.includes('PLACEMENT') ? 'PLACEMENT' : 'ACADEMIC',
      status: selectedStatus,
      assignedMentor: mentorToAssign,
      targetMetric: student.indicators[0]?.metricLabel || 'Composite Success Score',
      baselineValue: student.indicators[0]?.currentValue ? String(student.indicators[0].currentValue) : 'Baseline logged',
      currentValue: existingIntervention?.currentValue || 'Monitoring progress',
      reviewDate: selectedReviewDate,
      createdDate: existingIntervention?.createdDate || new Date().toISOString().split('T')[0],
      notes: existingIntervention?.notes ? [...existingIntervention.notes] : [],
    };

    if (newNoteText.trim()) {
      log.notes.push({
        id: `note-${Date.now()}`,
        author: mentorToAssign.split('(')[0].trim() || 'Advisor Staff',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        content: newNoteText.trim(),
      });
      setNewNoteText('');
    }

    addOrUpdateIntervention(log);
    setSaveSuccessMessage('Intervention plan and advisor assignment saved successfully.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const getQuadrantLabel = (q: string) => {
    switch (q) {
      case 'HIGH_ACADEMIC_HIGH_PLACEMENT':
        return 'Honours & Tier-1 Ready (High Acad · High Placement)';
      case 'HIGH_ACADEMIC_LOW_PLACEMENT':
        return 'Placement Skill Gap (High Acad · Low Placement)';
      case 'LOW_ACADEMIC_HIGH_PLACEMENT':
        return 'Academic Support Needed (Low Acad · High Placement)';
      case 'LOW_ACADEMIC_LOW_PLACEMENT':
        return 'Comprehensive Support Needed (Low Acad · Low Placement)';
      default:
        return 'Incomplete Records / Coverage Warning';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in duration-150">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-semibold text-sm">
              {student.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white leading-tight">
                  {student.name}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {student.studentId}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{student.department}</span>
                <span aria-hidden="true">·</span>
                <span>{student.semester}</span>
                {student.rawCGPA !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">CGPA: {student.rawCGPA.toFixed(2)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={closeStudent360}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Scorecards: Academic & Placement Composites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic Success Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Academic Success Score</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    student.scores.academicStatus === 'CALCULATED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : student.scores.academicStatus === 'PROVISIONAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {student.scores.academicStatus === 'CALCULATED'
                    ? 'Calculated'
                    : student.scores.academicStatus === 'PROVISIONAL'
                    ? 'Provisional'
                    : 'Insufficient Data'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                    {student.scores.academicSuccessScore !== null
                      ? student.scores.academicSuccessScore
                      : '—'}
                    <span className="text-sm font-normal text-slate-500"> / 100</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Coverage: <span className="font-mono font-medium">{student.scores.academicCoverage}%</span> of total weight
                  </div>
                </div>

                <div className="w-24 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${student.scores.academicSuccessScore || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Placement Readiness Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-teal-600" />
                  <span>Placement Readiness Score</span>
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    student.scores.placementStatus === 'CALCULATED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : student.scores.placementStatus === 'PROVISIONAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {student.scores.placementStatus === 'CALCULATED'
                    ? 'Calculated'
                    : student.scores.placementStatus === 'PROVISIONAL'
                    ? 'Provisional'
                    : 'Insufficient Data'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                    {student.scores.placementReadinessScore !== null
                      ? student.scores.placementReadinessScore
                      : '—'}
                    <span className="text-sm font-normal text-slate-500"> / 100</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Coverage: <span className="font-mono font-medium">{student.scores.placementCoverage}%</span> of total weight
                  </div>
                </div>

                <div className="w-24 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full"
                    style={{ width: `${student.scores.placementReadinessScore || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quadrant Classification */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-blue-950">Matrix Category: </span>
              <span className="text-blue-900 font-medium">
                {getQuadrantLabel(student.matrixQuadrant)}
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Assigned Advisor: <span className="font-medium text-slate-800">{student.assignedMentor || 'Unassigned'}</span>
            </div>
          </div>

          {/* Active Support Indicators & Evidence */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Support Indicators & Evidence ({student.indicators.length})
            </h4>

            {student.indicators.length === 0 ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All indicators meet or exceed institutional target benchmarks. No active support flags.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {student.indicators.map((ind) => (
                  <div
                    key={ind.id}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      ind.severity === 'HIGH'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : ind.severity === 'MEDIUM'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        ind.severity === 'HIGH'
                          ? 'text-rose-600'
                          : ind.severity === 'MEDIUM'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-semibold flex items-center justify-between">
                        <span>{ind.title}</span>
                        {ind.currentValue && ind.threshold && (
                          <span className="font-mono text-[11px] font-normal">
                            Observed: {ind.currentValue} · Target: {ind.threshold}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600 mt-0.5">{ind.evidence}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-[11px] text-slate-500 italic">
              Notice: Support indicators represent informational advising flags derived from current records, not deterministic outcomes.
            </div>
          </div>

          {/* Transparent Scoring Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Granular Component Breakdown & Formula Weights
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Metric Component</th>
                    <th className="py-2.5 px-3 w-28 text-right">Raw Recorded</th>
                    <th className="py-2.5 px-3 w-28 text-right">Normalized (0-100)</th>
                    <th className="py-2.5 px-3 w-24 text-right">Weight</th>
                    <th className="py-2.5 px-3 w-28 text-center">Data Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-slate-50/70 font-semibold text-slate-800 text-[11px]">
                    <td colSpan={5} className="py-1 px-3">ACADEMIC SUCCESS COMPONENTS (100% Total Weight)</td>
                  </tr>
                  {academicComponents.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-800">{item.label}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {item.val !== null ? `${item.val}${item.unit || ''}` : <span className="text-slate-400 italic">Unrecorded</span>}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900 font-medium">
                        {item.val !== null ? item.val : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{item.weight}%</td>
                      <td className="py-2 px-3 text-center">
                        {item.val !== null ? (
                          <span className="text-emerald-700 text-[11px] font-medium">Valid</span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Missing</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-50/70 font-semibold text-slate-800 text-[11px]">
                    <td colSpan={5} className="py-1 px-3">PLACEMENT READINESS COMPONENTS (100% Total Weight)</td>
                  </tr>
                  {placementComponents.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-800">{item.label}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                        {item.val !== null ? `${item.val}${item.unit || ''}` : <span className="text-slate-400 italic">Unrecorded</span>}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900 font-medium">
                        {item.val !== null ? item.val : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{item.weight}%</td>
                      <td className="py-2 px-3 text-center">
                        {item.val !== null ? (
                          <span className="text-emerald-700 text-[11px] font-medium">Valid</span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Missing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advisor Action Plan & Intervention Workflow */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recommended Next Action & Advisory Tracker</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  "{student.recommendedAction}"
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveIntervention} className="space-y-4 pt-2 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Assign Faculty Advisor / Mentor
                  </label>
                  <select
                    value={selectedMentor || student.assignedMentor || ''}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Dr. Priya Sharma (CSE Lead Advisor)">Dr. Priya Sharma (CSE Advisor)</option>
                    <option value="Prof. Arvind Narayanan (Career Services)">Prof. Arvind Narayanan (Career Head)</option>
                    <option value="Dr. Kavitha Rajan (ECE Academic Head)">Dr. Kavitha Rajan (ECE Head)</option>
                    <option value="Prof. Rajesh Kumar (Mech Coordinator)">Prof. Rajesh Kumar (Mech Coord)</option>
                    <option value="Dr. Sneha Kulkarni (Placement Trainer)">Dr. Sneha Kulkarni (Trainer)</option>
                    <option value="Prof. Arun Mehta (Student Success Dean)">Prof. Arun Mehta (Dean)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Intervention Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PROPOSED">Proposed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ESCALATED">Escalated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Next Review Date
                  </label>
                  <input
                    type="date"
                    value={selectedReviewDate}
                    onChange={(e) => setSelectedReviewDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Follow-up Note Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Add Advisory Session Observation / Follow-Up Note
                </label>
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record discussion outcomes, parent interactions, remedial lab attendance..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Recorded Notes History */}
              {existingIntervention && existingIntervention.notes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700">Advisory Timeline History:</div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {existingIntervention.notes.map((note) => (
                      <div key={note.id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span className="font-medium text-slate-800">{note.author}</span>
                          <span className="font-mono">{note.timestamp}</span>
                        </div>
                        <div className="text-slate-700">{note.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before-and-after tracking box */}
              {existingIntervention && existingIntervention.currentValue && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-blue-950">Observational Before / After Record:</div>
                  <div className="flex items-center gap-4 text-slate-700">
                    <div>
                      Baseline: <span className="font-mono font-medium">{existingIntervention.baselineValue}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    <div>
                      Current: <span className="font-mono font-medium text-blue-900">{existingIntervention.currentValue}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 italic mt-1">
                    Causality Disclaimer: Changes reflect recorded observational metric updates over time and do not imply direct statistical causation.
                  </div>
                </div>
              )}

              {saveSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Save Advisor Plan & Record Note
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Record ID: <span className="font-mono">{student.id}</span> · Last Updated: {student.lastUpdated}
          </div>
          <button
            onClick={closeStudent360}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
