import { UserProfile, TrainingPlan, PlannedWorkout, TrainingSegment, WorkoutType } from '../types';
import { TrainingPlanService } from './trainingPlanService';

// Configuration pour l'API OpenAI avec Assistant personnalisé
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ID de votre Assistant OpenAI personnalisé (à remplacer)
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || '';

interface PlanGenerationRequest {
  userProfile: UserProfile;
  goal: string;
  weeks: number;
  intensity: string;
  focusTypes: WorkoutType[];
  startDate: string;
}

export class AIService {
  
  static async generateAndSaveTrainingPlan(
    userId: string, 
    request: PlanGenerationRequest
  ): Promise<{ success: boolean; plan?: TrainingPlan; planId?: string; error?: string }> {
    try {
      // Generate the training plan
      const trainingPlan = await this.generateTrainingPlan(request);
      
      // Save to Supabase
      const planId = await TrainingPlanService.createTrainingPlan(userId, trainingPlan);
      
      if (planId) {
        return { 
          success: true, 
          plan: trainingPlan, 
          planId 
        };
      } else {
        return { 
          success: false, 
          error: 'Failed to save training plan to database' 
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
  
  static async generateTrainingPlan(request: PlanGenerationRequest): Promise<TrainingPlan> {
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
        id: `plan_${Date.now()}`,
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

  private static getSystemPrompt(): string {
    return `Tu es TreadKing Coach Pro, expert en entraînement course à pied spécialisé dans les plans pour tapis de course.

EXPERTISE:
- Entraîneur certifié en athlétisme et course de fond
- Spécialiste tapis roulant : maîtrise des spécificités biomécaniques  
- Expert en périodisation : planification scientifique des charges
- Physiologie de l'exercice : zones d'intensité et adaptations métaboliques

TYPES D'ENTRAÎNEMENTS:
- easy_run: Course facile 60-70% FCmax, développe la base aérobie
- intervals: Fractionné court/moyen 85-95% FCmax, améliore VO2max
- tempo: Allure seuil 80-85% FCmax, "confortablement dur" 
- long_run: Sortie longue 65-75% FCmax, endurance fondamentale
- time_trial: Test chronométré, évaluation performance
- fartlek: Jeu de vitesse varié, stimulation mentale
- hill_training: Entraînement inclinaisons, force et puissance
- recovery_run: Récupération active 50-60% FCmax
- progression_run: Accélération progressive dans la séance
- threshold: Allure marathon/seuil lactique

ZONES D'INTENSITÉ:
warm_up, recovery, easy, tempo, threshold, vo2max, neuromuscular, cool_down

PRINCIPES:
- Progression graduelle 10% max par semaine
- Alternance stress/récupération
- Spécificité tapis: vitesses exactes, inclinaisons
- Périodisation: base → intensité → affûtage
- Individualisation selon profil utilisateur

Tu DOIS générer exactement le nombre de séances demandé avec weekNumber et dayOfWeek précis. Répondre UNIQUEMENT en JSON structuré.`;
  }

  private static buildTrainingPlanPrompt(request: PlanGenerationRequest): string {
    const { userProfile, goal, weeks, intensity, focusTypes, startDate } = request;
    
    return `Crée un plan d'entraînement de ${weeks} semaines pour atteindre l'objectif ${goal}.

PROFIL UTILISATEUR:
- Niveau: ${userProfile.level}
- Objectif: ${userProfile.goal}
- Disponibilité: ${userProfile.weeklyAvailability} jours/semaine
- Expérience: ${userProfile.previousExperience.join(', ')}

ÉQUIPEMENT TAPIS:
- Vitesse max: ${userProfile.maxSpeed} km/h
- Inclinaison max: ${userProfile.maxIncline}%
- Capteur FC: ${userProfile.hasHeartRateMonitor ? 'Oui' : 'Non'}
- Vitesse marche: ${userProfile.preferredSpeedRange.walkingSpeed} km/h
- Vitesse course: ${userProfile.preferredSpeedRange.runningSpeed} km/h
- Vitesse sprint: ${userProfile.preferredSpeedRange.sprintSpeed || 'Inconnue'} km/h
- Durée habituelle: ${userProfile.usualWorkoutDuration} min

PARAMÈTRES PLAN:
- Intensité souhaitée: ${intensity}
- Types préférés: ${focusTypes.join(', ')}
- Date début: ${startDate}

CONTRAINTES:
- Utiliser uniquement les vitesses dans les capacités du tapis
- Adapter les intensités au niveau du coureur
- Respecter la progression physiologique
- Inclure échauffement et retour au calme obligatoires
- Instructions claires pour chaque segment

IMPORTANT: Génère exactement ${userProfile.weeklyAvailability} séances par semaine × ${weeks} semaines = ${userProfile.weeklyAvailability * weeks} séances au total.

FORMAT RÉPONSE JSON:
{
  "name": "Nom du plan",
  "description": "Description détaillée", 
  "workoutsPerWeek": ${userProfile.weeklyAvailability},
  "workouts": [
    // TOUTES les séances avec weekNumber et dayOfWeek précis
    {
      "name": "Nom séance semaine X",
      "description": "Description",
      "workoutType": "easy_run|intervals|tempo|etc",
      "estimatedDuration": minutes,
      "estimatedDistance": meters,
      "difficulty": 1-10,
      "targetPace": minutes_per_km,
      "weekNumber": 1-${weeks}, // OBLIGATOIRE
      "dayOfWeek": 1-7, // 1=lun, 3=mer, 5=ven
      "segments": [
        {
          "name": "Échauffement",
          "duration": seconds,
          "distance": meters_optional,
          "targetSpeed": km_h,
          "targetIncline": percentage,
          "intensity": "warm_up|easy|tempo|etc",
          "rpe": 1-10,
          "instruction": "Instructions détaillées pour le coureur",
          "recoveryAfter": seconds_optional
        }
      ]
    }
  ]
}

OBLIGATOIRE: Tu DOIS générer EXACTEMENT ${userProfile.weeklyAvailability * weeks} séances complètes avec progression semaine par semaine !`;
  }

  private static formatPlannedWorkout(aiWorkout: any): any {
    return {
      id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    
    const sampleWorkouts: PlannedWorkout[] = [
      {
        id: 'fallback_1',
        name: 'Course facile',
        description: 'Séance de course facile pour développer l\'endurance de base',
        workoutType: 'easy_run',
        estimatedDuration: 30,
        estimatedDistance: 3000,
        difficulty: 3,
        segments: [
          {
            id: 'seg_1',
            name: 'Échauffement',
            duration: 300,
            targetSpeed: userProfile.preferredSpeedRange.walkingSpeed,
            targetIncline: 0,
            intensity: 'warm_up',
            rpe: 3,
            instruction: 'Marche rapide pour préparer les muscles'
          },
          {
            id: 'seg_2', 
            name: 'Course facile',
            duration: 1200,
            targetSpeed: userProfile.preferredSpeedRange.runningSpeed,
            targetIncline: 0,
            intensity: 'easy',
            rpe: 5,
            instruction: 'Course confortable, vous devez pouvoir tenir une conversation'
          },
          {
            id: 'seg_3',
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
      }
    ];

    return {
      id: `fallback_plan_${Date.now()}`,
      name: `Plan ${goal} - ${weeks} semaines`,
      description: 'Plan d\'entraînement généré automatiquement',
      goal,
      totalWeeks: weeks,
      workoutsPerWeek: 3,
      startDate,
      endDate: this.calculateEndDate(startDate, weeks),
      plannedWorkouts: sampleWorkouts,
      userProfile,
      createdAt: new Date().toISOString(),
      generatedByAI: false,
    };
  }
}