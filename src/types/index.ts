export interface UserProfile {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  goal: '5k' | '10k' | 'half_marathon' | 'marathon' | 'ultra_marathon';
  weeklyAvailability: number; // Legacy - sera remplacé par availableDays
  availableDays?: number[]; // Jours de la semaine sélectionnés [1,3,5] = Lundi, Mercredi, Vendredi
  previousExperience: string[];
  physicalConstraints: string[];
  
  // Treadmill specific fields
  treadmillBrand?: string;
  maxSpeed: number; // km/h
  maxIncline: number; // percentage
  hasHeartRateMonitor: boolean;
  preferredSpeedRange: {
    walkingSpeed: number; // km/h
    runningSpeed: number; // km/h
    sprintSpeed: number; // km/h
  };
  comfortableInclines: {
    flat: number;
    moderate: number;
    steep: number;
  };
  usualWorkoutDuration: number; // minutes
  preferredWorkoutTimes: string[]; // ['morning', 'afternoon', 'evening']
  
  createdAt: string;
  updatedAt: string;
}

export type WorkoutType = 
  | 'easy_run'
  | 'intervals' 
  | 'tempo'
  | 'long_run'
  | 'time_trial'
  | 'fartlek'
  | 'hill_training'
  | 'recovery_run'
  | 'progression_run'
  | 'threshold';

export type IntensityZone = 
  | 'warm_up'
  | 'recovery'
  | 'easy'
  | 'tempo'
  | 'threshold'
  | 'vo2max'
  | 'neuromuscular'
  | 'cool_down';

export interface TrainingSegment {
  id: string;
  name: string; // "Échauffement", "Série 1", "Récupération", etc.
  duration: number; // seconds
  distance?: number; // meters (optional, can be time-based)
  targetSpeed: number; // km/h
  targetIncline: number; // percentage
  intensity: IntensityZone;
  rpe: number; // Rate of Perceived Exertion 1-10
  instruction: string; // Instructions détaillées
  recoveryAfter?: number; // seconds of recovery after this segment
}

export interface Split {
  kilometer: number;
  time: number; // seconds
  pace: number; // minutes per km
}

export interface WorkoutSession {
  id: string;
  date: string;
  totalDistance: number;
  totalTime: number; // seconds
  splits: Split[];
  averagePace: number;
  averageHeartRate?: number;
  workoutType: WorkoutType;
  notes?: string;
  plannedWorkout?: PlannedWorkout;
  completed: boolean;
}

export interface PlannedWorkout {
  id: string;
  name: string; // "Séance Intervalles 5x1000m"
  description: string;
  workoutType: WorkoutType;
  estimatedDuration: number; // minutes
  estimatedDistance: number; // meters
  segments: TrainingSegment[];
  difficulty: number; // 1-10
  targetPace?: number; // minutes per km
  notes?: string;
  weekNumber?: number; // Semaine du plan (1, 2, 3...)
  dayOfWeek?: number; // Jour de la semaine (1=lundi, 2=mardi, etc.)
  scheduledDate?: string; // Date précise calculée (ISO string)
  createdAt: string;
}

export interface TrainingPlan {
  id: string;
  name: string; // "Plan Marathon 12 semaines"
  description: string;
  goal: string; // Distance objective
  totalWeeks: number;
  workoutsPerWeek: number;
  startDate: string;
  endDate: string;
  plannedWorkouts: PlannedWorkout[];
  userProfile: UserProfile; // Snapshot du profil au moment de la création
  createdAt: string;
  generatedByAI: boolean;
  aiPrompt?: string; // Pour régénérer si besoin
}

export interface WeeklySchedule {
  weekNumber: number;
  startDate: string;
  endDate: string;
  workouts: {
    dayOfWeek: number; // 0 = dimanche, 1 = lundi, etc.
    plannedWorkout: PlannedWorkout;
    completed: boolean;
    actualSession?: WorkoutSession;
  }[];
}