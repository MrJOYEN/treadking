import { supabase } from '../lib/supabase';
import { TrainingPlan, PlannedWorkout } from '../types';

export interface WorkoutCompletionStatus {
  plannedWorkoutId: string;
  workoutName: string;
  weekNumber: number;
  dayOfWeek: number;
  scheduledDate?: string;
  isCompleted: boolean;
  completedSessionId?: string;
  completionData?: {
    duration: number;
    distance: number;
    averageSpeed: number;
    averagePace: number;
    completedAt: string;
  };
}

export interface PlanProgress {
  totalWorkouts: number;
  completedWorkouts: number;
  completionPercentage: number;
  currentWeekProgress: {
    week: number;
    total: number;
    completed: number;
    percentage: number;
  };
  weeklyBreakdown: {
    [weekNumber: number]: {
      total: number;
      completed: number;
      percentage: number;
    };
  };
}

export class PlanProgressService {

  /**
   * Récupère le statut de completion de tous les entraînements d'un plan
   */
  static async getPlanCompletionStatus(planId: string, userId: string): Promise<WorkoutCompletionStatus[]> {
    try {
      // Récupérer tous les entraînements planifiés
      const { data: plannedWorkouts, error: planError } = await supabase
        .from('planned_workouts')
        .select('id, name, week_number, day_of_week')
        .eq('training_plan_id', planId);

      if (planError) {
        console.error('Error fetching planned workouts:', planError);
        return [];
      }

      // Récupérer toutes les sessions complétées pour ces entraînements
      const plannedWorkoutIds = plannedWorkouts?.map(w => w.id) || [];
      
      if (plannedWorkoutIds.length === 0) {
        return [];
      }

      const { data: completedSessions, error: sessionsError } = await supabase
        .from('workout_sessions_detailed')
        .select('id, planned_workout_id, total_duration, total_distance, end_time')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('planned_workout_id', plannedWorkoutIds);

      if (sessionsError) {
        console.error('Error fetching completed sessions:', sessionsError);
      }

      // Mapper les statuts
      const completionStatuses: WorkoutCompletionStatus[] = (plannedWorkouts || []).map(planned => {
        const completedSession = (completedSessions || []).find(
          session => session.planned_workout_id === planned.id
        );

        const isCompleted = !!completedSession;
        
        return {
          plannedWorkoutId: planned.id,
          workoutName: planned.name,
          weekNumber: planned.week_number,
          dayOfWeek: planned.day_of_week,
          isCompleted,
          completedSessionId: completedSession?.id,
          completionData: completedSession ? {
            duration: completedSession.total_duration,
            distance: completedSession.total_distance,
            averageSpeed: completedSession.total_distance > 0 && completedSession.total_duration > 0
              ? (completedSession.total_distance / 1000) / (completedSession.total_duration / 3600)
              : 0,
            averagePace: (() => {
              const speed = completedSession.total_distance > 0 && completedSession.total_duration > 0
                ? (completedSession.total_distance / 1000) / (completedSession.total_duration / 3600)
                : 0;
              return speed > 0 ? 60 / speed : 0;
            })(),
            completedAt: completedSession.end_time
          } : undefined
        };
      });

      return completionStatuses;
    } catch (error) {
      console.error('Error in getPlanCompletionStatus:', error);
      return [];
    }
  }

  /**
   * Calcule la progression globale d'un plan
   */
  static async calculatePlanProgress(planId: string, userId: string): Promise<PlanProgress> {
    try {
      const completionStatuses = await this.getPlanCompletionStatus(planId, userId);
      
      const totalWorkouts = completionStatuses.length;
      const completedWorkouts = completionStatuses.filter(status => status.isCompleted).length;
      const completionPercentage = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

      // Calculer la progression par semaine
      const weeklyBreakdown: { [weekNumber: number]: { total: number; completed: number; percentage: number } } = {};
      
      for (const status of completionStatuses) {
        const week = status.weekNumber;
        
        if (!weeklyBreakdown[week]) {
          weeklyBreakdown[week] = { total: 0, completed: 0, percentage: 0 };
        }
        
        weeklyBreakdown[week].total++;
        if (status.isCompleted) {
          weeklyBreakdown[week].completed++;
        }
      }

      // Calculer les pourcentages par semaine
      Object.keys(weeklyBreakdown).forEach(week => {
        const weekNum = parseInt(week);
        const weekData = weeklyBreakdown[weekNum];
        weekData.percentage = weekData.total > 0 ? Math.round((weekData.completed / weekData.total) * 100) : 0;
      });

      // Déterminer la semaine actuelle (basée sur la date de début du plan)
      const { data: planData } = await supabase
        .from('training_plans')
        .select('start_date')
        .eq('id', planId)
        .single();

      let currentWeek = 1;
      if (planData?.start_date) {
        const startDate = new Date(planData.start_date);
        const now = new Date();
        const diffTime = now.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);
      }

      const currentWeekData = weeklyBreakdown[currentWeek] || { total: 0, completed: 0, percentage: 0 };

      return {
        totalWorkouts,
        completedWorkouts,
        completionPercentage,
        currentWeekProgress: {
          week: currentWeek,
          total: currentWeekData.total,
          completed: currentWeekData.completed,
          percentage: currentWeekData.percentage
        },
        weeklyBreakdown
      };
    } catch (error) {
      console.error('Error calculating plan progress:', error);
      return {
        totalWorkouts: 0,
        completedWorkouts: 0,
        completionPercentage: 0,
        currentWeekProgress: { week: 1, total: 0, completed: 0, percentage: 0 },
        weeklyBreakdown: {}
      };
    }
  }

  /**
   * Vérifie si un entraînement planifié est complété
   */
  static async isPlannedWorkoutCompleted(plannedWorkoutId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('workout_sessions_detailed')
        .select('id')
        .eq('user_id', userId)
        .eq('planned_workout_id', plannedWorkoutId)
        .eq('status', 'completed')
        .limit(1);

      if (error) {
        console.error('Error checking workout completion:', error);
        return false;
      }

      return (data || []).length > 0;
    } catch (error) {
      console.error('Error in isPlannedWorkoutCompleted:', error);
      return false;
    }
  }

  /**
   * Récupère la session complétée pour un entraînement planifié
   */
  static async getCompletedSession(plannedWorkoutId: string, userId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('workout_sessions_detailed')
        .select('*')
        .eq('user_id', userId)
        .eq('planned_workout_id', plannedWorkoutId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCompletedSession:', error);
      return null;
    }
  }
}