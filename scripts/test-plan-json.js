const fs = require('fs');

// Test de lecture et de structure du plan.json
console.log('🧪 TEST: Lecture du fichier plan.json');

try {
  // Lire le fichier plan.json
  const planData = JSON.parse(fs.readFileSync('./plan.json', 'utf8'));
  
  console.log('✅ Fichier lu avec succès');
  console.log('📋 Structure détectée:');
  
  // Vérifier la structure
  if (planData.trainingPlan) {
    console.log(`   - trainingPlan: ${Array.isArray(planData.trainingPlan) ? 'Array' : typeof planData.trainingPlan}`);
    console.log(`   - Nombre d'entraînements: ${planData.trainingPlan.length}`);
    
    // Analyser le premier entraînement
    const firstWorkout = planData.trainingPlan[0];
    console.log('\n🔍 Premier entraînement:');
    console.log(`   - Nom: ${firstWorkout.name}`);
    console.log(`   - Semaine: ${firstWorkout.weekNumber}`);
    console.log(`   - Jour: ${firstWorkout.dayOfWeek}`);
    console.log(`   - Durée: ${firstWorkout.estimatedDuration} minutes`);
    console.log(`   - Segments: ${firstWorkout.segments.length}`);
    
    // Analyser le premier segment
    const firstSegment = firstWorkout.segments[0];
    console.log('\n🧩 Premier segment:');
    console.log(`   - Type: ${firstSegment.type}`);
    console.log(`   - Durée: ${firstSegment.duration} secondes`);
    console.log(`   - Vitesse: ${firstSegment.targetSpeed} km/h`);
    console.log(`   - Inclinaison: ${firstSegment.incline}%`);
    console.log(`   - Description: ${firstSegment.description}`);
    
    // Calculer les statistiques
    const weeks = [...new Set(planData.trainingPlan.map(w => w.weekNumber))];
    const maxWeek = Math.max(...weeks);
    console.log(`\n📊 Statistiques:');
    console.log(`   - Nombre total de semaines: ${maxWeek}`);
    console.log(`   - Semaines uniques: ${weeks.join(', ')}`);
    console.log(`   - Entraînements par semaine: ${Math.ceil(planData.trainingPlan.length / maxWeek)}`);
    
    console.log('\n✅ Structure du JSON validée !');
    
  } else {
    console.log('❌ Erreur: propriété "trainingPlan" non trouvée');
    console.log('📋 Propriétés disponibles:', Object.keys(planData));
  }
  
} catch (error) {
  console.error('❌ Erreur lors de la lecture:', error.message);
}