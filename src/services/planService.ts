import { supabase } from '../lib/supabase';
import { TrainingPlan, PlannedWorkout, UserProfile, WorkoutType, TrainingSegment } from '../types';

export class PlanService {
  /**
   * Récupère tous les plans d'un utilisateur
   */
  static async getUserPlans(userId: string): Promise<TrainingPlan[]> {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select(`
          *,
          planned_workouts (
            *,
            training_segments (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user plans:', error);
        return [];
      }

      // Transformer les données de la DB vers le format TrainingPlan
      return (data || []).map(this.transformDbPlanToTrainingPlan);
    } catch (error) {
      console.error('Error in getUserPlans:', error);
      return [];
    }
  }

  /**
   * Récupère un plan spécifique
   */
  static async getPlan(planId: string): Promise<TrainingPlan | null> {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select(`
          *,
          planned_workouts (
            *,
            training_segments (*)
          )
        `)
        .eq('id', planId)
        .single();

      if (error) {
        console.error('Error fetching plan:', error);
        return null;
      }

      return this.transformDbPlanToTrainingPlan(data);
    } catch (error) {
      console.error('Error in getPlan:', error);
      return null;
    }
  }

  /**
   * Sauvegarde un nouveau plan d'entraînement
   */
  static async savePlan(userId: string, plan: Omit<TrainingPlan, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      console.log('Saving plan with', plan.plannedWorkouts.length, 'workouts');
      
      // Préparer les données du plan principal
      const planData = {
        user_id: userId,
        name: plan.name,
        description: plan.description,
        goal: plan.goal,
        total_weeks: plan.totalWeeks,
        workouts_per_week: plan.workoutsPerWeek,
        start_date: plan.startDate.split('T')[0], // Extraire la date sans l'heure
        end_date: plan.endDate.split('T')[0],
        generated_by_ai: plan.generatedByAI,
        ai_prompt: plan.aiPrompt || null,
      };

      // Insérer le plan principal
      const { data: planResult, error: planError } = await supabase
        .from('training_plans')
        .insert(planData)
        .select('id')
        .single();

      if (planError) {
        console.error('Error saving plan:', planError);
        return null;
      }

      const planId = planResult.id;

      // Sauvegarder les workouts et leurs segments
      console.log('Starting to save', plan.plannedWorkouts.length, 'workouts');
      for (let i = 0; i < plan.plannedWorkouts.length; i++) {
        const workout = plan.plannedWorkouts[i];
        console.log('Saving workout', i + 1, ':', workout.name);
        
        // Utiliser weekNumber et dayOfWeek de l'IA si disponibles, sinon calculer
        const weekNumber = workout.weekNumber || Math.floor(i / plan.workoutsPerWeek) + 1;
        const dayOfWeek = workout.dayOfWeek || (i % plan.workoutsPerWeek) + 1;
        
        console.log('Week:', weekNumber, 'Day:', dayOfWeek);

        // Insérer le workout
        const workoutData = {
          training_plan_id: planId,
          name: workout.name,
          description: workout.description,
          workout_type: workout.workoutType,
          estimated_duration: workout.estimatedDuration,
          estimated_distance: workout.estimatedDistance,
          difficulty: workout.difficulty,
          target_pace: workout.targetPace,
          notes: workout.notes,
          week_number: weekNumber,
          day_of_week: dayOfWeek,
        };

        const { data: workoutResult, error: workoutError } = await supabase
          .from('planned_workouts')
          .insert(workoutData)
          .select('id')
          .single();

        if (workoutError) {
          console.error('Error saving workout:', workoutError);
          continue;
        }

        const workoutId = workoutResult.id;
        console.log('Workout saved with ID:', workoutId);

        // Insérer les segments du workout
        console.log('Saving', workout.segments.length, 'segments for workout', workoutId);
        for (let j = 0; j < workout.segments.length; j++) {
          const segment = workout.segments[j];
          
          const segmentData = {
            planned_workout_id: workoutId,
            name: segment.name,
            duration: segment.duration,
            distance: segment.distance || null,
            target_speed: segment.targetSpeed,
            target_incline: segment.targetIncline,
            intensity: segment.intensity,
            rpe: segment.rpe,
            instruction: segment.instruction,
            recovery_after: segment.recoveryAfter || null,
            order_index: j,
          };

          const { error: segmentError } = await supabase
            .from('training_segments')
            .insert(segmentData);

          if (segmentError) {
            console.error('Error saving segment:', segmentError);
          }
        }
      }

      console.log('Plan saved successfully with ID:', planId);
      return planId;
    } catch (error) {
      console.error('Error in savePlan:', error);
      return null;
    }
  }

  /**
   * Sauvegarde la réponse IA brute pour débogage
   */
  static async saveAIResponse(userId: string, prompt: string, response: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_responses') // Table pour sauvegarder les réponses IA
        .insert({
          user_id: userId,
          prompt: prompt,
          response: JSON.stringify(response, null, 2),
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving AI response:', error);
      } else {
        console.log('AI response saved successfully');
      }
    } catch (error) {
      console.error('Error in saveAIResponse:', error);
    }
  }

  /**
   * Génère un plan d'entraînement factice (limité à 2 semaines pour les tests)
   */
  static async generatePlan(userProfile: UserProfile, options: {
    goal: string;
    duration: number; // semaines - sera forcé à 2 max
    intensity: 'light' | 'moderate' | 'intense';
  }): Promise<TrainingPlan> {
    // Forcer la durée à 2 semaines maximum pour les tests
    const maxWeeks = 2;
    const actualWeeks = Math.min(options.duration, maxWeeks);
    
    const planName = `Plan ${options.goal} - ${actualWeeks} semaine${actualWeeks > 1 ? 's' : ''}`;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (actualWeeks * 7));

    // Générer les workouts selon le profil utilisateur
    const workoutsPerWeek = userProfile.weeklyAvailability;
    const plannedWorkouts = this.generateWorkouts(userProfile, actualWeeks, workoutsPerWeek, options.intensity);

    const plan: TrainingPlan = {
      id: `plan_${Date.now()}`, // Sera remplacé par l'ID de la DB
      name: planName,
      description: `Plan d'entraînement personnalisé ${options.goal} sur ${actualWeeks} semaines, adapté à votre niveau ${userProfile.level}.`,
      goal: options.goal,
      totalWeeks: actualWeeks,
      workoutsPerWeek: workoutsPerWeek,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      plannedWorkouts: plannedWorkouts,
      userProfile: userProfile,
      createdAt: new Date().toISOString(),
      generatedByAI: true,
      aiPrompt: `Génération plan ${options.goal} pour niveau ${userProfile.level}, ${actualWeeks} semaines, intensité ${options.intensity}`,
    };

    return plan;
  }

  /**
   * Génère les workouts pour un plan
   */
  private static generateWorkouts(
    profile: UserProfile, 
    weeks: number, 
    workoutsPerWeek: number,
    intensity: 'light' | 'moderate' | 'intense'
  ): PlannedWorkout[] {
    const workouts: PlannedWorkout[] = [];
    
    // Templates de workouts selon le niveau
    const workoutTemplates = this.getWorkoutTemplates(profile.level, intensity);
    
    for (let week = 1; week <= weeks; week++) {
      for (let workout = 1; workout <= workoutsPerWeek; workout++) {
        const template = workoutTemplates[(week - 1) * workoutsPerWeek + (workout - 1)] || workoutTemplates[0];
        
        const plannedWorkout: PlannedWorkout = {
          id: `workout_${week}_${workout}_${Date.now()}`,
          name: `${template.name} - Semaine ${week}`,
          description: template.description,
          workoutType: template.type,
          estimatedDuration: profile.usualWorkoutDuration,
          estimatedDistance: this.calculateDistance(template.type, profile),
          segments: this.generateSegments(template.type, profile, week),
          difficulty: template.difficulty + (week - 1), // Progression
          targetPace: this.calculateTargetPace(profile, template.type),
          notes: `Séance ${workout} de la semaine ${week}`,
          createdAt: new Date().toISOString(),
        };
        
        workouts.push(plannedWorkout);
      }
    }
    
    return workouts;
  }

  /**
   * Templates de workouts selon le niveau
   */
  private static getWorkoutTemplates(level: string, intensity: string) {
    const base = [
      { name: 'Course facile', type: 'easy_run' as WorkoutType, difficulty: 3, description: 'Course d\'endurance en aisance respiratoire' },
      { name: 'Intervalles courts', type: 'intervals' as WorkoutType, difficulty: 6, description: 'Travail de vitesse par intervalles' },
      { name: 'Course tempo', type: 'tempo' as WorkoutType, difficulty: 5, description: 'Course à allure soutenue' },
      { name: 'Course longue', type: 'long_run' as WorkoutType, difficulty: 4, description: 'Course longue pour développer l\'endurance' },
      { name: 'Récupération', type: 'recovery_run' as WorkoutType, difficulty: 2, description: 'Course de récupération très facile' },
      { name: 'Fartlek', type: 'fartlek' as WorkoutType, difficulty: 5, description: 'Jeu de vitesse libre' },
    ];

    // Ajuster selon l'intensité
    const intensityMultiplier = {
      'light': 0.8,
      'moderate': 1.0,
      'intense': 1.2
    };

    return base.map(template => ({
      ...template,
      difficulty: Math.round(template.difficulty * intensityMultiplier[intensity])
    }));
  }

  /**
   * Génère les segments d'un workout
   */
  private static generateSegments(type: WorkoutType, profile: UserProfile, weekNumber: number): TrainingSegment[] {
    const segments: TrainingSegment[] = [];
    const baseSpeed = profile.preferredSpeedRange.runningSpeed;
    
    // Échauffement (toujours)
    segments.push({
      id: `warmup_${Date.now()}`,
      name: 'Échauffement',
      duration: 600, // 10 minutes
      targetSpeed: profile.preferredSpeedRange.walkingSpeed,
      targetIncline: 0,
      intensity: 'warm_up',
      rpe: 3,
      instruction: 'Marche rapide puis course très légère pour préparer le corps',
    });

    // Corps de séance selon le type
    switch (type) {
      case 'easy_run':
        segments.push({
          id: `main_${Date.now()}`,
          name: 'Course facile',
          duration: (profile.usualWorkoutDuration - 15) * 60, // Total moins échauffement/retour au calme
          targetSpeed: baseSpeed * 0.85,
          targetIncline: 0,
          intensity: 'easy',
          rpe: 4,
          instruction: 'Course à allure confortable, vous devez pouvoir tenir une conversation',
        });
        break;

      case 'intervals':
        // 5 intervalles de 3 minutes avec 2 minutes de récupération
        for (let i = 1; i <= 5; i++) {
          segments.push({
            id: `interval_${i}_${Date.now()}`,
            name: `Intervalle ${i}`,
            duration: 180, // 3 minutes
            targetSpeed: baseSpeed * 1.15,
            targetIncline: 1,
            intensity: 'vo2max',
            rpe: 8,
            instruction: `Intervalle ${i}/5 - Effort soutenu`,
            recoveryAfter: i < 5 ? 120 : 0, // 2 minutes de récup sauf le dernier
          });
        }
        break;

      case 'tempo':
        segments.push({
          id: `tempo_${Date.now()}`,
          name: 'Course tempo',
          duration: 1200, // 20 minutes
          targetSpeed: baseSpeed * 1.05,
          targetIncline: 0,
          intensity: 'tempo',
          rpe: 6,
          instruction: 'Allure soutenue mais contrôlée, effort "comfortablement dur"',
        });
        break;

      case 'long_run':
        segments.push({
          id: `long_${Date.now()}`,
          name: 'Course longue',
          duration: Math.min(profile.usualWorkoutDuration * 60 * 1.3, 3600), // Max 1h
          targetSpeed: baseSpeed * 0.8,
          targetIncline: 0,
          intensity: 'easy',
          rpe: 4,
          instruction: 'Course longue à allure très facile, privilégier la durée',
        });
        break;

      default:
        segments.push({
          id: `default_${Date.now()}`,
          name: 'Course libre',
          duration: (profile.usualWorkoutDuration - 15) * 60,
          targetSpeed: baseSpeed,
          targetIncline: 0,
          intensity: 'easy',
          rpe: 5,
          instruction: 'Course à votre rythme habituel',
        });
    }

    // Retour au calme (toujours)
    segments.push({
      id: `cooldown_${Date.now()}`,
      name: 'Retour au calme',
      duration: 300, // 5 minutes
      targetSpeed: profile.preferredSpeedRange.walkingSpeed * 0.8,
      targetIncline: 0,
      intensity: 'cool_down',
      rpe: 2,
      instruction: 'Marche lente pour récupérer progressivement',
    });

    return segments;
  }

  /**
   * Calcule la distance estimée selon le type de workout
   */
  private static calculateDistance(type: WorkoutType, profile: UserProfile): number {
    const duration = profile.usualWorkoutDuration; // minutes
    const avgSpeed = profile.preferredSpeedRange.runningSpeed; // km/h
    
    const multipliers = {
      'easy_run': 0.85,
      'intervals': 0.9,
      'tempo': 1.05,
      'long_run': 0.8,
      'recovery_run': 0.75,
      'fartlek': 0.95,
      'time_trial': 1.1,
      'hill_training': 0.8,
      'progression_run': 0.9,
      'threshold': 1.0,
    };

    const speedMultiplier = multipliers[type] || 0.85;
    const distanceKm = (duration / 60) * avgSpeed * speedMultiplier;
    
    return Math.round(distanceKm * 1000); // retour en mètres
  }

  /**
   * Calcule l'allure cible selon le type de workout
   */
  private static calculateTargetPace(profile: UserProfile, type: WorkoutType): number {
    const baseSpeed = profile.preferredSpeedRange.runningSpeed; // km/h
    const basePace = 60 / baseSpeed; // minutes per km
    
    const paceAdjustments = {
      'easy_run': 1.15,      // Plus lent
      'intervals': 0.85,     // Plus rapide
      'tempo': 0.95,         // Légèrement plus rapide
      'long_run': 1.2,       // Plus lent
      'recovery_run': 1.3,   // Très lent
      'fartlek': 1.0,        // Variable
      'time_trial': 0.9,     // Rapide
      'hill_training': 1.1,  // Plus lent à cause des côtes
      'progression_run': 1.05, // Commence plus lent
      'threshold': 0.92,     // Soutenu
    };

    const adjustment = paceAdjustments[type] || 1.0;
    return Math.round((basePace * adjustment) * 100) / 100; // Arrondi à 2 décimales
  }

  /**
   * Supprime un plan
   */
  static async deletePlan(planId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error('Error deleting plan:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePlan:', error);
      return false;
    }
  }

  /**
   * Marque un workout comme terminé
   */
  static async markWorkoutCompleted(planId: string, workoutId: string): Promise<boolean> {
    try {
      // Cette logique devra être implémentée selon la structure de la DB
      // Pour l'instant, on simule un succès
      return true;
    } catch (error) {
      console.error('Error marking workout completed:', error);
      return false;
    }
  }

  /**
   * Transforme les données de la DB vers le format TrainingPlan
   */
  private static transformDbPlanToTrainingPlan(dbPlan: any): TrainingPlan {
    // Trier les workouts par semaine et jour
    const sortedWorkouts = (dbPlan.planned_workouts || [])
      .sort((a: any, b: any) => {
        if (a.week_number !== b.week_number) {
          return a.week_number - b.week_number;
        }
        return a.day_of_week - b.day_of_week;
      });

    const plannedWorkouts: PlannedWorkout[] = sortedWorkouts.map((dbWorkout: any) => {
      // Trier les segments par order_index
      const sortedSegments = (dbWorkout.training_segments || [])
        .sort((a: any, b: any) => a.order_index - b.order_index);

      const segments: TrainingSegment[] = sortedSegments.map((dbSegment: any) => ({
        id: dbSegment.id,
        name: dbSegment.name,
        duration: dbSegment.duration,
        distance: dbSegment.distance,
        targetSpeed: dbSegment.target_speed,
        targetIncline: dbSegment.target_incline,
        intensity: dbSegment.intensity,
        rpe: dbSegment.rpe,
        instruction: dbSegment.instruction,
        recoveryAfter: dbSegment.recovery_after,
      }));

      return {
        id: dbWorkout.id,
        name: dbWorkout.name,
        description: dbWorkout.description,
        workoutType: dbWorkout.workout_type,
        estimatedDuration: dbWorkout.estimated_duration,
        estimatedDistance: dbWorkout.estimated_distance,
        segments: segments,
        difficulty: dbWorkout.difficulty,
        targetPace: dbWorkout.target_pace,
        notes: dbWorkout.notes,
        weekNumber: dbWorkout.week_number,
        dayOfWeek: dbWorkout.day_of_week,
        createdAt: dbWorkout.created_at,
      };
    });

    return {
      id: dbPlan.id,
      name: dbPlan.name,
      description: dbPlan.description,
      goal: dbPlan.goal,
      totalWeeks: dbPlan.total_weeks,
      workoutsPerWeek: dbPlan.workouts_per_week,
      startDate: dbPlan.start_date,
      endDate: dbPlan.end_date,
      plannedWorkouts: plannedWorkouts,
      userProfile: {} as UserProfile, // Nous n'avons pas le profil dans cette requête
      createdAt: dbPlan.created_at,
      generatedByAI: dbPlan.generated_by_ai,
      aiPrompt: dbPlan.ai_prompt,
    };
  }
}