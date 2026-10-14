import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { InstitutionOverview } from './components/overview/InstitutionOverview';
import { StudentExplorer } from './components/explorer/StudentExplorer';
import { GapMatrix } from './components/matrix/GapMatrix';
import { AdaptiveImportWizard } from './components/import/AdaptiveImportWizard';
import { DataQualityCenter } from './components/quality/DataQualityCenter';
import { InterventionTracker } from './components/interventions/InterventionTracker';
import { InstitutionSettings } from './components/settings/InstitutionSettings';
import { Student360Modal } from './components/profile/Student360Modal';

const AppContent: React.FC = () => {
  const { activeScreen } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeScreen === 'overview' && <InstitutionOverview />}
          {activeScreen === 'explorer' && <StudentExplorer />}
          {activeScreen === 'matrix' && <GapMatrix />}
          {activeScreen === 'import' && <AdaptiveImportWizard />}
          {activeScreen === 'quality' && <DataQualityCenter />}
          {activeScreen === 'interventions' && <InterventionTracker />}
          {activeScreen === 'settings' && <InstitutionSettings />}
        </main>

        {/* Global Student 360 Modal */}
        <Student360Modal />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
