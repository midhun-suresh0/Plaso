import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import api from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any, 'PersonalizationSetup'>;
  route: any;
};

const CATEGORIES = [
  'Food & Dining',
  'Fashion & Apparel',
  'Technology',
  'Health & Wellness',
  'Entertainment',
  'Sports',
  'Home & Garden',
  'Education',
  'Travel',
  'Art & Design',
  'Beauty',
  'Automotive'
];

export default function PersonalizationSetupScreen({ navigation, route }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isSignup = route?.params?.isSignup || false;

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Select categories', 'Please select at least one category you are interested in.');
      return;
    }

    setLoading(true);
    try {
      // Create user preference in backend
      await api.post('/recommendations/preferences', {
        categories: selectedCategories
      });
      
      if (isSignup) {
        // Just go to Home, AuthContext will update
        navigation.navigate('Home');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to save preferences', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlasoScreen>
      <View style={styles.header}>
        {!isSignup && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>What interests you?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Select categories to personalize your feed and discover local businesses you'll love.
        </Text>

        <View style={styles.grid}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => toggleCategory(cat)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, selectedCategories.length === 0 && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading || selectedCategories.length === 0}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={styles.saveButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {isSignup && (
          <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: theme.spacing.xxl,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: theme.colors.surface,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  saveButtonText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  }
});
