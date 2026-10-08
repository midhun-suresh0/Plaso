import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminService from '../services/admin.service';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

const TIME_RANGES = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

export default function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState('30d');
  const [overview, setOverview] = useState<any>(null);

  const loadData = async () => {
    try {
      const data = await AdminService.getOverview(range);
      setOverview(data);
    } catch (error) {
      console.error('Failed to load admin overview', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [range]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderKPICard = (title: string, value: number | string, icon: string, color: string, onPress?: () => void) => (
    <TouchableOpacity
      style={[styles.kpiCard, { borderBottomColor: color, borderBottomWidth: 3 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.kpiTextContainer}>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <MaterialCommunityIcons name="account-circle" size={32} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.rangeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeScroll}>
          {TIME_RANGES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.rangeBtn, range === t.value && styles.rangeBtnActive]}
              onPress={() => setRange(t.value)}
            >
              <Text style={[styles.rangeText, range === t.value && styles.rangeTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {overview && (
            <>
              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('AdminBusinesses')}
                  >
                    <MaterialCommunityIcons name="store-cog" size={24} color={theme.colors.text} />
                    <Text style={styles.actionText}>Manage Businesses</Text>
                    {overview.pendingBusinesses > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{overview.pendingBusinesses}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('AdminReports')} // Assuming this screen exists or will exist
                  >
                    <MaterialCommunityIcons name="shield-alert" size={24} color={theme.colors.text} />
                    <Text style={styles.actionText}>Moderation Queue</Text>
                    {overview.pendingReports > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{overview.pendingReports}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('AdminListings')}
                  >
                    <MaterialCommunityIcons name="shopping" size={24} color={theme.colors.text} />
                    <Text style={styles.actionText}>Marketplace Listings</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('AdminReviews')}
                  >
                    <MaterialCommunityIcons name="star-circle" size={24} color={theme.colors.text} />
                    <Text style={styles.actionText}>Reviews & Feedback</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* KPI Grid */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overview KPIs</Text>
                <View style={styles.kpiGrid}>
                  {renderKPICard('Total Users', overview.totalUsers, 'account-group', '#4ade80')}
                  {renderKPICard('Active Users', overview.activeUsers, 'account-check', '#22d3ee')}
                  {renderKPICard('Total Businesses', overview.totalBusinesses, 'storefront', '#f472b6')}
                  {renderKPICard('Pending Approval', overview.pendingBusinesses, 'store-clock', '#fbbf24', () => navigation.navigate('AdminBusinesses', { status: 'PENDING' }))}
                  {renderKPICard('Marketplace Listings', overview.totalListings, 'tag-multiple', '#c084fc')}
                  {renderKPICard('Total Orders', overview.totalOrders, 'cart-outline', '#60a5fa')}
                  {renderKPICard('Completed Orders', overview.completedOrders, 'cart-check', '#34d399')}
                  {renderKPICard('Total Revenue', `₹${overview.totalRevenue.toLocaleString()}`, 'cash-multiple', '#a3e635')}
                </View>
              </View>

              {/* System Intelligence */}
              <View style={[styles.section, styles.bottomSection]}>
                <Text style={styles.sectionTitle}>System Intelligence</Text>
                <View style={styles.intelligenceCard}>
                  <MaterialCommunityIcons name="brain" size={32} color={theme.colors.primary} />
                  <View style={styles.intelligenceTextContainer}>
                    <Text style={styles.intelligenceTitle}>AI Analytics Active</Text>
                    <Text style={styles.intelligenceDesc}>
                      The system is automatically monitoring user interactions, marketplace anomalies, and content moderation queue.
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rangeScroll: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  rangeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: theme.colors.background,
  },
  rangeBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  rangeText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  rangeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  bottomSection: {
    marginBottom: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: (width - 45) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    color: theme.colors.text,
    marginTop: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: (width - 45) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kpiTextContainer: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  kpiTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  intelligenceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  intelligenceTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  intelligenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  intelligenceDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
