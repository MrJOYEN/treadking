import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ProfileService } from '../services/profileService';

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({
    name: '',
    level: 'beginner',
    goal: '5k',
    weeklyAvailability: 3,
    previousExperience: [],
    physicalConstraints: [],
    maxSpeed: 12,
    maxIncline: 15,
    hasHeartRateMonitor: false,
    preferredSpeedRange: {
      walkingSpeed: 5,
      runningSpeed: 10,
      sprintSpeed: 15,
    },
    comfortableInclines: {
      flat: 0,
      moderate: 5,
      steep: 10,
    },
    usualWorkoutDuration: 45,
    preferredWorkoutTimes: [],
  });

  const steps = [
    'welcome',
    'level',
    'goal',
    'availability',
    'treadmill',
    'preferences',
    'experience',
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save profile to Supabase and navigate
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      setSaving(true);
      
      try {
        const success = await ProfileService.createOrUpdateProfile(user.id, userProfile);
        
        if (success) {
          // Force a re-check of the profile in App.tsx by triggering a navigation reset
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else {
          Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
        }
      } catch (error) {
        console.error('Error saving profile:', error);
        Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setUserProfile(prev => ({ ...prev, [key]: value }));
  };

  const renderStepContent = () => {
    switch (steps[currentStep]) {
      case 'welcome':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.emoji}>🏃‍♂️</Text>
            <Text style={styles.title}>Bienvenue sur TreadKing !</Text>
            <Text style={styles.subtitle}>
              L'application qui transforme votre tapis de course en coach personnel avec IA intégrée.
            </Text>
            <View style={styles.featuresContainer}>
              <FeatureItem icon="🧠" text="Plans IA personnalisés" />
              <FeatureItem icon="⏱️" text="Tracking temps réel" />
              <FeatureItem icon="📊" text="Statistiques avancées" />
              <FeatureItem icon="📱" text="Mode offline complet" />
            </View>
          </View>
        );

      case 'level':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Quel est votre niveau en course à pied ?</Text>
            <Text style={styles.subtitle}>Cela nous aide à créer un plan adapté à vos capacités.</Text>
            <View style={styles.optionsContainer}>
              <LevelOption
                level="beginner"
                title="Débutant"
                description="Je commence la course ou j'ai moins de 6 mois d'expérience"
                icon="🚶"
                selected={userProfile.level === 'beginner'}
                onSelect={() => updateProfile('level', 'beginner')}
              />
              <LevelOption
                level="intermediate"
                title="Intermédiaire"
                description="Je cours régulièrement depuis 6 mois à 2 ans"
                icon="🏃"
                selected={userProfile.level === 'intermediate'}
                onSelect={() => updateProfile('level', 'intermediate')}
              />
              <LevelOption
                level="advanced"
                title="Avancé"
                description="Je cours depuis plus de 2 ans avec expérience en compétition"
                icon="🏆"
                selected={userProfile.level === 'advanced'}
                onSelect={() => updateProfile('level', 'advanced')}
              />
            </View>
          </View>
        );

      case 'goal':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Quel est votre objectif principal ?</Text>
            <Text style={styles.subtitle}>Nous adapterons votre plan d'entraînement en conséquence.</Text>
            <View style={styles.goalGrid}>
              {(['5k', '10k', 'half_marathon', 'marathon', 'ultra_marathon'] as const).map(goal => (
                <GoalOption
                  key={goal}
                  goal={goal}
                  title={getGoalTitle(goal)}
                  selected={userProfile.goal === goal}
                  onSelect={() => updateProfile('goal', goal)}
                />
              ))}
            </View>
          </View>
        );

      case 'availability':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Combien de jours par semaine pouvez-vous vous entraîner ?</Text>
            <Text style={styles.subtitle}>Soyez réaliste, nous préférons un plan que vous suivrez régulièrement.</Text>
            <View style={styles.optionsContainer}>
              {[3, 4, 5, 6].map(days => (
                <AvailabilityOption
                  key={days}
                  days={days}
                  description={getAvailabilityDescription(days)}
                  selected={userProfile.weeklyAvailability === days}
                  onSelect={() => updateProfile('weeklyAvailability', days)}
                />
              ))}
            </View>
          </View>
        );

      case 'treadmill':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>📱 Votre équipement tapis de course</Text>
            <Text style={styles.subtitle}>Ces informations nous aident à personnaliser vos entraînements selon votre matériel.</Text>
            
            <View style={styles.treadmillContainer}>
              <View style={styles.speedContainer}>
                <Text style={styles.sectionTitle}>Vitesse maximale de votre tapis</Text>
                <View style={styles.speedSelector}>
                  {[10, 12, 15, 18, 20].map(speed => (
                    <TouchableOpacity
                      key={speed}
                      style={[styles.speedOption, userProfile.maxSpeed === speed && styles.selectedSpeedOption]}
                      onPress={() => updateProfile('maxSpeed', speed)}
                    >
                      <Text style={[styles.speedText, userProfile.maxSpeed === speed && styles.selectedSpeedText]}>
                        {speed} km/h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inclineContainer}>
                <Text style={styles.sectionTitle}>Inclinaison maximale</Text>
                <View style={styles.inclineSelector}>
                  {[10, 15, 20, 25].map(incline => (
                    <TouchableOpacity
                      key={incline}
                      style={[styles.inclineOption, userProfile.maxIncline === incline && styles.selectedInclineOption]}
                      onPress={() => updateProfile('maxIncline', incline)}
                    >
                      <Text style={[styles.inclineText, userProfile.maxIncline === incline && styles.selectedInclineText]}>
                        {incline}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.heartRateOption, userProfile.hasHeartRateMonitor && styles.selectedOption]}
                onPress={() => updateProfile('hasHeartRateMonitor', !userProfile.hasHeartRateMonitor)}
              >
                <Text style={styles.heartRateIcon}>💓</Text>
                <Text style={[styles.heartRateText, userProfile.hasHeartRateMonitor && styles.selectedText]}>
                  Mon tapis a un capteur de fréquence cardiaque
                </Text>
                {userProfile.hasHeartRateMonitor && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'preferences':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>⚙️ Vos préférences d'entraînement</Text>
            <Text style={styles.subtitle}>Définissons vos vitesses de confort pour créer des plans adaptés.</Text>
            
            <View style={styles.preferencesContainer}>
              <View style={styles.speedRangeContainer}>
                <Text style={styles.sectionTitle}>Vos vitesses préférées</Text>
                
                <View style={styles.speedRangeItem}>
                  <Text style={styles.speedRangeLabel}>🚶 Marche rapide</Text>
                  <View style={styles.speedButtons}>
                    {[4, 5, 6, 7].map(speed => (
                      <TouchableOpacity
                        key={speed}
                        style={[styles.speedButton, userProfile.preferredSpeedRange?.walkingSpeed === speed && styles.selectedSpeedButton]}
                        onPress={() => updateProfile('preferredSpeedRange', {...userProfile.preferredSpeedRange, walkingSpeed: speed})}
                      >
                        <Text style={[styles.speedButtonText, userProfile.preferredSpeedRange?.walkingSpeed === speed && styles.selectedSpeedButtonText]}>
                          {speed}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.speedRangeItem}>
                  <Text style={styles.speedRangeLabel}>🏃 Course confortable</Text>
                  <View style={styles.speedButtons}>
                    {[6, 7, 8, 9, 10].map(speed => (
                      <TouchableOpacity
                        key={speed}
                        style={[styles.speedButton, userProfile.preferredSpeedRange?.runningSpeed === speed && styles.selectedSpeedButton]}
                        onPress={() => updateProfile('preferredSpeedRange', {...userProfile.preferredSpeedRange, runningSpeed: speed})}
                      >
                        <Text style={[styles.speedButtonText, userProfile.preferredSpeedRange?.runningSpeed === speed && styles.selectedSpeedButtonText]}>
                          {speed}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.speedRangeItem}>
                  <Text style={styles.speedRangeLabel}>⚡ Sprint/Vitesse max</Text>
                  <View style={styles.speedButtons}>
                    {[11, 12, 13, 14].map(speed => (
                      <TouchableOpacity
                        key={speed}
                        style={[styles.speedButton, userProfile.preferredSpeedRange?.sprintSpeed === speed && styles.selectedSpeedButton]}
                        onPress={() => updateProfile('preferredSpeedRange', {...userProfile.preferredSpeedRange, sprintSpeed: speed})}
                      >
                        <Text style={[styles.speedButtonText, userProfile.preferredSpeedRange?.sprintSpeed === speed && styles.selectedSpeedButtonText]}>
                          {speed}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.speedButton, styles.unknownSpeedButton, userProfile.preferredSpeedRange?.sprintSpeed === 0 && styles.selectedSpeedButton]}
                      onPress={() => updateProfile('preferredSpeedRange', {...userProfile.preferredSpeedRange, sprintSpeed: 0})}
                    >
                      <Text style={[styles.speedButtonText, styles.unknownSpeedText, userProfile.preferredSpeedRange?.sprintSpeed === 0 && styles.selectedSpeedButtonText]}>
                        ?
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.speedHint}>Sélectionnez "?" si vous ne connaissez pas encore votre vitesse de sprint</Text>
                </View>
              </View>

              <View style={styles.durationContainer}>
                <Text style={styles.sectionTitle}>Durée habituelle d'entraînement</Text>
                <View style={styles.durationSelector}>
                  {[30, 45, 60, 75, 90].map(duration => (
                    <TouchableOpacity
                      key={duration}
                      style={[styles.durationOption, userProfile.usualWorkoutDuration === duration && styles.selectedDurationOption]}
                      onPress={() => updateProfile('usualWorkoutDuration', duration)}
                    >
                      <Text style={[styles.durationText, userProfile.usualWorkoutDuration === duration && styles.selectedDurationText]}>
                        {duration} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        );

      case 'experience':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>🏆 Dernière étape !</Text>
            <Text style={styles.subtitle}>Avez-vous des expériences particulières en course ?</Text>
            <View style={styles.checkboxContainer}>
              {[
                { key: 'previous_5k', label: 'J\'ai déjà couru un 5K' },
                { key: 'previous_10k', label: 'J\'ai déjà couru un 10K' },
                { key: 'previous_half', label: 'J\'ai déjà couru un semi-marathon' },
                { key: 'previous_marathon', label: 'J\'ai déjà couru un marathon' },
                { key: 'gym_experience', label: 'J\'ai l\'habitude du fitness/musculation' },
                { key: 'other_sports', label: 'Je pratique d\'autres sports régulièrement' },
                { key: 'treadmill_experience', label: 'J\'ai l\'habitude du tapis de course' },
                { key: 'interval_training', label: 'J\'ai déjà fait de l\'entraînement par intervalles' },
              ].map(item => (
                <ExperienceCheckbox
                  key={item.key}
                  experienceKey={item.key}
                  label={item.label}
                  checked={userProfile.previousExperience?.includes(item.key) || false}
                  onToggle={(checked) => {
                    const current = userProfile.previousExperience || [];
                    if (checked) {
                      updateProfile('previousExperience', [...current, item.key]);
                    } else {
                      updateProfile('previousExperience', current.filter(exp => exp !== item.key));
                    }
                  }}
                />
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TreadKing</Text>
        <Text style={styles.progress}>{currentStep + 1}/7</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
              <Text style={styles.backButtonText}>Précédent</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.indicatorContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  { backgroundColor: index === currentStep ? '#2196F3' : '#E0E0E0' }
                ]}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.nextButton, saving && styles.nextButtonDisabled]} 
            onPress={handleNext}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === steps.length - 1 ? 'Commencer' : 'Suivant'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Helper Components
const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const LevelOption: React.FC<{
  level: string;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ title, description, icon, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.levelOption, selected && styles.selectedOption]}
    onPress={onSelect}
  >
    <Text style={styles.levelIcon}>{icon}</Text>
    <View style={styles.levelTextContainer}>
      <Text style={[styles.levelTitle, selected && styles.selectedText]}>{title}</Text>
      <Text style={styles.levelDescription}>{description}</Text>
    </View>
    {selected && <Text style={styles.checkmark}>✓</Text>}
  </TouchableOpacity>
);

const GoalOption: React.FC<{
  goal: string;
  title: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ title, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.goalOption, selected && styles.selectedGoalOption]}
    onPress={onSelect}
  >
    <Text style={styles.goalIcon}>🏁</Text>
    <Text style={[styles.goalTitle, selected && styles.selectedText]}>{title}</Text>
    {selected && <Text style={styles.smallCheckmark}>✓</Text>}
  </TouchableOpacity>
);

const AvailabilityOption: React.FC<{
  days: number;
  description: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ days, description, selected, onSelect }) => (
  <TouchableOpacity
    style={[styles.availabilityOption, selected && styles.selectedOption]}
    onPress={onSelect}
  >
    <View style={[styles.daysCircle, selected && styles.selectedDaysCircle]}>
      <Text style={[styles.daysText, selected && styles.selectedDaysText]}>{days}</Text>
    </View>
    <Text style={[styles.availabilityDescription, selected && styles.selectedText]}>
      {description}
    </Text>
    {selected && <Text style={styles.checkmark}>✓</Text>}
  </TouchableOpacity>
);

const ExperienceCheckbox: React.FC<{
  experienceKey: string;
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}> = ({ label, checked, onToggle }) => (
  <TouchableOpacity
    style={styles.checkboxItem}
    onPress={() => onToggle(!checked)}
  >
    <View style={[styles.checkbox, checked && styles.checkedCheckbox]}>
      {checked && <Text style={styles.checkboxCheck}>✓</Text>}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

// Helper Functions
const getGoalTitle = (goal: string): string => {
  const titles = {
    '5k': '5 KM',
    '10k': '10 KM',
    'half_marathon': 'Semi-Marathon',
    'marathon': 'Marathon',
    'ultra_marathon': 'Ultra-Marathon',
  };
  return titles[goal as keyof typeof titles] || goal;
};

const getAvailabilityDescription = (days: number): string => {
  const descriptions = {
    3: 'Débutant - 3 jours par semaine (recommandé pour commencer)',
    4: 'Régulier - 4 jours par semaine (bon équilibre)',
    5: 'Assidu - 5 jours par semaine (progression rapide)',
    6: 'Intensif - 6 jours par semaine (pour coureurs expérimentés)',
  };
  return descriptions[days as keyof typeof descriptions] || '';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progress: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emoji: {
    fontSize: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  optionsContainer: {
    width: '100%',
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  levelIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  levelTextContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  selectedText: {
    color: '#2196F3',
  },
  checkmark: {
    fontSize: 24,
    color: '#2196F3',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  goalOption: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedGoalOption: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  goalIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  smallCheckmark: {
    fontSize: 20,
    color: '#2196F3',
    marginTop: 8,
  },
  availabilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  daysCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedDaysCircle: {
    backgroundColor: '#2196F3',
  },
  daysText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedDaysText: {
    color: '#FFF',
  },
  availabilityDescription: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  checkboxContainer: {
    width: '100%',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkboxCheck: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Treadmill specific styles
  treadmillContainer: {
    width: '100%',
  },
  speedContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  speedSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  speedOption: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: '18%',
    alignItems: 'center',
  },
  selectedSpeedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  speedText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedSpeedText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  inclineContainer: {
    marginBottom: 24,
  },
  inclineSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inclineOption: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: '22%',
    alignItems: 'center',
  },
  selectedInclineOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  inclineText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedInclineText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  heartRateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  heartRateIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  heartRateText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  
  // Preferences styles
  preferencesContainer: {
    width: '100%',
  },
  speedRangeContainer: {
    marginBottom: 24,
  },
  speedRangeItem: {
    marginBottom: 20,
  },
  speedRangeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  speedButton: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: '18%',
    alignItems: 'center',
  },
  selectedSpeedButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  speedButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedSpeedButtonText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  durationContainer: {
    marginBottom: 16,
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  durationOption: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: '18%',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedDurationOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  durationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedDurationText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  unknownSpeedButton: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  unknownSpeedText: {
    color: '#FF9800',
    fontSize: 18,
    fontWeight: 'bold',
  },
  speedHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default OnboardingScreen;