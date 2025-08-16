import { supabase } from '../lib/supabase';
import { TrainingPlan, PlannedWorkout, TrainingSegment } from '../types';
import { Database } from '../types/database';

type TrainingPlanRow = Database['public']['Tables']['training_plans']['Row'];
type TrainingPlanInsert = Database['public']['Tables']['training_plans']['Insert'];
type PlannedWorkoutInsert = Database['public']['Tables']['planned_workouts']['Insert'];
type TrainingSegmentInsert = Database['public']['Tables']['training_segments']['Insert'];

export class TrainingPlanService {
  static async createTrainingPlan(
    userId: string, 
    trainingPlan: TrainingPlan
  ): Promise<string | null> {
    try {
      // Create the training plan
      const planData: TrainingPlanInsert = {
        id: trainingPlan.id,
        user_id: userId,
        name: trainingPlan.name,
        description: trainingPlan.description,
        goal: trainingPlan.goal,
        total_weeks: trainingPlan.totalWeeks,
        workouts_per_week: trainingPlan.workoutsPerWeek,
        start_date: trainingPlan.startDate,
        end_date: trainingPlan.endDate,
        generated_by_ai: trainingPlan.generatedByAI,
        ai_prompt: trainingPlan.aiPrompt,
      };

      const { data: planResult, error: planError } = await supabase
        .from('training_plans')
        .insert(planData)
        .select()
        .single();

      if (planError) {
        console.error('Error creating training plan:', planError);
        return null;
      }

      // Create planned workouts and their segments
      for (const workout of trainingPlan.plannedWorkouts) {
        const workoutSuccess = await this.createPlannedWorkout(planResult.id, workout);
        if (!workoutSuccess) {
          console.error('Failed to create planned workout:', workout.name);
          // Continue with other workouts instead of failing entirely
        }
      }

      return planResult.id;
    } catch (error) {
      console.error('Error in createTrainingPlan:', error);
      return null;
    }
  }

  static async createPlannedWorkout(
    trainingPlanId: string,
    plannedWorkout: PlannedWorkout
  ): Promise<boolean> {
    try {
      // Extract week and day from the workout context
      // This is a simplified approach - you might need to adjust based on your data structure
      const weekNumber = 1; // You'll need to calculate this based on your plan structure
      const dayOfWeek = 1; // You'll need to calculate this based on your plan structure

      const workoutData: PlannedWorkoutInsert = {
        id: plannedWorkout.id,
        training_plan_id: trainingPlanId,
        name: plannedWorkout.name,
        description: plannedWorkout.description,
        workout_type: plannedWorkout.workoutType,
        estimated_duration: plannedWorkout.estimatedDuration,
        estimated_distance: plannedWorkout.estimatedDistance,
        difficulty: plannedWorkout.difficulty,
        target_pace: plannedWorkout.targetPace,
        notes: plannedWorkout.notes,
        week_number: weekNumber,
        day_of_week: dayOfWeek,
      };

      const { data: workoutResult, error: workoutError } = await supabase
        .from('planned_workouts')
        .insert(workoutData)
        .select()
        .single();

      if (workoutError) {
        console.error('Error creating planned workout:', workoutError);
        return false;
      }

      // Create training segments for this workout
      for (let i = 0; i < plannedWorkout.segments.length; i++) {
        const segment = plannedWorkout.segments[i];
        const segmentSuccess = await this.createTrainingSegment(workoutResult.id, segment, i);
        if (!segmentSuccess) {
          console.error('Failed to create training segment:', segment.name);
        }
      }

      return true;
    } catch (error) {
      console.error('Error in createPlannedWorkout:', error);
      return false;
    }
  }

  static async createTrainingSegment(
    plannedWorkoutId: string,
    segment: TrainingSegment,
    orderIndex: number
  ): Promise<boolean> {
    try {
      const segmentData: TrainingSegmentInsert = {
        id: segment.id,
        planned_workout_id: plannedWorkoutId,
        name: segment.name,
        duration: segment.duration,
        distance: segment.distance,
        target_speed: segment.targetSpeed,
        target_incline: segment.targetIncline,
        intensity: segment.intensity,
        rpe: segment.rpe,
        instruction: segment.instruction,
        recovery_after: segment.recoveryAfter,
        order_index: orderIndex,
      };

      const { error } = await supabase
        .from('training_segments')
        .insert(segmentData);

      if (error) {
        console.error('Error creating training segment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createTrainingSegment:', error);
      return false;
    }
  }

  static async getUserTrainingPlans(userId: string): Promise<TrainingPlan[]> {
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
        console.error('Error fetching training plans:', error);
        return [];
      }

      return data.map(plan => this.mapRowToTrainingPlan(plan));
    } catch (error) {
      console.error('Error in getUserTrainingPlans:', error);
      return [];
    }
  }

  static async getTrainingPlan(planId: string): Promise<TrainingPlan | null> {
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
        console.error('Error fetching training plan:', error);
        return null;
      }

      return this.mapRowToTrainingPlan(data);
    } catch (error) {
      console.error('Error in getTrainingPlan:', error);
      return null;
    }
  }

  static async deleteTrainingPlan(planId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        console.error('Error deleting training plan:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTrainingPlan:', error);
      return false;
    }
  }

  private static mapRowToTrainingPlan(row: any): TrainingPlan {
    const plannedWorkouts: PlannedWorkout[] = row.planned_workouts?.map((workout: any) => ({
      id: workout.id,
      name: workout.name,
      description: workout.description,
      workoutType: workout.workout_type,
      estimatedDuration: workout.estimated_duration,
      estimatedDistance: workout.estimated_distance,
      difficulty: workout.difficulty,
      targetPace: workout.target_pace,
      notes: workout.notes,
      segments: workout.training_segments?.map((segment: any) => ({
        id: segment.id,
        name: segment.name,
        duration: segment.duration,
        distance: segment.distance,
        targetSpeed: Number(segment.target_speed),
        targetIncline: Number(segment.target_incline),
        intensity: segment.intensity,
        rpe: segment.rpe,
        instruction: segment.instruction,
        recoveryAfter: segment.recovery_after,
      })).sort((a: any, b: any) => a.order_index - b.order_index) || [],
      createdAt: workout.created_at,
    })) || [];

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      goal: row.goal,
      totalWeeks: row.total_weeks,
      workoutsPerWeek: row.workouts_per_week,
      startDate: row.start_date,
      endDate: row.end_date,
      plannedWorkouts,
      userProfile: {} as any, // This would need to be populated separately if needed
      createdAt: row.created_at,
      generatedByAI: row.generated_by_ai,
      aiPrompt: row.ai_prompt,
    };
  }
}