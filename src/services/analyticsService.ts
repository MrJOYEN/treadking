import { supabase } from '../lib/supabase';
import { WorkoutEvent, WorkoutSplit } from './speedTrackingService';

export interface WorkoutAnalytics {
  sessionId: string;
  workoutName: string;
  totalDuration: number;
  totalDistance: number;
  averageSpeed: number;
  averagePace: number;
  maxSpeed: number;
  minSpeed: number;
  speedChanges: number;
  segmentSplits: WorkoutSplit[];
  kilometerSplits: WorkoutSplit[];
  speedProfile: SpeedPoint[];
  paceProfile: PacePoint[];
  heartRateZones?: HeartRateZone[];
}

export interface SpeedPoint {
  elapsedTime: number;
  speed: number;
  distance: number;
}

export interface PacePoint {
  elapsedTime: number;
  pace: number;
  distance: number;
}

export interface HeartRateZone {
  zone: number;
  duration: number;
  percentage: number;
}

export interface PerformanceComparison {
  metric: string;
  current: number;
  previous: number;
  improvement: number;
  unit: string;
}

export class AnalyticsService {

  /**
   * Génère les analytics complètes d'un entraînement
   */
  static async generateWorkoutAnalytics(sessionId: string): Promise<WorkoutAnalytics | null> {
    try {
      // Récupérer la session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions_detailed')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('Error fetching session:', sessionError);
        return null;
      }

      // Récupérer tous les événements
      const { data: events, error: eventsError } = await supabase
        .from('workout_events')
        .select('*')
        .eq('workout_session_id', sessionId)
        .order('elapsed_time', { ascending: true });

      if (eventsError || !events) {
        console.error('Error fetching events:', eventsError);
        return null;
      }

      // Récupérer tous les splits
      const { data: splits, error: splitsError } = await supabase
        .from('workout_splits')
        .select('*')
        .eq('workout_session_id', sessionId)
        .order('split_type, split_number', { ascending: true });

      if (splitsError) {
        console.error('Error fetching splits:', splitsError);
      }

      // Analyser les données
      const analytics = await this.analyzeWorkoutData(session, events, splits || []);
      
      return analytics;
    } catch (error) {
      console.error('Error generating workout analytics:', error);
      return null;
    }
  }

  /**
   * Analyse les données d'un entraînement
   */
  private static async analyzeWorkoutData(
    session: any, 
    events: any[], 
    splits: any[]
  ): Promise<WorkoutAnalytics> {
    
    // Calculs de base
    const totalDuration = session.total_duration || 0;
    const totalDistance = session.total_distance || 0;
    const averageSpeed = totalDistance > 0 && totalDuration > 0 
      ? (totalDistance / 1000) / (totalDuration / 3600) 
      : 0;
    const averagePace = averageSpeed > 0 ? 60 / averageSpeed : 0;

    // Analyser les changements de vitesse
    const speedEvents = events.filter(e => e.event_type === 'speed_change');
    const speeds = speedEvents.map(e => e.event_data?.newSpeed || 0).filter(s => s > 0);
    
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;
    const speedChanges = speedEvents.length;

    // Convertir les splits
    const segmentSplits = this.convertSplits(splits.filter(s => s.split_type === 'segment'));
    const kilometerSplits = this.convertSplits(splits.filter(s => s.split_type === 'kilometer'));

    // Générer les profils de vitesse et allure
    const speedProfile = this.generateSpeedProfile(events);
    const paceProfile = this.generatePaceProfile(speedProfile);

    return {
      sessionId: session.id,
      workoutName: session.workout_name,
      totalDuration,
      totalDistance,
      averageSpeed,
      averagePace,
      maxSpeed,
      minSpeed,
      speedChanges,
      segmentSplits,
      kilometerSplits,
      speedProfile,
      paceProfile
    };
  }

  /**
   * Convertit les splits de la DB vers le format TypeScript
   */
  private static convertSplits(dbSplits: any[]): WorkoutSplit[] {
    return dbSplits.map(split => ({
      id: split.id?.toString() || '',
      workoutSessionId: split.workout_session_id,
      splitType: split.split_type,
      splitNumber: split.split_number,
      startTime: split.start_time,
      endTime: split.end_time,
      duration: split.duration,
      startDistance: split.start_distance,
      endDistance: split.end_distance,
      distance: split.distance,
      averageSpeed: split.average_speed,
      averagePace: split.average_pace,
      speedChanges: split.speed_changes,
      minSpeed: split.min_speed,
      maxSpeed: split.max_speed,
      segmentName: split.segment_name
    }));
  }

  /**
   * Génère le profil de vitesse
   */
  private static generateSpeedProfile(events: any[]): SpeedPoint[] {
    const profile: SpeedPoint[] = [];
    let currentSpeed = 0;
    let currentDistance = 0;

    for (const event of events) {
      const elapsedTime = event.elapsed_time;
      
      if (event.event_type === 'speed_change') {
        currentSpeed = event.event_data?.newSpeed || 0;
      }
      
      if (event.event_data?.distance !== undefined) {
        currentDistance = event.event_data.distance;
      }

      profile.push({
        elapsedTime,
        speed: currentSpeed,
        distance: currentDistance
      });
    }

    return profile;
  }

  /**
   * Génère le profil d'allure
   */
  private static generatePaceProfile(speedProfile: SpeedPoint[]): PacePoint[] {
    return speedProfile.map(point => ({
      elapsedTime: point.elapsedTime,
      pace: point.speed > 0 ? 60 / point.speed : 0,
      distance: point.distance
    }));
  }

  /**
   * Compare les performances avec un entraînement précédent
   */
  static async compareWithPrevious(
    currentSessionId: string, 
    userId: string
  ): Promise<PerformanceComparison[]> {
    try {
      const currentAnalytics = await this.generateWorkoutAnalytics(currentSessionId);
      
      if (!currentAnalytics) {
        return [];
      }

      // Trouver la session précédente du même type
      const { data: previousSessions, error } = await supabase
        .from('workout_sessions_detailed')
        .select('id, workout_name, total_duration, total_distance')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .neq('id', currentSessionId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !previousSessions || previousSessions.length === 0) {
        return [];
      }

      // Prendre la session la plus récente comparable
      const previousSession = previousSessions.find(s => 
        s.workout_name === currentAnalytics.workoutName
      ) || previousSessions[0];

      const previousAnalytics = await this.generateWorkoutAnalytics(previousSession.id);
      
      if (!previousAnalytics) {
        return [];
      }

      // Générer les comparaisons
      const comparisons: PerformanceComparison[] = [
        {
          metric: 'Vitesse moyenne',
          current: currentAnalytics.averageSpeed,
          previous: previousAnalytics.averageSpeed,
          improvement: currentAnalytics.averageSpeed - previousAnalytics.averageSpeed,
          unit: 'km/h'
        },
        {
          metric: 'Allure moyenne',
          current: currentAnalytics.averagePace,
          previous: previousAnalytics.averagePace,
          improvement: previousAnalytics.averagePace - currentAnalytics.averagePace, // Inversion car plus petit = mieux
          unit: 'min/km'
        },
        {
          metric: 'Distance totale',
          current: currentAnalytics.totalDistance / 1000,
          previous: previousAnalytics.totalDistance / 1000,
          improvement: (currentAnalytics.totalDistance - previousAnalytics.totalDistance) / 1000,
          unit: 'km'
        },
        {
          metric: 'Durée',
          current: currentAnalytics.totalDuration,
          previous: previousAnalytics.totalDuration,
          improvement: previousAnalytics.totalDuration - currentAnalytics.totalDuration, // Inversion car plus court peut être mieux
          unit: 'sec'
        }
      ];

      return comparisons;
    } catch (error) {
      console.error('Error comparing with previous workout:', error);
      return [];
    }
  }

  /**
   * Calcule les statistiques de progression pour un utilisateur
   */
  static async getUserProgressStats(userId: string, days: number = 30): Promise<{
    totalWorkouts: number;
    totalDistance: number;
    totalTime: number;
    averageSpeed: number;
    bestPace: number;
    consistency: number;
  } | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sessions, error } = await supabase
        .from('workout_sessions_detailed')
        .select('total_duration, total_distance, created_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error || !sessions) {
        return null;
      }

      const totalWorkouts = sessions.length;
      const totalDistance = sessions.reduce((sum, s) => sum + (s.total_distance || 0), 0);
      const totalTime = sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0);
      
      const averageSpeed = totalDistance > 0 && totalTime > 0 
        ? (totalDistance / 1000) / (totalTime / 3600) 
        : 0;

      // Calculer la meilleure allure (plus petite = meilleure)
      const paces = sessions
        .filter(s => s.total_distance > 0 && s.total_duration > 0)
        .map(s => {
          const speed = (s.total_distance / 1000) / (s.total_duration / 3600);
          return speed > 0 ? 60 / speed : Infinity;
        })
        .filter(p => p < Infinity);

      const bestPace = paces.length > 0 ? Math.min(...paces) : 0;

      // Calculer la régularité (basée sur la fréquence d'entraînement)
      const daysWithWorkouts = new Set(
        sessions.map(s => new Date(s.created_at).toDateString())
      ).size;
      const consistency = Math.round((daysWithWorkouts / days) * 100);

      return {
        totalWorkouts,
        totalDistance: totalDistance / 1000, // Convertir en km
        totalTime: totalTime / 60, // Convertir en minutes
        averageSpeed,
        bestPace,
        consistency
      };
    } catch (error) {
      console.error('Error getting user progress stats:', error);
      return null;
    }
  }

  /**
   * Analyse les splits pour identifier les zones de force et faiblesse
   */
  static analyzeSplitPerformance(splits: WorkoutSplit[]): {
    fastestSplit: WorkoutSplit | null;
    slowestSplit: WorkoutSplit | null;
    mostConsistent: boolean;
    paceVariability: number;
  } {
    if (splits.length === 0) {
      return {
        fastestSplit: null,
        slowestSplit: null,
        mostConsistent: false,
        paceVariability: 0
      };
    }

    // Trouver le split le plus rapide et le plus lent
    const fastestSplit = splits.reduce((fastest, current) => 
      current.averageSpeed > fastest.averageSpeed ? current : fastest
    );

    const slowestSplit = splits.reduce((slowest, current) => 
      current.averageSpeed < slowest.averageSpeed ? current : slowest
    );

    // Calculer la variabilité de l'allure
    const paces = splits.map(s => s.averagePace);
    const avgPace = paces.reduce((sum, pace) => sum + pace, 0) / paces.length;
    const paceVariability = Math.sqrt(
      paces.reduce((sum, pace) => sum + Math.pow(pace - avgPace, 2), 0) / paces.length
    );

    // Déterminer la régularité (variabilité faible = régulier)
    const mostConsistent = paceVariability < 0.5; // Moins de 30s de variation par km

    return {
      fastestSplit,
      slowestSplit,
      mostConsistent,
      paceVariability
    };
  }
}