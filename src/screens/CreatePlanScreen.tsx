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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { PlanService } from '../services/planService';
import { AIService } from '../services/aiService';
import { ProfileService } from '../services/profileService';
import { CalendarService } from '../services/calendarService';
import { UserProfile, WorkoutType } from '../types';
import { Colors } from '../theme/colors';
import { CommonStyles, Typography, Spacing, BorderRadius, Shadows } from '../theme/commonStyles';

interface CreatePlanScreenProps {
  navigation?: any;
}

const CreatePlanScreen: React.FC<CreatePlanScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string>('5K');
  const [selectedDuration, setSelectedDuration] = useState<number>(6);
  const [selectedIntensity, setSelectedIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Lundi, Mercredi, Vendredi par défaut

  const goals = [
    { key: '5K', label: '5 KM', icon: 'walk-outline', description: 'Idéal pour débuter ou se remettre en forme' },
    { key: '10K', label: '10 KM', icon: 'fitness-outline', description: 'Challenge intermédiaire, excellent pour progresser' },
    { key: 'Semi-Marathon', label: 'Semi', icon: 'bicycle-outline', description: 'Défi ambitieux pour coureurs confirmés' },
    { key: 'Marathon', label: 'Marathon', icon: 'trophy-outline', description: 'Le graal du coureur de fond' },
  ];

  // Durées adaptées selon l'objectif sélectionné
  const getDurations = () => {
    switch (selectedGoal) {
      case '5K':
        return [
          { weeks: 4, label: '4 semaines', description: 'Plan compact pour débuter' },
          { weeks: 6, label: '6 semaines', description: 'Progression confortable' },
          { weeks: 8, label: '8 semaines', description: 'Préparation solide' },
        ];
      case '10K':
        return [
          { weeks: 6, label: '6 semaines', description: 'Minimum recommandé' },
          { weeks: 8, label: '8 semaines', description: 'Préparation équilibrée' },
          { weeks: 12, label: '12 semaines', description: 'Progression optimale' },
        ];
      case 'Semi-Marathon':
        return [
          { weeks: 8, label: '8 semaines', description: 'Préparation intensive' },
          { weeks: 12, label: '12 semaines', description: 'Progression recommandée' },
          { weeks: 16, label: '16 semaines', description: 'Préparation complète' },
        ];
      case 'Marathon':
        return [
          { weeks: 12, label: '12 semaines', description: 'Minimum pour coureurs expérimentés' },
          { weeks: 16, label: '16 semaines', description: 'Préparation standard' },
          { weeks: 20, label: '20 semaines', description: 'Préparation idéale' },
        ];
      default:
        return [
          { weeks: 4, label: '4 semaines', description: 'Plan court' },
          { weeks: 8, label: '8 semaines', description: 'Plan standard' },
        ];
    }
  };

  const durations = getDurations();

  // Ajuster la durée sélectionnée quand l'objectif change
  const handleGoalChange = (newGoal: string) => {
    setSelectedGoal(newGoal);
    // Sélectionner automatiquement la durée médiane pour le nouvel objectif
    const newDurationsForGoal = (() => {
      switch (newGoal) {
        case '5K':
          return [
            { weeks: 4, label: '4 semaines', description: 'Plan compact pour débuter' },
            { weeks: 6, label: '6 semaines', description: 'Progression confortable' },
            { weeks: 8, label: '8 semaines', description: 'Préparation solide' },
          ];
        case '10K':
          return [
            { weeks: 6, label: '6 semaines', description: 'Minimum recommandé' },
            { weeks: 8, label: '8 semaines', description: 'Préparation équilibrée' },
            { weeks: 12, label: '12 semaines', description: 'Progression optimale' },
          ];
        case 'Semi-Marathon':
          return [
            { weeks: 8, label: '8 semaines', description: 'Préparation intensive' },
            { weeks: 12, label: '12 semaines', description: 'Progression recommandée' },
            { weeks: 16, label: '16 semaines', description: 'Préparation complète' },
          ];
        case 'Marathon':
          return [
            { weeks: 12, label: '12 semaines', description: 'Minimum pour coureurs expérimentés' },
            { weeks: 16, label: '16 semaines', description: 'Préparation standard' },
            { weeks: 20, label: '20 semaines', description: 'Préparation idéale' },
          ];
        default:
          return [
            { weeks: 4, label: '4 semaines', description: 'Plan court' },
            { weeks: 8, label: '8 semaines', description: 'Plan standard' },
          ];
      }
    })();
    const medianIndex = Math.floor(newDurationsForGoal.length / 2);
    setSelectedDuration(newDurationsForGoal[medianIndex].weeks);
  };

  const intensities = [
    { key: 'light' as const, label: 'Léger', icon: 'leaf-outline', description: 'Progression douce et sécurisée' },
    { key: 'moderate' as const, label: 'Modéré', icon: 'flame-outline', description: 'Équilibre entre effort et récupération' },
    { key: 'intense' as const, label: 'Intensif', icon: 'flash-outline', description: 'Progression rapide pour coureurs expérimentés' },
  ];

  const weekDays = [
    { number: 1, short: 'L', full: 'Lundi', icon: 'calendar-outline' },
    { number: 2, short: 'M', full: 'Mardi', icon: 'calendar-outline' },
    { number: 3, short: 'M', full: 'Mercredi', icon: 'calendar-outline' },
    { number: 4, short: 'J', full: 'Jeudi', icon: 'calendar-outline' },
    { number: 5, short: 'V', full: 'Vendredi', icon: 'calendar-outline' },
    { number: 6, short: 'S', full: 'Samedi', icon: 'calendar-outline' },
    { number: 7, short: 'D', full: 'Dimanche', icon: 'calendar-outline' },
  ];

  // Fonction pour gérer la sélection des jours
  const toggleDay = (dayNumber: number) => {
    if (selectedDays.includes(dayNumber)) {
      // Retirer le jour (minimum 2 jours requis)
      if (selectedDays.length > 2) {
        setSelectedDays(selectedDays.filter(day => day !== dayNumber));
      } else {
        Alert.alert('Minimum requis', 'Veuillez sélectionner au moins 2 jours d\'entraînement par semaine.');
      }
    } else {
      // Ajouter le jour (maximum 6 jours)
      if (selectedDays.length < 6) {
        setSelectedDays([...selectedDays, dayNumber].sort((a, b) => a - b));
      } else {
        Alert.alert('Maximum atteint', 'Maximum 6 jours d\'entraînement par semaine recommandés.');
      }
    }
  };

  // Fonction pour prévisualiser les dates d'entraînement
  const getPreviewDates = () => {
    const startDate = new Date();
    const dates: string[] = [];
    
    for (let week = 1; week <= selectedDuration; week++) {
      selectedDays.forEach(dayOfWeek => {
        // Calculer le début de la semaine cible
        const daysToAdd = (week - 1) * 7;
        const targetWeekStart = new Date(startDate);
        targetWeekStart.setDate(startDate.getDate() + daysToAdd);
        
        // Ajuster au lundi de cette semaine
        const currentDayOfWeek = targetWeekStart.getDay();
        const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
        const monday = new Date(targetWeekStart);
        monday.setDate(targetWeekStart.getDate() + mondayOffset);
        
        // Ajouter les jours pour arriver au jour souhaité
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + (dayOfWeek - 1));
        
        dates.push(targetDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }));
      });
    }
    
    return dates.slice(0, 6); // Maximum 6 dates pour l'aperçu
  };

  const handleGenerateDebugPlan = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un plan');
      return;
    }

    setLoading(true);
    
    try {
      // Récupérer le profil utilisateur
      const userProfile = await ProfileService.getProfile(user.id);
      if (!userProfile) {
        Alert.alert('Erreur', 'Profil utilisateur introuvable. Veuillez compléter votre profil.');
        setLoading(false);
        return;
      }

      // Préparer les types de workout préférés (par défaut)
      const focusTypes: WorkoutType[] = ['easy_run', 'intervals', 'tempo'];
      
      // Créer un profil modifié avec les jours sélectionnés
      const enhancedProfile = {
        ...userProfile,
        weeklyAvailability: selectedDays.length,
        availableDays: selectedDays,
      };

      // Générer le plan avec le JSON de debug
      const result = await AIService.generateAndSaveDebugPlan(user.id, {
        userProfile: enhancedProfile,
        goal: selectedGoal,
        weeks: selectedDuration,
        intensity: selectedIntensity,
        focusTypes,
        startDate: new Date().toISOString(),
      });

      if (result.success && result.planId) {
        // Vérifier s'il y a une explication (réduction des séances pour sécurité)
        let message = `Votre plan debug "${result.plan?.name}" a été généré avec succès.`;
        
        if (result.explanation) {
          Alert.alert(
            'Plan debug créé !',
            `${result.explanation}\n\n${message}`,
            [
              {
                text: 'Voir le plan',
                onPress: () => {
                  navigation?.replace('PlanDetail', { planId: result.planId });
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Plan debug créé !',
            message,
            [
              {
                text: 'Voir le plan',
                onPress: () => {
                  navigation?.replace('PlanDetail', { planId: result.planId });
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer le plan debug');
      }
    } catch (error) {
      console.error('Error in handleGenerateDebugPlan:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la génération du plan debug');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un plan');
      return;
    }

    setLoading(true);
    
    try {
      // Récupérer le profil utilisateur
      const userProfile = await ProfileService.getProfile(user.id);
      if (!userProfile) {
        Alert.alert('Erreur', 'Profil utilisateur introuvable. Veuillez compléter votre profil.');
        setLoading(false);
        return;
      }

      // Préparer les types de workout préférés (par défaut)
      const focusTypes: WorkoutType[] = ['easy_run', 'intervals', 'tempo'];
      
      // Créer un profil modifié avec les jours sélectionnés
      const enhancedProfile = {
        ...userProfile,
        weeklyAvailability: selectedDays.length,
        availableDays: selectedDays,
      };

      // Générer le plan avec l'IA
      const result = await AIService.generateAndSaveTrainingPlan(user.id, {
        userProfile: enhancedProfile,
        goal: selectedGoal,
        weeks: selectedDuration,
        intensity: selectedIntensity,
        focusTypes,
        startDate: new Date().toISOString(),
      });

      if (result.success && result.planId) {
        // Vérifier s'il y a une explication (réduction des séances pour sécurité)
        let message = `Votre plan "${result.plan?.name}" a été généré avec succès.`;
        
        if (!result.plan?.generatedByAI) {
          message += '\n\nNote: Plan de base utilisé (IA non configurée).';
        }
        
        if (result.explanation) {
          Alert.alert(
            'Plan créé avec ajustements !',
            `${result.explanation}\n\n${message}`,
            [
              {
                text: 'Voir le plan',
                onPress: () => {
                  navigation?.replace('PlanDetail', { planId: result.planId });
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Plan créé !',
            message,
            [
              {
                text: 'Voir le plan',
                onPress: () => {
                  navigation?.replace('PlanDetail', { planId: result.planId });
                }
              }
            ]
          );
        }
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de générer le plan. Veuillez réessayer.');
      }

    } catch (error) {
      console.error('Error generating plan:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un plan</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>🎯 Votre plan personnalisé</Text>
          <Text style={styles.introText}>
            Définissez vos objectifs et notre IA TreadKing Coach Pro générera un plan d'entraînement scientifiquement adapté à votre profil.
          </Text>
          
          {/* Avertissement sécurité pour débutants */}
          {(selectedGoal === 'Marathon' || selectedGoal === 'Semi-Marathon') && (
            <View style={styles.safetyNotice}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.info} />
              <Text style={styles.safetyText}>
                Notre IA adaptera automatiquement le nombre de séances à votre niveau pour assurer une progression sécurisée et éviter les blessures.
              </Text>
            </View>
          )}
        </View>

        {/* Objectif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏁 Votre objectif</Text>
          <Text style={styles.sectionSubtitle}>Quelle distance souhaitez-vous préparer ?</Text>
          
          <View style={styles.goalGrid}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.key}
                style={[
                  styles.goalCard,
                  selectedGoal === goal.key && styles.selectedCard
                ]}
                onPress={() => handleGoalChange(goal.key)}
              >
                <Ionicons 
                  name={goal.icon as any} 
                  size={32} 
                  color={selectedGoal === goal.key ? Colors.accent : Colors.textSecondary} 
                />
                <Text style={[
                  styles.goalLabel,
                  selectedGoal === goal.key && styles.selectedText
                ]}>
                  {goal.label}
                </Text>
                <Text style={styles.goalDescription}>
                  {goal.description}
                </Text>
                {selectedGoal === goal.key && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={Colors.accent} 
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Durée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Durée du plan</Text>
          <Text style={styles.sectionSubtitle}>Combien de temps avez-vous pour vous préparer ?</Text>
          
          <View style={styles.durationContainer}>
            {durations.map((duration) => (
              <TouchableOpacity
                key={duration.weeks}
                style={[
                  styles.durationCard,
                  selectedDuration === duration.weeks && styles.selectedCard
                ]}
                onPress={() => setSelectedDuration(duration.weeks)}
              >
                <Text style={[
                  styles.durationWeeks,
                  selectedDuration === duration.weeks && styles.selectedText
                ]}>
                  {duration.weeks}
                </Text>
                <Text style={[
                  styles.durationLabel,
                  selectedDuration === duration.weeks && styles.selectedText
                ]}>
                  {duration.label}
                </Text>
                <Text style={styles.durationDescription}>
                  {duration.description}
                </Text>
                {selectedDuration === duration.weeks && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={Colors.accent} 
                    style={styles.checkIconSmall}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intensité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Intensité</Text>
          <Text style={styles.sectionSubtitle}>À quel rythme souhaitez-vous progresser ?</Text>
          
          <View style={styles.intensityContainer}>
            {intensities.map((intensity) => (
              <TouchableOpacity
                key={intensity.key}
                style={[
                  styles.intensityCard,
                  selectedIntensity === intensity.key && styles.selectedCard
                ]}
                onPress={() => setSelectedIntensity(intensity.key)}
              >
                <Ionicons 
                  name={intensity.icon as any} 
                  size={24} 
                  color={selectedIntensity === intensity.key ? Colors.accent : Colors.textSecondary} 
                />
                <Text style={[
                  styles.intensityLabel,
                  selectedIntensity === intensity.key && styles.selectedText
                ]}>
                  {intensity.label}
                </Text>
                <Text style={styles.intensityDescription}>
                  {intensity.description}
                </Text>
                {selectedIntensity === intensity.key && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={Colors.accent} 
                    style={styles.checkIconSmall}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sélection des jours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Jours d'entraînement</Text>
          <Text style={styles.sectionSubtitle}>Sélectionnez vos jours disponibles (2 à 6 jours)</Text>
          
          <View style={styles.daysContainer}>
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.number}
                style={[
                  styles.dayCard,
                  selectedDays.includes(day.number) && styles.selectedDayCard
                ]}
                onPress={() => toggleDay(day.number)}
              >
                <Text style={[
                  styles.dayShort,
                  selectedDays.includes(day.number) && styles.selectedDayText
                ]}>
                  {day.short}
                </Text>
                <Text style={[
                  styles.dayFull,
                  selectedDays.includes(day.number) && styles.selectedDayText
                ]}>
                  {day.full}
                </Text>
                {selectedDays.includes(day.number) && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={Colors.accent} 
                    style={styles.dayCheckIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.daysInfo}>
            <Text style={styles.daysInfoText}>
              {selectedDays.length} jour{selectedDays.length > 1 ? 's' : ''} sélectionné{selectedDays.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.daysInfoSubtext}>
              {selectedDays.map(day => weekDays.find(d => d.number === day)?.full).join(', ')}
            </Text>
          </View>
        </View>

        {/* Aperçu des dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Aperçu planning</Text>
          <Text style={styles.sectionSubtitle}>Vos prochains entraînements seront programmés :</Text>
          
          <View style={styles.previewContainer}>
            {getPreviewDates().map((date, index) => (
              <View key={index} style={styles.previewItem}>
                <Text style={styles.previewIndex}>#{index + 1}</Text>
                <Text style={styles.previewDate}>{date}</Text>
              </View>
            ))}
            <Text style={styles.previewNote}>
              💡 Les dates exactes seront calculées lors de la génération
            </Text>
          </View>
        </View>

        {/* Résumé */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>📋 Résumé de votre plan</Text>
          <LinearGradient
            colors={[Colors.accentSoft, Colors.backgroundSecondary]}
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Objectif :</Text>
              <Text style={styles.summaryValue}>{selectedGoal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Durée :</Text>
              <Text style={styles.summaryValue}>{selectedDuration} semaine{selectedDuration > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Intensité :</Text>
              <Text style={styles.summaryValue}>
                {intensities.find(i => i.key === selectedIntensity)?.label}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Jours :</Text>
              <Text style={styles.summaryValue}>
                {selectedDays.map(day => weekDays.find(d => d.number === day)?.short).join(', ')}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacing} />

      </ScrollView>

      {/* Bouton de debug JSON */}
      <TouchableOpacity 
        style={[styles.debugButton, loading && styles.generateButtonDisabled]} 
        onPress={handleGenerateDebugPlan}
        disabled={loading}
      >
        <View style={styles.debugButtonContent}>
          {loading ? (
            <ActivityIndicator color={Colors.textOnAccent} size="small" />
          ) : (
            <Ionicons name="code-outline" size={20} color={Colors.textOnAccent} />
          )}
          <Text style={styles.debugButtonText}>
            {loading ? 'Génération en cours...' : 'Utiliser mon JSON (Debug)'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Bouton de génération */}
      <TouchableOpacity 
        style={[styles.generateButton, loading && styles.generateButtonDisabled]} 
        onPress={handleGeneratePlan}
        disabled={loading}
      >
        <LinearGradient
          colors={loading ? [Colors.textTertiary, Colors.textTertiary] : Colors.gradients.accent}
          style={styles.generateButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textOnAccent} size="small" />
          ) : (
            <Ionicons name="sparkles" size={20} color={Colors.textOnAccent} />
          )}
          <Text style={styles.generateButtonText}>
            {loading ? 'Génération en cours...' : 'Générer mon plan IA'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  header: {
    ...CommonStyles.header,
  },
  headerTitle: {
    ...CommonStyles.headerTitle,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  introSection: {
    ...CommonStyles.section,
    alignItems: 'center',
  },
  introTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  introText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  limitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningSoft,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  limitText: {
    ...Typography.bodySmall,
    color: Colors.warning,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoSoft,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.info + '40',
    marginBottom: Spacing.lg,
  },
  safetyText: {
    ...Typography.bodySmall,
    color: Colors.info,
    marginLeft: Spacing.sm,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  section: {
    ...CommonStyles.section,
  },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  selectedCard: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  goalLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  goalDescription: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedText: {
    color: Colors.accent,
    fontWeight: '600',
  },
  checkIcon: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  checkIconSmall: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  durationWeeks: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  durationLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  durationDescription: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  intensityContainer: {
    gap: Spacing.md,
  },
  intensityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  intensityLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginLeft: Spacing.lg,
    marginRight: Spacing.md,
  },
  intensityDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  summarySection: {
    ...CommonStyles.section,
  },
  summaryTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  debugButton: {
    margin: Spacing.xl,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: 'transparent',
  },
  debugButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  debugButtonText: {
    ...Typography.label,
    color: Colors.accent,
    marginLeft: Spacing.sm,
  },
  generateButton: {
    margin: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.large,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  generateButtonText: {
    ...Typography.label,
    color: Colors.textOnAccent,
    marginLeft: Spacing.sm,
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
  // Styles pour l'aperçu des dates
  previewContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  previewIndex: {
    ...Typography.captionSmall,
    color: Colors.accent,
    fontWeight: '600',
    minWidth: 30,
  },
  previewDate: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    marginLeft: Spacing.md,
  },
  previewNote: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  // Styles pour la sélection des jours
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  dayCard: {
    width: '13%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    position: 'relative',
    ...Shadows.small,
  },
  selectedDayCard: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  dayShort: {
    ...Typography.labelSmall,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  dayFull: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  selectedDayText: {
    color: Colors.accent,
  },
  dayCheckIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  daysInfo: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  daysInfoText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  daysInfoSubtext: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});

export default CreatePlanScreen;