import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../theme/colors';
import { CommonStyles, Typography, Spacing, BorderRadius } from '../theme/commonStyles';

interface SettingsScreenProps {
  navigation?: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'À propos de TreadKing',
      'Version 1.0.0\n\nApplication de course sur tapis avec IA intégrée.\n\nDéveloppé avec ❤️ pour tous les coureurs.',
      [{ text: 'OK' }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'Pour toute question ou problème, contactez-nous à:\n\nsupport@treadking.app',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Politique de confidentialité',
      'Vos données sont sécurisées et ne sont jamais partagées avec des tiers. Nous utilisons uniquement vos informations pour améliorer votre expérience d\'entraînement.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Compte</Text>
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>Utilisateur</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Application</Text>
          <View style={styles.card}>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.borderDark, true: Colors.accent }}
                thumbColor={notifications ? Colors.surface : Colors.backgroundTertiary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-medium-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Sons</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: Colors.borderDark, true: Colors.accent }}
                thumbColor={soundEnabled ? Colors.surface : Colors.backgroundTertiary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="sync-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Synchronisation auto</Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: Colors.borderDark, true: Colors.accent }}
                thumbColor={autoSync ? Colors.surface : Colors.backgroundTertiary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Mode sombre</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.borderDark, true: Colors.accent }}
                thumbColor={darkMode ? Colors.surface : Colors.backgroundTertiary}
              />
            </View>

          </View>
        </View>

        {/* Workout Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏃‍♂️ Entraînement</Text>
          <View style={styles.card}>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="speedometer-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Unités de mesure</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>Métrique</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="heart-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Zones cardiaques</Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="trophy-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.settingLabel}>Objectifs</Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Données & Confidentialité</Text>
          <View style={styles.card}>
            
            <TouchableOpacity style={styles.settingItem} onPress={handlePrivacy}>
              <View style={styles.settingInfo}>
                <Ionicons name="shield-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>Politique de confidentialité</Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="download-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>Exporter mes données</Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="trash-outline" size={20} color="#f44336" />
                <Text style={[styles.settingLabel, { color: '#f44336' }]}>Supprimer mon compte</Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons name="chevron-forward" size={16} color="#f44336" />
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Support</Text>
          <View style={styles.card}>
            
            <TouchableOpacity style={styles.settingItem} onPress={handleSupport}>
              <View style={styles.settingInfo}>
                <Ionicons name="help-circle-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>Centre d'aide</Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>Nous contacter</Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="star-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>Noter l'app</Text>
              </View>
              <View style={styles.settingValue}>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleAbout}>
              <View style={styles.settingInfo}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.settingLabel}>À propos</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>v1.0.0</Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#f44336" />
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.container,
  },
  header: {
    ...CommonStyles.header,
  },
  headerTitle: {
    ...CommonStyles.headerTitle,
  },
  placeholder: {
    width: 24,
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
  card: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    ...Typography.h6,
    color: Colors.textOnAccent,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;