import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { Database } from '../types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export class ProfileService {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return this.mapProfileRowToUserProfile(data);
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  }

  static async createOrUpdateProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
    try {
      const profileData: ProfileInsert = {
        id: userId,
        name: profile.name || 'New User',
        level: profile.level || 'beginner',
        goal: profile.goal || '5k',
        weekly_availability: profile.weeklyAvailability || 3,
        previous_experience: profile.previousExperience || [],
        physical_constraints: profile.physicalConstraints || [],
        treadmill_brand: profile.treadmillBrand,
        max_speed: profile.maxSpeed || 12,
        max_incline: profile.maxIncline || 15,
        has_heart_rate_monitor: profile.hasHeartRateMonitor || false,
        preferred_speed_range: profile.preferredSpeedRange || {
          walkingSpeed: 5,
          runningSpeed: 10,
          sprintSpeed: 15,
        },
        comfortable_inclines: profile.comfortableInclines || {
          flat: 0,
          moderate: 5,
          steep: 10,
        },
        usual_workout_duration: profile.usualWorkoutDuration || 45,
        preferred_workout_times: profile.preferredWorkoutTimes || [],
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Error creating/updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      return false;
    }
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const profileUpdates: ProfileUpdate = {
        ...updates.name && { name: updates.name },
        ...updates.level && { level: updates.level },
        ...updates.goal && { goal: updates.goal },
        ...updates.weeklyAvailability && { weekly_availability: updates.weeklyAvailability },
        ...updates.previousExperience && { previous_experience: updates.previousExperience },
        ...updates.physicalConstraints && { physical_constraints: updates.physicalConstraints },
        ...updates.treadmillBrand && { treadmill_brand: updates.treadmillBrand },
        ...updates.maxSpeed && { max_speed: updates.maxSpeed },
        ...updates.maxIncline && { max_incline: updates.maxIncline },
        ...updates.hasHeartRateMonitor !== undefined && { has_heart_rate_monitor: updates.hasHeartRateMonitor },
        ...updates.preferredSpeedRange && { preferred_speed_range: updates.preferredSpeedRange },
        ...updates.comfortableInclines && { comfortable_inclines: updates.comfortableInclines },
        ...updates.usualWorkoutDuration && { usual_workout_duration: updates.usualWorkoutDuration },
        ...updates.preferredWorkoutTimes && { preferred_workout_times: updates.preferredWorkoutTimes },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return false;
    }
  }

  private static mapProfileRowToUserProfile(row: ProfileRow): UserProfile {
    return {
      name: row.name,
      level: row.level as 'beginner' | 'intermediate' | 'advanced',
      goal: row.goal as '5k' | '10k' | 'half_marathon' | 'marathon' | 'ultra_marathon',
      weeklyAvailability: row.weekly_availability,
      previousExperience: row.previous_experience,
      physicalConstraints: row.physical_constraints,
      treadmillBrand: row.treadmill_brand || undefined,
      maxSpeed: Number(row.max_speed),
      maxIncline: Number(row.max_incline),
      hasHeartRateMonitor: row.has_heart_rate_monitor,
      preferredSpeedRange: row.preferred_speed_range as {
        walkingSpeed: number;
        runningSpeed: number;
        sprintSpeed: number;
      },
      comfortableInclines: row.comfortable_inclines as {
        flat: number;
        moderate: number;
        steep: number;
      },
      usualWorkoutDuration: row.usual_workout_duration,
      preferredWorkoutTimes: row.preferred_workout_times,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}