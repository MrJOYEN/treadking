import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { TrainingSegment } from '../types';

interface TestWorkoutScreenProps {
  navigation: any;
}

const TestWorkoutScreen: React.FC<TestWorkoutScreenProps> = ({ navigation }) => {
  const startFreeRun = () => {
    navigation.navigate('WorkoutTracking', {
      workoutType: 'free_run',
      plannedSegments: null,
    });
  };

  const startGuidedWorkout = () => {
    // Create a sample progressive workout
    const segments: TrainingSegment[] = [
      {
        startDistance: 0.0,
        endDistance: 1.0,
        targetSpeed: 6.0,
        targetIncline: 0.0,
        intensity: 'warm_up',
        instruction: 'Échauffement progressif, trouvez votre rythme',
      },
      {
        startDistance: 1.0,
        endDistance: 2.5,
        targetSpeed: 8.0,
        targetIncline: 1.0,
        intensity: 'easy',
        instruction: 'Allure confortable, respirez calmement',
      },
      {
        startDistance: 2.5,
        endDistance: 4.0,
        targetSpeed: 10.0,
        targetIncline: 2.0,
        intensity: 'tempo',
        instruction: 'Augmentez progressivement la vitesse',
      },
      {
        startDistance: 4.0,
        endDistance: 5.0,
        targetSpeed: 12.0,
        targetIncline: 3.0,
        intensity: 'hard',
        instruction: 'Phase intensive ! Donnez tout !',
      },
      {
        startDistance: 5.0,
        endDistance: 6.0,
        targetSpeed: 6.0,
        targetIncline: 0.0,
        intensity: 'recovery',
        instruction: 'Récupération active, ralentissez progressivement',
      },
    ];

    navigation.navigate('WorkoutTracking', {
      workoutType: 'guided_workout',
      plannedSegments: segments,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TreadKing</Text>
        <Text style={styles.headerSubtitle}>Test Interface Tracking</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <Text style={styles.emoji}>🏃‍♂️</Text>
          <Text style={styles.title}>Interface de Tracking</Text>
          <Text style={styles.subtitle}>
            Testez les deux modes d'entraînement :
          </Text>

          <TouchableOpacity style={styles.freeRunButton} onPress={startFreeRun}>
            <Text style={styles.buttonIcon}>🏃‍♂️</Text>
            <Text style={styles.buttonText}>Course Libre</Text>
            <Text style={styles.buttonSubtext}>Splits par kilomètre</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guidedButton} onPress={startGuidedWorkout}>
            <Text style={styles.buttonIcon}>🎯</Text>
            <Text style={styles.buttonText}>Entraînement Guidé</Text>
            <Text style={styles.buttonSubtext}>Consignes progressives</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Fonctionnalités à tester :</Text>
          <FeatureItem emoji="⏱️" text="Chrono temps réel" />
          <FeatureItem emoji="🎛️" text="Contrôles vitesse +/-0.1 km/h" />
          <FeatureItem emoji="📊" text="Calcul distance automatique" />
          <FeatureItem emoji="🏁" text="Splits par kilomètre" />
          <FeatureItem emoji="🎯" text="Consignes segments progressifs" />
          <FeatureItem emoji="📱" text="Interface dark optimisée tapis" />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Test sur smartphone</Text>
          <Text style={styles.infoText}>
            Cette interface est optimisée pour fonctionner sur smartphone avec Expo Go.
            Scannez le QR code affiché dans le terminal pour tester en temps réel !
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{ emoji: string; text: string }> = ({ emoji, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  freeRunButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  guidedButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
  },
  featuresCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});

export default TestWorkoutScreen;