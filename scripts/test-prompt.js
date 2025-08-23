#!/usr/bin/env node

// Script pour tester le nouveau format de prompt
// Usage: node scripts/test-prompt.js

console.log('🧪 TEST: Comparaison des formats de prompts\n');

// Simulation de l'ancien prompt (très long)
const oldPromptSimulation = `Crée un plan d'entraînement de 20 semaines pour atteindre l'objectif Marathon.

## PROFIL UTILISATEUR ANALYSÉ:
- **Niveau**: beginner
- **Objectif**: marathon
- **Disponibilité optimisée**: 3 jours/semaine (ajusté pour la sécurité)
- **Expérience**: Aucune expérience renseignée
- **Contraintes physiques**: Aucune

## ÉQUIPEMENT TAPIS ROULANT:
- **Vitesse maximale**: 20 km/h
- **Inclinaison maximale**: 15%
- **Capteur fréquence cardiaque**: Disponible
- **Vitesse marche confortable**: 5 km/h
- **Vitesse course habituelle**: 7 km/h
- **Vitesse sprint maximale**: 15 km/h
- **Durée habituelle des séances**: 60 minutes

## PARAMÈTRES DU PLAN DEMANDÉ:
- **Intensité souhaitée**: moderate
- **Types d'entraînements privilégiés**: easy_run, intervals, tempo
- **Date de début**: 2025-08-22T08:57:21.843Z

## ⚠️ DIRECTIVES SPÉCIALES NIVEAU DÉBUTANT:
- **Sécurité PRIORITAIRE**: Progression très progressive pour éviter blessures
- **Volume modéré**: Maximum 3-4 séances/semaine même si disponibilité supérieure
- **Intensité contrôlée**: Privilégier easy_run (70%), quelques tempo (20%), recovery (10%)
- **Récupération renforcée**: Minimum 1 jour de repos entre séances intenses
- **Objectif Marathon**: Approche très graduelle avec étapes intermédiaires
- **RPE limité**: Éviter RPE > 7 les premières semaines
- **Instructions renforcées**: Expliquer chaque sensation et donner repères concrets

## CONTRAINTES TECHNIQUES ABSOLUES:
- **Respect matériel**: Utiliser UNIQUEMENT les vitesses ≤ 20 km/h et inclinaisons ≤ 15%
- **Progression physiologique**: Respecter la règle des 10% d'augmentation maximum par semaine
- **Structure obligatoire**: CHAQUE séance doit inclure échauffement (5-15min) et retour au calme (5-10min)
- **Instructions pédagogiques**: Expliquer le "pourquoi" de chaque segment avec repères physiologiques

## CALCUL EXACT DES SÉANCES:
**OBLIGATOIRE**: Générer exactement **3 séances/semaine × 20 semaines = 60 séances au total**.

## FORMAT DE RÉPONSE JSON OBLIGATOIRE:
\`\`\`json
{
  "name": "Plan [Objectif] [Niveau] [Durée] Semaines",
  "description": "Description détaillée du plan avec objectifs et approche pédagogique",
  "workoutsPerWeek": 3,
  "workouts": [
    {
      "name": "Nom explicite et motivant - Semaine X",
      "description": "Description pédagogique expliquant les bénéfices",
      "workoutType": "easy_run|intervals|tempo|long_run|time_trial|fartlek|hill_training|recovery_run|progression_run|threshold",
      "estimatedDuration": [minutes_total],
      "estimatedDistance": [metres],
      "difficulty": [1-10],
      "targetPace": [minutes_par_km],
      "weekNumber": [1-20],
      "dayOfWeek": [1-7],
      "segments": [...]
    }
  ]
}
\`\`\`

## VÉRIFICATION FINALE OBLIGATOIRE:
Avant d'envoyer, COMPTE les séances générées pour confirmer exactement **60 séances** avec progression cohérente semaine par semaine !`;

// Nouveau prompt simplifié
const newPrompt = `OBJECTIF: Marathon
NIVEAU: beginner
DURÉE: 20 semaines
DISPONIBILITÉ: 3 séances/semaine
INTENSITÉ: moderate
FOCUS: easy_run, intervals, tempo

ÉQUIPEMENT:
- Vitesse max: 20 km/h
- Inclinaison max: 15%
- Cardio: oui

VITESSES:
- Marche: 5 km/h
- Course: 7 km/h
- Sprint: 15 km/h

SÉANCE: 60 minutes habituelle
EXPÉRIENCE: débutant
CONTRAINTES: aucune
DATE DÉBUT: 2025-08-22T08:57:21.843Z

TOTAL SÉANCES REQUIS: 60`;

console.log('❌ ANCIEN PROMPT (problématique):');
console.log(`   📏 Longueur: ${oldPromptSimulation.length} caractères`);
console.log(`   📄 Lignes: ${oldPromptSimulation.split('\n').length} lignes`);
console.log(`   🔄 Instructions système répétées dans chaque requête`);
console.log(`   📝 Format JSON spécifié dans le prompt`);
console.log(`   ⚠️  Guidelines de sécurité répétées`);
console.log(`   🏗️  Architecture confuse (système + variables mélangés)\n`);

console.log('✅ NOUVEAU PROMPT (optimisé):');
console.log(`   📏 Longueur: ${newPrompt.length} caractères`);
console.log(`   📄 Lignes: ${newPrompt.split('\n').length} lignes`);
console.log(`   🎯 Variables seulement`);
console.log(`   🧠 Instructions système dans l'agent OpenAI`);
console.log(`   📋 Format JSON paramétré côté agent`);
console.log(`   🏗️  Architecture propre (séparation claire)\n`);

const reduction = Math.round((1 - newPrompt.length/oldPromptSimulation.length) * 100);
console.log(`📊 AMÉLIORATION:`);
console.log(`   🎯 Réduction de ${reduction}% de la taille`);
console.log(`   ⚡ Moins de conflits pour l'IA`);
console.log(`   🔧 Plus maintenable`);
console.log(`   🚀 Réponses plus fiables attendues\n`);

console.log('📋 NOUVEAU PROMPT FINAL:');
console.log('----------------------------------------');
console.log(newPrompt);
console.log('----------------------------------------\n');

console.log('✅ Le prompt est maintenant optimisé pour l\'IA !');
console.log('💡 Instructions système à configurer dans l\'agent OpenAI');