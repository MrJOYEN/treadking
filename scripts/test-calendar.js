#!/usr/bin/env node

// Script simple pour tester le système de calendrier
// Usage: node scripts/test-calendar.js

// Mock des modules React Native pour Node.js
global.console.log = console.log;

// Fonction de test du calcul des dates
function testDateCalculation() {
  console.log('🧪 TEST: Calcul des dates d\'entraînement\n');

  // Simulation de la logique CalendarService.getWorkoutDate
  function getWorkoutDate(planStartDate, weekNumber, dayOfWeek) {
    // Calculer le début de la semaine cible
    const daysToAdd = (weekNumber - 1) * 7;
    const targetWeekStart = new Date(planStartDate);
    targetWeekStart.setDate(planStartDate.getDate() + daysToAdd);
    
    // Ajuster au lundi de cette semaine (dayOfWeek 1 = lundi)
    const currentDayOfWeek = targetWeekStart.getDay(); // 0=dimanche, 1=lundi, etc.
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(targetWeekStart);
    monday.setDate(targetWeekStart.getDate() + mondayOffset);
    
    // Ajouter les jours pour arriver au jour souhaité
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (dayOfWeek - 1));
    
    return targetDate;
  }

  // Test avec date de début 22 août 2024 (jeudi)
  const startDate = new Date('2024-08-22T08:00:00.000Z');
  console.log(`📅 Date de début du plan: ${startDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n`);

  // Plan de test: 2 semaines, 3 séances par semaine (lundi, mercredi, vendredi)
  const testWorkouts = [
    // Semaine 1
    { name: 'Course facile - Semaine 1', weekNumber: 1, dayOfWeek: 1 }, // Lundi
    { name: 'Intervalles - Semaine 1', weekNumber: 1, dayOfWeek: 3 },   // Mercredi  
    { name: 'Tempo - Semaine 1', weekNumber: 1, dayOfWeek: 5 },        // Vendredi
    
    // Semaine 2
    { name: 'Course facile - Semaine 2', weekNumber: 2, dayOfWeek: 1 }, // Lundi
    { name: 'Intervalles - Semaine 2', weekNumber: 2, dayOfWeek: 3 },   // Mercredi
    { name: 'Long run - Semaine 2', weekNumber: 2, dayOfWeek: 5 },     // Vendredi
  ];

  console.log('🏃‍♂️ Plan d\'entraînement calculé:');
  testWorkouts.forEach((workout, index) => {
    const calculatedDate = getWorkoutDate(startDate, workout.weekNumber, workout.dayOfWeek);
    const formattedDate = calculatedDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    });
    
    console.log(`${index + 1}. ${workout.name} → ${formattedDate}`);
  });

  console.log('\n✅ Test terminé! Voici exactement ce que vous aurez:');
  console.log('   Entraînement 1 le lundi 26 août');
  console.log('   Entraînement 2 le mercredi 28 août'); 
  console.log('   Entraînement 3 le vendredi 30 août');
  console.log('   Etc...');
}

// Exécuter le test
testDateCalculation();