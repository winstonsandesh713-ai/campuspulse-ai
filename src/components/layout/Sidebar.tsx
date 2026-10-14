import React from 'react';
import {
  LayoutDashboard,
  Users,
  Grid2X2,
  FileSpreadsheet,
  CheckCircle2,
  ClipboardList,
  Sliders,
  RotateCcw,
  Sparkles,
  School,
  Database,
} from 'lucide-react';
import { ScreenType, useApp } from '../../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeScreen, setActiveScreen, students, resetDemoData, config } = useApp();

  const navItems: Array<{ id: ScreenType; label: string; icon: React.FC<{ className?: string }>; badge?: string }> = [
    { id: 'overview', label: 'Institution Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'Student Explorer', icon: Users },
    { id: 'matrix', label: 'Academic × Placement Matrix', icon: Grid2X2 },
    { id: 'import', label: 'Adaptive Data Import', icon: FileSpreadsheet, badge: 'Core' },
    { id: 'quality', label: 'Data Quality Center', icon: CheckCircle2 },
    { id: 'interventions', label: 'Intervention Tracker', icon: ClipboardList },
    { id: 'settings', label: 'Settings & Methodology', icon: Sliders },
  ];

  // Calculate quick average coverage
  const avgCoverage = Math.round(
    students.reduce((acc, s) => acc + s.scores.overallCoverage, 0) / (students.length || 1)
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <School className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">
              CampusPulse AI
            </h1>
            <p className="text-[11px] text-slate-400">Adaptive Student Success</p>
          </div>
        </div>

        {/* Core Product Principle Banner */}
        <div className="mt-3.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
          <div className="flex items-center gap-1.5 font-medium text-teal-400 mb-1">
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>Product Promise</span>
          </div>
          <p className="text-slate-300 italic">
            "Keep your existing systems. CampusPulse adapts to your data and workflows, with minimal setup and manual effort."
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveScreen(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-teal-950 text-teal-300 border border-teal-800/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Institution Info & State Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90 space-y-2.5">
        <div className="px-2 py-1.5 rounded-md bg-slate-900 border border-slate-800/80 text-[11px]">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="truncate max-w-[130px] font-medium text-slate-200" title={config.institutionName}>
              {config.institutionName}
            </span>
            <span className="font-mono tabular-nums text-slate-300">{students.length} students</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-teal-400" />
              <span>Data Coverage</span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-teal-300">{avgCoverage}%</span>
          </div>
        </div>

        <ResetDemoButton onReset={resetDemoData} />
      </div>
    </aside>
  );
};

const ResetDemoButton: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const [confirming, setConfirming] = React.useState(false);

  React.useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  if (confirming) {
    return (
      <button
        onClick={() => {
          onReset();
          setConfirming(false);
        }}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-rose-700 hover:bg-rose-800 border border-rose-600 rounded-md transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Confirm Reset All Data?</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
      title="Reset to original 300 fictional students and default mappings"
    >
      <RotateCcw className="w-3 h-3 text-slate-400" />
      <span>Reset Demo Data</span>
    </button>
  );
};
