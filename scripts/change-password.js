#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ocdoqzvlsmbuxsuhlroq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquant dans .env');
  console.log('Ajoutez SUPABASE_SERVICE_ROLE_KEY=your_service_role_key dans votre fichier .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function changeUserPassword(email, newPassword) {
  try {
    console.log(`🔄 Changement du mot de passe pour: ${email}`);
    
    // Récupérer la liste des utilisateurs pour trouver l'ID
    const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
    
    if (getUserError) {
      throw getUserError;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      throw new Error(`Utilisateur avec l'email ${email} introuvable`);
    }

    // Mettre à jour le mot de passe avec l'ID utilisateur
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Mot de passe changé avec succès pour ${email}`);
    return updateData;
    
  } catch (error) {
    console.error(`❌ Erreur lors du changement de mot de passe:`, error.message);
    process.exit(1);
  }
}

// Usage depuis la ligne de commande
if (require.main === module) {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('Usage: node scripts/change-password.js <email> <nouveau-mot-de-passe>');
    console.log('Exemple: node scripts/change-password.js user@example.com nouveauMotDePasse123');
    process.exit(1);
  }

  changeUserPassword(email, newPassword);
}

module.exports = { changeUserPassword };