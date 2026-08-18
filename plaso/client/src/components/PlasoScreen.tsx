import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';

interface PlasoScreenProps extends SafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const PlasoScreen: React.FC<PlasoScreenProps> = ({ children, style, ...props }) => {
  return (
    <SafeAreaView style={[styles.container, style]} {...props}>
      <StatusBar style="light" />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
