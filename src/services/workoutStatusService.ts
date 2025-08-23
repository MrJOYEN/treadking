import { supabase } from '../lib/supabase';
import { PlannedWorkout, WorkoutSession } from '../types';

export interface WorkoutCompletion {
  id: string;
  userId: string;
  plannedWorkoutId: string;
  completedAt: string;
  duration: number; // seconds
  distance: number; // meters
  averagePace?: number; // minutes per km
  averageSpeed?: number; // km/h
  maxHeartRate?: number;
  averageHeartRate?: number;
  caloriesBurned?: number;
  notes?: string;
  rating?: number; // 1-5 stars
}

export class WorkoutStatusService {
  
  /**
   * Marque un entraînement comme complété
   */
  static async completeWorkout(
    userId: string,
    plannedWorkoutId: string,
    completionData: Omit<WorkoutCompletion, 'id' | 'userId' | 'plannedWorkoutId' | 'completedAt'>
  ): Promise<string | null> {
    try {
      const workoutCompletion = {
        user_id: userId,
        planned_workout_id: plannedWorkoutId,
        completed_at: new Date().toISOString(),
        duration: completionData.duration,
        distance: completionData.distance,
        average_pace: completionData.averagePace,
        average_speed: completionData.averageSpeed,
        max_heart_rate: completionData.maxHeartRate,
        average_heart_rate: completionData.averageHeartRate,
        calories_burned: completionData.caloriesBurned,
        notes: completionData.notes,
        rating: completionData.rating,
      };

      const { data, error } = await supabase
        .from('workout_completions') // Table à créer
        .insert(workoutCompletion)
        .select('id')
        .single();

      if (error) {
        console.error('Error completing workout:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in completeWorkout:', error);
      return null;
    }
  }

  /**
   * Vérifie si un entraînement est complété
   */
  static async isWorkoutCompleted(userId: string, plannedWorkoutId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('planned_workout_id', plannedWorkoutId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking workout completion:', error);
        return false;
      }

      return data !== null;
    } catch (error) {
      console.error('Error in isWorkoutCompleted:', error);
      return false;
    }
  }

  /**
   * Récupère tous les entraînements complétés pour un utilisateur
   */
  static async getCompletedWorkouts(userId: string): Promise<WorkoutCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed workouts:', error);
        return [];
      }

      return (data || []).map(this.transformDbToCompletion);
    } catch (error) {
      console.error('Error in getCompletedWorkouts:', error);
      return [];
    }
  }

  /**
   * Récupère les entraînements complétés pour une période donnée
   */
  static async getCompletedWorkoutsInPeriod(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<WorkoutCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed workouts for period:', error);
        return [];
      }

      return (data || []).map(this.transformDbToCompletion);
    } catch (error) {
      console.error('Error in getCompletedWorkoutsInPeriod:', error);
      return [];
    }
  }

  /**
   * Calcule les statistiques d'entraînement pour une période
   */
  static async getWorkoutStats(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalWorkouts: number;
    totalDistance: number; // meters
    totalDuration: number; // seconds
    averagePace: number; // minutes per km
    bestPace: number; // minutes per km
  }> {
    try {
      const completedWorkouts = await this.getCompletedWorkoutsInPeriod(
        userId,
        startDate,
        endDate
      );

      if (completedWorkouts.length === 0) {
        return {
          totalWorkouts: 0,
          totalDistance: 0,
          totalDuration: 0,
          averagePace: 0,
          bestPace: 0,
        };
      }

      const totalWorkouts = completedWorkouts.length;
      const totalDistance = completedWorkouts.reduce((sum, w) => sum + w.distance, 0);
      const totalDuration = completedWorkouts.reduce((sum, w) => sum + w.duration, 0);

      // Calculer la moyenne des allures (seulement ceux qui ont une allure)
      const workoutsWithPace = completedWorkouts.filter(w => w.averagePace && w.averagePace > 0);
      const averagePace = workoutsWithPace.length > 0 
        ? workoutsWithPace.reduce((sum, w) => sum + (w.averagePace || 0), 0) / workoutsWithPace.length
        : 0;

      // Meilleure allure (la plus basse en minutes par km)
      const bestPace = workoutsWithPace.length > 0
        ? Math.min(...workoutsWithPace.map(w => w.averagePace || Infinity))
        : 0;

      return {
        totalWorkouts,
        totalDistance,
        totalDuration,
        averagePace,
        bestPace: bestPace === Infinity ? 0 : bestPace,
      };
    } catch (error) {
      console.error('Error calculating workout stats:', error);
      return {
        totalWorkouts: 0,
        totalDistance: 0,
        totalDuration: 0,
        averagePace: 0,
        bestPace: 0,
      };
    }
  }

  /**
   * Calcule la série d'entraînements en cours (streak)
   */
  static async getCurrentStreak(userId: string): Promise<number> {
    try {
      // Récupérer les 60 derniers jours d'entraînements
      const endDate = new Date().toISOString();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);

      const completedWorkouts = await this.getCompletedWorkoutsInPeriod(
        userId,
        startDate.toISOString(),
        endDate
      );

      if (completedWorkouts.length === 0) {
        return 0;
      }

      // Grouper par jour et calculer la série
      const workoutDates = completedWorkouts.map(w => 
        new Date(w.completedAt).toDateString()
      );
      
      const uniqueDates = [...new Set(workoutDates)].sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );

      let streak = 0;
      const today = new Date().toDateString();
      let checkDate = new Date();

      // Vérifier si il y a un entraînement aujourd'hui ou hier
      if (uniqueDates[0] === today || uniqueDates[0] === new Date(Date.now() - 86400000).toDateString()) {
        // Calculer la série en remontant dans le temps
        for (const dateStr of uniqueDates) {
          const workoutDate = new Date(dateStr);
          const daysDiff = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 1) { // Accepter aujourd'hui ou hier
            streak++;
            checkDate = workoutDate;
          } else {
            break;
          }
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating current streak:', error);
      return 0;
    }
  }

  /**
   * Récupère le statut des entraînements pour une liste de workouts planifiés
   */
  static async getWorkoutsStatus(
    userId: string,
    plannedWorkoutIds: string[]
  ): Promise<{ [workoutId: string]: boolean }> {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .select('planned_workout_id')
        .eq('user_id', userId)
        .in('planned_workout_id', plannedWorkoutIds);

      if (error) {
        console.error('Error fetching workouts status:', error);
        return {};
      }

      const statusMap: { [workoutId: string]: boolean } = {};
      plannedWorkoutIds.forEach(id => {
        statusMap[id] = false;
      });

      (data || []).forEach(item => {
        statusMap[item.planned_workout_id] = true;
      });

      return statusMap;
    } catch (error) {
      console.error('Error in getWorkoutsStatus:', error);
      return {};
    }
  }

  /**
   * Transforme les données DB vers l'interface WorkoutCompletion
   */
  private static transformDbToCompletion(dbData: any): WorkoutCompletion {
    return {
      id: dbData.id,
      userId: dbData.user_id,
      plannedWorkoutId: dbData.planned_workout_id,
      completedAt: dbData.completed_at,
      duration: dbData.duration,
      distance: dbData.distance,
      averagePace: dbData.average_pace,
      averageSpeed: dbData.average_speed,
      maxHeartRate: dbData.max_heart_rate,
      averageHeartRate: dbData.average_heart_rate,
      caloriesBurned: dbData.calories_burned,
      notes: dbData.notes,
      rating: dbData.rating,
    };
  }

  /**
   * Met à jour les notes ou le rating d'un entraînement complété
   */
  static async updateWorkoutCompletion(
    completionId: string,
    updates: { notes?: string; rating?: number }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workout_completions')
        .update({
          notes: updates.notes,
          rating: updates.rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', completionId);

      if (error) {
        console.error('Error updating workout completion:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateWorkoutCompletion:', error);
      return false;
    }
  }
}