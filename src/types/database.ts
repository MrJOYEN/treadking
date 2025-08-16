export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          level: 'beginner' | 'intermediate' | 'advanced';
          goal: '5k' | '10k' | 'half_marathon' | 'marathon' | 'ultra_marathon';
          weekly_availability: number;
          previous_experience: string[];
          physical_constraints: string[];
          treadmill_brand?: string;
          max_speed: number;
          max_incline: number;
          has_heart_rate_monitor: boolean;
          preferred_speed_range: {
            walkingSpeed: number;
            runningSpeed: number;
            sprintSpeed: number;
          };
          comfortable_inclines: {
            flat: number;
            moderate: number;
            steep: number;
          };
          usual_workout_duration: number;
          preferred_workout_times: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          level: 'beginner' | 'intermediate' | 'advanced';
          goal: '5k' | '10k' | 'half_marathon' | 'marathon' | 'ultra_marathon';
          weekly_availability: number;
          previous_experience?: string[];
          physical_constraints?: string[];
          treadmill_brand?: string;
          max_speed: number;
          max_incline: number;
          has_heart_rate_monitor: boolean;
          preferred_speed_range: {
            walkingSpeed: number;
            runningSpeed: number;
            sprintSpeed: number;
          };
          comfortable_inclines: {
            flat: number;
            moderate: number;
            steep: number;
          };
          usual_workout_duration: number;
          preferred_workout_times?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          level?: 'beginner' | 'intermediate' | 'advanced';
          goal?: '5k' | '10k' | 'half_marathon' | 'marathon' | 'ultra_marathon';
          weekly_availability?: number;
          previous_experience?: string[];
          physical_constraints?: string[];
          treadmill_brand?: string;
          max_speed?: number;
          max_incline?: number;
          has_heart_rate_monitor?: boolean;
          preferred_speed_range?: {
            walkingSpeed: number;
            runningSpeed: number;
            sprintSpeed: number;
          };
          comfortable_inclines?: {
            flat: number;
            moderate: number;
            steep: number;
          };
          usual_workout_duration?: number;
          preferred_workout_times?: string[];
          updated_at?: string;
        };
      };
      training_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          goal: string;
          total_weeks: number;
          workouts_per_week: number;
          start_date: string;
          end_date: string;
          generated_by_ai: boolean;
          ai_prompt?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          goal: string;
          total_weeks: number;
          workouts_per_week: number;
          start_date: string;
          end_date: string;
          generated_by_ai?: boolean;
          ai_prompt?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          goal?: string;
          total_weeks?: number;
          workouts_per_week?: number;
          start_date?: string;
          end_date?: string;
          generated_by_ai?: boolean;
          ai_prompt?: string;
          updated_at?: string;
        };
      };
      planned_workouts: {
        Row: {
          id: string;
          training_plan_id: string;
          name: string;
          description: string;
          workout_type: string;
          estimated_duration: number;
          estimated_distance: number;
          difficulty: number;
          target_pace?: number;
          notes?: string;
          week_number: number;
          day_of_week: number;
          created_at: string;
        };
        Insert: {
          id: string;
          training_plan_id: string;
          name: string;
          description: string;
          workout_type: string;
          estimated_duration: number;
          estimated_distance: number;
          difficulty: number;
          target_pace?: number;
          notes?: string;
          week_number: number;
          day_of_week: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          training_plan_id?: string;
          name?: string;
          description?: string;
          workout_type?: string;
          estimated_duration?: number;
          estimated_distance?: number;
          difficulty?: number;
          target_pace?: number;
          notes?: string;
          week_number?: number;
          day_of_week?: number;
        };
      };
      training_segments: {
        Row: {
          id: string;
          planned_workout_id: string;
          name: string;
          duration: number;
          distance?: number;
          target_speed: number;
          target_incline: number;
          intensity: string;
          rpe: number;
          instruction: string;
          recovery_after?: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id: string;
          planned_workout_id: string;
          name: string;
          duration: number;
          distance?: number;
          target_speed: number;
          target_incline: number;
          intensity: string;
          rpe: number;
          instruction: string;
          recovery_after?: number;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          planned_workout_id?: string;
          name?: string;
          duration?: number;
          distance?: number;
          target_speed?: number;
          target_incline?: number;
          intensity?: string;
          rpe?: number;
          instruction?: string;
          recovery_after?: number;
          order_index?: number;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          planned_workout_id?: string;
          date: string;
          total_distance: number;
          total_time: number;
          average_pace: number;
          average_heart_rate?: number;
          workout_type: string;
          notes?: string;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          planned_workout_id?: string;
          date: string;
          total_distance: number;
          total_time: number;
          average_pace: number;
          average_heart_rate?: number;
          workout_type: string;
          notes?: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          planned_workout_id?: string;
          date?: string;
          total_distance?: number;
          total_time?: number;
          average_pace?: number;
          average_heart_rate?: number;
          workout_type?: string;
          notes?: string;
          completed?: boolean;
        };
      };
      splits: {
        Row: {
          id: string;
          workout_session_id: string;
          kilometer: number;
          time: number;
          pace: number;
          created_at: string;
        };
        Insert: {
          id: string;
          workout_session_id: string;
          kilometer: number;
          time: number;
          pace: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_session_id?: string;
          kilometer?: number;
          time?: number;
          pace?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}