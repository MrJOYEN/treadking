import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PlanScreen from './src/screens/PlanScreen';
import CreatePlanScreen from './src/screens/CreatePlanScreen';
import PlanDetailScreen from './src/screens/PlanDetailScreen';
import WorkoutSessionScreen from './src/screens/WorkoutSessionScreen';
import { WorkoutStatsScreen } from './src/screens/WorkoutStatsScreen';
import { WorkoutHistoryScreen } from './src/screens/WorkoutHistoryScreen';
import { ProfileService } from './src/services/profileService';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserProfile();
    } else {
      setHasProfile(null);
      setCheckingProfile(false);
    }
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) {
      setCheckingProfile(false);
      return;
    }
    
    try {
      const profile = await ProfileService.getProfile(user.id);
      setHasProfile(profile !== null);
    } catch (error) {
      console.error('Error checking profile:', error);
      setHasProfile(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  if (loading || checkingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          hasProfile ? (
            <>
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen} 
              />
              <Stack.Screen 
                name="EditProfile" 
                component={EditProfileScreen} 
              />
              <Stack.Screen 
                name="Plan" 
                component={PlanScreen} 
              />
              <Stack.Screen 
                name="CreatePlan" 
                component={CreatePlanScreen} 
              />
              <Stack.Screen 
                name="PlanDetail" 
                component={PlanDetailScreen} 
              />
              <Stack.Screen 
                name="WorkoutSession" 
                component={WorkoutSessionScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="WorkoutStats" 
                component={WorkoutStatsScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="WorkoutHistory" 
                component={WorkoutHistoryScreen} 
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen} 
            />
          )
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

