import React, { useState } from 'react';
import { Info, X, ShieldAlert } from 'lucide-react';

export const PersistenceDisclaimer: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-900/5 border border-slate-200 text-xs text-slate-600 rounded-md">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Demo persistence is browser-local. Institutional editions connect to campus SIS/PostgreSQL.</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss disclaimer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-lg text-xs text-slate-700">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">Prototype Persistence & Security Notice: </span>
          <span>
            Demonstration imports and configuration changes are maintained within this browser's local sandbox storage.
            This environment does not constitute a multi-tenant institutional database. Production deployments utilize secure
            on-premise or cloud relational storage (PostgreSQL) with role-based access control and FERPA compliance.
          </span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-0.5"
        aria-label="Dismiss disclaimer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
