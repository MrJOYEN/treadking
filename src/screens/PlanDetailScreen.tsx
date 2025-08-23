import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrainingPlanService } from '../services/trainingPlanService';
import { PlanService } from '../services/planService';
import { CalendarService } from '../services/calendarService';
import { WorkoutStatusService } from '../services/workoutStatusService';
import { PlanProgressService } from '../services/planProgressService';
import { TrainingPlan, PlannedWorkout, TrainingSegment } from '../types';
import { Colors } from '../theme/colors';
import { CommonStyles, Typography, Spacing, BorderRadius, Shadows } from '../theme/commonStyles';

interface PlanDetailScreenProps {
  navigation?: any;
  route?: {
    params: {
      planId: string;
    };
  };
}

const PlanDetailScreen: React.FC<PlanDetailScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [workoutStatuses, setWorkoutStatuses] = useState<{ [key: string]: boolean }>({});
  const [completedSessions, setCompletedSessions] = useState<{ [key: string]: any }>({});
  const planId = route?.params?.planId;

  useEffect(() => {
    if (planId) {
      loadPlan();
    }
  }, [planId]);

  const loadPlan = async () => {
    if (!planId) return;
    
    try {
      // Essayer d'abord avec le nouveau PlanService
      let planData = await PlanService.getPlan(planId);
      
      // Si ça ne marche pas, essayer avec l'ancien service
      if (!planData) {
        planData = await TrainingPlanService.getTrainingPlan(planId);
      }
      
      if (planData) {
        // Calculer les dates des workouts si pas déjà fait
        const workoutsWithDates = CalendarService.calculateWorkoutDates(
          planData.plannedWorkouts,
          planData.startDate
        );
        
        const enrichedPlan: TrainingPlan = {
          ...planData,
          plannedWorkouts: workoutsWithDates
        };
        
        setPlan(enrichedPlan);
        
        // Charger les statuts des entraînements complétés
        const completionStatuses = await PlanProgressService.getPlanCompletionStatus(planId, '425f9060-6391-4b5a-ad2f-3eb6cf0b817f'); // TODO: utiliser user.id du contexte
        
        const statusMap: { [key: string]: boolean } = {};
        const sessionMap: { [key: string]: any } = {};
        
        completionStatuses.forEach(status => {
          statusMap[status.plannedWorkoutId] = status.isCompleted;
          if (status.completedSessionId) {
            sessionMap[status.plannedWorkoutId] = {
              sessionId: status.completedSessionId,
              ...status.completionData
            };
          }
        });
        
        setWorkoutStatuses(statusMap);
        setCompletedSessions(sessionMap);
        // setWorkoutStatuses(statuses);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      Alert.alert('Erreur', 'Impossible de charger le plan');
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'easy_run': 'walk-outline',
      'intervals': 'flash-outline',
      'tempo': 'speedometer-outline',
      'long_run': 'trail-sign-outline',
      'recovery_run': 'leaf-outline',
      'fartlek': 'shuffle-outline',
      'time_trial': 'stopwatch-outline',
      'hill_training': 'trending-up-outline',
      'progression_run': 'arrow-up-outline',
      'threshold': 'flame-outline',
    };
    return icons[type] || 'fitness-outline';
  };

  const getWorkoutTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'easy_run': Colors.success,
      'intervals': Colors.accent,
      'tempo': Colors.warning,
      'long_run': Colors.info,
      'recovery_run': Colors.textSecondary,
      'fartlek': Colors.accent,
      'time_trial': Colors.error,
      'hill_training': Colors.warning,
      'progression_run': Colors.info,
      'threshold': Colors.accent,
    };
    return colors[type] || Colors.textSecondary;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    if (remainingSeconds === 0) return `${minutes}min`;
    return `${minutes}min ${remainingSeconds}s`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  const getWeekWorkouts = (weekNumber: number): PlannedWorkout[] => {
    if (!plan) return [];
    
    // Essayer d'abord avec weekNumber (pour les plans générés par IA)
    const workoutsByWeekNumber = plan.plannedWorkouts.filter(workout => workout.weekNumber === weekNumber);
    
    if (workoutsByWeekNumber.length > 0) {
      return workoutsByWeekNumber.sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0));
    }
    
    // Fallback sur l'ancienne méthode par index
    const startIndex = (weekNumber - 1) * plan.workoutsPerWeek;
    const endIndex = startIndex + plan.workoutsPerWeek;
    
    return plan.plannedWorkouts.slice(startIndex, endIndex);
  };

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 3) return Colors.success;
    if (difficulty <= 6) return Colors.warning;
    return Colors.error;
  };

  const isWorkoutToday = (workout: PlannedWorkout): boolean => {
    if (!workout.scheduledDate) return false;
    const today = new Date().toDateString();
    const workoutDate = new Date(workout.scheduledDate).toDateString();
    return today === workoutDate;
  };
  
  const isWorkoutPast = (workout: PlannedWorkout): boolean => {
    if (!workout.scheduledDate) return false;
    const today = new Date();
    const workoutDate = new Date(workout.scheduledDate);
    return workoutDate < today;
  };
  
  const handleStartWorkout = (workout: PlannedWorkout, isMissed: boolean = false) => {
    const title = isMissed ? 'Rattraper l\'entraînement' : 'Démarrer l\'entraînement';
    const message = isMissed 
      ? `Cet entraînement était prévu le ${workout.scheduledDate ? CalendarService.formatWorkoutDate(workout.scheduledDate) : 'date inconnue'}.\n\nVoulez-vous le rattraper maintenant ?`
      : `Commencer "${workout.name}" maintenant ?`;
    
    Alert.alert(
      title,
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: isMissed ? 'Rattraper' : 'Démarrer',
          onPress: () => {
            navigation?.navigate('WorkoutSession', { workoutId: workout.id });
          }
        }
      ]
    );
  };

  const renderWorkoutCard = (workout: PlannedWorkout, index: number) => (
    <View key={workout.id} style={[
      styles.workoutCard,
      workoutStatuses[workout.id] && styles.completedWorkoutCard,
      isWorkoutToday(workout) && !workoutStatuses[workout.id] && styles.todayWorkoutCard
    ]}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <View style={styles.workoutTypeContainer}>
            <Ionicons 
              name={getWorkoutTypeIcon(workout.workoutType) as any} 
              size={20} 
              color={getWorkoutTypeColor(workout.workoutType)} 
            />
            <Text style={styles.workoutName}>{workout.name}</Text>
          </View>
          
          {/* Date de l'entraînement */}
          {workout.scheduledDate && (
            <View style={styles.workoutDateContainer}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
              <Text style={[
                styles.workoutDate,
                isWorkoutToday(workout) && styles.todayDate
              ]}>
                {isWorkoutToday(workout) 
                  ? 'Aujourd\'hui' 
                  : CalendarService.formatFullWorkoutDate(workout.scheduledDate)
                }
              </Text>
            </View>
          )}
          
          <Text style={styles.workoutDescription} numberOfLines={2}>
            {workout.description}
          </Text>
        </View>
        
        <View style={styles.workoutBadges}>
          {workoutStatuses[workout.id] ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={styles.completedText}>Terminé</Text>
            </View>
          ) : isWorkoutPast(workout) && !workoutStatuses[workout.id] ? (
            <View style={styles.missedBadge}>
              <Ionicons name="time-outline" size={16} color="white" />
              <Text style={styles.missedText}>Manqué</Text>
            </View>
          ) : null}
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(workout.difficulty) }]}>
              {workout.difficulty}/10
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{workout.estimatedDuration}min</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="trail-sign-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{formatDistance(workout.estimatedDistance)}</Text>
        </View>
        {workout.targetPace && (
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>{workout.targetPace.toFixed(2)} min/km</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.workoutActions}>
        {/* Segments preview */}
        <TouchableOpacity 
          style={styles.segmentsPreview}
          onPress={() => {
            Alert.alert('Détail du workout', `Segments de "${workout.name}":\n\n${workout.segments.map(s => `• ${s.name}: ${formatDuration(s.duration)}`).join('\n')}`);
          }}
        >
          <Text style={styles.segmentsText}>
            {workout.segments.length} segments • Voir détails
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.accent} />
        </TouchableOpacity>
        
        {/* Bouton d'action */}
        {isWorkoutToday(workout) && !workoutStatuses[workout.id] ? (
          <TouchableOpacity 
            style={styles.startWorkoutButton}
            onPress={() => handleStartWorkout(workout)}
          >
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.startWorkoutText}>Démarrer</Text>
          </TouchableOpacity>
        ) : workoutStatuses[workout.id] ? (
          <View style={styles.completedActionsContainer}>
            <TouchableOpacity 
              style={styles.restartWorkoutButton}
              onPress={() => handleStartWorkout(workout, true)}
            >
              <Ionicons name="refresh" size={16} color={Colors.warning} />
              <Text style={styles.restartWorkoutText}>Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statsWorkoutButton}
              onPress={() => {
                if (completedSessions[workout.id]) {
                  navigation?.navigate('WorkoutStats', { 
                    sessionId: completedSessions[workout.id].sessionId, 
                    userId: '425f9060-6391-4b5a-ad2f-3eb6cf0b817f' 
                  });
                }
              }}
            >
              <Ionicons name="stats-chart" size={16} color={Colors.accent} />
              <Text style={styles.statsWorkoutText}>Voir stats</Text>
            </TouchableOpacity>
          </View>
        ) : isWorkoutPast(workout) && !workoutStatuses[workout.id] ? (
          <TouchableOpacity 
            style={styles.missedWorkoutButton}
            onPress={() => handleStartWorkout(workout, true)}
          >
            <Ionicons name="refresh" size={16} color={Colors.error} />
            <Text style={styles.missedWorkoutText}>Rattraper</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.upcomingWorkoutButton}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.upcomingWorkoutText}>Programmé</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Chargement du plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={Colors.error} />
          <Text style={styles.errorText}>Plan introuvable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {plan.name}
        </Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Plan Header */}
        <View style={styles.planHeaderContainer}>
          <LinearGradient
            colors={Colors.gradients.accent}
            style={styles.planHeader}
          >
            <Text style={styles.planName}>{plan.name}</Text>
            
            <View style={styles.planStatsRow}>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{plan.totalWeeks}</Text>
                <Text style={styles.planStatLabel}>semaines</Text>
              </View>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{plan.workoutsPerWeek}</Text>
                <Text style={styles.planStatLabel}>x/semaine</Text>
              </View>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{plan.plannedWorkouts.length}</Text>
                <Text style={styles.planStatLabel}>séances</Text>
              </View>
            </View>

            {plan.generatedByAI && (
              <View style={styles.aiTag}>
                <Ionicons name="sparkles" size={14} color={Colors.textOnAccent} />
                <Text style={styles.aiText}>Généré par IA</Text>
              </View>
            )}
          </LinearGradient>
          
          {/* Description séparée sur fond blanc */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.planDescriptionNew}>{plan.description}</Text>
          </View>
        </View>

        {/* Week Selector */}
        <View style={styles.weekSelector}>
          <Text style={styles.weekSelectorTitle}>Semaines du plan</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScrollView}>
            {Array.from({ length: plan.totalWeeks }, (_, i) => i + 1).map((week) => (
              <TouchableOpacity
                key={week}
                style={[
                  styles.weekTab,
                  selectedWeek === week && styles.selectedWeekTab
                ]}
                onPress={() => setSelectedWeek(week)}
              >
                <Text style={[
                  styles.weekTabText,
                  selectedWeek === week && styles.selectedWeekTabText
                ]}>
                  Sem. {week}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Workouts pour la semaine sélectionnée */}
        <View style={styles.workoutsSection}>
          <Text style={styles.workoutsSectionTitle}>
            Séances - Semaine {selectedWeek}
          </Text>
          
          {getWeekWorkouts(selectedWeek).length > 0 ? (
            getWeekWorkouts(selectedWeek).map((workout, index) => 
              renderWorkoutCard(workout, index)
            )
          ) : (
            <View style={styles.noWorkoutsContainer}>
              <Text style={styles.noWorkoutsText}>
                Aucune séance trouvée pour la semaine {selectedWeek}
              </Text>
              <Text style={styles.debugText}>
                Debug: {plan?.plannedWorkouts?.length || 0} séances au total
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.bottomSpacing, { height: insets.bottom + 80 }]} />

      </ScrollView>

      {/* Action Button */}
      <TouchableOpacity style={[styles.actionButton, { bottom: insets.bottom + Spacing.lg }]}>
        <LinearGradient
          colors={Colors.gradients.accent}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="play" size={20} color={Colors.textOnAccent} />
          <Text style={styles.actionButtonText}>Commencer la semaine {selectedWeek}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  loadingContainer: {
    ...CommonStyles.centerContent,
    flex: 1,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  errorContainer: {
    ...CommonStyles.centerContent,
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.error,
    marginVertical: Spacing.xl,
    textAlign: 'center',
  },
  backButton: {
    ...CommonStyles.buttonSecondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  header: {
    ...CommonStyles.header,
  },
  headerTitle: {
    ...CommonStyles.headerTitle,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  content: {
    flex: 1,
  },
  planHeaderContainer: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  planHeader: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  descriptionContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  planName: {
    ...Typography.h4,
    color: Colors.textOnAccent,
    marginBottom: Spacing.xl,
  },
  planDescriptionNew: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  planStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  planStat: {
    alignItems: 'center',
  },
  planStatValue: {
    ...Typography.h3,
    color: Colors.textOnAccent,
  },
  planStatLabel: {
    ...Typography.captionSmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  aiText: {
    ...Typography.captionSmall,
    color: Colors.textOnAccent,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  weekSelector: {
    paddingVertical: Spacing.xl,
  },
  weekSelectorTitle: {
    ...Typography.h6,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  weekScrollView: {
    paddingLeft: Spacing.xl,
  },
  weekTab: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedWeekTab: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  weekTabText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedWeekTabText: {
    color: Colors.accent,
    fontWeight: '600',
  },
  workoutsSection: {
    paddingHorizontal: Spacing.xl,
  },
  workoutsSectionTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  workoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  workoutInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  workoutTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  workoutName: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  workoutDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  difficultyText: {
    ...Typography.captionSmall,
    fontWeight: '600',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  workoutActions: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  segmentsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  segmentsText: {
    ...Typography.bodySmall,
    color: Colors.accent,
    fontWeight: '500',
  },
  actionButton: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.large,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    ...Typography.label,
    color: Colors.textOnAccent,
    marginLeft: Spacing.sm,
  },
  noWorkoutsContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noWorkoutsText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  debugText: {
    ...Typography.captionSmall,
    color: Colors.error,
    textAlign: 'center',
  },
  bottomSpacing: {
    // height sera défini dynamiquement avec insets.bottom + 80
  },
  // Nouveaux styles
  completedWorkoutCard: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  todayWorkoutCard: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  workoutDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  workoutDate: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  todayDate: {
    color: Colors.accent,
    fontWeight: '600',
  },
  workoutBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  completedText: {
    ...Typography.captionSmall,
    color: 'white',
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-end',
  },
  startWorkoutText: {
    ...Typography.labelSmall,
    color: Colors.textOnAccent,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  completedWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-end',
  },
  completedWorkoutText: {
    ...Typography.labelSmall,
    color: Colors.success,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  missedWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-end',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  missedWorkoutText: {
    ...Typography.labelSmall,
    color: Colors.error,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  upcomingWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-end',
  },
  upcomingWorkoutText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  statsWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-end',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  statsWorkoutText: {
    ...Typography.labelSmall,
    color: Colors.accent,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  completedActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: Spacing.md,
  },
  restartWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.warning,
  },
  restartWorkoutText: {
    ...Typography.labelSmall,
    color: Colors.warning,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  missedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  missedText: {
    ...Typography.captionSmall,
    color: 'white',
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});

export default PlanDetailScreen;