import { PlannedWorkout } from '../types';

export class CalendarService {
  
  /**
   * Calcule les dates précises des entraînements à partir du plan
   * @param plannedWorkouts - Liste des entraînements planifiés
   * @param startDate - Date de début du plan (ISO string)
   * @returns Liste des entraînements avec dates calculées
   */
  static calculateWorkoutDates(
    plannedWorkouts: PlannedWorkout[], 
    startDate: string
  ): PlannedWorkout[] {
    const start = new Date(startDate);
    
    return plannedWorkouts.map(workout => {
      if (!workout.weekNumber || !workout.dayOfWeek) {
        console.warn(`Workout ${workout.name} manque weekNumber ou dayOfWeek`);
        return workout;
      }

      const scheduledDate = this.getWorkoutDate(start, workout.weekNumber, workout.dayOfWeek);
      
      return {
        ...workout,
        scheduledDate: scheduledDate.toISOString()
      };
    });
  }

  /**
   * Calcule la date exacte d'un entraînement
   * @param planStartDate - Date de début du plan
   * @param weekNumber - Numéro de semaine (1, 2, 3...)
   * @param dayOfWeek - Jour de la semaine (1=lundi, 7=dimanche)
   * @returns Date calculée
   */
  private static getWorkoutDate(planStartDate: Date, weekNumber: number, dayOfWeek: number): Date {
    // Calculer le début de la semaine cible
    const daysToAdd = (weekNumber - 1) * 7;
    const targetWeekStart = new Date(planStartDate);
    targetWeekStart.setDate(planStartDate.getDate() + daysToAdd);
    
    // Ajuster au lundi de cette semaine (dayOfWeek 1 = lundi)
    const currentDayOfWeek = targetWeekStart.getDay(); // 0=dimanche, 1=lundi, etc.
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek; // Calcul pour aller au lundi
    const monday = new Date(targetWeekStart);
    monday.setDate(targetWeekStart.getDate() + mondayOffset);
    
    // Ajouter les jours pour arriver au jour souhaité
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (dayOfWeek - 1)); // dayOfWeek 1=lundi donc -1
    
    return targetDate;
  }

  /**
   * Groupe les entraînements par semaine avec dates
   * @param plannedWorkouts - Entraînements avec dates calculées
   * @returns Entraînements groupés par semaine
   */
  static groupWorkoutsByWeek(plannedWorkouts: PlannedWorkout[]): {
    [weekNumber: number]: {
      startDate: string;
      endDate: string;
      workouts: PlannedWorkout[];
    }
  } {
    const groupedWorkouts: {
      [weekNumber: number]: {
        startDate: string;
        endDate: string;
        workouts: PlannedWorkout[];
      }
    } = {};

    plannedWorkouts.forEach(workout => {
      if (!workout.weekNumber || !workout.scheduledDate) return;

      if (!groupedWorkouts[workout.weekNumber]) {
        const workoutDate = new Date(workout.scheduledDate);
        const weekStart = this.getWeekStart(workoutDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        groupedWorkouts[workout.weekNumber] = {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          workouts: []
        };
      }

      groupedWorkouts[workout.weekNumber].workouts.push(workout);
    });

    // Trier les workouts par jour dans chaque semaine
    Object.values(groupedWorkouts).forEach(week => {
      week.workouts.sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0));
    });

    return groupedWorkouts;
  }

  /**
   * Obtient le début de semaine (lundi) pour une date donnée
   */
  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi soit le début
    return new Date(d.setDate(diff));
  }

  /**
   * Formatte une date pour l'affichage (ex: "23 août")
   */
  static formatWorkoutDate(dateString: string, locale: string = 'fr-FR'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long'
    });
  }

  /**
   * Formatte une date complète (ex: "Lundi 23 août 2024")
   */
  static formatFullWorkoutDate(dateString: string, locale: string = 'fr-FR'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Vérifie si un entraînement est prévu aujourd'hui
   */
  static isWorkoutToday(workout: PlannedWorkout): boolean {
    if (!workout.scheduledDate) return false;
    
    const today = new Date();
    const workoutDate = new Date(workout.scheduledDate);
    
    return today.toDateString() === workoutDate.toDateString();
  }

  /**
   * Récupère les entraînements des 7 prochains jours
   */
  static getUpcomingWorkouts(plannedWorkouts: PlannedWorkout[], days: number = 7): PlannedWorkout[] {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return plannedWorkouts
      .filter(workout => {
        if (!workout.scheduledDate) return false;
        const workoutDate = new Date(workout.scheduledDate);
        return workoutDate >= now && workoutDate <= futureDate;
      })
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());
  }

  /**
   * Reprogramme un entraînement à une nouvelle date
   */
  static rescheduleWorkout(workout: PlannedWorkout, newDate: string): PlannedWorkout {
    const date = new Date(newDate);
    
    // Calculer le nouveau dayOfWeek
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // Dimanche = 7, Lundi = 1, etc.
    
    return {
      ...workout,
      scheduledDate: date.toISOString(),
      dayOfWeek: dayOfWeek,
      // Note: weekNumber reste inchangé car c'est juste un décalage
    };
  }
}