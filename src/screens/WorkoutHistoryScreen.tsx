import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Colors } from '../theme/colors';
import { Spacing, Typography, BorderRadius } from '../theme/commonStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutHistory'>;

interface WorkoutHistoryItem {
  id: string;
  workoutName: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalDistance: number;
  status: string;
  eventsCount: number;
  splitsCount: number;
}

export function WorkoutHistoryScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('workout_sessions_detailed')
        .select(`
          id,
          workout_name,
          start_time,
          end_time,
          total_duration,
          total_distance,
          status,
          planned_workout_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading workout history:', error);
        return;
      }

      // Récupérer les comptes d'événements et splits pour chaque session
      const workoutsWithCounts = await Promise.all(
        (data || []).map(async (workout: any) => {
          // Compter les événements
          const { count: eventsCount } = await supabase
            .from('workout_events')
            .select('*', { count: 'exact', head: true })
            .eq('workout_session_id', workout.id);

          // Compter les splits
          const { count: splitsCount } = await supabase
            .from('workout_splits')
            .select('*', { count: 'exact', head: true })
            .eq('workout_session_id', workout.id);

          return {
            id: workout.id,
            workoutName: workout.workout_name,
            startTime: workout.start_time,
            endTime: workout.end_time,
            totalDuration: workout.total_duration,
            totalDistance: workout.total_distance,
            status: workout.status,
            eventsCount: eventsCount || 0,
            splitsCount: splitsCount || 0,
          };
        })
      );
      
      setWorkouts(workoutsWithCounts);
    } catch (error) {
      console.error('Error in loadWorkouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkouts();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAverageSpeed = (distance: number, duration: number): number => {
    if (duration === 0) return 0;
    return (distance / 1000) / (duration / 3600);
  };

  const calculateAveragePace = (distance: number, duration: number): string => {
    const avgSpeed = calculateAverageSpeed(distance, duration);
    if (avgSpeed === 0) return '--:--';
    
    const paceMinutesPerKm = 60 / avgSpeed;
    const minutes = Math.floor(paceMinutesPerKm);
    const seconds = Math.round((paceMinutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Historique des entraînements</Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : workouts.length > 0 ? (
          workouts.map((workout, index) => (
            <TouchableOpacity 
              key={workout.id}
              style={styles.workoutCard}
              onPress={() => navigation.navigate('WorkoutStats', { 
                sessionId: workout.id, 
                userId: user?.id 
              })}
            >
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>{workout.workoutName}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: workout.status === 'completed' ? '#4CAF50' : '#888' }
                ]}>
                  <Text style={styles.statusText}>
                    {workout.status === 'completed' ? 'Terminé' : 'En cours'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.workoutDate}>{formatDate(workout.startTime)}</Text>
              
              <View style={styles.workoutStats}>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color="#888" />
                  <Text style={styles.statText}>{formatTime(workout.totalDuration)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="map-outline" size={16} color="#888" />
                  <Text style={styles.statText}>{formatDistance(workout.totalDistance)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="speedometer-outline" size={16} color="#888" />
                  <Text style={styles.statText}>
                    {calculateAverageSpeed(workout.totalDistance, workout.totalDuration).toFixed(1)} km/h
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="stopwatch-outline" size={16} color="#888" />
                  <Text style={styles.statText}>
                    {calculateAveragePace(workout.totalDistance, workout.totalDuration)} /km
                  </Text>
                </View>
              </View>
              
              <View style={styles.workoutMeta}>
                <Text style={styles.metaText}>
                  {workout.eventsCount} événements • {workout.splitsCount} splits
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="fitness-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>Aucun entraînement</Text>
            <Text style={styles.emptySubtitle}>Vos entraînements apparaîtront ici</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  workoutCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  workoutDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#ccc',
    fontSize: 12,
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  metaText: {
    color: '#666',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});