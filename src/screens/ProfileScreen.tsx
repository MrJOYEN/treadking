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
import { useAuth } from '../contexts/AuthContext';
import { ProfileService } from '../services/profileService';
import { UserProfile } from '../types';
import { Colors } from '../theme/colors';
import { CommonStyles, Typography, Spacing, BorderRadius, Shadows } from '../theme/commonStyles';

interface ProfileScreenProps {
  navigation?: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', () => {
      // Reload profile when screen comes into focus
      loadProfile();
    });

    return unsubscribe;
  }, [navigation]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const userProfile = await ProfileService.getProfile(user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const getGoalLabel = (goal: string) => {
    const goals: { [key: string]: string } = {
      '5k': '5 KM',
      '10k': '10 KM', 
      'half_marathon': 'Semi-Marathon',
      'marathon': 'Marathon',
      'ultra_marathon': 'Ultra-Marathon',
    };
    return goals[goal] || goal;
  };

  const getLevelLabel = (level: string) => {
    const levels: { [key: string]: string } = {
      'beginner': 'Débutant',
      'intermediate': 'Intermédiaire',
      'advanced': 'Avancé',
    };
    return levels[level] || level;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={60} color="#666" />
          <Text style={styles.errorText}>Profil non trouvé</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('EditProfile')}>
          <Ionicons name="create-outline" size={24} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <LinearGradient
          colors={Colors.gradients.accent}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profile.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile.name || 'Utilisateur'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getLevelLabel(profile.level || '')}</Text>
            <Text style={styles.statLabel}>Niveau</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getGoalLabel(profile.goal || '')}</Text>
            <Text style={styles.statLabel}>Objectif</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.weeklyAvailability}</Text>
            <Text style={styles.statLabel}>Jours/sem</Text>
          </View>
        </View>

        {/* Equipment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏃‍♂️ Mon Équipement</Text>
          <View style={styles.equipmentCard}>
            <View style={styles.equipmentRow}>
              <Ionicons name="speedometer-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.equipmentLabel}>Vitesse max</Text>
              <Text style={styles.equipmentValue}>{profile.maxSpeed} km/h</Text>
            </View>
            <View style={styles.equipmentRow}>
              <Ionicons name="trending-up-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.equipmentLabel}>Inclinaison max</Text>
              <Text style={styles.equipmentValue}>{profile.maxIncline}%</Text>
            </View>
            <View style={styles.equipmentRow}>
              <Ionicons name="heart-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.equipmentLabel}>Capteur cardiaque</Text>
              <Text style={styles.equipmentValue}>
                {profile.hasHeartRateMonitor ? 'Oui' : 'Non'}
              </Text>
            </View>
          </View>
        </View>

        {/* Speed Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Mes Vitesses</Text>
          <View style={styles.speedCard}>
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>🚶 Marche rapide</Text>
              <Text style={styles.speedValue}>{profile.preferredSpeedRange?.walkingSpeed} km/h</Text>
            </View>
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>🏃 Course confortable</Text>
              <Text style={styles.speedValue}>{profile.preferredSpeedRange?.runningSpeed} km/h</Text>
            </View>
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>⚡ Sprint</Text>
              <Text style={styles.speedValue}>
                {profile.preferredSpeedRange?.sprintSpeed === 0 
                  ? 'Non définie' 
                  : `${profile.preferredSpeedRange?.sprintSpeed} km/h`}
              </Text>
            </View>
          </View>
        </View>

        {/* Workout Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Mes Préférences</Text>
          <View style={styles.preferencesCard}>
            <View style={styles.preferenceRow}>
              <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.preferenceLabel}>Durée habituelle</Text>
              <Text style={styles.preferenceValue}>{profile.usualWorkoutDuration} min</Text>
            </View>
            <View style={styles.preferenceRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.preferenceLabel}>Disponibilité</Text>
              <Text style={styles.preferenceValue}>{profile.weeklyAvailability} jours/semaine</Text>
            </View>
          </View>
        </View>

        {/* Experience */}
        {profile.previousExperience && profile.previousExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Mon Expérience</Text>
            <View style={styles.experienceCard}>
              {profile.previousExperience.map((exp, index) => (
                <View key={index} style={styles.experienceItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.experienceText}>
                    {getExperienceLabel(exp)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.editButton} onPress={() => navigation?.navigate('EditProfile')}>
            <Ionicons name="create-outline" size={20} color={Colors.accent} />
            <Text style={styles.editButtonText}>Modifier mon profil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />

      </ScrollView>
    </SafeAreaView>
  );
};

const getExperienceLabel = (exp: string): string => {
  const labels: { [key: string]: string } = {
    'previous_5k': 'Course 5K',
    'previous_10k': 'Course 10K', 
    'previous_half': 'Semi-marathon',
    'previous_marathon': 'Marathon',
    'gym_experience': 'Fitness/Musculation',
    'other_sports': 'Autres sports',
    'treadmill_experience': 'Tapis de course',
    'interval_training': 'Entraînement intervalles',
  };
  return labels[exp] || exp;
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginVertical: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    ...CommonStyles.header,
  },
  headerTitle: {
    ...CommonStyles.headerTitle,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  section: {
    ...CommonStyles.section,
  },
  sectionTitle: {
    ...CommonStyles.sectionTitle,
  },
  equipmentCard: {
    ...CommonStyles.card,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  equipmentLabel: {
    flex: 1,
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.md,
  },
  equipmentValue: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  speedCard: {
    ...CommonStyles.card,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  speedLabel: {
    fontSize: 16,
    color: '#374151',
  },
  speedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  preferencesCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  preferenceLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  experienceCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  experienceText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  editButton: {
    ...CommonStyles.buttonSecondary,
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  editButtonText: {
    ...Typography.label,
    color: Colors.accent,
    marginLeft: Spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorSoft,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  logoutButtonText: {
    ...Typography.label,
    color: Colors.error,
    marginLeft: Spacing.sm,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileScreen;