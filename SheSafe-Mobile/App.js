import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './src/screens/HomeScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcons({ route, focused }) {
  const icons = {
    Home: focused ? '🚨' : '🛡️',
    Contacts: focused ? '👥' : '👤',
  };
  return <Text style={{ fontSize: 22 }}>{icons[route.name] || '●'}</Text>;
}

function MainTabs({ username, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: (props) => <TabIcons route={route} {...props} />,
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: '#fff',
          elevation: 16,
          shadowColor: '#7c3aed',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" options={{ tabBarLabel: 'SOS & Safety' }}>
        {(props) => <HomeScreen {...props} username={username} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarLabel: 'Guardians' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('username').then((storedUser) => {
      setUser(storedUser || null);
      setLoading(false);
    });
  }, []);

  function handleLogin(username) {
    setUser(username);
  }

  function handleLogout() {
    AsyncStorage.removeItem('username');
    setUser(null);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#7c3aed' }}>
        <Text style={{ fontSize: 50, marginBottom: 16 }}>🛡️</Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainTabs username={user} onLogout={handleLogout} />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
