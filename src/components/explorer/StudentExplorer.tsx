import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  ChevronDown,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MatrixQuadrantId, Student } from '../../types';
import { exportToCSV } from '../../utils/csvParser';

export const StudentExplorer: React.FC = () => {
  const { students, config, openStudent360, selectedQuadrantFilter, setSelectedQuadrantFilter } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSem, setSelectedSem] = useState<string>('ALL');
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>(selectedQuadrantFilter || 'ALL');
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<string>('ALL');
  const [selectedCoverageFilter, setSelectedCoverageFilter] = useState<string>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<keyof Student | 'academicScore' | 'placementScore' | 'coverage'>('studentId');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 20;

  // Filter logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesId = s.studentId.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }

      // Department
      if (selectedDept !== 'ALL' && s.department !== selectedDept) return false;

      // Semester
      if (selectedSem !== 'ALL' && String(s.semester) !== selectedSem) return false;

      // Matrix Quadrant
      if (selectedQuadrant !== 'ALL' && s.matrixQuadrant !== selectedQuadrant) return false;

      // Flags
      if (selectedFlagFilter !== 'ALL') {
        if (selectedFlagFilter === 'ATTENDANCE' && !s.indicators.some((i) => i.type === 'ATTENDANCE_SUPPORT')) return false;
        if (selectedFlagFilter === 'ACADEMIC' && !s.indicators.some((i) => i.type === 'ACADEMIC_SUPPORT')) return false;
        if (selectedFlagFilter === 'PLACEMENT' && !s.indicators.some((i) => i.type === 'PLACEMENT_GAP')) return false;
        if (selectedFlagFilter === 'DATA_WARNING' && !s.indicators.some((i) => i.type === 'DATA_QUALITY_WARNING')) return false;
      }

      // Coverage
      if (selectedCoverageFilter !== 'ALL') {
        if (selectedCoverageFilter === 'CALCULATED' && s.scores.academicStatus !== 'CALCULATED') return false;
        if (selectedCoverageFilter === 'PROVISIONAL' && s.scores.academicStatus !== 'PROVISIONAL') return false;
        if (selectedCoverageFilter === 'INSUFFICIENT' && s.scores.academicStatus !== 'INSUFFICIENT') return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedDept, selectedSem, selectedQuadrant, selectedFlagFilter, selectedCoverageFilter]);

  // Sort logic
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let valA: any = a[sortField as keyof Student];
      let valB: any = b[sortField as keyof Student];

      if (sortField === 'academicScore') {
        valA = a.scores.academicSuccessScore;
        valB = b.scores.academicSuccessScore;
      } else if (sortField === 'placementScore') {
        valA = a.scores.placementReadinessScore;
        valB = b.scores.placementReadinessScore;
      } else if (sortField === 'coverage') {
        valA = a.scores.overallCoverage;
        valB = b.scores.overallCoverage;
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (valA < valB) return sortAsc ? -1 : 1;
      return sortAsc ? 1 : -1;
    });
  }, [filteredStudents, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedStudents.length / rowsPerPage) || 1;
  const paginatedStudents = sortedStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const toggleSort = (field: any) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportFiltered = () => {
    const exportHeaders = [
      'Student Identifier',
      'Student Name',
      'Department',
      'Semester',
      'Academic Success Score',
      'Placement Readiness Score',
      'Data Coverage %',
      'Attendance %',
      'Quadrant',
      'Recommended Action',
    ];

    const exportRows = sortedStudents.map((s) => ({
      'Student Identifier': s.studentId,
      'Student Name': s.name,
      'Department': s.department,
      'Semester': s.semester,
      'Academic Success Score': s.scores.academicSuccessScore ?? 'Insufficient Data',
      'Placement Readiness Score': s.scores.placementReadinessScore ?? 'Insufficient Data',
      'Data Coverage %': `${s.scores.overallCoverage}%`,
      'Attendance %': s.scores.attendance !== null ? `${s.scores.attendance}%` : 'Unrecorded',
      'Quadrant': s.matrixQuadrant.replace(/_/g, ' '),
      'Recommended Action': s.recommendedAction,
    }));

    exportToCSV('filtered_student_explorer_export', exportHeaders, exportRows);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDept('ALL');
    setSelectedSem('ALL');
    setSelectedQuadrant('ALL');
    setSelectedQuadrantFilter(null);
    setSelectedFlagFilter('ALL');
    setSelectedCoverageFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Search by Student Name or ${config.terminology.identifierLabel} (e.g. 22CS002)...`}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportFiltered}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Filtered ({sortedStudents.length})</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-attribute Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Department */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Departments</option>
              {config.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Semester
            </label>
            <select
              value={selectedSem}
              onChange={(e) => {
                setSelectedSem(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Semesters</option>
              {config.semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Matrix Quadrant */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Matrix Category
            </label>
            <select
              value={selectedQuadrant}
              onChange={(e) => {
                setSelectedQuadrant(e.target.value);
                setSelectedQuadrantFilter(e.target.value === 'ALL' ? null : (e.target.value as MatrixQuadrantId));
                setCurrentPage(1);
              }}
              className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Quadrants</option>
              <option value="HIGH_ACADEMIC_HIGH_PLACEMENT">Honours & Ready</option>
              <option value="HIGH_ACADEMIC_LOW_PLACEMENT">Placement Skill Gap</option>
              <option value="LOW_ACADEMIC_HIGH_PLACEMENT">Academic Support</option>
              <option value="LOW_ACADEMIC_LOW_PLACEMENT">Dual Support</option>
              <option value="INSUFFICIENT_DATA">Insufficient Data (&lt;60%)</option>
            </select>
          </div>

          {/* Support Indicator Flag */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Support Flag
            </label>
            <select
              value={selectedFlagFilter}
              onChange={(e) => {
                setSelectedFlagFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Flags</option>
              <option value="ATTENDANCE">Attendance &lt;{config.attendanceThreshold}%</option>
              <option value="ACADEMIC">Academic Score &lt;{config.academicScoreThreshold}</option>
              <option value="PLACEMENT">Placement Score &lt;{config.placementScoreThreshold}</option>
              <option value="DATA_WARNING">Data Quality Warning</option>
            </select>
          </div>

          {/* Coverage Status */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Data Coverage
            </label>
            <select
              value={selectedCoverageFilter}
              onChange={(e) => {
                setSelectedCoverageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Coverage Levels</option>
              <option value="CALCULATED">Full (≥ 80% weight)</option>
              <option value="PROVISIONAL">Provisional (60–79%)</option>
              <option value="INSUFFICIENT">Insufficient (&lt; 60%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold select-none">
              <tr>
                <th
                  onClick={() => toggleSort('studentId')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors w-28 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{config.terminology.identifierLabel}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('department')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Department</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap w-16">Sem</th>
                <th
                  onClick={() => toggleSort('academicScore')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Academic</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('placementScore')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Placement</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-right whitespace-nowrap w-20">Attd %</th>
                <th
                  onClick={() => toggleSort('coverage')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-24"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Coverage</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Support Flags</th>
                <th className="py-3 px-2 text-center w-12">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => openStudent360(student.id)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    {/* Identifier */}
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {student.studentId}
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {student.name}
                    </td>

                    {/* Department */}
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[160px]" title={student.department}>
                      {student.department}
                    </td>

                    {/* Semester */}
                    <td className="py-2.5 px-2 text-center text-slate-500 text-[11px] whitespace-nowrap">
                      {String(student.semester).replace('Semester ', 'S')}
                    </td>

                    {/* Academic Score */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {student.scores.academicSuccessScore !== null ? (
                        <span className="font-semibold text-slate-900">
                          {student.scores.academicSuccessScore}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Insufficient</span>
                      )}
                    </td>

                    {/* Placement Score */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                      {student.scores.placementReadinessScore !== null ? (
                        <span className="font-semibold text-teal-700">
                          {student.scores.placementReadinessScore}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Insufficient</span>
                      )}
                    </td>

                    {/* Attendance % */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums whitespace-nowrap text-slate-700">
                      {student.scores.attendance !== null ? (
                        <span className={student.scores.attendance < config.attendanceThreshold ? 'text-amber-600 font-semibold' : ''}>
                          {student.scores.attendance}%
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Overall Coverage */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                          student.scores.overallCoverage >= 80
                            ? 'bg-emerald-50 text-emerald-800'
                            : student.scores.overallCoverage >= 60
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {student.scores.overallCoverage}%
                      </span>
                    </td>

                    {/* Support Flags */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {student.indicators.length === 0 ? (
                          <span className="text-[11px] text-slate-400">Nominal</span>
                        ) : (
                          student.indicators.slice(0, 2).map((ind, i) => (
                            <span
                              key={i}
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate max-w-[130px] ${
                                ind.type === 'ATTENDANCE_SUPPORT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ind.type === 'PLACEMENT_GAP'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                              title={ind.evidence}
                            >
                              {ind.metricLabel}
                            </span>
                          ))
                        )}
                        {student.indicators.length > 2 && (
                          <span className="text-[10px] text-slate-500">
                            +{student.indicators.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* View Action */}
                    <td className="py-2.5 px-2 text-center text-slate-400 group-hover:text-blue-600">
                      <ExternalLink className="w-3.5 h-3.5 mx-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-mono font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
            <span className="font-mono font-medium">
              {Math.min(currentPage * rowsPerPage, sortedStudents.length)}
            </span>{' '}
            of <span className="font-mono font-medium">{sortedStudents.length}</span> students
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              Previous
            </button>
            <span className="font-mono text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
