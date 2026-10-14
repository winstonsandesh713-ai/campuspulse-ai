import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_CONFIG,
  generateSyntheticStudents,
  INITIAL_INTERVENTIONS,
  PRESET_MAPPING_PROFILES,
} from '../data/syntheticStudents';
import {
  InstitutionConfig,
  InterventionLog,
  MappingProfile,
  MatrixQuadrantId,
  Student,
} from '../types';
import {
  computeStudentScores,
  determineMatrixQuadrant,
  evaluateSupportIndicators,
  generateSuggestedAction,
  normalizeAcademicGrade,
} from '../utils/scoringEngine';

export type ScreenType =
  | 'overview'
  | 'explorer'
  | 'matrix'
  | 'import'
  | 'quality'
  | 'interventions'
  | 'settings';

interface AppContextType {
  activeScreen: ScreenType;
  setActiveScreen: (screen: ScreenType) => void;
  students: Student[];
  config: InstitutionConfig;
  savedProfiles: MappingProfile[];
  interventions: InterventionLog[];
  activeStudentId: string | null;
  selectedQuadrantFilter: MatrixQuadrantId | null;
  setSelectedQuadrantFilter: (quadrant: MatrixQuadrantId | null) => void;
  openStudent360: (studentId: string) => void;
  closeStudent360: () => void;
  updateConfig: (newConfig: InstitutionConfig) => void;
  resetDemoData: () => void;
  saveMappingProfile: (profile: MappingProfile) => void;
  deleteMappingProfile: (profileId: string) => void;
  addOrUpdateIntervention: (intervention: InterventionLog) => void;
  importValidatedStudents: (imported: Student[], mode: 'replace' | 'append') => void;
  updateStudentMentor: (studentId: string, mentorName: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STUDENTS: 'campuspulse_demo_students_v1',
  CONFIG: 'campuspulse_demo_config_v1',
  PROFILES: 'campuspulse_demo_profiles_v1',
  INTERVENTIONS: 'campuspulse_demo_interventions_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('overview');
  const [selectedQuadrantFilter, setSelectedQuadrantFilter] = useState<MatrixQuadrantId | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  // Initialize config with fallback to default
  const [config, setConfig] = useState<InstitutionConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {
      // LocalStorage access failure fallback
    }
    return DEFAULT_CONFIG;
  });

  // Initialize students
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return generateSyntheticStudents(DEFAULT_CONFIG);
  });

  // Initialize saved mapping profiles
  const [savedProfiles, setSavedProfiles] = useState<MappingProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return PRESET_MAPPING_PROFILES;
  });

  // Initialize interventions
  const [interventions, setInterventions] = useState<InterventionLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_INTERVENTIONS;
  });

  // Persist students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {
      // storage quota or private browsing
    }
  }, [students]);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch {
      // storage quota
    }
  }, [config]);

  // Persist profiles
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(savedProfiles));
    } catch {
      // storage quota
    }
  }, [savedProfiles]);

  // Persist interventions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
    } catch {
      // storage quota
    }
  }, [interventions]);

  const openStudent360 = (id: string) => {
    setActiveStudentId(id);
  };

  const closeStudent360 = () => {
    setActiveStudentId(null);
  };

  const updateConfig = (newConfig: InstitutionConfig) => {
    setConfig(newConfig);
    // Dynamically recompute scores and indicators for all existing students
    setStudents((prev) =>
      prev.map((student) => {
        const normalizedAcad =
          student.rawCGPA !== undefined
            ? normalizeAcademicGrade(student.rawCGPA, newConfig.gradingScale)
            : student.scores.academicPerformance;

        const recomputedScores = computeStudentScores(
          {
            academicPerformance: normalizedAcad,
            attendance: student.scores.attendance,
            assessmentCompletion: student.scores.assessmentCompletion,
            lmsActivity: student.scores.lmsActivity,
            academicTrend: student.scores.academicTrend,
            engagement: student.scores.engagement,
            technicalAssessment: student.scores.technicalAssessment,
            aptitude: student.scores.aptitude,
            communication: student.scores.communication,
            practicalSkills: student.scores.practicalSkills,
            mockInterview: student.scores.mockInterview,
          },
          newConfig.weights
        );

        const recomputedIndicators = evaluateSupportIndicators(recomputedScores, newConfig);
        const recomputedQuadrant = determineMatrixQuadrant(recomputedScores, newConfig.matrixCutoff);
        const action = generateSuggestedAction(recomputedQuadrant, recomputedScores, recomputedIndicators);

        return {
          ...student,
          scores: recomputedScores,
          indicators: recomputedIndicators,
          matrixQuadrant: recomputedQuadrant,
          recommendedAction: action,
        };
      })
    );
  };

  const resetDemoData = () => {
    const defaultData = generateSyntheticStudents(DEFAULT_CONFIG);
    setConfig(DEFAULT_CONFIG);
    setStudents(defaultData);
    setSavedProfiles(PRESET_MAPPING_PROFILES);
    setInterventions(INITIAL_INTERVENTIONS);
    setSelectedQuadrantFilter(null);
    setActiveStudentId(null);

    try {
      localStorage.removeItem(STORAGE_KEYS.STUDENTS);
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem(STORAGE_KEYS.PROFILES);
      localStorage.removeItem(STORAGE_KEYS.INTERVENTIONS);
    } catch {
      // ignore
    }
  };

  const saveMappingProfile = (profile: MappingProfile) => {
    setSavedProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === profile.id || p.name.toLowerCase() === profile.name.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...profile, updatedAt: new Date().toISOString().split('T')[0] };
        return next;
      }
      return [...prev, profile];
    });
  };

  const deleteMappingProfile = (profileId: string) => {
    setSavedProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const addOrUpdateIntervention = (intervention: InterventionLog) => {
    setInterventions((prev) => {
      const idx = prev.findIndex((item) => item.id === intervention.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = intervention;
        return next;
      }
      return [intervention, ...prev];
    });
  };

  const updateStudentMentor = (studentId: string, mentorName: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, assignedMentor: mentorName } : s))
    );
  };

  const importValidatedStudents = (imported: Student[], mode: 'replace' | 'append') => {
    // Automatically merge any newly introduced departments and semesters into configuration catalog
    const importedDepts = Array.from(new Set(imported.map((s) => s.department).filter(Boolean)));
    const importedSems = Array.from(new Set(imported.map((s) => String(s.semester)).filter(Boolean)));

    const updatedDepts = Array.from(new Set([...config.departments, ...importedDepts]));
    const updatedSems = Array.from(new Set([...config.semesters, ...importedSems]));

    if (
      updatedDepts.length !== config.departments.length ||
      updatedSems.length !== config.semesters.length
    ) {
      setConfig((prevConfig) => ({
        ...prevConfig,
        departments: updatedDepts,
        semesters: updatedSems,
      }));
    }

    if (mode === 'replace') {
      setStudents(imported);
    } else {
      // Append while updating duplicates by studentId
      setStudents((prev) => {
        const existingMap = new Map(prev.map((s) => [s.studentId, s]));
        imported.forEach((s) => {
          existingMap.set(s.studentId, s);
        });
        return Array.from(existingMap.values());
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        students,
        config,
        savedProfiles,
        interventions,
        activeStudentId,
        selectedQuadrantFilter,
        setSelectedQuadrantFilter,
        openStudent360,
        closeStudent360,
        updateConfig,
        resetDemoData,
        saveMappingProfile,
        deleteMappingProfile,
        addOrUpdateIntervention,
        importValidatedStudents,
        updateStudentMentor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
