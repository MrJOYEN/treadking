import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
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

interface EditProfileScreenProps {
  navigation?: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    level: 'beginner',
    goal: '5k',
    weeklyAvailability: 3,
    maxSpeed: 12,
    maxIncline: 15,
    hasHeartRateMonitor: false,
    preferredSpeedRange: {
      walkingSpeed: 5,
      runningSpeed: 10,
      sprintSpeed: 15,
    },
    usualWorkoutDuration: 45,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const userProfile = await ProfileService.getProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const success = await ProfileService.updateProfile(user.id, profile);
      
      if (success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès', [
          { text: 'OK', onPress: () => {
            // Navigate back and trigger a refresh of the profile screen
            navigation?.goBack();
          }}
        ]);
      } else {
        Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const updateSpeedRange = (speedType: 'walkingSpeed' | 'runningSpeed' | 'sprintSpeed', value: number) => {
    setProfile(prev => ({
      ...prev,
      preferredSpeedRange: {
        ...prev.preferredSpeedRange,
        [speedType]: value,
      }
    }));
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <Text style={styles.saveButton}>Sauver</Text>
          )}
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
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </LinearGradient>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Informations personnelles</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.textInput}
                value={profile.name || ''}
                onChangeText={(text) => updateProfile('name', text)}
                placeholder="Votre nom"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Level & Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Niveau et objectif</Text>
          <View style={styles.card}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Niveau</Text>
              <View style={styles.buttonGroup}>
                {[
                  { key: 'beginner', label: 'Débutant' },
                  { key: 'intermediate', label: 'Intermédiaire' },
                  { key: 'advanced', label: 'Avancé' }
                ].map(level => (
                  <TouchableOpacity
                    key={level.key}
                    style={[
                      styles.optionButton,
                      profile.level === level.key && styles.selectedOption
                    ]}
                    onPress={() => updateProfile('level', level.key)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.level === level.key && styles.selectedText
                    ]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Objectif</Text>
              <View style={styles.buttonGroup}>
                {[
                  { key: '5k', label: '5K' },
                  { key: '10k', label: '10K' },
                  { key: 'half_marathon', label: 'Semi' },
                  { key: 'marathon', label: 'Marathon' }
                ].map(goal => (
                  <TouchableOpacity
                    key={goal.key}
                    style={[
                      styles.optionButton,
                      profile.goal === goal.key && styles.selectedOption
                    ]}
                    onPress={() => updateProfile('goal', goal.key)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.goal === goal.key && styles.selectedText
                    ]}>
                      {goal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </View>

        {/* Weekly Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Disponibilité</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jours par semaine</Text>
              <View style={styles.buttonGroup}>
                {[3, 4, 5, 6].map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.optionButton,
                      profile.weeklyAvailability === days && styles.selectedOption
                    ]}
                    onPress={() => updateProfile('weeklyAvailability', days)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.weeklyAvailability === days && styles.selectedText
                    ]}>
                      {days}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Durée habituelle (minutes)</Text>
              <View style={styles.buttonGroup}>
                {[30, 45, 60, 75, 90].map(duration => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.optionButton,
                      profile.usualWorkoutDuration === duration && styles.selectedOption
                    ]}
                    onPress={() => updateProfile('usualWorkoutDuration', duration)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.usualWorkoutDuration === duration && styles.selectedText
                    ]}>
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏃‍♂️ Équipement</Text>
          <View style={styles.card}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vitesse maximale (km/h)</Text>
              <View style={styles.buttonGroup}>
                {[10, 12, 15, 18, 20].map(speed => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.optionButton,
                      profile.maxSpeed === speed && styles.selectedOption
                    ]}
                    onPress={() => updateProfile('maxSpeed', speed)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.maxSpeed === speed && styles.selectedText
                    ]}>
                      {speed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Inclinaison maximale (%)</Text>
              <View style={styles.buttonGroup}>
                {[10, 15, 20, 25].map(incline => (
                  <TouchableOpacity
                    key={incline}
                    style={[
                      styles.optionButton,
                      profile.maxIncline === incline && styles.selectedOption
                    ]}
                    onPress={() => updateProfile('maxIncline', incline)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.maxIncline === incline && styles.selectedText
                    ]}>
                      {incline}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkboxOption, profile.hasHeartRateMonitor && styles.selectedCheckbox]}
              onPress={() => updateProfile('hasHeartRateMonitor', !profile.hasHeartRateMonitor)}
            >
              <Ionicons 
                name={profile.hasHeartRateMonitor ? "checkbox" : "checkbox-outline"} 
                size={20} 
                color={profile.hasHeartRateMonitor ? Colors.accent : Colors.textSecondary} 
              />
              <Text style={styles.checkboxText}>Capteur de fréquence cardiaque</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Speed Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Vitesses préférées</Text>
          <View style={styles.card}>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🚶 Marche rapide (km/h)</Text>
              <View style={styles.buttonGroup}>
                {[4, 5, 6, 7].map(speed => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.optionButton,
                      profile.preferredSpeedRange?.walkingSpeed === speed && styles.selectedOption
                    ]}
                    onPress={() => updateSpeedRange('walkingSpeed', speed)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.preferredSpeedRange?.walkingSpeed === speed && styles.selectedText
                    ]}>
                      {speed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🏃 Course confortable (km/h)</Text>
              <View style={styles.buttonGroup}>
                {[6, 7, 8, 9, 10, 11].map(speed => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.optionButton,
                      profile.preferredSpeedRange?.runningSpeed === speed && styles.selectedOption
                    ]}
                    onPress={() => updateSpeedRange('runningSpeed', speed)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.preferredSpeedRange?.runningSpeed === speed && styles.selectedText
                    ]}>
                      {speed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>⚡ Sprint (km/h)</Text>
              <View style={styles.buttonGroup}>
                {[11, 12, 13, 14, 15].map(speed => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.optionButton,
                      profile.preferredSpeedRange?.sprintSpeed === speed && styles.selectedOption
                    ]}
                    onPress={() => updateSpeedRange('sprintSpeed', speed)}
                  >
                    <Text style={[
                      styles.optionText,
                      profile.preferredSpeedRange?.sprintSpeed === speed && styles.selectedText
                    ]}>
                      {speed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </View>
        </View>

        <View style={styles.bottomSpacing} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    ...CommonStyles.header,
  },
  headerTitle: {
    ...CommonStyles.headerTitle,
  },
  saveButton: {
    ...Typography.label,
    color: Colors.accent,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    ...CommonStyles.section,
  },
  sectionTitle: {
    ...CommonStyles.sectionTitle,
  },
  card: {
    ...CommonStyles.card,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    ...CommonStyles.input,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  optionText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  selectedText: {
    color: Colors.accent,
    fontWeight: '600',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  selectedCheckbox: {
    // Add any specific styling for selected checkbox if needed
  },
  checkboxText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default EditProfileScreen;