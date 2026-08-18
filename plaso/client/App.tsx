import React from 'react';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';

/**
 * Plaso — Root Application Component.
 * Wraps the app with context providers and navigation.
 */
export default function App(): React.JSX.Element {
  return (
    <AppProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppNavigator />
        </NotificationProvider>
      </AuthProvider>
    </AppProvider>
  );
}
