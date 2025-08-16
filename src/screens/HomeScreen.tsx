import React, { useState } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../theme/colors';
import { CommonStyles, Typography, Spacing, BorderRadius, Shadows } from '../theme/commonStyles';

interface HomeScreenProps {
  navigation?: any;
}

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const getCurrentWeek = () => {
    const today = new Date();
    const weekDays = [];
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
      currentWeek.push({
        name: weekNames[i],
        date: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        hasWorkout: Math.random() > 0.6, // Simulated data
        isCompleted: Math.random() > 0.7
      });
    }
    
    return currentWeek;
  };

  const weekDays = getCurrentWeek();
  const todayWorkouts = [
    {
      id: 1,
      time: '16h30',
      duration: '35m',
      title: '5K Training Run',
      subtitle: 'Endurance · 5.2km',
      type: 'endurance',
      progress: 0
    }
  ];

  const stats = {
    weekProgress: 3,
    totalWorkouts: 5,
    weekDistance: '12.8',
    streakDays: 5
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with profile and notifications */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileAvatar}>
          <Text style={styles.profileInitial}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.weekSelector}>
          <Text style={styles.weekText}>Semaine 1/8</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </View>
        
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

        {/* Today's Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's workouts</Text>
          
          {todayWorkouts.map((workout) => (
            <LinearGradient
              key={workout.id}
              colors={Colors.gradients.accent}
              style={styles.workoutCard}
            >
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutTime}>
                  {workout.time} · {workout.duration}
                </Text>
                <TouchableOpacity style={styles.workoutMenu}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="white" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.workoutTitle}>{workout.title}</Text>
              <Text style={styles.workoutSubtitle}>{workout.subtitle}</Text>
              
              <TouchableOpacity style={styles.playButton}>
                <Ionicons name="play" size={16} color="white" />
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </View>

        {/* Week Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Week 1 Overview</Text>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.overviewCard}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(stats.weekProgress / stats.totalWorkouts) * 100}%` }]} />
            </View>
            <View style={styles.overviewStats}>
              <Text style={styles.overviewLabel}>WORKOUTS {stats.weekProgress}/{stats.totalWorkouts}</Text>
              <Text style={styles.overviewLabel}>DISTANCE {stats.weekDistance}KM</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My insights</Text>
            <TouchableOpacity style={styles.expandButton}>
              <Text style={styles.expandText}>EXPAND</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.insightsRow}>
            <LinearGradient
              colors={Colors.gradients.primary}
              style={styles.insightCard}
            >
              <View style={styles.insightHeader}>
                <Text style={styles.insightDate}>16 Août</Text>
                <Text style={styles.insightPercentage}>62%</Text>
              </View>
              <Text style={styles.insightDetail}>06:45</Text>
              <Text style={styles.insightDetail}>21:06</Text>
              <Ionicons name="star" size={16} color="#FFD700" style={styles.insightStar} />
            </LinearGradient>
            
            <View style={styles.weekInsight}>
              <Text style={styles.weekLabel}>WEEK 1</Text>
              <Text style={styles.weekRatio}>2/3</Text>
            </View>
          </View>
          
          <LinearGradient
            colors={[Colors.info, Colors.infoLight]}
            style={styles.beauchampCard}
          >
            <Text style={styles.beauchampTitle}>Beauchamp</Text>
            <Text style={styles.beauchampTemp}>23°</Text>
            <View style={styles.beauchampFooter}>
              <Ionicons name="sunny" size={16} color="white" />
              <Text style={styles.beauchampRun}>RUN</Text>
              <Text style={styles.beauchampRatio}>2/3</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />

      </ScrollView>

      {/* Record Workout Button */}
      <TouchableOpacity style={styles.recordButton}>
        <Ionicons name="play" size={20} color="white" style={styles.recordIcon} />
        <Text style={styles.recordText}>Record workout</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="today" size={24} color={Colors.accent} />
          <Text style={[styles.navLabel, { color: Colors.accent }]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="calendar-outline" size={24} color={Colors.navigation.inactive} />
          <Text style={styles.navLabel}>Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart-outline" size={24} color={Colors.navigation.inactive} />
          <Text style={styles.navLabel}>Activity</Text>
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
    paddingTop: Spacing.lg,
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
  overviewCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.progress.background,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.progress.fill,
    borderRadius: BorderRadius.xs,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewLabel: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
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
    height: 100,
  },
  recordButton: {
    position: 'absolute',
    bottom: 90,
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
});

export default HomeScreen;