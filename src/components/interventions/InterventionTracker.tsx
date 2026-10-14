import React, { useState } from 'react';
import {
  ClipboardList,
  UserCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Plus,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InterventionLog } from '../../types';

export const InterventionTracker: React.FC = () => {
  const { interventions, openStudent360, config } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredInterventions = interventions.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>Advisory Interventions & Follow-up Tracker</span>
          </h4>
          <p className="text-xs text-slate-500">
            Monitor faculty mentor assignments, remedial action plans, scheduled reviews, and observational progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            {['ALL', 'IN_PROGRESS', 'SCHEDULED', 'PROPOSED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Observational Notice */}
      <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
        <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">Advisory Tracking Principle: </span>
          <span>
            Logged baseline and current metrics reflect recorded observational assessments over time.
            CampusPulse records timeline updates without claiming algorithmic causation.
          </span>
        </div>
      </div>

      {/* Interventions Table / List */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-3 px-4">Student & ID</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-4">Advisory Action Plan</th>
                <th className="py-3 px-3">Assigned Mentor</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Baseline vs Current Observation</th>
                <th className="py-3 px-3">Review Date</th>
                <th className="py-3 px-3 text-center">360 View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInterventions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No interventions found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredInterventions.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openStudent360(item.studentId)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.studentName}</div>
                      <div className="font-mono text-[11px] text-slate-500 mt-0.5">{item.studentRollNo}</div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                      {item.department}
                    </td>

                    {/* Action Plan */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{item.actionTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Category: <span className="font-semibold">{item.category}</span>
                      </div>
                    </td>

                    {/* Mentor */}
                    <td className="py-3 px-3 text-slate-700">
                      {item.assignedMentor.split('(')[0].trim()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'SCHEDULED'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Baseline vs Current */}
                    <td className="py-3 px-4 text-xs font-mono">
                      <div className="text-slate-600 text-[11px]">
                        Base: <span className="font-medium text-slate-800">{item.baselineValue}</span>
                      </div>
                      {item.currentValue && (
                        <div className="text-blue-700 text-[11px] mt-0.5">
                          Now: <span className="font-medium">{item.currentValue}</span>
                        </div>
                      )}
                    </td>

                    {/* Review Date */}
                    <td className="py-3 px-3 font-mono text-slate-700 text-[11px] whitespace-nowrap">
                      {item.reviewDate}
                    </td>

                    {/* Inspect Link */}
                    <td className="py-3 px-3 text-center text-blue-600">
                      <ExternalLink className="w-3.5 h-3.5 mx-auto text-slate-400 hover:text-blue-600" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
