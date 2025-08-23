import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

import { RootStackParamList } from '../types';
import { AnalyticsService, WorkoutAnalytics, PerformanceComparison } from '../services/analyticsService';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutStats'>;

const { width: screenWidth } = Dimensions.get('window');

export function WorkoutStatsScreen({ route, navigation }: Props) {
  const { sessionId, userId } = route.params;
  
  const [analytics, setAnalytics] = useState<WorkoutAnalytics | null>(null);
  const [comparisons, setComparisons] = useState<PerformanceComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'splits' | 'performance'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [analyticsData, comparisonsData] = await Promise.all([
        AnalyticsService.generateWorkoutAnalytics(sessionId),
        AnalyticsService.compareWithPrevious(sessionId, userId)
      ]);
      
      setAnalytics(analyticsData);
      setComparisons(comparisonsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Erreur', 'Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    return (meters / 1000).toFixed(2);
  };

  const renderSpeedChart = () => {
    if (!analytics || analytics.speedProfile.length < 2) return null;

    const data = {
      labels: analytics.speedProfile
        .filter((_, index) => index % Math.max(1, Math.floor(analytics.speedProfile.length / 6)) === 0)
        .map(point => formatTime(point.elapsedTime)),
      datasets: [{
        data: analytics.speedProfile
          .filter((_, index) => index % Math.max(1, Math.floor(analytics.speedProfile.length / 6)) === 0)
          .map(point => point.speed),
        strokeWidth: 2,
        color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Profil de vitesse</Text>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={200}
          chartConfig={{
            backgroundColor: '#1a1a1a',
            backgroundGradientFrom: '#1a1a1a',
            backgroundGradientTo: '#2a2a2a',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
        />
        <Text style={styles.chartUnit}>km/h</Text>
      </View>
    );
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#FF3B30" />
          <Text style={styles.statValue}>{formatTime(analytics?.totalDuration || 0)}</Text>
          <Text style={styles.statLabel}>Durée</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="map-outline" size={24} color="#FF3B30" />
          <Text style={styles.statValue}>{formatDistance(analytics?.totalDistance || 0)} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="speedometer-outline" size={24} color="#FF3B30" />
          <Text style={styles.statValue}>{analytics?.averageSpeed.toFixed(1) || '0.0'} km/h</Text>
          <Text style={styles.statLabel}>Vitesse moy.</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="stopwatch-outline" size={24} color="#FF3B30" />
          <Text style={styles.statValue}>{formatPace(analytics?.averagePace || 0)}/km</Text>
          <Text style={styles.statLabel}>Allure moy.</Text>
        </View>
      </View>

      {renderSpeedChart()}

      <View style={styles.additionalStats}>
        <View style={styles.additionalStatRow}>
          <Text style={styles.additionalStatLabel}>Vitesse max:</Text>
          <Text style={styles.additionalStatValue}>{analytics?.maxSpeed.toFixed(1) || '0.0'} km/h</Text>
        </View>
        <View style={styles.additionalStatRow}>
          <Text style={styles.additionalStatLabel}>Vitesse min:</Text>
          <Text style={styles.additionalStatValue}>{analytics?.minSpeed.toFixed(1) || '0.0'} km/h</Text>
        </View>
        <View style={styles.additionalStatRow}>
          <Text style={styles.additionalStatLabel}>Changements vitesse:</Text>
          <Text style={styles.additionalStatValue}>{analytics?.speedChanges || 0}</Text>
        </View>
      </View>
    </View>
  );

  const renderSplits = () => (
    <View style={styles.tabContent}>
      {analytics?.segmentSplits.length ? (
        <View style={styles.splitsSection}>
          <Text style={styles.splitsTitle}>Splits par segment</Text>
          {analytics.segmentSplits.map((split, index) => (
            <View key={split.id} style={styles.splitCard}>
              <View style={styles.splitHeader}>
                <Text style={styles.splitName}>{split.segmentName || `Segment ${split.splitNumber}`}</Text>
                <Text style={styles.splitDistance}>{formatDistance(split.distance)} km</Text>
              </View>
              <View style={styles.splitStats}>
                <Text style={styles.splitStat}>
                  <Ionicons name="time-outline" size={14} color="#888" /> {formatTime(split.duration)}
                </Text>
                <Text style={styles.splitStat}>
                  <Ionicons name="speedometer-outline" size={14} color="#888" /> {split.averageSpeed.toFixed(1)} km/h
                </Text>
                <Text style={styles.splitStat}>
                  <Ionicons name="stopwatch-outline" size={14} color="#888" /> {formatPace(split.averagePace)}/km
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {analytics?.kilometerSplits.length ? (
        <View style={styles.splitsSection}>
          <Text style={styles.splitsTitle}>Splits par kilomètre</Text>
          {analytics.kilometerSplits.map((split, index) => (
            <View key={split.id} style={styles.splitCard}>
              <View style={styles.splitHeader}>
                <Text style={styles.splitName}>Kilomètre {split.splitNumber}</Text>
                <Text style={styles.splitDistance}>1.00 km</Text>
              </View>
              <View style={styles.splitStats}>
                <Text style={styles.splitStat}>
                  <Ionicons name="time-outline" size={14} color="#888" /> {formatTime(split.duration)}
                </Text>
                <Text style={styles.splitStat}>
                  <Ionicons name="speedometer-outline" size={14} color="#888" /> {split.averageSpeed.toFixed(1)} km/h
                </Text>
                <Text style={styles.splitStat}>
                  <Ionicons name="stopwatch-outline" size={14} color="#888" /> {formatPace(split.averagePace)}/km
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {(!analytics?.segmentSplits.length && !analytics?.kilometerSplits.length) && (
        <View style={styles.noSplitsContainer}>
          <Ionicons name="bar-chart-outline" size={48} color="#666" />
          <Text style={styles.noSplitsText}>Aucun split disponible</Text>
        </View>
      )}
    </View>
  );

  const renderPerformance = () => (
    <View style={styles.tabContent}>
      {comparisons.length > 0 ? (
        <View>
          <Text style={styles.performanceTitle}>Comparaison avec l'entraînement précédent</Text>
          {comparisons.map((comparison, index) => (
            <View key={index} style={styles.comparisonCard}>
              <View style={styles.comparisonHeader}>
                <Text style={styles.comparisonMetric}>{comparison.metric}</Text>
                <View style={[
                  styles.improvementBadge,
                  { backgroundColor: comparison.improvement > 0 ? '#4CAF50' : comparison.improvement < 0 ? '#FF3B30' : '#888' }
                ]}>
                  <Ionicons 
                    name={comparison.improvement > 0 ? 'trending-up' : comparison.improvement < 0 ? 'trending-down' : 'remove'} 
                    size={14} 
                    color="white" 
                  />
                  <Text style={styles.improvementText}>
                    {comparison.unit === 'sec' 
                      ? formatTime(Math.abs(comparison.improvement))
                      : `${Math.abs(comparison.improvement).toFixed(2)} ${comparison.unit}`
                    }
                  </Text>
                </View>
              </View>
              <View style={styles.comparisonValues}>
                <Text style={styles.comparisonValue}>
                  Actuel: {comparison.unit === 'sec' 
                    ? formatTime(comparison.current)
                    : `${comparison.current.toFixed(2)} ${comparison.unit}`
                  }
                </Text>
                <Text style={styles.comparisonValue}>
                  Précédent: {comparison.unit === 'sec' 
                    ? formatTime(comparison.previous)
                    : `${comparison.previous.toFixed(2)} ${comparison.unit}`
                  }
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics-outline" size={48} color="#666" />
          <Text style={styles.noDataText}>Aucune donnée de comparaison</Text>
          <Text style={styles.noDataSubtext}>Complétez plus d'entraînements pour voir vos progrès</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des statistiques...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Statistiques</Text>
        <Text style={styles.workoutName}>{analytics?.workoutName}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Vue d'ensemble</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'splits' && styles.activeTab]}
          onPress={() => setActiveTab('splits')}
        >
          <Text style={[styles.tabText, activeTab === 'splits' && styles.activeTabText]}>Splits</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'performance' && styles.activeTab]}
          onPress={() => setActiveTab('performance')}
        >
          <Text style={[styles.tabText, activeTab === 'performance' && styles.activeTabText]}>Performance</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'splits' && renderSplits()}
        {activeTab === 'performance' && renderPerformance()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={20} color="white" />
          <Text style={styles.shareButtonText}>Partager</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  workoutName: {
    fontSize: 16,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF3B30',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF3B30',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  chartUnit: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  additionalStats: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  additionalStatLabel: {
    color: '#888',
    fontSize: 14,
  },
  additionalStatValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  splitsSection: {
    marginBottom: 30,
  },
  splitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  splitCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  splitName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  splitDistance: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  splitStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  splitStat: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  noSplitsContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  noSplitsText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  comparisonCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  comparisonMetric: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  improvementText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  comparisonValues: {
    gap: 5,
  },
  comparisonValue: {
    color: '#888',
    fontSize: 14,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  noDataText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  noDataSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    gap: 15,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    flex: 2,
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});