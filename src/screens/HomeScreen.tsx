import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  navigation?: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Bonjour';
    if (hour < 18) return '☀️ Bon après-midi';
    return '🌙 Bonsoir';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Chaque kilomètre commence par un premier pas",
      "La différence entre l'ordinaire et l'extraordinaire, c'est cette petite partie 'extra'",
      "Tu es plus fort que tes excuses",
      "Le seul mauvais entraînement est celui qu'on ne fait pas",
      "Champions d'aujourd'hui, légendes de demain",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Coureur'} !
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={signOut}
          >
            <Ionicons name="log-out" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {/* Citation motivationnelle */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quote}>"{getMotivationalQuote()}"</Text>
        </View>

        {/* Prochaines fonctionnalités */}
        <View style={styles.comingSoonContainer}>
          <Text style={styles.sectionTitle}>🚀 Bientôt disponible</Text>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>
              Nous développons activement les fonctionnalités suivantes :
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>📋 Plans d'entraînement personnalisés</Text>
              <Text style={styles.featureItem}>🧠 Génération de plans avec IA</Text>
              <Text style={styles.featureItem}>🏃‍♂️ Suivi des séances en temps réel</Text>
              <Text style={styles.featureItem}>📊 Statistiques et historique</Text>
              <Text style={styles.featureItem}>🎯 Objectifs et défis</Text>
            </View>
          </View>
        </View>

        {/* Version actuelle */}
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>✅ Version actuelle</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statusText}>Authentification fonctionnelle</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statusText}>Interface moderne et responsive</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statusText}>Base de données Supabase</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statusText}>Compatible mobile et web</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFF',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteContainer: {
    margin: 24,
    marginBottom: 0,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#333',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  comingSoonContainer: {
    margin: 24,
    marginBottom: 0,
  },
  comingSoonCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  featuresList: {
    marginVertical: 4,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  statusContainer: {
    margin: 24,
  },
  statusCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
});

export default HomeScreen;