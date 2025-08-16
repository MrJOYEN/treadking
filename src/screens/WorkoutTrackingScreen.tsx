import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { TrainingSegment, Split } from '../types';

interface WorkoutTrackingScreenProps {
  navigation: any;
  route: {
    params: {
      workoutType: string;
      plannedSegments?: TrainingSegment[];
    };
  };
}

const WorkoutTrackingScreen: React.FC<WorkoutTrackingScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { workoutType, plannedSegments } = route.params;
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(8.0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        const timeDelta = (now - lastUpdateTime) / 1000; // seconds
        const distanceDelta = (currentSpeed * timeDelta) / 3600; // km
        
        setElapsedTime(prev => prev + 1);
        setTotalDistance(prev => {
          const newDistance = prev + distanceDelta;
          checkForNewSplit(newDistance, elapsedTime + 1);
          return newDistance;
        });
        setLastUpdateTime(now);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, currentSpeed, lastUpdateTime, elapsedTime]);

  const checkForNewSplit = (distance: number, time: number) => {
    const currentKm = Math.floor(distance) + 1;
    const hasThisKmSplit = splits.some(split => split.kilometer === currentKm);
    
    if (distance >= currentKm && !hasThisKmSplit && currentKm <= Math.floor(distance) + 1) {
      const newSplit: Split = {
        kilometer: currentKm,
        time: time,
        pace: time / 60 / currentKm, // average pace up to this km
      };
      setSplits(prev => [...prev, newSplit]);
    }
  };

  const toggleWorkout = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
      setLastUpdateTime(Date.now());
    }
  };

  const stopWorkout = () => {
    Alert.alert(
      'Arrêter l\'entraînement',
      'Voulez-vous vraiment arrêter votre entraînement ?',
      [
        { text: 'Continuer', style: 'cancel' },
        { 
          text: 'Arrêter', 
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            navigation.goBack();
          }
        },
      ]
    );
  };

  const adjustSpeed = (delta: number) => {
    setCurrentSpeed(prev => Math.max(1.0, Math.min(20.0, prev + delta)));
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(2)} km`;
  };

  const formatPace = (): string => {
    if (totalDistance <= 0) return '0.0 min/km';
    const pace = elapsedTime / 60 / totalDistance;
    return `${pace.toFixed(1)} min/km`;
  };

  const getCurrentSegment = (): TrainingSegment | null => {
    if (!plannedSegments) return null;
    return plannedSegments.find(segment => 
      totalDistance >= segment.startDistance && totalDistance < segment.endDistance
    ) || null;
  };

  const isGuidedWorkout = workoutType === 'guided_workout' && plannedSegments;
  const currentSegment = getCurrentSegment();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isGuidedWorkout ? 'Entraînement Guidé' : 'Course Libre'}
        </Text>
        <View style={[styles.badge, { backgroundColor: isGuidedWorkout ? '#2196F3' : '#4CAF50' }]}>
          <Text style={styles.badgeText}>
            {isGuidedWorkout ? 'GUIDÉ' : 'LIBRE'}
          </Text>
        </View>
      </View>

      {/* Main Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.mainMetric}>
          <Text style={styles.mainTime}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.mainLabel}>TEMPS</Text>
        </View>

        <View style={styles.secondaryMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatDistance(totalDistance)}</Text>
            <Text style={styles.metricLabel}>DISTANCE</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatPace()}</Text>
            <Text style={styles.metricLabel}>ALLURE</Text>
          </View>
        </View>

        <View style={styles.speedIndicator}>
          <Text style={styles.speedText}>Vitesse: {currentSpeed.toFixed(1)} km/h</Text>
        </View>
      </View>

      {/* Middle Section - Guidance or Splits */}
      <View style={styles.middleSection}>
        {isGuidedWorkout && currentSegment ? (
          <SegmentGuidance segment={currentSegment} currentDistance={totalDistance} />
        ) : (
          <SplitsDisplay splits={splits} currentDistance={totalDistance} />
        )}
      </View>

      {/* Speed Controls */}
      <View style={styles.speedControls}>
        <Text style={styles.speedControlLabel}>VITESSE</Text>
        <View style={styles.speedDisplay}>
          <Text style={styles.speedValue}>{currentSpeed.toFixed(1)}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
        
        <View style={styles.speedButtons}>
          <TouchableOpacity 
            style={[styles.speedButton, styles.decreaseButton]} 
            onPress={() => adjustSpeed(-1.0)}
          >
            <Text style={styles.speedButtonText}>-1.0</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.speedButton, styles.smallDecreaseButton]} 
            onPress={() => adjustSpeed(-0.1)}
          >
            <Text style={styles.speedButtonText}>-0.1</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.speedButton, styles.smallIncreaseButton]} 
            onPress={() => adjustSpeed(0.1)}
          >
            <Text style={styles.speedButtonText}>+0.1</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.speedButton, styles.increaseButton]} 
            onPress={() => adjustSpeed(1.0)}
          >
            <Text style={styles.speedButtonText}>+1.0</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlButtons}>
        <TouchableOpacity 
          style={[styles.mainButton, { backgroundColor: isRunning ? '#FF9800' : '#4CAF50' }]} 
          onPress={toggleWorkout}
        >
          <Text style={styles.mainButtonText}>
            {isRunning ? '⏸️ PAUSE' : '▶️ START'}
          </Text>
        </TouchableOpacity>
        
        {(isRunning || elapsedTime > 0) && (
          <TouchableOpacity style={styles.stopButton} onPress={stopWorkout}>
            <Text style={styles.stopButtonText}>⏹️ STOP</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// Helper Components
const SegmentGuidance: React.FC<{
  segment: TrainingSegment;
  currentDistance: number;
}> = ({ segment, currentDistance }) => {
  const progress = (currentDistance - segment.startDistance) / (segment.endDistance - segment.startDistance);
  const remaining = segment.endDistance - currentDistance;
  
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'warm_up': return '#2196F3';
      case 'easy': return '#4CAF50';
      case 'tempo': return '#FF9800';
      case 'hard': return '#F44336';
      case 'recovery': return '#9C27B0';
      default: return '#666';
    }
  };

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'warm_up': return 'Échauffement';
      case 'easy': return 'Facile';
      case 'tempo': return 'Tempo';
      case 'hard': return 'Intensif';
      case 'recovery': return 'Récupération';
      default: return intensity;
    }
  };

  return (
    <View style={styles.segmentGuidance}>
      <Text style={styles.guidanceTitle}>CONSIGNES ENTRAÎNEMENT</Text>
      
      <View style={[styles.segmentCard, { borderColor: getIntensityColor(segment.intensity) }]}>
        <View style={styles.segmentHeader}>
          <View style={[styles.intensityBadge, { backgroundColor: getIntensityColor(segment.intensity) }]}>
            <Text style={styles.intensityText}>{getIntensityLabel(segment.intensity)}</Text>
          </View>
          <Text style={styles.remainingText}>{remaining.toFixed(2)} km restants</Text>
        </View>
        
        <View style={styles.segmentDetails}>
          <Text style={styles.targetSpeed}>🏃‍♂️ {segment.targetSpeed.toFixed(1)} km/h</Text>
          {segment.targetIncline && (
            <Text style={styles.targetIncline}>📈 {segment.targetIncline.toFixed(1)}%</Text>
          )}
        </View>
        
        {segment.instruction && (
          <Text style={styles.instruction}>{segment.instruction}</Text>
        )}
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.max(0, Math.min(100, progress * 100))}%`,
                  backgroundColor: getIntensityColor(segment.intensity)
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      </View>
    </View>
  );
};

const SplitsDisplay: React.FC<{
  splits: Split[];
  currentDistance: number;
}> = ({ splits, currentDistance }) => {
  return (
    <View style={styles.splitsContainer}>
      <Text style={styles.splitsTitle}>SPLITS KILOMÈTRE</Text>
      
      {splits.length === 0 ? (
        <View style={styles.emptySplits}>
          <Text style={styles.emptySplitsText}>
            Commencez à courir pour voir vos splits par kilomètre
          </Text>
        </View>
      ) : (
        <View style={styles.splitsList}>
          {splits.map((split) => (
            <View key={split.kilometer} style={styles.splitItem}>
              <View style={styles.kmBadge}>
                <Text style={styles.kmText}>{split.kilometer}</Text>
              </View>
              <View style={styles.splitDetails}>
                <Text style={styles.splitTime}>{Math.floor(split.time / 60)}:{(split.time % 60).toString().padStart(2, '0')}</Text>
                <Text style={styles.splitPace}>{split.pace.toFixed(1)} min/km</Text>
              </View>
            </View>
          ))}
        </View>
      )}
      
      <Text style={styles.currentDistance}>Distance: {currentDistance.toFixed(2)} km</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mainMetric: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTime: {
    color: '#FFF',
    fontSize: 56,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  mainLabel: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  metricLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  speedIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  speedText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  segmentGuidance: {
    flex: 1,
  },
  guidanceTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  segmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  intensityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  intensityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  remainingText: {
    color: '#FFF',
    fontSize: 12,
  },
  segmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  targetSpeed: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  targetIncline: {
    color: '#FFF',
    fontSize: 14,
  },
  instruction: {
    color: '#FFF',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  splitsContainer: {
    flex: 1,
  },
  splitsTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  emptySplits: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySplitsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  splitsList: {
    flex: 1,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  kmBadge: {
    width: 40,
    height: 40,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  kmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  splitDetails: {
    flex: 1,
  },
  splitTime: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  splitPace: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.8,
  },
  currentDistance: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  speedControls: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  speedControlLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  speedDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  speedValue: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  speedUnit: {
    color: '#FFF',
    fontSize: 18,
    opacity: 0.8,
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  speedButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  decreaseButton: {
    backgroundColor: '#F44336',
  },
  smallDecreaseButton: {
    backgroundColor: '#FF5722',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  smallIncreaseButton: {
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  increaseButton: {
    backgroundColor: '#2E7D32',
  },
  speedButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  mainButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  stopButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WorkoutTrackingScreen;