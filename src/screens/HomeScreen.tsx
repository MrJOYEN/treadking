import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../theme/colors';
import { CommonStyles, Typography, Spacing, BorderRadius, Shadows } from '../theme/commonStyles';
import { UserPlanService, ActivePlanInfo } from '../services/userPlanService';
import { WorkoutStatusService } from '../services/workoutStatusService';
import { CalendarService } from '../services/calendarService';
import { PlannedWorkout } from '../types';

interface HomeScreenProps {
  navigation?: any;
}

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [activePlanInfo, setActivePlanInfo] = useState<ActivePlanInfo | null>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<PlannedWorkout | null>(null);
  const [nextWorkout, setNextWorkout] = useState<PlannedWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutStatuses, setWorkoutStatuses] = useState<{ [key: string]: boolean }>({});

  // Charger les données du plan actif
  const loadPlanData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Charger le plan actif
      const planInfo = await UserPlanService.getActivePlan(user.id);
      setActivePlanInfo(planInfo);
      
      if (planInfo) {
        // Charger l'entraînement du jour
        const todayWorkout = await UserPlanService.getTodaysWorkout(user.id);
        setTodaysWorkout(todayWorkout);
        
        // Si pas d'entraînement aujourd'hui, charger le prochain
        if (!todayWorkout) {
          const upcoming = await UserPlanService.getNextWorkout(user.id);
          setNextWorkout(upcoming);
        }
        
        // Charger les statuts des entraînements de la semaine
        const weekWorkouts = await UserPlanService.getCurrentWeekWorkouts(user.id);
        const workoutIds = weekWorkouts.map(w => w.id);
        const statuses = await WorkoutStatusService.getWorkoutsStatus(user.id, workoutIds);
        setWorkoutStatuses(statuses);
      }
    } catch (error) {
      console.error('Error loading plan data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadPlanData();
  }, [user?.id]);

  const getCurrentWeek = () => {
    const today = new Date();
    const currentWeek = [];
    
    // Get current week starting from Monday
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const weekNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      // Vérifier s'il y a un entraînement ce jour-là
      let hasWorkout = false;
      let isCompleted = false;
      
      if (activePlanInfo) {
        const dayWorkout = activePlanInfo.plan.plannedWorkouts.find(workout => {
          if (!workout.scheduledDate) return false;
          const workoutDate = new Date(workout.scheduledDate);
          return workoutDate.toDateString() === date.toDateString();
        });
        
        if (dayWorkout) {
          hasWorkout = true;
          isCompleted = workoutStatuses[dayWorkout.id] || false;
        }
      }
      
      currentWeek.push({
        name: weekNames[i],
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        hasWorkout,
        isCompleted
      });
    }
    
    return currentWeek;
  };

  const weekDays = getCurrentWeek();
  
  // Formater les données d'entraînement
  const formatWorkoutDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
  };
  
  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };
  
  const getWorkoutTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      'easy_run': 'Course facile',
      'intervals': 'Intervalles',
      'tempo': 'Tempo',
      'long_run': 'Course longue',
      'recovery_run': 'Récupération',
      'fartlek': 'Fartlek',
      'hill_training': 'Côtes',
      'time_trial': 'Test',
      'progression_run': 'Progression',
      'threshold': 'Seuil'
    };
    return labels[type] || type;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with profile and notifications */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <TouchableOpacity style={styles.profileAvatar}>
          <Text style={styles.profileInitial}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.weekSelector} onPress={() => navigation?.navigate('Plan')}>
          <Text style={styles.weekText}>
            {activePlanInfo 
              ? `Semaine ${activePlanInfo.currentWeek}/${activePlanInfo.plan.totalWeeks}`
              : 'Aucun plan'
            }
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="calendar-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayContainer,
                day.isToday && styles.todayContainer
              ]}
              onPress={() => setSelectedDay(day.date)}
            >
              <Text style={[
                styles.dayName,
                day.isToday && styles.todayText
              ]}>
                {day.name}
              </Text>
              <Text style={[
                styles.dayNumber,
                day.isToday && styles.todayText
              ]}>
                {day.date}
              </Text>
              {day.hasWorkout && (
                <View style={[
                  styles.workoutDot,
                  day.isCompleted && styles.completedDot
                ]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Weather */}
        <View style={styles.weatherContainer}>
          <Ionicons name="sunny" size={20} color={Colors.warning} />
          <Text style={styles.weatherText}>23°</Text>
        </View>

        {/* Entraînement du jour / Prochain entraînement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {todaysWorkout ? 'Entraînement du jour' : 'Prochain entraînement'}
          </Text>
          
          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : (todaysWorkout || nextWorkout) ? (
            <LinearGradient
              colors={Colors.gradients.accent}
              style={styles.workoutCard}
            >
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutTime}>
                  {todaysWorkout ? 'Aujourd’hui' : 
                    (nextWorkout?.scheduledDate ? CalendarService.formatWorkoutDate(nextWorkout.scheduledDate) : '')}
                  {' · '}
                  {formatWorkoutDuration((todaysWorkout || nextWorkout)?.estimatedDuration || 0)}
                </Text>
                <TouchableOpacity style={styles.workoutMenu}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="white" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.workoutTitle}>
                {(todaysWorkout || nextWorkout)?.name || ''}
              </Text>
              <Text style={styles.workoutSubtitle}>
                {getWorkoutTypeLabel((todaysWorkout || nextWorkout)?.workoutType || '')} · {' '}
                {formatDistance((todaysWorkout || nextWorkout)?.estimatedDistance || 0)}
              </Text>
              
              {todaysWorkout && (
                <TouchableOpacity style={styles.playButton} onPress={() => {
                  navigation?.navigate('WorkoutSession', { workoutId: todaysWorkout.id });
                }}>
                  <Ionicons name="play" size={16} color="white" />
                </TouchableOpacity>
              )}
              
              {nextWorkout && !todaysWorkout && (
                <View style={styles.nextWorkoutIndicator}>
                  <Ionicons name="time-outline" size={16} color="white" />
                </View>
              )}
            </LinearGradient>
          ) : activePlanInfo ? (
            <View style={styles.noWorkoutCard}>
              <Ionicons name="checkmark-circle" size={32} color={Colors.success} style={styles.noWorkoutIcon} />
              <Text style={styles.noWorkoutTitle}>Excellente semaine !</Text>
              <Text style={styles.noWorkoutSubtitle}>Tous vos entraînements sont terminés.</Text>
            </View>
          ) : (
            <View style={styles.noPlanCard}>
              <Ionicons name="fitness" size={32} color={Colors.textSecondary} style={styles.noPlanIcon} />
              <Text style={styles.noPlanTitle}>Aucun plan actif</Text>
              <Text style={styles.noPlanSubtitle}>Créez votre premier plan d'entraînement</Text>
              <TouchableOpacity 
                style={styles.createPlanButton}
                onPress={() => navigation?.navigate('CreatePlan')}
              >
                <Text style={styles.createPlanText}>Créer un plan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Progression du plan */}
        {activePlanInfo && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planTitle}>{activePlanInfo.plan.name}</Text>
                <Text style={styles.weekSubtitle}>
                  Semaine {activePlanInfo.currentWeek}/{activePlanInfo.plan.totalWeeks}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation?.navigate('Plan')}>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Progression du plan */}
            <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Progression semaine</Text>
                <Text style={styles.progressText}>
                  {activePlanInfo.weeklyProgress.completed}/{activePlanInfo.weeklyProgress.total}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFillWeek,
                    { width: `${activePlanInfo.weeklyProgress.percentage}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Progression totale</Text>
                <Text style={styles.progressText}>{activePlanInfo.totalProgress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFillTotal,
                    { width: `${activePlanInfo.totalProgress}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes statistiques</Text>
            <TouchableOpacity style={styles.expandButton}>
              <Text style={styles.expandText}>VOIR PLUS</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.insightsRow}>
            <LinearGradient
              colors={Colors.gradients.primary}
              style={styles.insightCard}
            >
              <View style={styles.insightHeader}>
                <Text style={styles.insightDate}>Cette semaine</Text>
                <Text style={styles.insightPercentage}>
                  {activePlanInfo ? `${activePlanInfo.weeklyProgress.percentage}%` : '0%'}
                </Text>
              </View>
              <Text style={styles.insightDetail}>
                {activePlanInfo ? `${activePlanInfo.weeklyProgress.completed} terminés` : 'Aucun plan'}
              </Text>
              <Text style={styles.insightDetail}>
                {activePlanInfo ? `${activePlanInfo.weeklyProgress.total} prévus` : ''}
              </Text>
              {activePlanInfo && activePlanInfo.weeklyProgress.percentage >= 80 && (
                <Ionicons name="star" size={16} color="#FFD700" style={styles.insightStar} />
              )}
            </LinearGradient>
            
            <View style={styles.weekInsight}>
              <Text style={styles.weekLabel}>
                {activePlanInfo ? `SEMAINE ${activePlanInfo.currentWeek}` : 'PLAN'}
              </Text>
              <Text style={styles.weekRatio}>
                {activePlanInfo ? `${activePlanInfo.currentWeek}/${activePlanInfo.plan.totalWeeks}` : '0/0'}
              </Text>
            </View>
          </View>
          
          <LinearGradient
            colors={[Colors.info, Colors.infoLight]}
            style={styles.beauchampCard}
          >
            <Text style={styles.beauchampTitle}>
              {todaysWorkout ? 'Prêt à courir' : 'Repos bien mérité'}
            </Text>
            <Text style={styles.beauchampTemp}>23°</Text>
            <View style={styles.beauchampFooter}>
              <Ionicons name="sunny" size={16} color="white" />
              <Text style={styles.beauchampRun}>
                {todaysWorkout ? 'COURSE' : 'REPOS'}
              </Text>
              <Text style={styles.beauchampRatio}>
                {activePlanInfo ? `${activePlanInfo.weeklyProgress.completed}/${activePlanInfo.weeklyProgress.total}` : '0/0'}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom Spacing */}
        <View style={[styles.bottomSpacing, { height: insets.bottom + 160 }]} />

      </ScrollView>

      {/* Record Workout Button */}
      <TouchableOpacity style={[styles.recordButton, { bottom: insets.bottom + 90 }]}>
        <Ionicons name="play" size={20} color="white" style={styles.recordIcon} />
        <Text style={styles.recordText}>Record workout</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="today" size={24} color={Colors.accent} />
          <Text style={[styles.navLabel, { color: Colors.accent }]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Plan')}>
          <Ionicons name="calendar-outline" size={24} color={Colors.navigation.inactive} />
          <Text style={styles.navLabel}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('WorkoutHistory')}>
          <Ionicons name="bar-chart-outline" size={24} color={Colors.navigation.inactive} />
          <Text style={styles.navLabel}>Historique</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Profile')}>
          <Ionicons name="person-outline" size={24} color={Colors.navigation.inactive} />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={Colors.navigation.inactive} />
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  weekText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
  },
  dayContainer: {
    alignItems: 'center',
    width: 40,
    paddingVertical: 8,
  },
  todayContainer: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.md,
  },
  dayName: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  dayNumber: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  todayText: {
    color: Colors.textOnDark,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginTop: Spacing.xs,
  },
  completedDot: {
    backgroundColor: Colors.accent,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: Spacing.xl,
  },
  weatherText: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  planTitleContainer: {
    flex: 1,
  },
  planTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  weekSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  progressText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  progressFillWeek: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressFillTotal: {
    height: '100%',
    backgroundColor: Colors.error,
    borderRadius: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandText: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  workoutCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  workoutTime: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  workoutMenu: {
    padding: Spacing.xs,
  },
  workoutTitle: {
    ...Typography.h4,
    color: Colors.textOnAccent,
    marginBottom: Spacing.xs,
  },
  workoutSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.lg,
  },
  playButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  insightCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    minHeight: 100,
    ...Shadows.medium,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  insightDate: {
    ...Typography.bodySmall,
    color: Colors.textOnDark,
  },
  insightPercentage: {
    ...Typography.bodySmall,
    color: Colors.textOnDark,
  },
  insightDetail: {
    ...Typography.captionSmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  insightStar: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
  },
  weekInsight: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  weekLabel: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  weekRatio: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  beauchampCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minHeight: 80,
    ...Shadows.medium,
  },
  beauchampTitle: {
    ...Typography.label,
    color: Colors.textOnDark,
    marginBottom: Spacing.xs,
  },
  beauchampTemp: {
    ...Typography.h3,
    color: Colors.textOnDark,
    marginBottom: Spacing.sm,
  },
  beauchampFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  beauchampRun: {
    ...Typography.captionSmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  beauchampRatio: {
    ...Typography.bodySmall,
    color: Colors.textOnDark,
  },
  bottomSpacing: {
    // height sera défini dynamiquement avec insets.bottom + 160
  },
  recordButton: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },
  recordIcon: {
    marginRight: Spacing.sm,
  },
  recordText: {
    ...Typography.label,
    color: Colors.textOnDark,
  },
  bottomNav: {
    ...CommonStyles.bottomNav,
  },
  navItem: {
    ...CommonStyles.navItem,
  },
  navLabel: {
    ...CommonStyles.navLabel,
  },
  // Nouveaux styles pour le système de planification
  loadingCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  noWorkoutCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  noWorkoutIcon: {
    marginBottom: Spacing.md,
  },
  noWorkoutTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  noWorkoutSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noPlanCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  noPlanIcon: {
    marginBottom: Spacing.md,
  },
  noPlanTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  noPlanSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  createPlanButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  createPlanText: {
    ...Typography.label,
    color: Colors.textOnDark,
  },
  nextWorkoutIndicator: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;