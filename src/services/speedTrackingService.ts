import { supabase } from '../lib/supabase';

export interface WorkoutEvent {
  id: string;
  workoutSessionId: string;
  timestamp: string; // ISO string du moment de l'événement
  elapsedTime: number; // Temps écoulé depuis le début (secondes)
  eventType: 'speed_change' | 'segment_start' | 'segment_end' | 'pause' | 'resume' | 'start' | 'finish';
  data: {
    // Pour speed_change
    previousSpeed?: number;
    newSpeed?: number;
    
    // Pour segment_start/segment_end
    segmentIndex?: number;
    segmentName?: string;
    
    // Position
    distance?: number; // Distance parcourue en mètres
    currentPace?: number; // Allure actuelle en min/km
  };
}

export interface WorkoutSplit {
  id: string;
  workoutSessionId: string;
  splitType: 'segment' | 'kilometer';
  splitNumber: number; // Index du split (segment 1, 2, 3... ou km 1, 2, 3...)
  startTime: number; // Temps de début du split (secondes depuis début workout)
  endTime: number; // Temps de fin du split (secondes)
  duration: number; // Durée du split (secondes)
  startDistance: number; // Distance au début du split (mètres)
  endDistance: number; // Distance à la fin du split (mètres)
  distance: number; // Distance du split (mètres)
  averageSpeed: number; // Vitesse moyenne du split (km/h)
  averagePace: number; // Allure moyenne du split (min/km)
  speedChanges: number; // Nombre de changements de vitesse dans ce split
  minSpeed?: number; // Vitesse minimale dans le split
  maxSpeed?: number; // Vitesse maximale dans le split
  segmentName?: string; // Nom du segment si splitType = 'segment'
}

export class SpeedTrackingService {
  
  /**
   * Démarre une nouvelle session d'entraînement et retourne l'ID
   */
  static async startWorkoutSession(
    userId: string, 
    plannedWorkoutId: string,
    workoutName: string
  ): Promise<string | null> {
    try {
      const sessionData = {
        user_id: userId,
        planned_workout_id: plannedWorkoutId,
        workout_name: workoutName,
        start_time: new Date().toISOString(),
        status: 'active',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('workout_sessions_detailed') // Nouvelle table
        .insert(sessionData)
        .select('id')
        .single();

      if (error) {
        console.error('Error starting workout session:', error);
        return null;
      }

      // Enregistrer l'événement de début
      await this.recordEvent(data.id, {
        timestamp: new Date().toISOString(),
        elapsedTime: 0,
        eventType: 'start',
        data: {}
      });

      return data.id;
    } catch (error) {
      console.error('Error in startWorkoutSession:', error);
      return null;
    }
  }

  /**
   * Enregistre un événement dans la session
   */
  static async recordEvent(
    sessionId: string, 
    event: Omit<WorkoutEvent, 'id' | 'workoutSessionId'>
  ): Promise<boolean> {
    try {
      const eventData = {
        workout_session_id: sessionId,
        timestamp: event.timestamp,
        elapsed_time: event.elapsedTime,
        event_type: event.eventType,
        event_data: event.data,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('workout_events')
        .insert(eventData);

      if (error) {
        console.error('Error recording event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in recordEvent:', error);
      return false;
    }
  }

  /**
   * Enregistre un changement de vitesse
   */
  static async recordSpeedChange(
    sessionId: string,
    elapsedTime: number,
    previousSpeed: number,
    newSpeed: number,
    distance: number
  ): Promise<boolean> {
    return await this.recordEvent(sessionId, {
      timestamp: new Date().toISOString(),
      elapsedTime,
      eventType: 'speed_change',
      data: {
        previousSpeed,
        newSpeed,
        distance,
        currentPace: newSpeed > 0 ? 60 / newSpeed : 0
      }
    });
  }

  /**
   * Enregistre le début d'un segment
   */
  static async recordSegmentStart(
    sessionId: string,
    elapsedTime: number,
    segmentIndex: number,
    segmentName: string,
    distance: number
  ): Promise<boolean> {
    return await this.recordEvent(sessionId, {
      timestamp: new Date().toISOString(),
      elapsedTime,
      eventType: 'segment_start',
      data: {
        segmentIndex,
        segmentName,
        distance
      }
    });
  }

  /**
   * Enregistre la fin d'un segment
   */
  static async recordSegmentEnd(
    sessionId: string,
    elapsedTime: number,
    segmentIndex: number,
    segmentName: string,
    distance: number
  ): Promise<boolean> {
    return await this.recordEvent(sessionId, {
      timestamp: new Date().toISOString(),
      elapsedTime,
      eventType: 'segment_end',
      data: {
        segmentIndex,
        segmentName,
        distance
      }
    });
  }

  /**
   * Termine une session d'entraînement
   */
  static async finishWorkoutSession(
    sessionId: string,
    elapsedTime: number,
    totalDistance: number
  ): Promise<boolean> {
    try {
      // Enregistrer l'événement de fin
      await this.recordEvent(sessionId, {
        timestamp: new Date().toISOString(),
        elapsedTime,
        eventType: 'finish',
        data: {
          distance: totalDistance
        }
      });

      // Mettre à jour le statut de la session
      const { error } = await supabase
        .from('workout_sessions_detailed')
        .update({
          end_time: new Date().toISOString(),
          status: 'completed',
          total_duration: elapsedTime,
          total_distance: totalDistance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error finishing workout session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in finishWorkoutSession:', error);
      return false;
    }
  }

  /**
   * Calcule et sauvegarde les splits d'un entraînement terminé
   */
  static async calculateAndSaveSplits(sessionId: string): Promise<boolean> {
    try {
      // Récupérer tous les événements de la session
      const { data: events, error: eventsError } = await supabase
        .from('workout_events')
        .select('*')
        .eq('workout_session_id', sessionId)
        .order('elapsed_time', { ascending: true });

      if (eventsError || !events) {
        console.error('Error fetching events:', eventsError);
        return false;
      }

      // Calculer les splits par segment
      const segmentSplits = this.calculateSegmentSplits(events);
      
      // Calculer les splits par kilomètre
      const kilometerSplits = this.calculateKilometerSplits(events);

      // Sauvegarder tous les splits
      const allSplits = [...segmentSplits, ...kilometerSplits];
      
      if (allSplits.length > 0) {
        const splitsData = allSplits.map(split => ({
          workout_session_id: sessionId,
          split_type: split.splitType,
          split_number: split.splitNumber,
          start_time: Math.round(split.startTime),
          end_time: Math.round(split.endTime),
          duration: Math.round(split.duration),
          start_distance: Math.round(split.startDistance),
          end_distance: Math.round(split.endDistance),
          distance: Math.round(split.distance),
          average_speed: split.averageSpeed,
          average_pace: split.averagePace,
          speed_changes: split.speedChanges,
          min_speed: split.minSpeed,
          max_speed: split.maxSpeed,
          segment_name: split.segmentName,
          created_at: new Date().toISOString(),
        }));

        const { error: splitsError } = await supabase
          .from('workout_splits')
          .insert(splitsData);

        if (splitsError) {
          console.error('Error saving splits:', splitsError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in calculateAndSaveSplits:', error);
      return false;
    }
  }

  /**
   * Calcule les splits par segment
   */
  private static calculateSegmentSplits(events: any[]): WorkoutSplit[] {
    const splits: WorkoutSplit[] = [];
    let currentSegmentStart: any = null;
    let segmentIndex = 0;

    for (const event of events) {
      if (event.event_type === 'segment_start') {
        currentSegmentStart = event;
        segmentIndex++;
      } else if (event.event_type === 'segment_end' && currentSegmentStart) {
        const split = this.createSplitFromEvents(
          currentSegmentStart, 
          event, 
          'segment', 
          segmentIndex,
          events
        );
        if (split) {
          splits.push(split);
        }
        currentSegmentStart = null;
      }
    }

    return splits;
  }

  /**
   * Calcule les splits par kilomètre
   */
  private static calculateKilometerSplits(events: any[]): WorkoutSplit[] {
    const splits: WorkoutSplit[] = [];
    
    // Trier les événements par temps écoulé
    const sortedEvents = events.sort((a, b) => a.elapsed_time - b.elapsed_time);
    
    // Trouver le premier et dernier événement avec distance
    const eventsWithDistance = sortedEvents.filter(e => 
      e.event_data?.distance !== undefined && e.event_data?.distance !== null
    );
    
    if (eventsWithDistance.length < 2) {
      return splits;
    }
    
    const startEvent = eventsWithDistance[0];
    const endEvent = eventsWithDistance[eventsWithDistance.length - 1];
    const totalDistance = endEvent.event_data.distance - startEvent.event_data.distance;
    
    if (totalDistance <= 0) {
      return splits;
    }
    
    // Calculer les splits par kilomètre
    const totalKilometers = Math.floor(totalDistance / 1000);
    
    for (let km = 1; km <= totalKilometers; km++) {
      const kmStartDistance = startEvent.event_data.distance + (km - 1) * 1000;
      const kmEndDistance = startEvent.event_data.distance + km * 1000;
      
      // Trouver les événements qui encadrent ce kilomètre
      const kmStartEvent = this.findEventAtDistance(eventsWithDistance, kmStartDistance);
      const kmEndEvent = this.findEventAtDistance(eventsWithDistance, kmEndDistance);
      
      if (kmStartEvent && kmEndEvent && kmStartEvent.elapsed_time < kmEndEvent.elapsed_time) {
        const split = this.createSplitFromEvents(
          kmStartEvent,
          kmEndEvent,
          'kilometer',
          km,
          sortedEvents
        );
        
        if (split) {
          splits.push(split);
        }
      }
    }
    
    return splits;
  }
  
  /**
   * Trouve l'événement le plus proche d'une distance donnée
   */
  private static findEventAtDistance(eventsWithDistance: any[], targetDistance: number): any | null {
    let closestEvent = null;
    let minDiff = Infinity;
    
    for (const event of eventsWithDistance) {
      const eventDistance = event.event_data?.distance || 0;
      const diff = Math.abs(eventDistance - targetDistance);
      
      if (diff < minDiff) {
        minDiff = diff;
        closestEvent = event;
      }
      
      // Si on trouve un événement exact ou très proche, on l'utilise
      if (diff < 10) { // 10 mètres de tolérance
        break;
      }
    }
    
    // Si on n'a pas d'événement proche, on crée un événement interpolé
    if (!closestEvent || minDiff > 50) { // Plus de 50m de différence
      return this.interpolateEventAtDistance(eventsWithDistance, targetDistance);
    }
    
    return closestEvent;
  }
  
  /**
   * Interpole un événement à une distance donnée
   */
  private static interpolateEventAtDistance(eventsWithDistance: any[], targetDistance: number): any | null {
    // Trouver les deux événements qui encadrent la distance cible
    let beforeEvent = null;
    let afterEvent = null;
    
    for (let i = 0; i < eventsWithDistance.length - 1; i++) {
      const currentEvent = eventsWithDistance[i];
      const nextEvent = eventsWithDistance[i + 1];
      
      const currentDistance = currentEvent.event_data?.distance || 0;
      const nextDistance = nextEvent.event_data?.distance || 0;
      
      if (currentDistance <= targetDistance && nextDistance >= targetDistance) {
        beforeEvent = currentEvent;
        afterEvent = nextEvent;
        break;
      }
    }
    
    if (!beforeEvent || !afterEvent) {
      return null;
    }
    
    const beforeDistance = beforeEvent.event_data?.distance || 0;
    const afterDistance = afterEvent.event_data?.distance || 0;
    const beforeTime = beforeEvent.elapsed_time;
    const afterTime = afterEvent.elapsed_time;
    
    // Interpolation linéaire du temps
    const distanceRatio = (targetDistance - beforeDistance) / (afterDistance - beforeDistance);
    const interpolatedTime = beforeTime + (afterTime - beforeTime) * distanceRatio;
    
    return {
      ...beforeEvent,
      elapsed_time: interpolatedTime,
      timestamp: new Date(new Date(beforeEvent.timestamp).getTime() + (interpolatedTime - beforeTime) * 1000).toISOString(),
      event_data: {
        ...beforeEvent.event_data,
        distance: targetDistance
      }
    };
  }

  /**
   * Crée un split à partir de deux événements (début et fin)
   */
  private static createSplitFromEvents(
    startEvent: any, 
    endEvent: any, 
    splitType: 'segment' | 'kilometer',
    splitNumber: number,
    allEvents: any[]
  ): WorkoutSplit | null {
    try {
      const duration = endEvent.elapsed_time - startEvent.elapsed_time;
      const startDistance = startEvent.event_data?.distance || 0;
      const endDistance = endEvent.event_data?.distance || 0;
      const distance = endDistance - startDistance;

      if (duration <= 0 || distance <= 0) {
        return null;
      }

      // Calculer la vitesse moyenne
      const averageSpeed = (distance / 1000) / (duration / 3600); // km/h
      const averagePace = averageSpeed > 0 ? 60 / averageSpeed : 0; // min/km

      // Compter les changements de vitesse dans cette période
      const speedChanges = allEvents.filter(e => 
        e.event_type === 'speed_change' && 
        e.elapsed_time >= startEvent.elapsed_time && 
        e.elapsed_time <= endEvent.elapsed_time
      ).length;

      // Calculer les vitesses min/max
      const speedEvents = allEvents.filter(e => 
        e.event_type === 'speed_change' && 
        e.elapsed_time >= startEvent.elapsed_time && 
        e.elapsed_time <= endEvent.elapsed_time
      );

      let minSpeed, maxSpeed;
      if (speedEvents.length > 0) {
        const speeds = speedEvents.map(e => e.event_data?.newSpeed || 0);
        minSpeed = Math.min(...speeds);
        maxSpeed = Math.max(...speeds);
      }

      return {
        id: `split_${splitType}_${splitNumber}_${Date.now()}`,
        workoutSessionId: startEvent.workout_session_id,
        splitType,
        splitNumber,
        startTime: startEvent.elapsed_time,
        endTime: endEvent.elapsed_time,
        duration,
        startDistance,
        endDistance,
        distance,
        averageSpeed,
        averagePace,
        speedChanges,
        minSpeed,
        maxSpeed,
        segmentName: startEvent.event_data?.segmentName
      };
    } catch (error) {
      console.error('Error creating split:', error);
      return null;
    }
  }
}