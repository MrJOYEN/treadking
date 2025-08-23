import { supabase } from '../lib/supabase';
import { TrainingPlan, PlannedWorkout } from '../types';
import { PlanService } from './planService';
import { CalendarService } from './calendarService';
import { PlanProgressService } from './planProgressService';

export interface ActivePlanInfo {
  plan: TrainingPlan;
  currentWeek: number;
  totalProgress: number; // Pourcentage de completion du plan
  weeklyProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

export class UserPlanService {
  
  /**
   * Récupère le plan actif de l'utilisateur
   */
  static async getActivePlan(userId: string): Promise<ActivePlanInfo | null> {
    try {
      // Récupérer tous les plans de l'utilisateur
      const userPlans = await PlanService.getUserPlans(userId);
      
      if (userPlans.length === 0) {
        return null;
      }

      // Pour l'instant, on prend le plan le plus récent comme plan actif
      // TODO: Ajouter une colonne 'active' dans la DB pour gérer plusieurs plans
      const activePlan = userPlans[0];
      
      // Calculer les dates des workouts si pas déjà fait
      const workoutsWithDates = CalendarService.calculateWorkoutDates(
        activePlan.plannedWorkouts, 
        activePlan.startDate
      );

      const planWithDates: TrainingPlan = {
        ...activePlan,
        plannedWorkouts: workoutsWithDates
      };

      // Calculer la semaine actuelle et les statistiques
      const currentWeek = this.calculateCurrentWeek(planWithDates.startDate);
      const planProgress = await PlanProgressService.calculatePlanProgress(activePlan.id, userId);
      const totalProgress = planProgress.completionPercentage;
      const weeklyProgress = planProgress.currentWeekProgress;

      return {
        plan: planWithDates,
        currentWeek,
        totalProgress,
        weeklyProgress: {
          completed: weeklyProgress.completed,
          total: weeklyProgress.total,
          percentage: weeklyProgress.percentage
        }
      };
    } catch (error) {
      console.error('Error getting active plan:', error);
      return null;
    }
  }

  /**
   * Récupère l'entraînement du jour (si il y en a un)
   */
  static async getTodaysWorkout(userId: string): Promise<PlannedWorkout | null> {
    const activePlanInfo = await this.getActivePlan(userId);
    
    if (!activePlanInfo) {
      return null;
    }

    const todaysWorkouts = activePlanInfo.plan.plannedWorkouts.filter(workout => 
      CalendarService.isWorkoutToday(workout)
    );

    // Vérifier si l'entraînement du jour est déjà complété
    for (const workout of todaysWorkouts) {
      const isCompleted = await PlanProgressService.isPlannedWorkoutCompleted(workout.id, userId);
      if (!isCompleted) {
        return workout; // Retourner le premier entraînement non complété
      }
    }

    return null; // Tous les entraînements du jour sont complétés
  }

  /**
   * Récupère le prochain entraînement prévu
   */
  static async getNextWorkout(userId: string): Promise<PlannedWorkout | null> {
    const activePlanInfo = await this.getActivePlan(userId);
    
    if (!activePlanInfo) {
      return null;
    }

    const upcomingWorkouts = CalendarService.getUpcomingWorkouts(
      activePlanInfo.plan.plannedWorkouts, 
      30 // Chercher dans les 30 prochains jours
    );

    return upcomingWorkouts.length > 0 ? upcomingWorkouts[0] : null;
  }

  /**
   * Récupère les entraînements de la semaine en cours
   */
  static async getCurrentWeekWorkouts(userId: string): Promise<PlannedWorkout[]> {
    const activePlanInfo = await this.getActivePlan(userId);
    
    if (!activePlanInfo) {
      return [];
    }

    return activePlanInfo.plan.plannedWorkouts.filter(workout => 
      workout.weekNumber === activePlanInfo.currentWeek
    );
  }

  /**
   * Marque un entraînement comme terminé
   * TODO: Implémenter la persistance en DB
   */
  static async markWorkoutCompleted(userId: string, workoutId: string, completionData?: {
    duration: number;
    distance: number;
    averagePace: number;
    notes?: string;
  }): Promise<boolean> {
    try {
      // Pour l'instant, on simule le succès
      // TODO: Sauvegarder en DB avec les données de completion
      console.log('Workout marked as completed:', workoutId, completionData);
      return true;
    } catch (error) {
      console.error('Error marking workout as completed:', error);
      return false;
    }
  }

  /**
   * Calcule la semaine actuelle du plan
   */
  private static calculateCurrentWeek(planStartDate: string): number {
    const start = new Date(planStartDate);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculer la semaine (commence à 1)
    const weekNumber = Math.floor(diffDays / 7) + 1;
    
    return Math.max(1, weekNumber);
  }

  /**
   * Calcule le progrès total du plan
   * TODO: Basé sur les entraînements vraiment complétés
   */
  private static calculateTotalProgress(plan: TrainingPlan, userId: string): number {
    // Pour l'instant simulation basée sur le temps écoulé
    const start = new Date(plan.startDate);
    const end = new Date(plan.endDate);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();
    
    return Math.round((elapsedDuration / totalDuration) * 100);
  }

  /**
   * Vérifie si un entraînement planifié est complété
   */
  static async isWorkoutCompleted(plannedWorkoutId: string, userId: string): Promise<boolean> {
    return await PlanProgressService.isPlannedWorkoutCompleted(plannedWorkoutId, userId);
  }

  /**
   * Vérifie si l'utilisateur a un plan actif
   */
  static async hasActivePlan(userId: string): Promise<boolean> {
    const activePlan = await this.getActivePlan(userId);
    return activePlan !== null;
  }

  /**
   * Récupère un workout spécifique par son ID
   */
  static async getWorkoutById(userId: string, workoutId: string): Promise<PlannedWorkout | null> {
    try {
      const activePlanInfo = await this.getActivePlan(userId);
      
      if (!activePlanInfo) {
        return null;
      }

      return activePlanInfo.plan.plannedWorkouts.find(w => w.id === workoutId) || null;
    } catch (error) {
      console.error('Error getting workout by id:', error);
      return null;
    }
  }

  /**
   * Récupère les statistiques rapides pour l'utilisateur
   */
  static async getQuickStats(userId: string): Promise<{
    currentStreak: number;
    weeklyDistance: number;
    monthlyWorkouts: number;
  } | null> {
    // TODO: Implémenter avec des données réelles depuis la DB
    // Pour l'instant, données simulées
    return {
      currentStreak: 5,
      weeklyDistance: 12.8,
      monthlyWorkouts: 15
    };
  }
}