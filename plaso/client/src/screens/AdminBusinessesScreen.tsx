import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoCard } from '../components/PlasoCard';
import { theme } from '../constants/theme';
import { businessApi } from '../services/businessApi';
import { MaterialIcons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

const AdminBusinessesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const data = await businessApi.getAdminBusinesses(activeTab);
      if ((data as any).success) {
        setBusinesses((data as any).data.businesses);
      }
    } catch (error) {
      console.error('Error fetching admin businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBusinesses();
    }, [activeTab])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return theme.colors.success;
      case 'PENDING': return theme.colors.warning;
      case 'REJECTED': return theme.colors.error;
      case 'SUSPENDED': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const renderBusinessCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('AdminBusinessDetails', { businessId: item._id })}
    >
      <PlasoCard style={styles.businessCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.businessName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.verificationStatus) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.verificationStatus) }]}>
              {item.verificationStatus}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>Owner: {item.owner?.name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="category" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>Category: {item.category}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.infoText}>
            Submitted: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </PlasoCard>
    </TouchableOpacity>
  );

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.title}>Business Management</Text>
      </View>

      <View style={styles.tabsContainer}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : businesses.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="inbox" size={64} color={theme.colors.surfaceHighlight} />
          <Text style={styles.emptyText}>No businesses found for this status.</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={item => item._id}
          renderItem={renderBusinessCard}
          contentContainerStyle={styles.listContent}
        />
      )}
    </PlasoScreen>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: 24, fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  businessCard: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  businessName: {
    fontSize: 20, fontWeight: '600',
    color: theme.colors.textLight,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  }
});

export default AdminBusinessesScreen;
