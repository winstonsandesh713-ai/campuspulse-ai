import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Trash2,
  HelpCircle,
  Layers,
  School,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GradingScaleType, InstitutionConfig } from '../../types';
import { PersistenceDisclaimer } from '../common/PersistenceDisclaimer';

export const InstitutionSettings: React.FC = () => {
  const { config, updateConfig, resetDemoData, savedProfiles, deleteMappingProfile } = useApp();

  const [formConfig, setFormConfig] = useState<InstitutionConfig>(config);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [newDeptInput, setNewDeptInput] = useState<string>('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Weight sums
  const acadSum =
    formConfig.weights.academic.academicPerformance +
    formConfig.weights.academic.attendance +
    formConfig.weights.academic.assessmentCompletion +
    formConfig.weights.academic.lmsActivity +
    formConfig.weights.academic.academicTrend +
    formConfig.weights.academic.engagement;

  const placeSum =
    formConfig.weights.placement.technicalAssessment +
    formConfig.weights.placement.aptitude +
    formConfig.weights.placement.communication +
    formConfig.weights.placement.practicalSkills +
    formConfig.weights.placement.mockInterview;

  const isWeightValid = acadSum === 100 && placeSum === 100;

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    setWeightError(null);
    if (!isWeightValid) {
      setWeightError(`Component weights must sum exactly to 100%. Currently: Academic (${acadSum}%), Placement (${placeSum}%).`);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmApplyConfig = () => {
    updateConfig(formConfig);
    setShowConfirmModal(false);
    setSaveFeedback('Settings successfully applied! All student success and placement readiness scores dynamically recomputed.');
    setTimeout(() => setSaveFeedback(null), 5000);
  };

  const confirmResetDefaults = () => {
    resetDemoData();
    setShowResetConfirmModal(false);
    setFormConfig(config);
    setSaveFeedback('Institutional settings and student cohort reset to defaults.');
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleAddDept = () => {
    if (!newDeptInput.trim()) return;
    if (!formConfig.departments.includes(newDeptInput.trim())) {
      setFormConfig({
        ...formConfig,
        departments: [...formConfig.departments, newDeptInput.trim()],
      });
      setNewDeptInput('');
    }
  };

  const handleRemoveDept = (dept: string) => {
    setFormConfig({
      ...formConfig,
      departments: formConfig.departments.filter((d) => d !== dept),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Institutional Adaptation Settings & Scoring Methodology</span>
          </h4>
          <p className="text-xs text-slate-500">
            Tailor CampusPulse to match your university's grading scale, threshold policies, and KPI formulas without code modifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <PersistenceDisclaimer />

      {saveFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{saveFeedback}</span>
        </div>
      )}

      {weightError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{weightError}</span>
        </div>
      )}

      <form onSubmit={handleSaveClick} className="space-y-6">
        {/* Section 1: Institution Profile & Terminology */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            1. Institutional Identity & Terminology
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Institution Name
              </label>
              <input
                type="text"
                value={formConfig.institutionName}
                onChange={(e) => setFormConfig({ ...formConfig, institutionName: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary Student Identifier Convention
              </label>
              <input
                type="text"
                value={formConfig.terminology.identifierLabel}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    terminology: { ...formConfig.terminology, identifierLabel: e.target.value },
                    identifierName: e.target.value,
                  })
                }
                placeholder="e.g. Roll No, USN, Register No, Student ID"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department Label
              </label>
              <input
                type="text"
                value={formConfig.terminology.departmentLabel}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    terminology: { ...formConfig.terminology, departmentLabel: e.target.value },
                  })
                }
                placeholder="e.g. Department, Branch, School, Stream"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Semester / Academic Term Label
              </label>
              <input
                type="text"
                value={formConfig.terminology.semesterLabel}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    terminology: { ...formConfig.terminology, semesterLabel: e.target.value },
                  })
                }
                placeholder="e.g. Semester, Term, Year"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Departments Catalog */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              2. Academic Departments ({formConfig.departments.length})
            </h4>
          </div>

          <div className="flex flex-wrap gap-2">
            {formConfig.departments.map((dept, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-800 border border-slate-200"
              >
                <span>{dept}</span>
                {formConfig.departments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDept(dept)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-md pt-2">
            <input
              type="text"
              value={newDeptInput}
              onChange={(e) => setNewDeptInput(e.target.value)}
              placeholder="Add another department/branch..."
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 flex-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddDept}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* Section 3: Grading Scale & Normalization Formula */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            3. Grading Scale & Documented Normalization Methodology
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'CGPA_10', label: '10-Point Scale (CGPA)', formula: 'Normalized Score = CGPA × 10 (0.00 – 10.00 → 0 – 100)' },
              { id: 'GPA_4', label: '4.0 Scale (GPA)', formula: 'Normalized Score = GPA × 25 (0.00 – 4.00 → 0 – 100)' },
              { id: 'PERCENTAGE_100', label: 'Percentage (0–100%)', formula: 'Normalized Score = Percentage (Direct 0 – 100 mapping)' },
            ].map((scale) => (
              <label
                key={scale.id}
                className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-between transition-colors ${
                  formConfig.gradingScale === scale.id
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="grading-scale"
                    value={scale.id}
                    checked={formConfig.gradingScale === scale.id}
                    onChange={() =>
                      setFormConfig({
                        ...formConfig,
                        gradingScale: scale.id as GradingScaleType,
                        gradeNormalizationFormula: scale.formula,
                      })
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-900">{scale.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-mono">{scale.formula}</p>
              </label>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono">
            Active Normalization Formula: {formConfig.gradeNormalizationFormula}
          </div>
        </div>

        {/* Section 4: Policy Thresholds */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            4. Support Indicator Advisory Thresholds
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Attendance Policy Warning Threshold
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={formConfig.attendanceThreshold}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, attendanceThreshold: Number(e.target.value) })
                  }
                  className="w-24 text-xs font-mono px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
                <span className="text-xs text-slate-500">% attendance</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Default 75% standard university mandate</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Academic Support Advisory Cutoff
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={35}
                  max={75}
                  value={formConfig.academicScoreThreshold}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, academicScoreThreshold: Number(e.target.value) })
                  }
                  className="w-24 text-xs font-mono px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
                <span className="text-xs text-slate-500">/ 100 score</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Scores below this trigger coursework advisory</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Placement Readiness Benchmark Cutoff
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={35}
                  max={75}
                  value={formConfig.placementScoreThreshold}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, placementScoreThreshold: Number(e.target.value) })
                  }
                  className="w-24 text-xs font-mono px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
                <span className="text-xs text-slate-500">/ 100 score</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Scores below this trigger career readiness flag</p>
            </div>
          </div>
        </div>

        {/* Section 5: Configurable KPI Component Weights */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              5. Composite Score Component Weights (Must Total 100%)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Academic Weights */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Academic Success Score Weights</span>
                <span
                  className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                    acadSum === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Sum: {acadSum}%
                </span>
              </div>

              {[
                { key: 'academicPerformance', label: 'Academic Performance (CGPA / Marks)', val: formConfig.weights.academic.academicPerformance },
                { key: 'attendance', label: 'Attendance Percentage', val: formConfig.weights.academic.attendance },
                { key: 'assessmentCompletion', label: 'Assessment / CIA Completion', val: formConfig.weights.academic.assessmentCompletion },
                { key: 'lmsActivity', label: 'LMS Activity & Portal Logins', val: formConfig.weights.academic.lmsActivity },
                { key: 'academicTrend', label: 'Academic Trend / Sem Growth', val: formConfig.weights.academic.academicTrend },
                { key: 'engagement', label: 'Co-curricular Engagement', val: formConfig.weights.academic.engagement },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.val}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          weights: {
                            ...formConfig.weights,
                            academic: {
                              ...formConfig.weights.academic,
                              [item.key]: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-16 text-right font-mono px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900"
                    />
                    <span className="text-slate-400 w-3">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Placement Weights */}
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Placement Readiness Score Weights</span>
                <span
                  className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                    placeSum === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Sum: {placeSum}%
                </span>
              </div>

              {[
                { key: 'technicalAssessment', label: 'Technical Assessment / Coding', val: formConfig.weights.placement.technicalAssessment },
                { key: 'aptitude', label: 'Aptitude & Cognitive Score', val: formConfig.weights.placement.aptitude },
                { key: 'communication', label: 'Communication & Verbal Articulation', val: formConfig.weights.placement.communication },
                { key: 'practicalSkills', label: 'Practical Skills & Capstone', val: formConfig.weights.placement.practicalSkills },
                { key: 'mockInterview', label: 'Mock Interview / HR Readiness', val: formConfig.weights.placement.mockInterview },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.val}
                      onChange={(e) =>
                        setFormConfig({
                          ...formConfig,
                          weights: {
                            ...formConfig.weights,
                            placement: {
                              ...formConfig.weights.placement,
                              [item.key]: Number(e.target.value),
                            },
                          },
                        })
                      }
                      className="w-16 text-right font-mono px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900"
                    />
                    <span className="text-slate-400 w-3">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 6: Saved Mapping Profiles Manager */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            6. Saved Institutional Mapping Profiles ({savedProfiles.length})
          </h4>
          <p className="text-xs text-slate-500">
            Approved column mapping profiles stored locally for your institution.
          </p>

          <div className="space-y-2">
            {savedProfiles.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {p.institutionFormat} · {Object.keys(p.mappings).length} column mappings · Updated {p.updatedAt}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMappingProfile(p.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={!isWeightValid}
            className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Changes & Recompute All Scores</span>
          </button>
        </div>
      </form>

      {/* Confirmation Dialog Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Confirm Scoring Model Recalculation
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Changing weights, grading formulas, or thresholds will recompute scores for all active students.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
              <div>• Institutional Name: {formConfig.institutionName}</div>
              <div>• Scale: {formConfig.gradingScale}</div>
              <div>• Attendance Cutoff: {formConfig.attendanceThreshold}%</div>
              <div>• Academic Weights Sum: {acadSum}% · Placement Weights Sum: {placeSum}%</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmApplyConfig}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Yes, Recompute Scores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Reset Demo Data & Settings?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will restore the original 300 fictional students, default scoring weights, and preset mapping profiles.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              Any custom CSV imports or modified thresholds saved in this browser session will be reset to default.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetDefaults}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
