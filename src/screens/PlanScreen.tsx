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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { TrainingPlanService } from '../services/trainingPlanService';
import { TrainingPlan } from '../types';
import { Colors } from '../theme/colors';
import { CommonStyles, Typography, Spacing, BorderRadius, Shadows } from '../theme/commonStyles';

interface PlanScreenProps {
  navigation?: any;
}

const PlanScreen: React.FC<PlanScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [user]);

  const loadPlans = async () => {
    if (!user) return;
    
    try {
      const userPlans = await TrainingPlanService.getUserTrainingPlans(user.id);
      setPlans(userPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      Alert.alert('Erreur', 'Impossible de charger vos plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPlans();
  };

  const handleCreatePlan = () => {
    navigation?.navigate('CreatePlan');
  };

  const handlePlanPress = (plan: TrainingPlan) => {
    navigation?.navigate('PlanDetail', { planId: plan.id });
  };

  const handleDeletePlan = (plan: TrainingPlan) => {
    Alert.alert(
      'Supprimer le plan',
      `Êtes-vous sûr de vouloir supprimer "${plan.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await TrainingPlanService.deleteTrainingPlan(plan.id);
            if (success) {
              setPlans(plans.filter(p => p.id !== plan.id));
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer le plan');
            }
          },
        },
      ]
    );
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${startStr} - ${endStr}`;
  };

  const getStatusColor = (plan: TrainingPlan) => {
    const now = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    
    if (now < startDate) return Colors.info; // À venir
    if (now > endDate) return Colors.textTertiary; // Terminé
    return Colors.accent; // En cours
  };

  const getStatusText = (plan: TrainingPlan) => {
    const now = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    
    if (now < startDate) return 'À venir';
    if (now > endDate) return 'Terminé';
    
    // Calculer la semaine actuelle
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksPassed = Math.ceil(daysPassed / 7);
    
    return `Semaine ${weeksPassed}/${plan.totalWeeks}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Chargement de vos plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Plans</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <ScrollView 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        
        {/* Plans existants */}
        {plans.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Vos plans d'entraînement</Text>
            
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => handlePlanPress(plan)}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDates}>
                      {formatDateRange(plan.startDate, plan.endDate)}
                    </Text>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(plan) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(plan) }]}>
                      {getStatusText(plan)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.planDescription} numberOfLines={2}>
                  {plan.description}
                </Text>

                <View style={styles.planStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{plan.totalWeeks} sem</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="fitness-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{plan.workoutsPerWeek}x/sem</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="flag-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.statText}>{plan.goal}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeletePlan(plan)}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>

                {plan.generatedByAI && (
                  <View style={styles.aiTag}>
                    <Ionicons name="sparkles" size={12} color={Colors.accent} />
                    <Text style={styles.aiText}>Généré par IA</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={80} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Aucun plan d'entraînement</Text>
            <Text style={styles.emptySubtitle}>
              Créez votre premier plan personnalisé pour commencer votre progression
            </Text>
          </View>
        )}

        <View style={[styles.bottomSpacing, { height: insets.bottom + 80 }]} />

      </ScrollView>

      {/* Bouton de création */}
      <TouchableOpacity 
        style={[styles.createButton, { bottom: insets.bottom + Spacing.lg }]} 
        onPress={handleCreatePlan}
      >
        <LinearGradient
          colors={Colors.gradients.accent}
          style={styles.createButtonGradient}
        >
          <Ionicons name="add" size={24} color={Colors.textOnAccent} />
          <Text style={styles.createButtonText}>Créer un plan</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
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
  header: {
    ...CommonStyles.header,
  },
  headerTitle: {
    ...CommonStyles.headerTitle,
  },
  content: {
    flex: 1,
  },
  section: {
    ...CommonStyles.section,
  },
  sectionTitle: {
    ...CommonStyles.sectionTitle,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  planInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  planName: {
    ...Typography.h6,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  planDates: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    ...Typography.captionSmall,
    fontWeight: '600',
  },
  planDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  planStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  aiText: {
    ...Typography.captionSmall,
    color: Colors.accent,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  emptyState: {
    ...CommonStyles.centerContent,
    paddingVertical: Spacing.massive,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    position: 'absolute',
    // bottom sera défini dynamiquement avec insets.bottom + Spacing.lg
    left: Spacing.xl,
    right: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.large,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  createButtonText: {
    ...Typography.label,
    color: Colors.textOnAccent,
    marginLeft: Spacing.sm,
  },
  bottomSpacing: {
    // height sera défini dynamiquement avec insets.bottom + 80
  },
});

export default PlanScreen;