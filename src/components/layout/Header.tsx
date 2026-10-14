import React from 'react';
import { Menu, FileSpreadsheet, Download, RefreshCw } from 'lucide-react';
import { ScreenType, useApp } from '../../context/AppContext';
import { exportToCSV } from '../../utils/csvParser';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const SCREEN_TITLES: Record<ScreenType, { title: string; subtitle: string }> = {
  overview: {
    title: 'Institution Overview',
    subtitle: 'Institutional KPIs, Success Metrics & At-Risk Summary',
  },
  explorer: {
    title: 'Student Explorer',
    subtitle: 'Granular Student Records, Component Weights & Support Flags',
  },
  matrix: {
    title: 'Academic × Placement Gap Matrix',
    subtitle: 'Cross-Domain Student Readiness Quadrants & Interventions',
  },
  import: {
    title: 'Adaptive Data Integration Wizard',
    subtitle: 'Import Native ERP/SIS Spreadsheets Without Column Renaming',
  },
  quality: {
    title: 'Data Quality & Coverage Center',
    subtitle: 'Completeness Audit, Missing Field Analysis & Reconciliation',
  },
  interventions: {
    title: 'Student Intervention Tracker',
    subtitle: 'Advisory Assignments, Action Plans & Progress Observations',
  },
  settings: {
    title: 'Institutional Adaptation Settings',
    subtitle: 'Grading Scales, Normalization Rules, Terminology & KPI Weights',
  },
};

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { activeScreen, setActiveScreen, config, students } = useApp();
  const screenInfo = SCREEN_TITLES[activeScreen] || SCREEN_TITLES.overview;

  const handleExportAll = () => {
    const exportHeaders = [
      'Student Identifier',
      'Full Name',
      'Department',
      'Semester',
      'Academic Success Score',
      'Academic Coverage %',
      'Placement Readiness Score',
      'Placement Coverage %',
      'Matrix Quadrant',
      'Attendance %',
      'Support Indicators Count',
      'Recommended Action',
    ];

    const exportRows = students.map((s) => ({
      'Student Identifier': s.studentId,
      'Full Name': s.name,
      'Department': s.department,
      'Semester': s.semester,
      'Academic Success Score': s.scores.academicSuccessScore ?? 'Insufficient Data',
      'Academic Coverage %': `${s.scores.academicCoverage}%`,
      'Placement Readiness Score': s.scores.placementReadinessScore ?? 'Insufficient Data',
      'Placement Coverage %': `${s.scores.placementCoverage}%`,
      'Matrix Quadrant': s.matrixQuadrant?.replace(/_/g, ' ') ?? 'Unclassified',
      'Attendance %': s.scores.attendance !== null ? `${s.scores.attendance}%` : 'Unrecorded',
      'Support Indicators Count': s.indicators?.length ?? 0,
      'Recommended Action': s.recommendedAction,
    }));

    exportToCSV(`campuspulse_${(config.institutionName || 'institution').toLowerCase().replace(/\s+/g, '_')}_export`, exportHeaders, exportRows);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-4 lg:px-8 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Breadcrumb Trail & Brand Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 lg:hidden rounded-md hover:bg-slate-100"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700 truncate max-w-[200px]">{config.institutionName}</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-500 truncate">{screenInfo.title}</span>
          </div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight leading-tight truncate">
            {screenInfo.title}
          </h2>
        </div>
      </div>

      {/* Zone 2: Unboxed Informational Metadata (No Pills) */}
      <div className="hidden xl:flex items-center gap-3 text-xs text-slate-500">
        <span className="font-mono tabular-nums">{students.length} students</span>
        <span aria-hidden="true">·</span>
        <span>{(config.departments || []).length} departments</span>
        <span aria-hidden="true">·</span>
        <span>Scale: {(config.gradingScale || 'CGPA_10').replace('_', ' ')}</span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={handleExportAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
          title="Export current cohort to CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        <button
          onClick={() => setActiveScreen('import')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shadow-sm ${
            activeScreen === 'import'
              ? 'bg-teal-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Import Client Data</span>
        </button>
      </div>
    </header>
  );
};
