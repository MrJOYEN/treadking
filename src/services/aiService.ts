import { UserProfile, TrainingPlan, PlannedWorkout, TrainingSegment, WorkoutType } from '../types';
import { TrainingPlanService } from './trainingPlanService';
import { CalendarService } from './calendarService';
import Constants from 'expo-constants';

// Fonction pour générer des UUIDs compatibles React Native
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Configuration pour l'API OpenAI avec Assistant personnalisé
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || '';

// ID de votre Assistant OpenAI personnalisé
const ASSISTANT_ID = Constants.expoConfig?.extra?.openaiAssistantId || '';

interface PlanGenerationRequest {
  userProfile: UserProfile;
  goal: string;
  weeks: number;
  intensity: string;
  focusTypes: WorkoutType[];
  startDate: string;
}

export class AIService {
  
  /**
   * Calcule le nombre optimal de séances par semaine selon le niveau et la sécurité
   */
  private static calculateOptimalWorkouts(
    level: string, 
    availability: number, 
    goal: string, 
    experience: string[]
  ): { workoutsPerWeek: number; explanation: string } {
    
    // Règles de sécurité par niveau
    switch (level) {
      case 'beginner':
        const beginnerMax = goal.toLowerCase().includes('marathon') ? 3 : 4;
        const beginnerWorkouts = Math.min(availability, beginnerMax);
        const explanation = availability > beginnerMax 
          ? `Pour votre sécurité en tant que débutant, nous recommandons ${beginnerWorkouts} séances/semaine au lieu de ${availability}. Cela permet une progression progressive et réduit les risques de blessure.`
          : '';
        return { workoutsPerWeek: beginnerWorkouts, explanation };
        
      case 'intermediate':
        const intermediateMax = 5;
        const intermediateWorkouts = Math.min(availability, intermediateMax);
        const intExplanation = availability > intermediateMax 
          ? `Nous recommandons ${intermediateWorkouts} séances/semaine pour optimiser votre progression sans risque de surentraînement.`
          : '';
        return { workoutsPerWeek: intermediateWorkouts, explanation: intExplanation };
        
      case 'advanced':
        // Les coureurs avancés peuvent utiliser toute leur disponibilité
        return { workoutsPerWeek: availability, explanation: '' };
        
      default:
        // Par défaut, traiter comme intermédiaire
        const defaultWorkouts = Math.min(availability, 4);
        return { 
          workoutsPerWeek: defaultWorkouts, 
          explanation: 'Plan adapté avec un nombre sécurisé de séances par semaine.' 
        };
    }
  }

  /**
   * Génère et sauvegarde un plan à partir du JSON de debug fixe
   */
  static async generateAndSaveDebugPlan(
    userId: string, 
    request: PlanGenerationRequest
  ): Promise<{ success: boolean; plan?: TrainingPlan; planId?: string; error?: string; explanation?: string }> {
    try {
      // Calculer le nombre optimal de séances avec logique de sécurité
      const { workoutsPerWeek, explanation } = this.calculateOptimalWorkouts(
        request.userProfile.level,
        request.userProfile.weeklyAvailability,
        request.goal,
        request.userProfile.previousExperience
      );
      
      // Mettre à jour la requête avec le nombre optimal
      const optimizedRequest = {
        ...request,
        userProfile: {
          ...request.userProfile,
          weeklyAvailability: workoutsPerWeek
        }
      };
      
      // Generate the training plan from debug JSON
      const trainingPlan = await this.generatePlanFromDebugJSON(optimizedRequest);
      
      // Save to Supabase
      console.log('About to save debug plan via TrainingPlanService');
      const planId = await TrainingPlanService.createTrainingPlan(userId, trainingPlan);
      
      if (planId) {
        return { 
          success: true, 
          plan: trainingPlan, 
          planId,
          explanation: explanation ? `${explanation} (Plan debug utilisé)` : 'Plan debug utilisé' 
        };
      } else {
        return { 
          success: false, 
          error: 'Failed to save debug training plan to database',
          explanation 
        };
      }
    } catch (error) {
      console.error('Error in generateAndSaveDebugPlan:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
  
  static async generateAndSaveTrainingPlan(
    userId: string, 
    request: PlanGenerationRequest
  ): Promise<{ success: boolean; plan?: TrainingPlan; planId?: string; error?: string; explanation?: string }> {
    try {
      // Calculer le nombre optimal de séances avec logique de sécurité
      const { workoutsPerWeek, explanation } = this.calculateOptimalWorkouts(
        request.userProfile.level,
        request.userProfile.weeklyAvailability,
        request.goal,
        request.userProfile.previousExperience
      );
      
      // Mettre à jour la requête avec le nombre optimal
      const optimizedRequest = {
        ...request,
        userProfile: {
          ...request.userProfile,
          weeklyAvailability: workoutsPerWeek
        }
      };
      
      // Generate the training plan
      const trainingPlan = await this.generateTrainingPlan(optimizedRequest);
      console.log('Generated plan with', trainingPlan.plannedWorkouts?.length || 0, 'workouts');
      
      if (trainingPlan.plannedWorkouts?.length > 0) {
        console.log('First workout details:', trainingPlan.plannedWorkouts[0]);
      }
      
      // Save to Supabase
      console.log('About to save training plan via TrainingPlanService');
      const planId = await TrainingPlanService.createTrainingPlan(userId, trainingPlan);
      
      if (planId) {
        return { 
          success: true, 
          plan: trainingPlan, 
          planId,
          explanation 
        };
      } else {
        return { 
          success: false, 
          error: 'Failed to save training plan to database',
          explanation 
        };
      }
    } catch (error) {
      console.error('Error in generateAndSaveTrainingPlan:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Génère un plan à partir du JSON de debug fixe
   */
  static async generatePlanFromDebugJSON(request: PlanGenerationRequest): Promise<TrainingPlan> {
    console.log('🔧 Utilisation du JSON de debug fixe');
    
    try {
      // Importer le JSON fixe
      const debugPlanData = require('../../plan.json');
      
      // Accéder au bon chemin: trainingPlan au lieu de plan
      const trainingPlanData = debugPlanData.trainingPlan;
      
      if (!trainingPlanData || !Array.isArray(trainingPlanData)) {
        throw new Error('Structure JSON invalide: trainingPlan non trouvé');
      }
      
      // Calculer le nombre de semaines d'après le JSON
      const maxWeekNumber = Math.max(...trainingPlanData.map((w: any) => w.weekNumber));
      console.log(`📊 JSON contient ${maxWeekNumber} semaines (ignorant les ${request.weeks} semaines de l'interface)`);
      console.log(`🔍 DEBUG: request.weeks = ${request.weeks}, maxWeekNumber = ${maxWeekNumber}`);
      
      // Mapper les types de segments depuis le JSON vers les types attendus
      const mapSegmentType = (type: string) => {
        const typeMapping: { [key: string]: string } = {
          'warm_up': 'warm_up',
          'easy_run': 'easy',
          'intervals': 'vo2max',
          'tempo': 'tempo',
          'cool_down': 'cool_down'
        };
        return typeMapping[type] || 'easy';
      };
      
      // Déterminer le type d'entraînement basé sur le nom
      const determineWorkoutType = (name: string): WorkoutType => {
        const nameLower = name.toLowerCase();
        if (nameLower.includes('intervalles') || nameLower.includes('fractionn')) return 'intervals';
        if (nameLower.includes('tempo')) return 'tempo';
        if (nameLower.includes('endurance') || nameLower.includes('facile')) return 'easy_run';
        return 'easy_run'; // par défaut
      };
      
      // Transformer au format TrainingPlan
      const plannedWorkouts: PlannedWorkout[] = trainingPlanData.map((workout: any) => ({
        id: generateUUID(),
        name: workout.name,
        description: `Séance de ${workout.estimatedDuration} minutes`,
        workoutType: determineWorkoutType(workout.name),
        estimatedDuration: workout.estimatedDuration,
        estimatedDistance: Math.round(workout.estimatedDuration * 0.1 * 1000), // estimation basée sur durée
        difficulty: 5, // difficulté moyenne par défaut
        weekNumber: workout.weekNumber,
        dayOfWeek: workout.dayOfWeek,
        segments: workout.segments.map((segment: any) => ({
          id: generateUUID(),
          name: segment.type === 'warm_up' ? 'Échauffement' : 
                segment.type === 'cool_down' ? 'Retour au calme' :
                segment.type === 'easy_run' ? 'Course facile' :
                segment.type === 'intervals' ? 'Intervalles' :
                segment.type === 'tempo' ? 'Tempo' : 'Segment',
          duration: segment.duration,
          distance: Math.round(segment.duration * segment.targetSpeed / 3.6), // distance = temps * vitesse
          targetSpeed: segment.targetSpeed,
          targetIncline: segment.incline || 0,
          intensity: mapSegmentType(segment.type),
          rpe: segment.type === 'warm_up' || segment.type === 'cool_down' ? 3 :
               segment.type === 'easy_run' ? 5 :
               segment.type === 'intervals' ? 8 : 6,
          instruction: segment.description || '',
          recoveryAfter: 0,
        })),
        createdAt: new Date().toISOString(),
      }));

      const trainingPlan: TrainingPlan = {
        id: generateUUID(),
        name: `Plan d'entraînement ${maxWeekNumber} semaines`,
        description: `Plan d'entraînement personnalisé de ${maxWeekNumber} semaines avec ${plannedWorkouts.length} séances`,
        goal: request.goal,
        totalWeeks: maxWeekNumber,
        workoutsPerWeek: Math.ceil(trainingPlanData.length / maxWeekNumber),
        startDate: request.startDate,
        endDate: this.calculateEndDate(request.startDate, maxWeekNumber),
        plannedWorkouts: plannedWorkouts,
        userProfile: request.userProfile,
        createdAt: new Date().toISOString(),
        generatedByAI: true,
        aiPrompt: 'JSON de debug fixe',
      };

      console.log('✅ Plan debug généré avec', plannedWorkouts.length, 'workouts');
      console.log(`🔍 DEBUG: trainingPlan.totalWeeks = ${trainingPlan.totalWeeks}`);
      return trainingPlan;
      
    } catch (error) {
      console.error('❌ Erreur lecture JSON debug:', error);
      // Fallback sur le plan de base en cas d'erreur
      return this.generateFallbackPlan(request);
    }
  }
  
  static async generateTrainingPlan(request: PlanGenerationRequest): Promise<TrainingPlan> {
    // Vérifier si les clés API sont configurées
    if (!OPENAI_API_KEY || !ASSISTANT_ID) {
      console.warn('❌ Clés API OpenAI non configurées, utilisation du plan fallback');
      return this.generateFallbackPlan(request);
    }
    
    console.log('✅ Clés API trouvées, utilisation de l\'IA OpenAI');
    
    const prompt = this.buildTrainingPlanPrompt(request);
    
    try {
      // 1. Créer un thread
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({}),
      });

      if (!threadResponse.ok) {
        throw new Error(`Erreur création thread: ${threadResponse.status}`);
      }

      const thread = await threadResponse.json();
      const threadId = thread.id;

      // 2. Ajouter le message au thread
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          role: 'user',
          content: prompt,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error(`Erreur ajout message: ${messageResponse.status}`);
      }

      // 3. Lancer l'assistant
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          assistant_id: ASSISTANT_ID,
        }),
      });

      if (!runResponse.ok) {
        throw new Error(`Erreur lancement assistant: ${runResponse.status}`);
      }

      const run = await runResponse.json();
      const runId = run.id;

      // 4. Attendre la completion (polling) - Debug amélioré
      let runStatus = 'queued';
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max
      console.log('Assistant démarré, attente completion...');

      while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5s
        
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          runStatus = statusData.status;
          console.log(`Assistant status: ${runStatus} (tentative ${attempts + 1}/${maxAttempts})`);
          
          if (runStatus === 'failed') {
            console.error('Assistant failed:', statusData.last_error);
          }
        }
        
        attempts++;
      }

      if (runStatus !== 'completed') {
        throw new Error(`Assistant timeout ou échec: ${runStatus}`);
      }

      // 5. Récupérer les messages
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (!messagesResponse.ok) {
        throw new Error(`Erreur récupération messages: ${messagesResponse.status}`);
      }

      const messages = await messagesResponse.json();
      const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
      
      if (!assistantMessage) {
        throw new Error('Pas de réponse de l\'assistant');
      }

      const aiResponse = assistantMessage.content[0]?.text?.value;
      if (!aiResponse) {
        throw new Error('Contenu vide de l\'assistant');
      }

      // Debug: vérifier la réponse de l'IA
      console.log('Réponse IA longueur:', aiResponse.length);
      console.log('Début réponse IA:', aiResponse.substring(0, 500));
      console.log('Fin réponse IA:', aiResponse.substring(aiResponse.length - 500));
      
      // Parser la réponse JSON de l'IA
      const parsedPlan = JSON.parse(aiResponse);
      
      console.log('Plan parsé name:', parsedPlan.name);
      console.log('Plan parsé workouts count:', parsedPlan.workouts?.length || 0);
      console.log('Premier workout:', parsedPlan.workouts?.[0]?.name);
      console.log('Dernier workout:', parsedPlan.workouts?.[parsedPlan.workouts?.length - 1]?.name);
      
      // Créer le plan complet avec métadonnées
      const trainingPlan: TrainingPlan = {
        id: generateUUID(),
        name: parsedPlan.name,
        description: parsedPlan.description,
        goal: request.goal,
        totalWeeks: request.weeks,
        workoutsPerWeek: parsedPlan.workoutsPerWeek,
        startDate: request.startDate,
        endDate: this.calculateEndDate(request.startDate, request.weeks),
        plannedWorkouts: parsedPlan.workouts.map((workout: any) => this.formatPlannedWorkout(workout)),
        userProfile: request.userProfile,
        createdAt: new Date().toISOString(),
        generatedByAI: true,
        aiPrompt: prompt,
      };

      return trainingPlan;
      
    } catch (error) {
      console.error('Erreur lors de la génération du plan:', error);
      
      // Fallback: générer un plan basique
      return this.generateFallbackPlan(request);
    }
  }


  private static buildTrainingPlanPrompt(request: PlanGenerationRequest): string {
    const { userProfile, goal, weeks, intensity, focusTypes, startDate } = request;
    
    const dayNames = ['', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const selectedDayNames = userProfile.availableDays 
      ? userProfile.availableDays.map(day => dayNames[day]).join(', ')
      : 'non spécifiés';
    const availableDaysNumbers = userProfile.availableDays 
      ? `[${userProfile.availableDays.join(',')}]`
      : 'automatique';

    return `OBJECTIF: ${goal}
NIVEAU: ${userProfile.level}
DURÉE: ${weeks} semaines
DISPONIBILITÉ: ${userProfile.weeklyAvailability} séances/semaine
JOURS SÉLECTIONNÉS: ${selectedDayNames}
JOURS CODES: ${availableDaysNumbers}
INTENSITÉ: ${intensity}
FOCUS: ${focusTypes.join(', ')}

ÉQUIPEMENT:
- Vitesse max: ${userProfile.maxSpeed} km/h
- Inclinaison max: ${userProfile.maxIncline}%
- Cardio: ${userProfile.hasHeartRateMonitor ? 'oui' : 'non'}

VITESSES:
- Marche: ${userProfile.preferredSpeedRange.walkingSpeed} km/h
- Course: ${userProfile.preferredSpeedRange.runningSpeed} km/h
- Sprint: ${userProfile.preferredSpeedRange.sprintSpeed || 'non définie'} km/h

SÉANCE: ${userProfile.usualWorkoutDuration} minutes habituelle
EXPÉRIENCE: ${userProfile.previousExperience.join(', ') || 'débutant'}
CONTRAINTES: ${userProfile.physicalConstraints?.join(', ') || 'aucune'}
DATE DÉBUT: ${startDate}

TOTAL SÉANCES REQUIS: ${userProfile.weeklyAvailability * weeks}`;
  }
  

  private static formatPlannedWorkout(aiWorkout: any): any {
    return {
      id: generateUUID(),
      name: aiWorkout.name,
      description: aiWorkout.description,
      workoutType: aiWorkout.workoutType,
      estimatedDuration: aiWorkout.estimatedDuration,
      estimatedDistance: aiWorkout.estimatedDistance,
      difficulty: aiWorkout.difficulty,
      targetPace: aiWorkout.targetPace,
      weekNumber: aiWorkout.weekNumber, // Préserver pour le calendrier
      dayOfWeek: aiWorkout.dayOfWeek, // Préserver pour le calendrier
      segments: aiWorkout.segments.map((segment: any) => ({
        id: generateUUID(),
        name: segment.name,
        duration: segment.duration,
        distance: segment.distance,
        targetSpeed: segment.targetSpeed,
        targetIncline: segment.targetIncline,
        intensity: segment.intensity,
        rpe: segment.rpe,
        instruction: segment.instruction,
        recoveryAfter: segment.recoveryAfter,
      })),
      createdAt: new Date().toISOString(),
    };
  }

  private static calculateEndDate(startDate: string, weeks: number): string {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (weeks * 7));
    return end.toISOString();
  }

  private static generateFallbackPlan(request: PlanGenerationRequest): TrainingPlan {
    // Plan de base si l'IA échoue
    const { userProfile, goal, weeks, startDate } = request;
    
    // Générer les workouts selon la logique de sécurité
    const { workoutsPerWeek } = this.calculateOptimalWorkouts(
      userProfile.level,
      userProfile.weeklyAvailability,
      goal,
      userProfile.previousExperience
    );
    
    const sampleWorkouts: PlannedWorkout[] = [];
    
    // Générer les workouts pour toutes les semaines
    for (let week = 1; week <= weeks; week++) {
      for (let day = 1; day <= workoutsPerWeek; day++) {
        const workoutTypes = ['easy_run', 'intervals', 'tempo'];
        const workoutType = workoutTypes[(day - 1) % workoutTypes.length];
        
        sampleWorkouts.push({
          id: generateUUID(),
          name: `${workoutType === 'easy_run' ? 'Course facile' : workoutType === 'intervals' ? 'Intervalles' : 'Tempo'} - Semaine ${week}`,
          description: `Séance de ${workoutType === 'easy_run' ? 'course facile' : workoutType === 'intervals' ? 'fractionné' : 'tempo'} pour développer l'endurance`,
          workoutType: workoutType as WorkoutType,
          estimatedDuration: userProfile.usualWorkoutDuration,
          estimatedDistance: Math.round((userProfile.usualWorkoutDuration / 60) * userProfile.preferredSpeedRange.runningSpeed * 1000),
          difficulty: workoutType === 'easy_run' ? 3 : workoutType === 'intervals' ? 6 : 5,
          weekNumber: week,
          dayOfWeek: day,
          segments: [
            {
              id: generateUUID(),
              name: 'Échauffement',
              duration: 300,
              targetSpeed: userProfile.preferredSpeedRange.walkingSpeed,
              targetIncline: 0,
              intensity: 'warm_up',
              rpe: 3,
              instruction: 'Marche rapide pour préparer les muscles'
            },
            {
              id: generateUUID(), 
              name: workoutType === 'easy_run' ? 'Course facile' : workoutType === 'intervals' ? 'Intervalles' : 'Tempo',
              duration: (userProfile.usualWorkoutDuration - 10) * 60,
              targetSpeed: workoutType === 'easy_run' ? 
                userProfile.preferredSpeedRange.runningSpeed * 0.9 : 
                userProfile.preferredSpeedRange.runningSpeed,
              targetIncline: 0,
              intensity: workoutType === 'easy_run' ? 'easy' : workoutType === 'intervals' ? 'vo2max' : 'tempo',
              rpe: workoutType === 'easy_run' ? 5 : workoutType === 'intervals' ? 8 : 6,
              instruction: workoutType === 'easy_run' ? 
                'Course confortable, vous devez pouvoir tenir une conversation' :
                workoutType === 'intervals' ?
                'Alternez 2 minutes rapides et 1 minute de récupération' :
                'Allure soutenue mais contrôlée'
            },
            {
              id: generateUUID(),
              name: 'Retour au calme',
              duration: 300,
              targetSpeed: userProfile.preferredSpeedRange.walkingSpeed,
              targetIncline: 0,
              intensity: 'cool_down',
              rpe: 2,
              instruction: 'Marche lente pour récupérer progressivement'
            }
          ],
          createdAt: new Date().toISOString(),
        });
      }
    }

    return {
      id: generateUUID(),
      name: `Plan ${goal} - ${weeks} semaines`,
      description: `Plan d'entraînement de ${weeks} semaines avec ${workoutsPerWeek} séances par semaine, adapté à votre niveau ${userProfile.level}`,
      goal,
      totalWeeks: weeks,
      workoutsPerWeek: workoutsPerWeek,
      startDate,
      endDate: this.calculateEndDate(startDate, weeks),
      plannedWorkouts: sampleWorkouts,
      userProfile,
      createdAt: new Date().toISOString(),
      generatedByAI: false,
    };
  }

  /**
   * Fonction de test pour valider le système avec un profil débutant/marathon/6 jours
   */
  static async testBeginnerMarathonProfile(): Promise<void> {
    console.log('🧪 TEST: Profil débutant/marathon/6 jours disponibilité');
    
    // Profil de test débutant
    const testProfile = {
      name: 'Test Débutant',
      level: 'beginner' as const,
      goal: '5k' as const, // Profil basique même si l'objectif est marathon
      weeklyAvailability: 6, // 6 jours disponibles
      previousExperience: [],
      physicalConstraints: [],
      maxSpeed: 12,
      maxIncline: 15,
      hasHeartRateMonitor: false,
      preferredSpeedRange: {
        walkingSpeed: 4,
        runningSpeed: 7, // Débutant qui peut à peine courir 4km
        sprintSpeed: 10
      },
      comfortableInclines: {
        flat: 0,
        moderate: 2,
        steep: 5
      },
      usualWorkoutDuration: 30, // 30 minutes seulement
      preferredWorkoutTimes: ['evening'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calcul avec la logique de sécurité
    const { workoutsPerWeek, explanation } = this.calculateOptimalWorkouts(
      testProfile.level,
      testProfile.weeklyAvailability,
      'Marathon', // Objectif marathon
      testProfile.previousExperience
    );

    console.log('📊 Résultats du test:');
    console.log(`- Disponibilité initiale: ${testProfile.weeklyAvailability} jours/semaine`);
    console.log(`- Séances recommandées: ${workoutsPerWeek} jours/semaine`);
    console.log(`- Explication: ${explanation}`);
    
    // Vérifier que la logique fonctionne correctement
    const expectedWorkouts = 3; // Débutant marathon = 3 séances max
    if (workoutsPerWeek === expectedWorkouts && explanation.length > 0) {
      console.log('✅ TEST RÉUSSI: La logique de sécurité fonctionne correctement');
    } else {
      console.log('❌ TEST ÉCHOUÉ: La logique ne fonctionne pas comme attendu');
      console.log(`Expected: ${expectedWorkouts}, Got: ${workoutsPerWeek}`);
    }
  }

  /**
   * Test complet du système de dates et calendrier
   */
  static async testCalendarIntegration(): Promise<void> {
    console.log('📅 TEST: Intégration calendrier et dates précises');
    
    const testProfile = {
      name: 'Test Calendar',
      level: 'intermediate' as const,
      goal: '5k' as const,
      weeklyAvailability: 3,
      previousExperience: [],
      physicalConstraints: [],
      maxSpeed: 12,
      maxIncline: 10,
      hasHeartRateMonitor: false,
      preferredSpeedRange: {
        walkingSpeed: 4.5,
        runningSpeed: 8,
        sprintSpeed: 12
      },
      comfortableInclines: {
        flat: 0,
        moderate: 3,
        steep: 6
      },
      usualWorkoutDuration: 45,
      preferredWorkoutTimes: ['morning'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Créer un plan de test avec fallback
    const startDate = '2024-08-22T08:00:00.000Z'; // 22 août 2024
    const testPlan = this.generateFallbackPlan({
      userProfile: testProfile,
      goal: '5K Challenge',
      weeks: 2,
      intensity: 'moderate',
      focusTypes: ['easy_run', 'intervals'],
      startDate
    });

    console.log(`📋 Plan généré: ${testPlan.name}`);
    console.log(`📊 ${testPlan.plannedWorkouts.length} entraînements sur ${testPlan.totalWeeks} semaines`);

    // Calculer les dates avec le CalendarService
    const workoutsWithDates = CalendarService.calculateWorkoutDates(
      testPlan.plannedWorkouts,
      startDate
    );

    console.log('\n📅 Dates calculées:');
    workoutsWithDates.forEach((workout, index) => {
      if (workout.scheduledDate) {
        const formattedDate = CalendarService.formatFullWorkoutDate(workout.scheduledDate);
        const shortDate = CalendarService.formatWorkoutDate(workout.scheduledDate);
        console.log(`${index + 1}. ${workout.name} - ${shortDate} (${formattedDate})`);
      }
    });

    // Test des fonctions utilitaires
    console.log('\n🔧 Tests fonctions utilitaires:');
    
    const upcomingWorkouts = CalendarService.getUpcomingWorkouts(workoutsWithDates, 7);
    console.log(`- Prochains entraînements (7j): ${upcomingWorkouts.length}`);
    
    const groupedByWeek = CalendarService.groupWorkoutsByWeek(workoutsWithDates);
    console.log(`- Semaines planifiées: ${Object.keys(groupedByWeek).length}`);
    
    Object.entries(groupedByWeek).forEach(([weekNum, week]) => {
      console.log(`  Semaine ${weekNum}: ${week.workouts.length} séances du ${CalendarService.formatWorkoutDate(week.startDate)} au ${CalendarService.formatWorkoutDate(week.endDate)}`);
    });

    console.log('\n✅ Test du système calendrier terminé!');
  }

  /**
   * Test du nouveau prompt simplifié
   */
  static testNewPromptFormat(): void {
    console.log('🧪 TEST: Nouveau format de prompt simplifié\n');
    
    const testProfile = {
      name: 'Test Prompt',
      level: 'beginner' as const,
      goal: 'marathon' as const,
      weeklyAvailability: 3,
      previousExperience: [],
      physicalConstraints: [],
      maxSpeed: 20,
      maxIncline: 15,
      hasHeartRateMonitor: true,
      preferredSpeedRange: {
        walkingSpeed: 5,
        runningSpeed: 7,
        sprintSpeed: 15
      },
      comfortableInclines: {
        flat: 0,
        moderate: 3,
        steep: 8
      },
      usualWorkoutDuration: 60,
      preferredWorkoutTimes: ['morning'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const request: PlanGenerationRequest = {
      userProfile: testProfile,
      goal: 'Marathon',
      weeks: 20,
      intensity: 'moderate',
      focusTypes: ['easy_run', 'intervals', 'tempo'],
      startDate: '2025-08-22T08:57:21.843Z'
    };

    const prompt = this.buildTrainingPlanPrompt(request);
    
    console.log('📝 ANCIEN PROMPT (~77 lignes):');
    console.log('❌ Instructions système répétées');
    console.log('❌ Format JSON dans le prompt');
    console.log('❌ Guidelines de sécurité répétées');
    console.log('❌ Contraintes techniques répétées\n');
    
    console.log('📝 NOUVEAU PROMPT SIMPLIFIÉ:');
    console.log('-------------------');
    console.log(prompt);
    console.log('-------------------');
    
    const lineCount = prompt.split('\n').length;
    console.log(`\n📊 Statistiques:`);
    console.log(`✅ Lignes: ${lineCount} (vs ~77 avant)`);
    console.log(`✅ Réduction: ${Math.round((1 - lineCount/77) * 100)}%`);
    console.log(`✅ Variables seulement: Objectif, niveau, équipement, contraintes`);
    console.log(`✅ Aucune instruction système répétée`);
    console.log(`\n🎯 Le prompt ne contient plus que les variables spécifiques !`);
  }
}