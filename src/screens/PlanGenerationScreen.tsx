import React, { useState } from 'react';
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
import { UserProfile, WorkoutType } from '../types';

interface PlanGenerationScreenProps {
  navigation: any;
}

const PlanGenerationScreen: React.FC<PlanGenerationScreenProps> = ({ navigation }) => {
  const [selectedGoal, setSelectedGoal] = useState<string>('5k');
  const [selectedWeeks, setSelectedWeeks] = useState<number>(8);
  const [selectedIntensity, setSelectedIntensity] = useState<string>('moderate');
  const [selectedFocus, setSelectedFocus] = useState<WorkoutType[]>(['easy_run', 'intervals']);
  const [isGenerating, setIsGenerating] = useState(false);

  const goals = [
    { key: '5k', name: '5 KM', weeks: [6, 8, 10] },
    { key: '10k', name: '10 KM', weeks: [8, 10, 12] },
    { key: 'half_marathon', name: 'Semi-Marathon', weeks: [12, 16, 20] },
    { key: 'marathon', name: 'Marathon', weeks: [16, 20, 24] },
    { key: 'fitness', name: 'Forme générale', weeks: [4, 6, 8, 12] },
  ];

  const intensities = [
    { key: 'light', name: 'Léger', description: 'Pour débuter en douceur' },
    { key: 'moderate', name: 'Modéré', description: 'Équilibre performance/récupération' },
    { key: 'intensive', name: 'Intensif', description: 'Pour progression rapide' },
  ];

  const workoutTypes = [
    { key: 'easy_run', name: 'Course facile', icon: '🚶', description: 'Base aérobie' },
    { key: 'intervals', name: 'Fractionné', icon: '⚡', description: 'Vitesse et VO2max' },
    { key: 'tempo', name: 'Tempo', icon: '🏃', description: 'Seuil lactique' },
    { key: 'long_run', name: 'Sortie longue', icon: '🛣️', description: 'Endurance' },
    { key: 'hill_training', name: 'Côtes', icon: '⛰️', description: 'Force et puissance' },
    { key: 'recovery_run', name: 'Récupération', icon: '😌', description: 'Récupération active' },
  ];

  const handleFocusToggle = (workoutType: WorkoutType) => {
    setSelectedFocus(prev => 
      prev.includes(workoutType)
        ? prev.filter(type => type !== workoutType)
        : [...prev, workoutType]
    );
  };

  const handleGeneratePlan = async () => {
    if (selectedFocus.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un type d\'entraînement');
      return;
    }

    setIsGenerating(true);
    
    try {
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      if (!userProfileStr) {
        Alert.alert('Erreur', 'Profil utilisateur introuvable');
        return;
      }
      
      const userProfile: UserProfile = JSON.parse(userProfileStr);
      
      // Préparer les données pour l'IA
      const planRequest = {
        userProfile,
        goal: selectedGoal,
        weeks: selectedWeeks,
        intensity: selectedIntensity,
        focusTypes: selectedFocus,
        startDate: new Date().toISOString(),
      };
      
      // Naviguer vers l'écran de génération
      navigation.navigate('AIGeneration', { planRequest });
      
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un plan</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Objectif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Votre objectif</Text>
          <View style={styles.goalGrid}>
            {goals.map(goal => (
              <TouchableOpacity
                key={goal.key}
                style={[styles.goalCard, selectedGoal === goal.key && styles.selectedCard]}
                onPress={() => setSelectedGoal(goal.key)}
              >
                <Text style={[styles.goalName, selectedGoal === goal.key && styles.selectedText]}>
                  {goal.name}
                </Text>
                {selectedGoal === goal.key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Durée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Durée du plan</Text>
          <View style={styles.weeksContainer}>
            {goals.find(g => g.key === selectedGoal)?.weeks.map(weeks => (
              <TouchableOpacity
                key={weeks}
                style={[styles.weekCard, selectedWeeks === weeks && styles.selectedCard]}
                onPress={() => setSelectedWeeks(weeks)}
              >
                <Text style={[styles.weekText, selectedWeeks === weeks && styles.selectedText]}>
                  {weeks} semaines
                </Text>
                {selectedWeeks === weeks && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intensité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Intensité</Text>
          <View style={styles.intensityContainer}>
            {intensities.map(intensity => (
              <TouchableOpacity
                key={intensity.key}
                style={[styles.intensityCard, selectedIntensity === intensity.key && styles.selectedCard]}
                onPress={() => setSelectedIntensity(intensity.key)}
              >
                <Text style={[styles.intensityName, selectedIntensity === intensity.key && styles.selectedText]}>
                  {intensity.name}
                </Text>
                <Text style={styles.intensityDescription}>{intensity.description}</Text>
                {selectedIntensity === intensity.key && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Types d'entraînements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏃‍♂️ Types d'entraînements souhaités</Text>
          <Text style={styles.sectionSubtitle}>Sélectionnez vos préférences (minimum 1)</Text>
          <View style={styles.workoutTypesContainer}>
            {workoutTypes.map(type => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.workoutTypeCard, 
                  selectedFocus.includes(type.key as WorkoutType) && styles.selectedCard
                ]}
                onPress={() => handleFocusToggle(type.key as WorkoutType)}
              >
                <Text style={styles.workoutTypeIcon}>{type.icon}</Text>
                <Text style={[
                  styles.workoutTypeName, 
                  selectedFocus.includes(type.key as WorkoutType) && styles.selectedText
                ]}>
                  {type.name}
                </Text>
                <Text style={styles.workoutTypeDescription}>{type.description}</Text>
                {selectedFocus.includes(type.key as WorkoutType) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.generateButton, isGenerating && styles.disabledButton]}
          onPress={handleGeneratePlan}
          disabled={isGenerating}
        >
          <Text style={styles.generateButtonText}>
            {isGenerating ? '⏳ Génération...' : '🧠 Générer mon plan IA'}
          </Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: '#2196F3',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 16,
    color: '#2196F3',
  },
  weeksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    position: 'relative',
  },
  weekText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  intensityContainer: {
    gap: 12,
  },
  intensityCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    position: 'relative',
  },
  intensityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  intensityDescription: {
    fontSize: 14,
    color: '#666',
  },
  workoutTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  workoutTypeCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    position: 'relative',
  },
  workoutTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  workoutTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  workoutTypeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    elevation: 8,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlanGenerationScreen;