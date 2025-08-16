import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingPlan, PlannedWorkout, WeeklySchedule } from '../types';

interface PlanDetailsScreenProps {
  navigation: any;
  route: any;
}

const PlanDetailsScreen: React.FC<PlanDetailsScreenProps> = ({ navigation, route }) => {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const { planId, isNewPlan } = route.params;

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const plansStr = await AsyncStorage.getItem('trainingPlans');
      if (plansStr) {
        const plans: TrainingPlan[] = JSON.parse(plansStr);
        const foundPlan = plans.find(p => p.id === planId);
        
        if (foundPlan) {
          console.log('Plan chargé:', foundPlan.name);
          console.log('Nombre total de workouts:', foundPlan.plannedWorkouts.length);
          console.log('Workouts par semaine:', foundPlan.workoutsPerWeek);
          console.log('Premier workout weekNumber:', foundPlan.plannedWorkouts[0]?.weekNumber);
          setPlan(foundPlan);
          generateWeeklySchedules(foundPlan);
        }
      }
    } catch (error) {
      console.error('Erreur chargement plan:', error);
      Alert.alert('Erreur', 'Impossible de charger le plan');
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklySchedules = (trainingPlan: TrainingPlan) => {
    const schedules: WeeklySchedule[] = [];
    const startDate = new Date(trainingPlan.startDate);
    
    for (let week = 1; week <= trainingPlan.totalWeeks; week++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (week - 1) * 7);
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);

      // Filtrer les workouts pour cette semaine
      const weekWorkouts = trainingPlan.plannedWorkouts
        .filter(workout => {
          const workoutWeek = getWorkoutWeek(workout);
          if (week === 1) {
            console.log(`Workout: ${workout.name}, weekNumber: ${workout.weekNumber}, calculé: ${workoutWeek}`);
          }
          return workoutWeek === week;
        })
        .map(workout => ({
          dayOfWeek: getWorkoutDayOfWeek(workout, week),
          plannedWorkout: workout,
          completed: false,
          actualSession: undefined,
        }));

      if (week === 1) {
        console.log(`Semaine ${week}: ${weekWorkouts.length} workouts trouvés`);
      }

      schedules.push({
        weekNumber: week,
        startDate: weekStartDate.toISOString(),
        endDate: weekEndDate.toISOString(),
        workouts: weekWorkouts,
      });
    }
    
    setWeeklySchedules(schedules);
  };

  // Fonctions utilitaires pour organiser les workouts par semaine
  const getWorkoutWeek = (workout: any): number => {
    // Utiliser weekNumber fourni par l'IA, fallback sur distribution
    return workout.weekNumber || (Math.floor((plan?.plannedWorkouts.indexOf(workout) || 0) / (plan?.workoutsPerWeek || 3)) + 1);
  };

  const getWorkoutDayOfWeek = (workout: any, week: number): number => {
    // Utiliser dayOfWeek fourni par l'IA, fallback sur distribution
    if (workout.dayOfWeek) {
      return workout.dayOfWeek;
    }
    // Distribution simple : 1=lundi, 3=mercredi, 5=vendredi
    const workoutIndexInWeek = (plan?.plannedWorkouts.indexOf(workout) || 0) % (plan?.workoutsPerWeek || 3);
    const dayMappings = [1, 3, 5, 2, 4, 6, 0]; // lun, mer, ven, mar, jeu, sam, dim
    return dayMappings[workoutIndexInWeek] || 1;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dayOfWeek];
  };

  const getWorkoutTypeIcon = (workoutType: string): string => {
    const icons: { [key: string]: string } = {
      'easy_run': '🚶',
      'intervals': '⚡',
      'tempo': '🏃',
      'long_run': '🛣️',
      'time_trial': '⏱️',
      'fartlek': '🎲',
      'hill_training': '⛰️',
      'recovery_run': '😌',
      'progression_run': '📈',
      'threshold': '🎯',
    };
    return icons[workoutType] || '🏃‍♂️';
  };

  const handleStartWorkout = (workout: PlannedWorkout) => {
    navigation.navigate('WorkoutGuided', { 
      plannedWorkout: workout,
      planId: plan?.id 
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement du plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Plan introuvable</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentWeekSchedule = weeklySchedules.find(w => w.weekNumber === selectedWeek);

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{plan.name}</Text>
      </View>

      {/* Alerte nouveau plan */}
      {isNewPlan && (
        <View style={styles.newPlanAlert}>
          <Text style={styles.newPlanText}>
            🎉 Votre plan a été créé avec succès ! Prêt à commencer votre transformation ?
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Informations du plan */}
        <View style={styles.planInfoSection}>
          <Text style={styles.planDescription}>{plan.description}</Text>
          <View style={styles.planStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{plan.totalWeeks}</Text>
              <Text style={styles.statLabel}>semaines</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{plan.workoutsPerWeek}</Text>
              <Text style={styles.statLabel}>séances/sem</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{plan.plannedWorkouts.length}</Text>
              <Text style={styles.statLabel}>séances total</Text>
            </View>
          </View>
        </View>

        {/* Sélecteur de semaine */}
        <View style={styles.weekSelectorSection}>
          <Text style={styles.sectionTitle}>📅 Calendrier d'entraînement</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.weekSelector}
          >
            {weeklySchedules.map(week => (
              <TouchableOpacity
                key={week.weekNumber}
                style={[
                  styles.weekButton,
                  selectedWeek === week.weekNumber && styles.selectedWeekButton
                ]}
                onPress={() => setSelectedWeek(week.weekNumber)}
              >
                <Text style={[
                  styles.weekButtonText,
                  selectedWeek === week.weekNumber && styles.selectedWeekButtonText
                ]}>
                  Sem. {week.weekNumber}
                </Text>
                <Text style={styles.weekDateText}>
                  {formatDate(week.startDate)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Séances de la semaine */}
        <View style={styles.workoutsSection}>
          <Text style={styles.sectionTitle}>
            🏃‍♂️ Semaine {selectedWeek} - Séances
          </Text>
          
          {currentWeekSchedule?.workouts.map((workout, index) => (
            <View key={index} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutIcon}>
                  {getWorkoutTypeIcon(workout.plannedWorkout.workoutType)}
                </Text>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>
                    {getDayName(workout.dayOfWeek)} - {workout.plannedWorkout.name}
                  </Text>
                  <Text style={styles.workoutDescription}>
                    {workout.plannedWorkout.description}
                  </Text>
                </View>
                <View style={styles.workoutStatus}>
                  {workout.completed ? (
                    <Text style={styles.completedIcon}>✅</Text>
                  ) : (
                    <Text style={styles.pendingIcon}>⏳</Text>
                  )}
                </View>
              </View>

              <View style={styles.workoutDetails}>
                <Text style={styles.workoutDetail}>
                  ⏱️ {workout.plannedWorkout.estimatedDuration} min
                </Text>
                <Text style={styles.workoutDetail}>
                  📏 {(workout.plannedWorkout.estimatedDistance / 1000).toFixed(1)} km
                </Text>
                <Text style={styles.workoutDetail}>
                  💪 Difficulté {workout.plannedWorkout.difficulty}/10
                </Text>
              </View>

              <View style={styles.workoutActions}>
                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate('WorkoutDetails', { 
                    workout: workout.plannedWorkout 
                  })}
                >
                  <Text style={styles.viewDetailsButtonText}>Voir détails</Text>
                </TouchableOpacity>
                
                {!workout.completed && (
                  <TouchableOpacity 
                    style={styles.startWorkoutButton}
                    onPress={() => handleStartWorkout(workout.plannedWorkout)}
                  >
                    <Text style={styles.startWorkoutButtonText}>▶️ Commencer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {(!currentWeekSchedule?.workouts || currentWeekSchedule.workouts.length === 0) && (
            <View style={styles.noWorkoutsCard}>
              <Text style={styles.noWorkoutsText}>
                Aucune séance prévue cette semaine. Repos bien mérité ! 😌
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  newPlanAlert: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  newPlanText: {
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  planInfoSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
    elevation: 2,
  },
  planDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  weekSelectorSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  weekSelector: {
    paddingVertical: 8,
  },
  weekButton: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    elevation: 2,
    minWidth: 80,
  },
  selectedWeekButton: {
    backgroundColor: '#2196F3',
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedWeekButtonText: {
    color: '#FFF',
  },
  weekDateText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  workoutsSection: {
    marginBottom: 24,
  },
  workoutCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  workoutStatus: {
    marginLeft: 12,
  },
  completedIcon: {
    fontSize: 20,
  },
  pendingIcon: {
    fontSize: 20,
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  workoutDetail: {
    fontSize: 12,
    color: '#666',
  },
  workoutActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewDetailsButton: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  startWorkoutButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  startWorkoutButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noWorkoutsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  noWorkoutsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default PlanDetailsScreen;