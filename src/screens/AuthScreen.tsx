import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

interface AuthScreenProps {
  navigation: any;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [authError, setAuthError] = useState<string>('');
  
  const { signIn, signUp } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (isSignUp) {
      if (!name.trim()) {
        newErrors.name = 'Le nom est requis';
      }
      
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getErrorMessage = (error: any): string => {
    if (error?.message) {
      if (error.message.includes('Invalid login credentials')) {
        return 'Email ou mot de passe incorrect';
      }
      if (error.message.includes('User already registered')) {
        return 'Un compte avec cet email existe déjà';
      }
      if (error.message.includes('Password should be at least 6 characters')) {
        return 'Le mot de passe doit contenir au moins 6 caractères';
      }
      if (error.message.includes('Unable to validate email address')) {
        return 'Format d\'email invalide';
      }
      return error.message;
    }
    return 'Une erreur inattendue s\'est produite';
  };

  const handleAuth = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setAuthError('');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, { name });
        if (error) {
          console.error('Erreur inscription détaillée:', error);
          setAuthError(getErrorMessage(error));
        } else {
          Alert.alert(
            'Inscription réussie !',
            'Votre compte a été créé. Vous pouvez maintenant vous connecter.'
          );
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Erreur connexion détaillée:', error);
          setAuthError(getErrorMessage(error));
        }
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      setAuthError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setErrors({});
    setAuthError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons name="fitness" size={60} color="#2196F3" />
            <Text style={styles.title}>TreadKing</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Créer un compte' : 'Connexion'}
            </Text>
          </View>

          <View style={styles.card}>
            {authError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#f44336" />
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              {isSignUp && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person" size={24} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Nom complet"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errors.name) {
                          setErrors(prev => ({ ...prev, name: '' }));
                        }
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.name ? <Text style={styles.inputError}>{errors.name}</Text> : null}
                </View>
              )}

              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail" size={24} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) {
                        setErrors(prev => ({ ...prev, email: '' }));
                      }
                      if (authError) {
                        setAuthError('');
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
                {errors.email ? <Text style={styles.inputError}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={24} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: '' }));
                      }
                      if (authError) {
                        setAuthError('');
                      }
                    }}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>
                {errors.password ? <Text style={styles.inputError}>{errors.password}</Text> : null}
              </View>

              {isSignUp && (
                <View style={styles.inputGroup}>
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-open" size={24} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirmer le mot de passe"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }
                      }}
                      secureTextEntry
                    />
                  </View>
                  {errors.confirmPassword ? <Text style={styles.inputError}>{errors.confirmPassword}</Text> : null}
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons 
                      name={isSignUp ? "person-add" : "log-in"} 
                      size={20} 
                      color="white" 
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.buttonText}>
                      {isSignUp ? 'S\'inscrire' : 'Se connecter'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleAuthMode}
                disabled={loading}
              >
                <Text style={styles.toggleButtonText}>
                  {isSignUp 
                    ? 'Déjà un compte ? Se connecter'
                    : 'Pas de compte ? S\'inscrire'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginVertical: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: '#ffffff',
    padding: 20,
    marginHorizontal: 4,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default AuthScreen;