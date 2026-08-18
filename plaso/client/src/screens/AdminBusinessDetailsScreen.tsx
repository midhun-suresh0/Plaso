import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { theme } from '../constants/theme';
import { businessApi } from '../services/businessApi';

type DetailsRouteProp = RouteProp<RootStackParamList, 'AdminBusinessDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AdminBusinessDetailsScreen = () => {
  const route = useRoute<DetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { businessId } = route.params;

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBusinessDetails();
  }, [businessId]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      const data = await businessApi.getBusinessById(businessId);
      if ((data as any).success) {
        setBusiness((data as any).data);
      }
    } catch (error) {
      console.error('Error fetching business details:', error);
      Alert.alert('Error', 'Failed to fetch business details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (status: string) => {
    Alert.alert(
      `Confirm ${status}`,
      `Are you sure you want to change the status to ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              setActionLoading(true);
              const response: any = await businessApi.updateBusinessStatus(businessId, status);
              if (response.success) {
                setBusiness((response as any).data);
                Alert.alert('Success', `Business is now ${status}`);
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading || !business) {
    return (
      <PlasoScreen>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PlasoScreen>
    );
  }

  return (
    <PlasoScreen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Review Business</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Business Name</Text>
          <Text style={styles.value}>{business.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Owner</Text>
          <Text style={styles.value}>{business.owner?.name} ({business.owner?.email})</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{business.category}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{business.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Current Status</Text>
          <Text style={[styles.value, { color: theme.colors.primary, fontWeight: '700' }]}>
            {business.verificationStatus}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {business.verificationStatus !== 'APPROVED' && (
            <PlasoButton 
              title="Approve"
              onPress={() => handleUpdateStatus('APPROVED')}
              loading={actionLoading}
              style={[styles.actionBtn, { backgroundColor: theme.colors.success, borderColor: theme.colors.success }]}
            />
          )}
          
          {business.verificationStatus !== 'REJECTED' && (
            <PlasoButton 
              title="Reject"
              variant="secondary"
              onPress={() => handleUpdateStatus('REJECTED')}
              loading={actionLoading}
              style={[styles.actionBtn, { borderColor: theme.colors.error }]}
            />
          )}
          
          {business.verificationStatus === 'APPROVED' && (
            <PlasoButton 
              title="Suspend"
              variant="secondary"
              onPress={() => handleUpdateStatus('SUSPENDED')}
              loading={actionLoading}
              style={[styles.actionBtn, { borderColor: theme.colors.warning }]}
            />
          )}
        </View>

        <PlasoButton 
          title="Go Back"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        />
      </ScrollView>
    </PlasoScreen>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 32, fontWeight: 'bold',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  actionsContainer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  actionBtn: {
    width: '100%',
  },
  backBtn: {
    width: '100%',
    marginTop: theme.spacing.xl,
  }
});

export default AdminBusinessDetailsScreen;
