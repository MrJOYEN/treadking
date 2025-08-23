import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { PlanService } from '../services/planService';
import { UserPlanService } from '../services/userPlanService';
import { WorkoutStatusService } from '../services/workoutStatusService';
import { SpeedTrackingService } from '../services/speedTrackingService';
import { PlannedWorkout, TrainingSegment } from '../types';
import { Colors } from '../theme/colors';
import { CommonStyles, Typography, Spacing, BorderRadius, Shadows } from '../theme/commonStyles';

interface WorkoutSessionScreenProps {
  navigation?: any;
  route?: {
    params: {
      workoutId: string;
    };
  };
}

const { width } = Dimensions.get('window');

const WorkoutSessionScreen: React.FC<WorkoutSessionScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [workout, setWorkout] = useState<PlannedWorkout | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [previewSegmentIndex, setPreviewSegmentIndex] = useState(0); // Segment à prévisualiser
  const [sessionState, setSessionState] = useState<'ready' | 'running' | 'paused' | 'completed'>('ready');
  const [elapsedTime, setElapsedTime] = useState(0); // secondes
  const [segmentTime, setSegmentTime] = useState(0); // secondes dans le segment actuel
  const [distance, setDistance] = useState(0); // mètres
  const [actualSpeed, setActualSpeed] = useState(5.0); // vitesse réelle utilisateur (km/h)
  const [lastSpeedForDistance, setLastSpeedForDistance] = useState(5.0); // vitesse utilisée pour le calcul de distance
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const workoutId = route?.params?.workoutId;

  useEffect(() => {
    loadWorkout();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [workoutId]);

  // Initialiser la vitesse avec la vitesse cible du premier segment
  useEffect(() => {
    if (workout && workout.segments && workout.segments.length > 0 && sessionState === 'ready') {
      const initialSpeed = workout.segments[0]?.targetSpeed || 5.0;
      setActualSpeed(initialSpeed);
      setLastSpeedForDistance(initialSpeed);
    }
  }, [workout, sessionState]);

  useEffect(() => {
    if (sessionState === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        setSegmentTime(prev => prev + 1);
        
        // Calcul de distance basé sur la vitesse au début de cette seconde
        setDistance(prev => {
          const speedMs = (lastSpeedForDistance * 1000) / 3600; // m/s
          return prev + speedMs;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState, lastSpeedForDistance]);

  const loadWorkout = async () => {
    if (!workoutId || !user?.id) return;
    
    try {
      const foundWorkout = await UserPlanService.getWorkoutById(user.id, workoutId);
      
      if (!foundWorkout) {
        Alert.alert('Erreur', 'Entraînement introuvable dans votre plan actif');
        return;
      }

      console.log('Workout trouvé:', foundWorkout.name, 'avec', foundWorkout.segments.length, 'segments');
      setWorkout(foundWorkout);
    } catch (error) {
      console.error('Error loading workout:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'entraînement');
    } finally {
      setLoading(false);
    }
  };

  // Utiliser le segment de preview quand on est en mode 'ready', sinon le segment actuel
  const displayedSegmentIndex = sessionState === 'ready' ? previewSegmentIndex : currentSegmentIndex;
  const currentSegment = workout?.segments[displayedSegmentIndex] || null;
  const isLastSegment = currentSegmentIndex === (workout?.segments.length || 0) - 1;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const calculateAveragePace = (): string => {
    if (distance === 0 || elapsedTime === 0) return '--:-- min/km';
    // Allure moyenne = temps écoulé / distance parcourue
    const paceSeconds = (elapsedTime * 1000) / distance; // secondes par km
    const paceMinutes = Math.floor(paceSeconds / 60);
    const remainingSeconds = Math.round(paceSeconds % 60);
    return `${paceMinutes}:${remainingSeconds.toString().padStart(2, '0')} min/km`;
  };

  // Calculer les totaux prévus de l'entraînement
  const getPlannedTotals = () => {
    if (!workout || !workout.segments) return { duration: 0, distance: 0, averageSpeed: 0 };
    
    const totalDuration = workout.segments.reduce((sum, segment) => sum + segment.duration, 0);
    const totalDistance = workout.estimatedDistance;
    
    // Calculer la vitesse moyenne pondérée par la durée de chaque segment
    const weightedSpeedSum = workout.segments.reduce((sum, segment) => {
      return sum + (segment.targetSpeed * segment.duration);
    }, 0);
    const averageSpeed = totalDuration > 0 ? weightedSpeedSum / totalDuration : 0;
    
    return { 
      duration: totalDuration, 
      distance: totalDistance, 
      averageSpeed 
    };
  };

  const calculatePlannedPace = (): string => {
    const totals = getPlannedTotals();
    if (totals.averageSpeed === 0) return '--:-- min/km';
    
    const paceMinutesPerKm = 60 / totals.averageSpeed; // minutes per km
    const minutes = Math.floor(paceMinutesPerKm);
    const seconds = Math.round((paceMinutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  // Fonctions de contrôle de vitesse
  const adjustSpeed = (increment: number) => {
    setActualSpeed(prevSpeed => {
      const newSpeed = Math.max(0.5, Math.min(25, prevSpeed + increment)); // Limité entre 0.5 et 25 km/h
      console.log(`Vitesse ajustée : ${prevSpeed} -> ${newSpeed} km/h`);
      
      // Mettre à jour la vitesse pour le calcul de distance
      setLastSpeedForDistance(newSpeed);
      
      // Enregistrer le changement de vitesse si en cours d'entraînement
      if (workoutSessionId && sessionState === 'running' && Math.abs(newSpeed - prevSpeed) > 0.05) {
        SpeedTrackingService.recordSpeedChange(
          workoutSessionId,
          elapsedTime,
          prevSpeed,
          newSpeed,
          distance
        );
      }
      
      return newSpeed;
    });
  };

  const increaseSpeedLarge = () => adjustSpeed(0.5);
  const decreaseSpeedLarge = () => adjustSpeed(-0.5);
  const increaseSpeedSmall = () => adjustSpeed(0.1);
  const decreaseSpeedSmall = () => adjustSpeed(-0.1);

  const handleStartPause = async () => {
    if (sessionState === 'ready') {
      // Démarrer l'entraînement
      if (user?.id && workout) {
        const sessionId = await SpeedTrackingService.startWorkoutSession(
          user.id,
          workout.id,
          workout.name
        );
        
        if (sessionId) {
          setWorkoutSessionId(sessionId);
          
          // Remettre la vitesse à 0 au démarrage
          setActualSpeed(0);
          setLastSpeedForDistance(0);
          
          // Enregistrer le début du premier segment
          if (workout.segments && workout.segments.length > 0) {
            await SpeedTrackingService.recordSegmentStart(
              sessionId,
              0,
              0,
              workout.segments[0]?.name || 'Segment 1',
              0
            );
          }
          setSessionState('running');
        }
      }
    } else if (sessionState === 'paused') {
      // Reprendre l'entraînement
      if (workoutSessionId) {
        await SpeedTrackingService.recordEvent(workoutSessionId, {
          timestamp: new Date().toISOString(),
          elapsedTime,
          eventType: 'resume',
          data: { distance }
        });
      }
      setSessionState('running');
    } else if (sessionState === 'running') {
      // Mettre en pause
      if (workoutSessionId) {
        await SpeedTrackingService.recordEvent(workoutSessionId, {
          timestamp: new Date().toISOString(),
          elapsedTime,
          eventType: 'pause',
          data: { distance }
        });
      }
      setSessionState('paused');
    }
  };

  const handleNextSegment = async () => {
    if (workoutSessionId && workout) {
      // Enregistrer la fin du segment actuel
      await SpeedTrackingService.recordSegmentEnd(
        workoutSessionId,
        elapsedTime,
        currentSegmentIndex,
        workout?.segments?.[currentSegmentIndex]?.name || '',
        distance
      );
    }
    
    if (isLastSegment) {
      handleFinishWorkout();
    } else {
      const nextIndex = currentSegmentIndex + 1;
      setCurrentSegmentIndex(nextIndex);
      setSegmentTime(0);
      
      // Enregistrer le début du prochain segment
      if (workoutSessionId && workout && workout.segments && workout.segments[nextIndex]) {
        await SpeedTrackingService.recordSegmentStart(
          workoutSessionId,
          elapsedTime,
          nextIndex,
          workout.segments[nextIndex]?.name || `Segment ${nextIndex + 1}`,
          distance
        );
        
        // Ajuster la vitesse à la vitesse cible du nouveau segment
        const newSegmentSpeed = workout.segments[nextIndex]?.targetSpeed || 5.0;
        setActualSpeed(newSegmentSpeed);
        setLastSpeedForDistance(newSegmentSpeed);
      }
    }
  };

  const handleFinishWorkout = async () => {
    Alert.alert(
      'Terminer l\'entraînement',
      'Voulez-vous terminer cet entraînement ?',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            try {
              // Terminer la session de tracking détaillée
              if (workoutSessionId) {
                await SpeedTrackingService.finishWorkoutSession(
                  workoutSessionId,
                  elapsedTime,
                  Math.round(distance)
                );
                
                // Calculer et sauvegarder les splits
                await SpeedTrackingService.calculateAndSaveSplits(workoutSessionId);
              }
              
              // Sauvegarder dans l'ancien système aussi (pour compatibilité)
              if (user?.id && workout) {
                await WorkoutStatusService.completeWorkout(user.id, workout.id, {
                  duration: elapsedTime,
                  distance: Math.round(distance),
                  averagePace: elapsedTime > 0 && distance > 0 ? (elapsedTime / 60) / (distance / 1000) : 0,
                  notes: 'Entraînement terminé avec tracking détaillé',
                  rating: 4
                });
              }
              
              setSessionState('completed');
              
              Alert.alert(
                'Bravo !',
                'Votre entraînement a été enregistré avec toutes les données détaillées.',
                [
                  {
                    text: 'Voir les stats',
                    onPress: () => {
                      navigation?.navigate('WorkoutStats', {
                        sessionId: workoutSessionId,
                        userId: user?.id
                      });
                    }
                  },
                  {
                    text: 'Retour',
                    onPress: () => navigation?.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error finishing workout:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
            }
          }
        }
      ]
    );
  };

  const handleSkipSegment = () => {
    Alert.alert(
      'Passer le segment',
      `Voulez-vous passer "${currentSegment?.name}" ?`,
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui', onPress: handleNextSegment }
      ]
    );
  };

  const getIntensityColor = (intensity: string): string => {
    const colors: { [key: string]: string } = {
      'warm_up': Colors.info,
      'recovery': Colors.success,
      'easy': Colors.success,
      'tempo': Colors.warning,
      'threshold': Colors.warning,
      'vo2max': Colors.accent,
      'neuromuscular': Colors.error,
      'cool_down': Colors.info,
    };
    return colors[intensity] || Colors.textSecondary;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Entraînement introuvable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionState === 'completed') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={Colors.gradients.success} style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={80} color="white" />
          <Text style={styles.completedTitle}>Bravo !</Text>
          <Text style={styles.completedSubtitle}>Entraînement terminé</Text>
          
          <View style={styles.completedStats}>
            <View style={styles.completedStat}>
              <Text style={styles.completedStatValue}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.completedStatLabel}>Durée</Text>
            </View>
            <View style={styles.completedStat}>
              <Text style={styles.completedStatValue}>{formatDistance(distance)}</Text>
              <Text style={styles.completedStatLabel}>Distance</Text>
            </View>
            <View style={styles.completedStat}>
              <Text style={styles.completedStatValue}>{calculateAveragePace()}</Text>
              <Text style={styles.completedStatLabel}>Allure moy.</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation?.navigate('Home')}>
            <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workout.name}</Text>
        <TouchableOpacity onPress={handleFinishWorkout}>
          <Text style={styles.finishText}>Terminer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Statistiques principales */}
        <View style={styles.statsContainer}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>
              {sessionState === 'ready' 
                ? formatTime(getPlannedTotals().duration)
                : formatTime(elapsedTime)
              }
            </Text>
            <Text style={styles.mainStatLabel}>
              {sessionState === 'ready' ? 'Durée prévue' : 'Temps écoulé'}
            </Text>
          </View>
          
          <View style={styles.secondaryStats}>
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryStatValue}>
                {sessionState === 'ready' 
                  ? formatDistance(getPlannedTotals().distance)
                  : formatDistance(distance)
                }
              </Text>
              <Text style={styles.secondaryStatLabel}>Distance</Text>
            </View>
            <View style={styles.secondaryStat}>
              <Text style={styles.secondaryStatValue}>
                {sessionState === 'ready' 
                  ? calculatePlannedPace()
                  : calculateAveragePace()
                }
              </Text>
              <Text style={styles.secondaryStatLabel}>
                {sessionState === 'ready' ? 'Allure prévue' : 'Allure moyenne'}
              </Text>
            </View>
          </View>
        </View>

        {/* Segment actuel */}
        {currentSegment && (
          <View style={styles.currentSegmentContainer}>
            <View style={styles.segmentHeader}>
              <View style={styles.segmentInfo}>
                <View style={[styles.intensityDot, { backgroundColor: getIntensityColor(currentSegment.intensity) }]} />
                <Text style={styles.segmentName}>{currentSegment.name}</Text>
              </View>
              <Text style={styles.segmentProgress}>
                {displayedSegmentIndex + 1}/{workout?.segments?.length || 0}
              </Text>
            </View>
            
            <Text style={styles.segmentInstruction}>{currentSegment.instruction}</Text>
            
            {/* Temps du segment - Plus visible */}
            <View style={styles.segmentTimeDisplay}>
              <Text style={styles.segmentTimeValue}>
                {sessionState === 'ready' 
                  ? formatTime(currentSegment.duration)
                  : `${formatTime(segmentTime)} / ${formatTime(currentSegment.duration)}`
                }
              </Text>
              <Text style={styles.segmentTimeLabel}>
                {sessionState === 'ready' ? 'Temps prévu' : 'Temps du segment'}
              </Text>
            </View>

            {/* Vitesse avec indicateur de performance */}
            <View style={styles.speedPerformanceDisplay}>
              <View style={styles.speedTargetDisplay}>
                <Text style={styles.speedDisplayValue}>{currentSegment.targetSpeed.toFixed(1)}</Text>
                <Text style={styles.speedDisplayLabel}>Cible km/h</Text>
              </View>
              
              {sessionState !== 'ready' && (
                <>
                  <View style={styles.performanceIndicator}>
                    <Ionicons 
                      name={
                        actualSpeed > currentSegment.targetSpeed + 0.2 ? 'arrow-up' : 
                        actualSpeed < currentSegment.targetSpeed - 0.2 ? 'arrow-down' : 
                        'remove'
                      } 
                      size={28} 
                      color={
                        actualSpeed > currentSegment.targetSpeed + 0.2 ? '#4CAF50' : 
                        actualSpeed < currentSegment.targetSpeed - 0.2 ? '#FF3B30' : 
                        '#888'
                      } 
                    />
                  </View>
                  
                  <View style={styles.speedActualDisplay}>
                    <Text style={styles.speedDisplayValue}>{actualSpeed.toFixed(1)}</Text>
                    <Text style={styles.speedDisplayLabel}>Actuelle km/h</Text>
                  </View>
                </>
              )}
            </View>

            {/* Inclinaison - Plus visible */}
            <View style={styles.inclineDisplay}>
              <Text style={styles.inclineValue}>{currentSegment.targetIncline}%</Text>
              <Text style={styles.inclineLabel}>Inclinaison</Text>
            </View>


            {/* Barre de progression du segment */}
            <View style={styles.segmentProgressBar}>
              <View 
                style={[
                  styles.segmentProgressFill, 
                  { 
                    width: sessionState === 'ready' 
                      ? '0%' 
                      : `${Math.min((segmentTime / currentSegment.duration) * 100, 100)}%`,
                    backgroundColor: getIntensityColor(currentSegment.intensity)
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Aperçu des segments */}
        <View style={styles.segmentsOverview}>
          <Text style={styles.segmentsTitle}>Segments de l'entraînement</Text>
          {workout?.segments?.map((segment, index) => (
            <TouchableOpacity 
              key={segment.id} 
              style={[
                styles.segmentPreview,
                index === displayedSegmentIndex && styles.activeSegmentPreview,
                index < currentSegmentIndex && sessionState !== 'ready' && styles.completedSegmentPreview
              ]}
              onPress={() => {
                if (sessionState === 'ready') {
                  setPreviewSegmentIndex(index);
                }
              }}
              disabled={sessionState !== 'ready'}
            >
              <View style={[styles.segmentPreviewDot, { backgroundColor: getIntensityColor(segment.intensity) }]} />
              <View style={styles.segmentPreviewInfo}>
                <Text style={[
                  styles.segmentPreviewName,
                  index === displayedSegmentIndex && styles.activeSegmentPreviewText
                ]}>
                  {segment.name}
                </Text>
                <Text style={styles.segmentPreviewDuration}>{formatTime(segment.duration)}</Text>
              </View>
              {index < currentSegmentIndex && sessionState !== 'ready' && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Contrôles de vitesse - Affichés pendant l'entraînement */}
      {sessionState !== 'ready' && sessionState !== 'completed' && (
        <View style={styles.speedControls}>
          <Text style={styles.speedControlsTitle}>Contrôle vitesse tapis</Text>
          
          <View style={styles.speedControlsRow}>
            {/* Boutons MOINS à gauche */}
            <View style={styles.leftControls}>
              <TouchableOpacity style={styles.speedControlButton} onPress={decreaseSpeedSmall}>
                <Text style={styles.speedControlButtonText}>- 0.1</Text>
                <Text style={styles.speedControlUnit}>km/h</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.speedControlButton, styles.largeControlButton]} onPress={decreaseSpeedLarge}>
                <Text style={styles.speedControlButtonText}>- 0.5</Text>
                <Text style={styles.speedControlUnit}>km/h</Text>
              </TouchableOpacity>
            </View>
            
            {/* Affichage vitesse actuelle au centre */}
            <View style={styles.currentSpeedDisplay}>
              <Text style={styles.currentSpeedValue}>{actualSpeed.toFixed(1)}</Text>
              <Text style={styles.currentSpeedUnit}>km/h</Text>
            </View>
            
            {/* Boutons PLUS à droite */}
            <View style={styles.rightControls}>
              <TouchableOpacity style={styles.speedControlButton} onPress={increaseSpeedSmall}>
                <Text style={styles.speedControlButtonText}>+ 0.1</Text>
                <Text style={styles.speedControlUnit}>km/h</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.speedControlButton, styles.largeControlButton]} onPress={increaseSpeedLarge}>
                <Text style={styles.speedControlButtonText}>+ 0.5</Text>
                <Text style={styles.speedControlUnit}>km/h</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Contrôles principaux */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkipSegment}
          disabled={sessionState !== 'running'}
        >
          <Ionicons name="play-skip-forward" size={20} color={Colors.textSecondary} />
          <Text style={styles.skipButtonText}>Passer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.playPauseButton, sessionState === 'running' && styles.pauseButton]} 
          onPress={handleStartPause}
        >
          <LinearGradient 
            colors={sessionState === 'running' ? Colors.gradients.warning : Colors.gradients.accent}
            style={styles.playPauseButtonGradient}
          >
            <Ionicons 
              name={sessionState === 'running' ? 'pause' : 'play'} 
              size={24} 
              color="white" 
            />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={handleNextSegment}
          disabled={sessionState !== 'running'}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  errorText: {
    ...Typography.h4,
    color: Colors.error,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  finishText: {
    ...Typography.label,
    color: Colors.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  statsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  mainStatValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'System',
  },
  mainStatLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  secondaryStat: {
    alignItems: 'center',
  },
  secondaryStatValue: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  secondaryStatLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  currentSegmentContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  segmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  segmentName: {
    ...Typography.h6,
    color: Colors.textPrimary,
  },
  segmentProgress: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  segmentInstruction: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  segmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  segmentStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  segmentStatText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  segmentProgressBar: {
    height: 6,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  segmentProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  segmentsOverview: {
    marginBottom: Spacing.xxl,
  },
  segmentsTitle: {
    ...Typography.h6,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  segmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  activeSegmentPreview: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
    borderWidth: 1,
  },
  completedSegmentPreview: {
    backgroundColor: Colors.successLight,
  },
  segmentPreviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  segmentPreviewInfo: {
    flex: 1,
  },
  segmentPreviewName: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  activeSegmentPreviewText: {
    color: Colors.accent,
    fontWeight: '600',
  },
  segmentPreviewDuration: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.surface,
    ...Shadows.large,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    ...Shadows.medium,
  },
  pauseButton: {
    // Styles spécifiques pour le bouton pause si nécessaire
  },
  playPauseButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  nextButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  completedTitle: {
    ...Typography.h2,
    color: Colors.textOnDark,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  completedSubtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xxl,
  },
  completedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  completedStat: {
    alignItems: 'center',
  },
  completedStatValue: {
    ...Typography.h3,
    color: Colors.textOnDark,
    fontWeight: '600',
  },
  completedStatLabel: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  homeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  homeButtonText: {
    ...Typography.label,
    color: Colors.textOnDark,
  },
  // Styles pour les contrôles de vitesse
  speedControls: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.small,
  },
  speedControlsTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  speedControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedControlButton: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    minWidth: 80,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  largeControlButton: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
    minWidth: 90,
    minHeight: 65,
  },
  speedControlButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: 'bold',
  },
  currentSpeedDisplay: {
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  currentSpeedValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  currentSpeedUnit: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  
  // Nouveaux styles pour l'amélioration UI
  segmentTimeDisplay: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  segmentTimeValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  segmentTimeLabel: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  
  speedPerformanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
  },
  speedTargetDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  speedActualDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  speedDisplayValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  speedDisplayLabel: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  performanceIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundTertiary,
  },
  
  inclineDisplay: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  inclineValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.info,
  },
  inclineLabel: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  
  // Contrôles de vitesse réorganisés
  leftControls: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rightControls: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  speedControlUnit: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default WorkoutSessionScreen;