import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { PlasoCard } from '../components/PlasoCard';
import { theme } from '../constants/theme';
import { businessApi } from '../services/businessApi';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BusinessDashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBusinesses = async () => {
    try {
      setLoading(true);
      const data = await businessApi.getMyBusinesses();
      if ((data as any).success && (data as any).data) {
        setBusinesses((data as any).data);
      } else {
        setBusinesses([]);
      }
    } catch (error) {
      console.log('Error fetching business or no business found:', error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMyBusinesses();
    }, [])
  );

  const toggleShopStatus = async (bus: any) => {
    try {
      const newStatus = !bus.isOpen;
      const res = await businessApi.updateMyBusiness(bus._id, { isOpen: newStatus });
      if ((res as any).success) {
        setBusinesses(prev => prev.map(b => b._id === bus._id ? { ...b, isOpen: newStatus } : b));
        Alert.alert('Success', `Shop is now ${newStatus ? 'Open' : 'Closed'}`);
      }
    } catch (error) {
      console.log('Error updating shop status:', error);
      Alert.alert('Error', 'Failed to update shop status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return theme.colors.success;
      case 'PENDING': return theme.colors.warning;
      case 'REJECTED': return theme.colors.error;
      case 'SUSPENDED': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <PlasoScreen>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PlasoScreen>
    );
  }

  if (businesses.length === 0) {
    return (
      <PlasoScreen>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Business Dashboard</Text>
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="storefront" size={64} color={theme.colors.surfaceHighlight} />
          <Text style={styles.emptyTitle}>No Business Yet</Text>
          <Text style={styles.emptyText}>Create your business profile to start reaching local customers.</Text>
          <PlasoButton 
            title="Create Business" 
            onPress={() => navigation.navigate('EditBusiness')}
            style={styles.createButton}
          />
        </View>
      </PlasoScreen>
    );
  }

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditBusiness')}>
          <MaterialIcons name="add" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {businesses.map(business => (
          <View key={business._id} style={{ marginBottom: theme.spacing.xl }}>
            {/* Status Banner */}
            {business.verificationStatus !== 'APPROVED' && (
              <View style={[styles.statusBanner, { borderLeftColor: getStatusColor(business.verificationStatus) }]}>
                <MaterialIcons name="info-outline" size={24} color={getStatusColor(business.verificationStatus)} />
                <View style={styles.bannerTextContainer}>
                  <Text style={styles.bannerTitle}>Status: {business.verificationStatus}</Text>
                  <Text style={styles.bannerDesc}>
                    {business.verificationStatus === 'PENDING' ? 'Your business is awaiting admin approval.' :
                     business.verificationStatus === 'REJECTED' ? 'Your business application was rejected.' :
                     'Your business is suspended.'}
                  </Text>
                </View>
              </View>
            )}

            {/* Header Card */}
            <PlasoCard style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.businessName}>{business.name}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('BusinessProfile', { businessId: business._id })}>
                  <MaterialIcons name="visibility" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.categoryText}>{business.category}</Text>

              <View style={styles.shopStatusRow}>
                <Text style={styles.shopStatusText}>
                  Shop Status: {business.isOpen ? 'Open' : 'Closed'}
                </Text>
                <Switch
                  value={business.isOpen}
                  onValueChange={() => toggleShopStatus(business)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.success }}
                  thumbColor={theme.colors.surface}
                />
              </View>
              
              <View style={styles.actionRow}>
                <PlasoButton 
                  title="Edit Profile" 
                  variant="secondary"
                  onPress={() => navigation.navigate('EditBusiness', { businessId: business._id })} 
                  style={styles.actionButton}
                />
                <PlasoButton 
                  title="Create Post" 
                  variant="primary"
                  onPress={() => navigation.navigate('CreatePost', { asBusiness: true })} 
                  disabled={business.verificationStatus !== 'APPROVED'}
                  style={styles.actionButton}
                />
              </View>
              <PlasoButton 
                title="Manage Listings" 
                variant="secondary"
                onPress={() => navigation.navigate('BusinessListings', { businessId: business._id })} 
                disabled={business.verificationStatus !== 'APPROVED'}
                style={{ marginTop: theme.spacing.md }}
              />
            </PlasoCard>
          </View>
        ))}
      </ScrollView>
    </PlasoScreen>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 32, fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  emptyTitle: {
    fontSize: 24, fontWeight: 'bold',
    color: theme.colors.textLight,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  createButton: {
    width: '100%',
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  statusBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderLeftWidth: 4,
    marginBottom: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  bannerTextContainer: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18, fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  mainCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  businessName: {
    fontSize: 24, fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  categoryText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  shopStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.lg,
  },
  shopStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20, fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    width: '47%',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24, fontWeight: 'bold',
    color: theme.colors.textLight,
    marginTop: theme.spacing.sm,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  }
});

export default BusinessDashboardScreen;
