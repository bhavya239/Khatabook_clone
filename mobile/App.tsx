import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Wallet, Users, CheckSquare, User, Building2 } from 'lucide-react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import PinGateScreen from './src/screens/auth/PinGateScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import ContactsScreen from './src/screens/main/ContactsScreen';
import ContactDetailScreen from './src/screens/main/ContactDetailScreen';
import TodosScreen from './src/screens/main/TodosScreen';
import SettingsScreen from './src/screens/main/SettingsScreen';
import BusinessScreen from './src/screens/main/BusinessScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f3f4f6', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { color: '#111827', fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />, title: 'Ledger' }} />
      <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} />, title: 'Parties' }} />
      <Tab.Screen name="Tasks" component={TodosScreen} options={{ tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />, title: 'Tasks' }} />
      <Tab.Screen name="Business" component={BusinessScreen} options={{ tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} />, title: 'Business' }} />
      <Tab.Screen name="Profile" component={SettingsScreen} options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} />, title: 'Settings' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isUnlocked, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : !isUnlocked ? (
          <Stack.Screen name="PinGate" component={PinGateScreen} />
        ) : (
          <>
            <Stack.Screen name="Root" component={MainTabs} />
            <Stack.Screen
              name="ContactDetail"
              component={ContactDetailScreen}
              options={{ headerShown: true, headerTitle: 'Party Ledger', headerBackTitle: 'Back', headerStyle: { backgroundColor: '#fff' }, headerTitleStyle: { fontWeight: '700' } }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
