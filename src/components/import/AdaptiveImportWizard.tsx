import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Download,
  Save,
  Layers,
  Sparkles,
  Info,
  Check,
  Eye,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ConfidenceLevel,
  FieldMapping,
  MappingProfile,
  RowValidationError,
  StandardFieldKey,
  Student,
  ValidationSummary,
} from '../../types';
import { parseCSV, exportToCSV } from '../../utils/csvParser';
import { STANDARD_FIELDS, suggestFieldMapping } from '../../utils/columnMatcher';
import {
  computeStudentScores,
  determineMatrixQuadrant,
  evaluateSupportIndicators,
  generateSuggestedAction,
  normalizeAcademicGrade,
} from '../../utils/scoringEngine';
import {
  SAMPLE_CSV_ANNA_UNIV,
  SAMPLE_CSV_MESSY_ERP,
  SAMPLE_CSV_US_BANNER,
} from '../../data/syntheticStudents';
import { PersistenceDisclaimer } from '../common/PersistenceDisclaimer';

type WizardStep = 'upload' | 'mapping' | 'validation' | 'complete';

export const AdaptiveImportWizard: React.FC = () => {
  const {
    config,
    savedProfiles,
    saveMappingProfile,
    importValidatedStudents,
    setActiveScreen,
  } = useApp();

  const [step, setStep] = useState<WizardStep>('upload');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [profileName, setProfileName] = useState<string>('');
  const [saveProfileChecked, setSaveProfileChecked] = useState<boolean>(true);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [validatedStudents, setValidatedStudents] = useState<Student[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [previewRowCount, setPreviewRowCount] = useState<number>(5);
  const [hasAmbiguityUnconfirmed, setHasAmbiguityUnconfirmed] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Handle file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setMappingError(null);
    setApplyError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setRawText(content);
        processRawData(content, file.name);
      } catch (err: any) {
        setUploadError(`Failed to process CSV file: ${err?.message || 'Invalid or unreadable file format.'}`);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file from disk. Please ensure the file is an accessible text CSV.');
    };
    reader.readAsText(file);
  };

  // 1-Click Load Sample Dataset
  const handleLoadSample = (sampleType: 'anna' | 'us' | 'messy') => {
    let content = '';
    let name = '';
    if (sampleType === 'anna') {
      content = SAMPLE_CSV_ANNA_UNIV;
      name = 'Anna_University_Affiliated_ERP.csv';
    } else if (sampleType === 'us') {
      content = SAMPLE_CSV_US_BANNER;
      name = 'US_Banner_Canvas_Export.csv';
    } else {
      content = SAMPLE_CSV_MESSY_ERP;
      name = 'Legacy_Polytechnic_Workbook.csv';
    }

    setFileName(name);
    setRawText(content);
    processRawData(content, name);
  };

  // Download Sample CSV
  const handleDownloadSample = (sampleType: 'anna' | 'us' | 'messy') => {
    let content = '';
    let name = '';
    if (sampleType === 'anna') {
      content = SAMPLE_CSV_ANNA_UNIV;
      name = 'sample_anna_university_erp.csv';
    } else if (sampleType === 'us') {
      content = SAMPLE_CSV_US_BANNER;
      name = 'sample_us_higher_ed_banner.csv';
    } else {
      content = SAMPLE_CSV_MESSY_ERP;
      name = 'sample_legacy_polytechnic.csv';
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Process raw text and generate adaptive mappings
  const processRawData = (content: string, name: string) => {
    setUploadError(null);
    setMappingError(null);
    setApplyError(null);

    if (!content || !content.trim()) {
      setUploadError('The selected file is empty (0 bytes). Please select a valid CSV with headers and student data.');
      return;
    }

    const parsed = parseCSV(content);

    if (parsed.headers.length === 0) {
      setUploadError('No valid column headers found. The first line of the CSV must contain column names (e.g. Roll No, Name, CGPA).');
      return;
    }

    if (parsed.rows.length === 0) {
      setUploadError('The CSV file contains column headers but zero student data rows (empty dataset). Please provide a CSV with records.');
      return;
    }

    setRawHeaders(parsed.headers);
    setRawRows(parsed.rows);

    // Default profile name
    const cleanName = name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setProfileName(`${cleanName} Schema Profile`);

    // Check if an existing profile matches this file's headers
    const matchingProfile = savedProfiles.find((profile) => {
      const profileCols = Object.keys(profile.mappings);
      const matchCount = parsed.headers.filter((h) => profileCols.includes(h)).length;
      return matchCount >= Math.min(3, parsed.headers.length);
    });

    if (matchingProfile) {
      setSelectedProfileId(matchingProfile.id);
    }

    // Generate adaptive mappings for each source column
    const initialMappings: FieldMapping[] = parsed.headers.map((col) => {
      const sampleVals = parsed.rows
        .map((r) => r[col])
        .filter((v) => v && v.trim().length > 0)
        .slice(0, 3);

      // If matching saved profile exists and has this column mapped
      if (matchingProfile && matchingProfile.mappings[col]) {
        const target = matchingProfile.mappings[col];
        return {
          sourceColumn: col,
          targetField: target,
          confidence: 'HIGH',
          reason: `Loaded from approved saved profile "${matchingProfile.name}".`,
          isConfirmed: true,
          sampleValues: sampleVals,
        };
      }

      return suggestFieldMapping(col, sampleVals);
    });

    setMappings(initialMappings);
    checkAmbiguities(initialMappings);
    setStep('mapping');
  };

  // Apply a selected saved profile manually
  const handleApplyProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    const prof = savedProfiles.find((p) => p.id === profileId);
    if (!prof) return;

    setMappings((prev) =>
      prev.map((m) => {
        if (prof.mappings[m.sourceColumn]) {
          return {
            ...m,
            targetField: prof.mappings[m.sourceColumn],
            confidence: 'HIGH',
            reason: `Applied from profile "${prof.name}".`,
            isConfirmed: true,
          };
        }
        return m;
      })
    );
  };

  // Update target mapping for a specific column
  const handleUpdateMapping = (sourceColumn: string, newTarget: StandardFieldKey | 'IGNORE') => {
    setMappings((prev) => {
      const next = prev.map((m) => {
        if (m.sourceColumn === sourceColumn) {
          const targetDef = STANDARD_FIELDS.find((f) => f.key === newTarget);
          return {
            ...m,
            targetField: newTarget,
            confidence: 'HIGH' as ConfidenceLevel,
            reason: newTarget === 'IGNORE'
              ? 'Column set to be excluded from import by user.'
              : `User manually assigned to standard field "${targetDef?.label}".`,
            isConfirmed: true,
          };
        }
        return m;
      });
      checkAmbiguities(next);
      return next;
    });
  };

  // Confirm ambiguity for a column
  const handleConfirmMapping = (sourceColumn: string) => {
    setMappings((prev) => {
      const next = prev.map((m) =>
        m.sourceColumn === sourceColumn ? { ...m, isConfirmed: true } : m
      );
      checkAmbiguities(next);
      return next;
    });
  };

  const checkAmbiguities = (mappingList: FieldMapping[]) => {
    const unconfirmed = mappingList.some(
      (m) => m.confidence === 'AMBIGUOUS' && !m.isConfirmed
    );
    setHasAmbiguityUnconfirmed(unconfirmed);
  };

  // Step 2 -> Step 3: Run Validation Diagnostics
  const handleProceedToValidation = () => {
    setMappingError(null);
    setApplyError(null);

    // Ensure student_id is mapped
    const idMapping = mappings.find((m) => m.targetField === 'student_id');
    if (!idMapping) {
      setMappingError('Validation Requirement: A source column must be mapped to "Student Identifier" before continuing.');
      return;
    }

    const errors: RowValidationError[] = [];
    const parsedStudents: Student[] = [];
    const seenIdentifiers = new Set<string>();
    let duplicateCount = 0;
    let errorRowCount = 0;
    let warningRowCount = 0;

    // Create lookup: targetField -> sourceColumn
    const targetToSource: Record<string, string> = {};
    mappings.forEach((m) => {
      if (m.targetField !== 'IGNORE') {
        targetToSource[m.targetField] = m.sourceColumn;
      }
    });

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // header is row 1
      let hasError = false;
      let hasWarning = false;

      // 1. Check Student ID
      const rawId = row[targetToSource['student_id'] || '']?.trim();
      if (!rawId) {
        errors.push({
          rowNumber: rowNum,
          column: targetToSource['student_id'] || 'Student ID',
          severity: 'ERROR',
          message: 'Missing student identifier. Record cannot be indexed.',
        });
        hasError = true;
      } else if (seenIdentifiers.has(rawId)) {
        errors.push({
          rowNumber: rowNum,
          identifier: rawId,
          column: targetToSource['student_id'] || 'Student ID',
          severity: 'ERROR',
          message: `Duplicate student identifier "${rawId}" detected in source file.`,
          rawVal: rawId,
        });
        duplicateCount++;
        hasError = true;
      } else {
        seenIdentifiers.add(rawId);
      }

      // 2. Check Name
      const rawName = row[targetToSource['name'] || '']?.trim();
      const studentName = rawName || `Student ${rawId || rowNum}`;

      // 3. Check Department
      const rawDept = row[targetToSource['department'] || '']?.trim();
      const department = rawDept || config.departments[0] || 'General Engineering';

      // 4. Check Semester
      const rawSem = row[targetToSource['semester'] || '']?.trim();
      const semester = rawSem || config.semesters[0] || 'Semester 3';

      // Parse numerical components
      const parseNum = (fieldKey: StandardFieldKey): number | null => {
        const col = targetToSource[fieldKey];
        if (!col) return null;
        const valStr = row[col]?.trim();
        if (!valStr || valStr === '-' || valStr.toLowerCase() === 'na' || valStr.toLowerCase() === 'null') {
          return null;
        }

        // Clean out % signs or extra text
        const cleanVal = valStr.replace(/%/g, '').trim();
        const num = parseFloat(cleanVal);
        if (isNaN(num)) {
          errors.push({
            rowNumber: rowNum,
            identifier: rawId,
            column: col,
            severity: 'WARNING',
            message: `Non-numeric value "${valStr}" in metric field. Value left unrecorded rather than defaulting to zero.`,
            rawVal: valStr,
          });
          hasWarning = true;
          return null;
        }

        // Standard percentage metrics (0–100%)
        const percentageMetrics: StandardFieldKey[] = [
          'attendance',
          'assessment_completion',
          'lms_activity',
          'academic_trend',
          'engagement',
          'technical_assessment',
          'aptitude',
          'communication',
          'practical_skills',
          'mock_interview',
        ];

        if (percentageMetrics.includes(fieldKey) && (num < 0 || num > 100)) {
          errors.push({
            rowNumber: rowNum,
            identifier: rawId,
            column: col,
            severity: 'WARNING',
            message: `Metric value ${num} is outside expected 0–100 percentage range. Clamped to valid boundary.`,
            rawVal: valStr,
          });
          hasWarning = true;
          return Math.max(0, Math.min(100, num));
        }

        // Academic performance range check based on active institutional grading scale
        if (fieldKey === 'academic_performance') {
          if (config.gradingScale === 'CGPA_10' && (num < 0 || num > 10)) {
            errors.push({
              rowNumber: rowNum,
              identifier: rawId,
              column: col,
              severity: 'WARNING',
              message: `CGPA mark ${num} is outside expected 0.0–10.0 scale. Clamped to valid boundary.`,
              rawVal: valStr,
            });
            hasWarning = true;
            return Math.max(0, Math.min(10, num));
          } else if (config.gradingScale === 'GPA_4' && (num < 0 || num > 4)) {
            errors.push({
              rowNumber: rowNum,
              identifier: rawId,
              column: col,
              severity: 'WARNING',
              message: `GPA mark ${num} is outside expected 0.0–4.0 scale. Clamped to valid boundary.`,
              rawVal: valStr,
            });
            hasWarning = true;
            return Math.max(0, Math.min(4, num));
          } else if (config.gradingScale === 'PERCENTAGE_100' && (num < 0 || num > 100)) {
            errors.push({
              rowNumber: rowNum,
              identifier: rawId,
              column: col,
              severity: 'WARNING',
              message: `Academic percentage ${num}% is outside 0–100% scale. Clamped to valid boundary.`,
              rawVal: valStr,
            });
            hasWarning = true;
            return Math.max(0, Math.min(100, num));
          }
        }

        return num;
      };

      const rawAcadGrade = parseNum('academic_performance');
      const normalizedAcad = normalizeAcademicGrade(rawAcadGrade, config.gradingScale);

      const rawComponents = {
        academicPerformance: normalizedAcad,
        attendance: parseNum('attendance'),
        assessmentCompletion: parseNum('assessment_completion'),
        lmsActivity: parseNum('lms_activity'),
        academicTrend: parseNum('academic_trend'),
        engagement: parseNum('engagement'),

        technicalAssessment: parseNum('technical_assessment'),
        aptitude: parseNum('aptitude'),
        communication: parseNum('communication'),
        practicalSkills: parseNum('practical_skills'),
        mockInterview: parseNum('mock_interview'),
      };

      if (hasError) {
        errorRowCount++;
      } else {
        if (hasWarning) warningRowCount++;

        const scores = computeStudentScores(rawComponents, config.weights);
        const indicators = evaluateSupportIndicators(scores, config);
        const matrixQuadrant = determineMatrixQuadrant(scores, config.matrixCutoff);
        const recommendedAction = generateSuggestedAction(matrixQuadrant, scores, indicators);

        parsedStudents.push({
          id: `imported-${rawId}-${Date.now()}`,
          studentId: rawId,
          name: studentName,
          department,
          semester,
          rawCGPA: rawAcadGrade !== null ? rawAcadGrade : undefined,
          scores,
          indicators,
          matrixQuadrant,
          recommendedAction,
          assignedMentor: 'Unassigned Advisor',
          lastUpdated: new Date().toISOString().split('T')[0],
        });
      }
    });

    const summary: ValidationSummary = {
      totalRows: rawRows.length,
      validRows: parsedStudents.length,
      warningRows: warningRowCount,
      errorRows: errorRowCount,
      duplicateRows: duplicateCount,
      unmatchedRows: 0,
      errors,
    };

    setValidationSummary(summary);
    setValidatedStudents(parsedStudents);
    setStep('validation');
  };

  // Step 3 -> Complete: Apply Import
  const handleApplyImport = () => {
    setApplyError(null);

    if (validatedStudents.length === 0) {
      setApplyError('Cannot apply import: No valid student records found. Please resolve error diagnostics before proceeding.');
      return;
    }

    // Save profile if checked
    if (saveProfileChecked && profileName.trim()) {
      const mappingDict: Record<string, StandardFieldKey | 'IGNORE'> = {};
      mappings.forEach((m) => {
        mappingDict[m.sourceColumn] = m.targetField;
      });

      const newProfile: MappingProfile = {
        id: selectedProfileId || `profile-${Date.now()}`,
        name: profileName.trim(),
        description: `Import profile generated on ${new Date().toLocaleDateString()} for ${fileName || 'client spreadsheet'}`,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        institutionFormat: 'Custom Client Import',
        mappings: mappingDict,
      };

      saveMappingProfile(newProfile);
    }

    importValidatedStudents(validatedStudents, importMode);
    setStep('complete');
  };

  return (
    <div className="space-y-6">
      {/* Principle Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptive Data Integration Architecture</span>
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Zero-Reformatting Client File Ingestion
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl">
              Institutions use diverse schemas — Roll No vs USN, CGPA vs Percentage, CIA marks vs Midterms.
              CampusPulse dynamically learns your column conventions, validates ranges, handles missing components safely,
              and remembers institutional mapping profiles.
            </p>
          </div>
          <div className="shrink-0">
            <PersistenceDisclaimer compact />
          </div>
        </div>
      </div>

      {/* Wizard Step Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
        <div className="flex items-center gap-1 sm:gap-4">
          <button
            onClick={() => step !== 'upload' && setStep('upload')}
            className={`flex items-center gap-1.5 font-medium transition-colors ${
              step === 'upload' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-slate-100 text-slate-700">1</span>
            <span>Upload File</span>
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => rawHeaders.length > 0 && setStep('mapping')}
            disabled={rawHeaders.length === 0}
            className={`flex items-center gap-1.5 font-medium transition-colors ${
              step === 'mapping' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900 disabled:opacity-40'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-slate-100 text-slate-700">2</span>
            <span>Adaptive Column Mapping</span>
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => validationSummary !== null && setStep('validation')}
            disabled={validationSummary === null}
            className={`flex items-center gap-1.5 font-medium transition-colors ${
              step === 'validation' ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-900 disabled:opacity-40'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-slate-100 text-slate-700">3</span>
            <span>Validation & Quality Check</span>
          </button>
          <span className="text-slate-300">/</span>
          <span
            className={`flex items-center gap-1.5 font-medium ${
              step === 'complete' ? 'text-teal-600 font-semibold' : 'text-slate-400'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-slate-100 text-slate-700">4</span>
            <span>Complete</span>
          </span>
        </div>

        {rawRows.length > 0 && (
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            {fileName} · {rawRows.length} rows detected
          </div>
        )}
      </div>

      {/* STEP 1: UPLOAD & SAMPLE DATASET SELECTION */}
      {step === 'upload' && (
        <div className="space-y-6">
          {uploadError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-rose-950">CSV Ingestion Issue: </span>
                  <span>{uploadError}</span>
                </div>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="text-rose-400 hover:text-rose-700 p-0.5"
                aria-label="Dismiss error"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Custom File Upload Box */}
            <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  Upload Institutional Spreadsheet (.CSV)
                </h4>
                <p className="text-xs text-slate-500 mb-5">
                  Select your college's raw student marks, attendance, or placement records file.
                  Do not reorder or rename columns beforehand.
                </p>

                <label
                  htmlFor="csv-file-input"
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    Click to select CSV file, or drag and drop
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Supports comma-delimited files (.csv), UTF-8 encoded with headers
                  </span>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>XLSX direct import pipeline: Scheduled in next release. CSV parser active.</span>
                </span>
                {fileName && (
                  <span className="font-medium text-slate-700">Loaded: {fileName}</span>
                )}
              </div>
            </div>

            {/* Ready-to-Test Institutional Sample Datasets */}
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Test With Real-World Schemas
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Experience adaptive integration without having to prepare a file:
                </p>

                <div className="space-y-3">
                  {/* Sample 1: Anna University */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          Anna University ERP Format
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Headers: Roll No, Branch, CGPA, CIA Marks, Soft Skills...
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => handleLoadSample('anna')}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        Load Into Wizard
                      </button>
                      <button
                        onClick={() => handleDownloadSample('anna')}
                        className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                        title="Download sample CSV"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Sample 2: US Banner */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          US Banner & Canvas SIS
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Headers: Student ID, GPA (4.0), Midterm %, Canvas Score...
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => handleLoadSample('us')}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        Load Into Wizard
                      </button>
                      <button
                        onClick={() => handleDownloadSample('us')}
                        className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Sample 3: Messy Polytechnic */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          Legacy Polytechnic Workbook
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Headers: USN, Stream, Aggregate %, Present %, DSA Score...
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        onClick={() => handleLoadSample('messy')}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        Load Into Wizard
                      </button>
                      <button
                        onClick={() => handleDownloadSample('messy')}
                        className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-slate-500">
                Click any preset to simulate how CampusPulse auto-adapts to disparate column namings.
              </div>
            </div>
          </div>

          {/* Raw File Preview */}
          {rawRows.length > 0 && (
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    File Contents Preview: {fileName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Showing initial {Math.min(previewRowCount, rawRows.length)} of {rawRows.length} total rows.
                  </p>
                </div>
                <button
                  onClick={() => setStep('mapping')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <span>Review Column Mappings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-200 text-slate-400 w-12 text-center">#</th>
                      {rawHeaders.map((h, i) => (
                        <th key={i} className="py-2 px-3 whitespace-nowrap font-medium text-slate-800">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {rawRows.slice(0, previewRowCount).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-400 text-center">
                          {rowIdx + 1}
                        </td>
                        {rawHeaders.map((h, colIdx) => (
                          <td key={colIdx} className="py-2 px-3 whitespace-nowrap text-slate-700">
                            {row[h] || <span className="text-slate-300 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: ADAPTIVE COLUMN MAPPING */}
      {step === 'mapping' && (
        <div className="space-y-6">
          {/* Header & Mapping Profiles Selector */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Adaptive Field Alignment & Confidence
              </h4>
              <p className="text-xs text-slate-500">
                CampusPulse inferred internal schema equivalents using institutional aliases.
                Verify suggestions below and resolve any ambiguities.
              </p>
            </div>

            {/* Saved Profile Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="saved-profile-select" className="text-xs text-slate-600 whitespace-nowrap">
                Known Profiles:
              </label>
              <select
                id="saved-profile-select"
                value={selectedProfileId}
                onChange={(e) => handleApplyProfile(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Auto-Detected Aliases --</option>
                {savedProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mapping Error Notice */}
          {mappingError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-rose-950">Mapping Required: </span>
                  <span>{mappingError}</span>
                </div>
              </div>
              <button
                onClick={() => setMappingError(null)}
                className="text-rose-400 hover:text-rose-700 p-0.5"
                aria-label="Dismiss error"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Ambiguity Alert Notice if applicable */}
          {hasAmbiguityUnconfirmed && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Ambiguous Mappings Detected: </span>
                <span>
                  Some column names have multiple potential institutional meanings. Please review
                  and click the confirmation checkmark on flagged columns before proceeding.
                </span>
              </div>
            </div>
          )}

          {/* Mapping Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-1/4">Source Column (In Your File)</th>
                    <th className="py-3 px-4 w-1/5">Sample Values</th>
                    <th className="py-3 px-4 w-1/4">Target CampusPulse Field</th>
                    <th className="py-3 px-4 w-1/6">Inference Reason & Confidence</th>
                    <th className="py-3 px-3 text-center w-20">Confirm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappings.map((mapping, idx) => {
                    const isAmbiguous = mapping.confidence === 'AMBIGUOUS';
                    const isConfirmed = mapping.isConfirmed;

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isAmbiguous && !isConfirmed ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        {/* Source Column */}
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {mapping.sourceColumn}
                        </td>

                        {/* Sample Data */}
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {mapping.sampleValues.length > 0 ? (
                            <div className="truncate max-w-[200px]" title={mapping.sampleValues.join(', ')}>
                              {mapping.sampleValues.join(' · ')}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No samples</span>
                          )}
                        </td>

                        {/* Target Mapping Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={mapping.targetField}
                            onChange={(e) =>
                              handleUpdateMapping(
                                mapping.sourceColumn,
                                e.target.value as StandardFieldKey | 'IGNORE'
                              )
                            }
                            className={`w-full text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-1 ${
                              mapping.targetField === 'student_id'
                                ? 'border-blue-300 bg-blue-50/50 font-medium text-blue-900'
                                : mapping.targetField === 'IGNORE'
                                ? 'border-slate-200 bg-slate-50 text-slate-400'
                                : 'border-slate-300 bg-white text-slate-800'
                            }`}
                          >
                            <option value="IGNORE">— Do Not Import (Exclude) —</option>
                            <optgroup label="Core Identifiers">
                              <option value="student_id">Student Identifier (Roll No / Reg No)</option>
                              <option value="name">Student Full Name</option>
                              <option value="department">Department / Branch</option>
                              <option value="semester">Semester / Year</option>
                            </optgroup>
                            <optgroup label="Academic Metrics">
                              <option value="academic_performance">Academic Performance (CGPA / Marks %)</option>
                              <option value="attendance">Attendance Percentage</option>
                              <option value="assessment_completion">Assessment / CIA Completion</option>
                              <option value="lms_activity">LMS Activity / Portal Logins</option>
                              <option value="academic_trend">Academic Trend / SGPA Delta</option>
                              <option value="engagement">Co-curricular Engagement</option>
                            </optgroup>
                            <optgroup label="Placement Metrics">
                              <option value="technical_assessment">Technical / Coding Assessment</option>
                              <option value="aptitude">Aptitude & Cognitive Score</option>
                              <option value="communication">Communication & Soft Skills</option>
                              <option value="practical_skills">Practical Skills & Projects</option>
                              <option value="mock_interview">Mock Interview / HR Readiness</option>
                            </optgroup>
                          </select>
                        </td>

                        {/* Inference Reason & Confidence */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  mapping.confidence === 'HIGH'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : mapping.confidence === 'MEDIUM'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : mapping.confidence === 'AMBIGUOUS'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {mapping.confidence}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {mapping.reason}
                            </p>
                          </div>
                        </td>

                        {/* Confirm Button */}
                        <td className="py-3 px-3 text-center">
                          {isAmbiguous ? (
                            <button
                              onClick={() => handleConfirmMapping(mapping.sourceColumn)}
                              className={`p-1.5 rounded-md transition-colors ${
                                isConfirmed
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                              title={isConfirmed ? 'Mapping Confirmed' : 'Click to confirm mapping'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profile Save Option */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="save-profile-cb"
                type="checkbox"
                checked={saveProfileChecked}
                onChange={(e) => setSaveProfileChecked(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="save-profile-cb" className="text-xs font-semibold text-slate-900 cursor-pointer">
                Remember this mapping profile for future institutional uploads
              </label>
            </div>

            {saveProfileChecked && (
              <div className="pl-6">
                <label htmlFor="profile-name-input" className="block text-[11px] text-slate-500 mb-1">
                  Profile Name:
                </label>
                <input
                  id="profile-name-input"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Anna University Affiliated ERP Export"
                  className="w-full max-w-md text-xs px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('upload')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Upload</span>
            </button>

            <button
              onClick={handleProceedToValidation}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <span>Validate & Inspect Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATION & DATA QUALITY PRE-CHECK */}
      {step === 'validation' && validationSummary && (
        <div className="space-y-6">
          {applyError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-rose-950">Ingestion Blocked: </span>
                  <span>{applyError}</span>
                </div>
              </div>
              <button
                onClick={() => setApplyError(null)}
                className="text-rose-400 hover:text-rose-700 p-0.5"
                aria-label="Dismiss error"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Validation Scoreboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500">Total Source Rows</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {validationSummary.totalRows}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Parsed from CSV</div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl shadow-sm">
              <div className="text-xs text-emerald-800 font-medium">Valid for Ingestion</div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                {validationSummary.validRows}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Clean records ready</div>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl shadow-sm">
              <div className="text-xs text-amber-800 font-medium">Records with Warnings</div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-1">
                {validationSummary.warningRows}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">Missing values kept null</div>
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl shadow-sm">
              <div className="text-xs text-rose-800 font-medium">Rejected Records</div>
              <div className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-1">
                {validationSummary.errorRows}
              </div>
              <div className="text-[11px] text-rose-600 mt-1">
                {validationSummary.duplicateRows > 0 ? `${validationSummary.duplicateRows} duplicates` : 'Missing identifiers'}
              </div>
            </div>
          </div>

          {/* Validation Diagnostics & Row Errors */}
          {validationSummary.errors.length > 0 && (
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Data Quality Findings & Validation Logs</span>
              </h4>
              <p className="text-xs text-slate-500">
                Never silently discarding records: missing values are properly tracked as unrecorded metrics
                to calculate true institutional coverage rather than falsely penalizing students as zeros.
              </p>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-16">Row</th>
                      <th className="py-2 px-3 w-28">Identifier</th>
                      <th className="py-2 px-3 w-32">Column</th>
                      <th className="py-2 px-3 w-20">Severity</th>
                      <th className="py-2 px-4">Actionable Diagnostic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {validationSummary.errors.map((err, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 text-slate-500">{err.rowNumber}</td>
                        <td className="py-2 px-3 text-slate-700">{err.identifier || '—'}</td>
                        <td className="py-2 px-3 text-slate-700">{err.column}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              err.severity === 'ERROR'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {err.severity}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-sans text-xs text-slate-600">
                          {err.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Ingestion Options */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Ingestion Execution Strategy
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-3.5 border rounded-xl cursor-pointer flex items-start gap-3 transition-colors ${
                  importMode === 'append'
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Merge / Upsert Into Active Cohort
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Updates existing students matching student identifier; appends novel records without wiping cohort.
                  </div>
                </div>
              </label>

              <label
                className={`p-3.5 border rounded-xl cursor-pointer flex items-start gap-3 transition-colors ${
                  importMode === 'replace'
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Replace Entire Institutional Cohort
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Substitutes current student dataset with solely the {validationSummary.validRows} validated records from this file.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('mapping')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Mappings</span>
            </button>

            <button
              onClick={handleApplyImport}
              disabled={validationSummary.validRows === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Apply Import ({validationSummary.validRows} Records)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: COMPLETE & SUMMARY */}
      {step === 'complete' && (
        <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900">
              Data Ingestion Successfully Completed
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Imported {validatedStudents.length} student records into CampusPulse with full scoring calculation.
              {saveProfileChecked && profileName && (
                <span className="block mt-1 font-medium text-slate-700">
                  Saved mapping profile: "{profileName}"
                </span>
              )}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActiveScreen('explorer')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              View in Student Explorer
            </button>
            <button
              onClick={() => setActiveScreen('matrix')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            >
              Explore Academic × Placement Matrix
            </button>
            <button
              onClick={() => {
                setStep('upload');
                setRawRows([]);
                setRawHeaders([]);
                setFileName('');
              }}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
