import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';
import { connectWebSocket, disconnectWebSocket } from './services/websocket';
function RootNavigator() {
  const { user, loading, colors } = useAuth();

  useEffect(() => {
    if (user) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    return () => { };
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.splash, { backgroundColor: colors?.bg || '#05050a' }]}>
        <ActivityIndicator size="large" color={colors?.primary || '#00e5ff'} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={colors?.bg || '#05050a'} />
      {user ? <AppNavigator /> : <LoginScreen />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
