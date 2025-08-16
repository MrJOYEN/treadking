import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AIService } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { TrainingPlan } from '../types';

interface AIGenerationScreenProps {
  navigation: any;
  route: any;
}

const AIGenerationScreen: React.FC<AIGenerationScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Préparation...');
  const [isComplete, setIsComplete] = useState(false);

  const { planRequest } = route.params;

  useEffect(() => {
    generatePlan();
  }, []);

  const generatePlan = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      navigation.goBack();
      return;
    }

    try {
      // Simulation du processus étape par étape
      setCurrentStep('🧠 Analyse de votre profil...');
      setGenerationProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setCurrentStep('🏃‍♂️ Calcul des zones d\'intensité...');
      setGenerationProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStep('📅 Création du calendrier...');
      setGenerationProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setCurrentStep('⚡ Génération des séances IA...');
      setGenerationProgress(80);
      
      setCurrentStep('💾 Sauvegarde du plan...');
      setGenerationProgress(90);
      
      // Appel intégré à l'IA avec sauvegarde Supabase
      const result = await AIService.generateAndSaveTrainingPlan(user.id, planRequest);
      
      if (result.success && result.plan && result.planId) {
        setCurrentStep('✅ Plan créé avec succès !');
        setGenerationProgress(100);
        setIsComplete(true);

        // Attendre un peu puis naviguer
        setTimeout(() => {
          navigation.replace('PlanDetails', { 
            planId: result.planId,
            isNewPlan: true 
          });
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to generate and save plan');
      }

    } catch (error) {
      console.error('Erreur génération:', error);
      Alert.alert(
        'Erreur de génération', 
        'Impossible de générer le plan. Voulez-vous réessayer ?',
        [
          { text: 'Annuler', onPress: () => navigation.goBack() },
          { text: 'Réessayer', onPress: generatePlan }
        ]
      );
    }
  };


  const getLoadingAnimation = () => {
    const animations = ['🏃‍♂️', '🏃‍♀️', '💨', '⚡', '🔥'];
    const index = Math.floor(Date.now() / 500) % animations.length;
    return animations[index];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Logo et titre */}
        <View style={styles.header}>
          <Text style={styles.aiIcon}>🧠</Text>
          <Text style={styles.title}>TreadKing AI</Text>
          <Text style={styles.subtitle}>Génération de votre plan personnalisé</Text>
        </View>

        {/* Animation de chargement */}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingAnimation}>{getLoadingAnimation()}</Text>
          
          {!isComplete ? (
            <ActivityIndicator size="large" color="#2196F3" style={styles.spinner} />
          ) : (
            <Text style={styles.checkmark}>✅</Text>
          )}
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${generationProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{generationProgress}%</Text>
        </View>

        {/* Étape actuelle */}
        <View style={styles.stepContainer}>
          <Text style={styles.currentStep}>{currentStep}</Text>
        </View>

        {/* Informations sur le plan */}
        <View style={styles.planInfoContainer}>
          <Text style={styles.planInfoTitle}>Votre plan en cours de création :</Text>
          <View style={styles.planInfo}>
            <Text style={styles.planInfoItem}>
              🎯 Objectif : {planRequest.goal.toUpperCase()}
            </Text>
            <Text style={styles.planInfoItem}>
              📅 Durée : {planRequest.weeks} semaines
            </Text>
            <Text style={styles.planInfoItem}>
              💪 Intensité : {planRequest.intensity}
            </Text>
            <Text style={styles.planInfoItem}>
              🏃‍♂️ Types : {planRequest.focusTypes.join(', ')}
            </Text>
          </View>
        </View>

        {/* Messages motivationnels */}
        <View style={styles.motivationContainer}>
          {generationProgress < 50 && (
            <Text style={styles.motivationText}>
              "L'IA analyse votre profil tapis pour créer le plan parfait ! 🎯"
            </Text>
          )}
          {generationProgress >= 50 && generationProgress < 90 && (
            <Text style={styles.motivationText}>
              "Chaque séance sera adaptée à vos capacités et objectifs ! 🚀"
            </Text>
          )}
          {generationProgress >= 90 && (
            <Text style={styles.motivationText}>
              "Votre plan personnalisé est prêt à vous faire progresser ! 🏆"
            </Text>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  aiIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingAnimation: {
    fontSize: 60,
    marginBottom: 20,
  },
  spinner: {
    marginVertical: 10,
  },
  checkmark: {
    fontSize: 60,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  stepContainer: {
    marginBottom: 30,
  },
  currentStep: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  planInfoContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    elevation: 2,
  },
  planInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  planInfo: {
    gap: 8,
  },
  planInfoItem: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  motivationContainer: {
    paddingHorizontal: 20,
  },
  motivationText: {
    fontSize: 16,
    color: '#2196F3',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
});

export default AIGenerationScreen;