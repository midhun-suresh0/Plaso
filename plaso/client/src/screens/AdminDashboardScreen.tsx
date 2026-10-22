import React, { useState, useEffect, useCallback } from 'react';
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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
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

type MainTab = 'dashboard' | 'analytics';
type AnalyticsFilter = 'all' | 'financials' | 'users' | 'businesses' | 'reviews';

export default function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  
  // Navigation / View states
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [analyticsFilter, setAnalyticsFilter] = useState<AnalyticsFilter>('all');
  const [range, setRange] = useState('30d');
  
  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard Overview
  const [overview, setOverview] = useState<any>(null);

  // Analytics datasets
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [bizAnalytics, setBizAnalytics] = useState<any>(null);
  const [mktAnalytics, setMktAnalytics] = useState<any>(null);
  const [orderAnalytics, setOrderAnalytics] = useState<any>(null);
  const [revAnalytics, setRevAnalytics] = useState<any>(null);
  const [reviewAnalytics, setReviewAnalytics] = useState<any>(null);
  const [topEntities, setTopEntities] = useState<any>(null);

  const loadData = useCallback(async (isPullToRefresh = false) => {
    if (!isPullToRefresh) setLoading(true);
    setError(null);

    try {
      // Load overview and all analytics concurrently with Promise.allSettled
      const [
        overviewRes,
        usersRes,
        bizRes,
        mktRes,
        ordersRes,
        revRes,
        reviewsRes,
        topRes,
      ] = await Promise.allSettled([
        AdminService.getOverview(range),
        AdminService.getUserAnalytics(range),
        AdminService.getBusinessAnalytics(range),
        AdminService.getMarketplaceAnalytics(range),
        AdminService.getOrderAnalytics(range),
        AdminService.getRevenueAnalytics(range),
        AdminService.getReviewAnalytics(range),
        AdminService.getTopEntities(range),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value) {
        if (__DEV__) console.log('[ADMIN DASHBOARD] Overview:', overviewRes.value);
        setOverview(overviewRes.value);
      }
      if (usersRes.status === 'fulfilled') setUserAnalytics(usersRes.value);
      if (bizRes.status === 'fulfilled') setBizAnalytics(bizRes.value);
      if (mktRes.status === 'fulfilled') setMktAnalytics(mktRes.value);
      if (ordersRes.status === 'fulfilled') setOrderAnalytics(ordersRes.value);
      if (revRes.status === 'fulfilled') setRevAnalytics(revRes.value);
      if (reviewsRes.status === 'fulfilled') setReviewAnalytics(reviewsRes.value);
      if (topRes.status === 'fulfilled') setTopEntities(topRes.value);

      if (overviewRes.status === 'rejected') {
        const errMsg = overviewRes.reason?.response?.data?.message || overviewRes.reason?.message || 'Failed to load dashboard data';
        if (__DEV__) console.warn('[ADMIN DASHBOARD] Overview error:', overviewRes.reason);
        setError(errMsg);
      }
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
      setError('Unable to connect to admin services. Please verify permissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Helper formatting
  const formatCurrency = (val: number | undefined) => {
    return `₹${Number(val || 0).toLocaleString()}`;
  };

  // KPI Card
  const renderKPICard = (
    title: string,
    value: number | string,
    icon: string,
    color: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      key={title}
      style={[styles.kpiCard, { borderBottomColor: color, borderBottomWidth: 3 }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.kpiTextContainer}>
        <Text style={styles.kpiValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.kpiTitle} numberOfLines={1}>{title}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} style={styles.kpiArrow} />
      )}
    </TouchableOpacity>
  );

  // Percentage bar component
  const renderProgressBar = (label: string, count: number, total: number, color: string) => {
    const safeTotal = Math.max(total, 1);
    const pct = Math.min(Math.round((count / safeTotal) * 100), 100);
    return (
      <View key={label} style={styles.progressRow}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>
            {count} <Text style={styles.progressPct}>({pct}%)</Text>
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  // ==================== DASHBOARD VIEW ====================
  const renderDashboardView = () => {
    const data = overview || {
      totalUsers: 0,
      activeUsers: 0,
      totalBusinesses: 0,
      pendingBusinesses: 0,
      totalListings: 0,
      totalOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      pendingReports: 0,
      totalReviews: 0,
    };

    const activeUserPct = Math.round(((data.activeUsers || 0) / Math.max(data.totalUsers || 1, 1)) * 100);
    const orderCompPct = Math.round(((data.completedOrders || 0) / Math.max(data.totalOrders || 1, 1)) * 100);

    return (
      <>
        {/* Quick Actions Center */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AdminBusinesses')}
            >
              <MaterialCommunityIcons name="store-cog" size={26} color={theme.colors.primary} />
              <Text style={styles.actionText}>Businesses</Text>
              {(data.pendingBusinesses || 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{data.pendingBusinesses}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AdminOrders')}
            >
              <MaterialCommunityIcons name="cart-arrow-down" size={26} color="#60a5fa" />
              <Text style={styles.actionText}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AdminListings')}
            >
              <MaterialCommunityIcons name="tag-outline" size={26} color="#c084fc" />
              <Text style={styles.actionText}>Listings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AdminReports')}
            >
              <MaterialCommunityIcons name="shield-alert-outline" size={26} color={theme.colors.error} />
              <Text style={styles.actionText}>Reports</Text>
              {(data.pendingReports || 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{data.pendingReports}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AdminReviews')}
            >
              <MaterialCommunityIcons name="star-check-outline" size={26} color="#fbbf24" />
              <Text style={styles.actionText}>Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview KPIs */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Overview Key Metrics</Text>
            <TouchableOpacity onPress={() => setActiveTab('analytics')}>
              <Text style={styles.sectionActionText}>Deep Analytics →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.kpiGrid}>
            {renderKPICard('Total Users', data.totalUsers || 0, 'account-group', '#4ade80')}
            {renderKPICard('Active Users', data.activeUsers || 0, 'account-check', '#22d3ee')}
            {renderKPICard('Businesses', data.totalBusinesses || 0, 'storefront', '#f472b6', () => navigation.navigate('AdminBusinesses'))}
            {renderKPICard('Pending Approval', data.pendingBusinesses || 0, 'store-clock', '#fbbf24', () => navigation.navigate('AdminBusinesses', { status: 'PENDING' }))}
            {renderKPICard('Listings', data.totalListings || 0, 'tag-multiple', '#c084fc', () => navigation.navigate('AdminListings'))}
            {renderKPICard('Total Orders', data.totalOrders || 0, 'cart-outline', '#60a5fa', () => navigation.navigate('AdminOrders'))}
            {renderKPICard('Completed', data.completedOrders || 0, 'cart-check', '#34d399', () => navigation.navigate('AdminOrders'))}
            {renderKPICard('Total Revenue', formatCurrency(data.totalRevenue), 'cash-multiple', '#a3e635')}
          </View>
        </View>

        {/* Platform Conversion & Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Health</Text>
          <View style={styles.card}>
            <View style={styles.healthRow}>
              <View style={styles.healthItem}>
                <Text style={styles.healthValue}>{activeUserPct}%</Text>
                <Text style={styles.healthLabel}>User Activity Rate</Text>
              </View>
              <View style={styles.healthDivider} />
              <View style={styles.healthItem}>
                <Text style={styles.healthValue}>{orderCompPct}%</Text>
                <Text style={styles.healthLabel}>Order Completion</Text>
              </View>
              <View style={styles.healthDivider} />
              <View style={styles.healthItem}>
                <Text style={styles.healthValue}>{data.totalReviews || 0}</Text>
                <Text style={styles.healthLabel}>Verified Reviews</Text>
              </View>
            </View>
          </View>
        </View>

        {/* System Intelligence */}
        <View style={[styles.section, styles.bottomSection]}>
          <Text style={styles.sectionTitle}>System Intelligence</Text>
          <View style={styles.intelligenceCard}>
            <MaterialCommunityIcons name="brain" size={32} color={theme.colors.primary} />
            <View style={styles.intelligenceTextContainer}>
              <Text style={styles.intelligenceTitle}>AI Analytics & Moderation Active</Text>
              <Text style={styles.intelligenceDesc}>
                Monitoring user interactions, anomaly alerts, content feeds, and marketplace transactions across Plaso.
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  // ==================== ANALYTICS VIEW ====================
  const renderAnalyticsView = () => {
    const showAll = analyticsFilter === 'all';
    const showFinancials = showAll || analyticsFilter === 'financials';
    const showUsers = showAll || analyticsFilter === 'users';
    const showBiz = showAll || analyticsFilter === 'businesses';
    const showReviews = showAll || analyticsFilter === 'reviews';

    return (
      <>
        {/* Analytics Sub-Filter Pills */}
        <View style={styles.subFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilterScroll}>
            {[
              { label: 'All Domains', value: 'all' },
              { label: 'Financials & Orders', value: 'financials' },
              { label: 'Users & Roles', value: 'users' },
              { label: 'Businesses & Catalog', value: 'businesses' },
              { label: 'Reviews & Sentiment', value: 'reviews' },
            ].map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.subFilterBtn, analyticsFilter === f.value && styles.subFilterBtnActive]}
                onPress={() => setAnalyticsFilter(f.value as AnalyticsFilter)}
              >
                <Text style={[styles.subFilterText, analyticsFilter === f.value && styles.subFilterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 1. FINANCIALS & ORDERS */}
        {showFinancials && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue & Order Analytics</Text>
            
            <View style={styles.card}>
              <View style={styles.revGrid}>
                <View style={styles.revStat}>
                  <Text style={styles.revStatLabel}>Gross Revenue</Text>
                  <Text style={[styles.revStatValue, { color: '#4ade80' }]}>
                    {formatCurrency(revAnalytics?.totalRevenue || overview?.totalRevenue)}
                  </Text>
                </View>
                <View style={styles.revStat}>
                  <Text style={styles.revStatLabel}>Refunded Volume</Text>
                  <Text style={[styles.revStatValue, { color: '#f87171' }]}>
                    {formatCurrency(revAnalytics?.totalRefunded || 0)}
                  </Text>
                </View>
                <View style={styles.revStat}>
                  <Text style={styles.revStatLabel}>Total Transactions</Text>
                  <Text style={styles.revStatValue}>
                    {revAnalytics?.totalTransactions || 0}
                  </Text>
                </View>
                <View style={styles.revStat}>
                  <Text style={styles.revStatLabel}>Avg Order Value</Text>
                  <Text style={styles.revStatValue}>
                    {formatCurrency(
                      (revAnalytics?.totalRevenue || 0) / Math.max(overview?.completedOrders || 1, 1)
                    )}
                  </Text>
                </View>
              </View>

              {/* Order Status Distribution */}
              <View style={styles.cardDivider} />
              <Text style={styles.cardSubTitle}>Order Status Distribution</Text>
              {orderAnalytics?.byStatus && orderAnalytics.byStatus.length > 0 ? (
                orderAnalytics.byStatus.map((item: any) => {
                  const statusColors: Record<string, string> = {
                    COMPLETED: '#10b981',
                    PENDING: '#f59e0b',
                    PROCESSING: '#3b82f6',
                    CANCELLED: '#ef4444',
                    DISPUTED: '#dc2626',
                    READY: '#8b5cf6',
                  };
                  const color = statusColors[item._id] || theme.colors.primary;
                  return renderProgressBar(
                    item._id || 'UNKNOWN',
                    item.count,
                    orderAnalytics.total || 1,
                    color
                  );
                })
              ) : (
                <Text style={styles.emptyNotice}>No order status data available for this range.</Text>
              )}
            </View>
          </View>
        )}

        {/* 2. USERS & ROLES */}
        {showUsers && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Base & Demographics</Text>
            
            <View style={styles.card}>
              <View style={styles.revGrid}>
                <View style={styles.revStat}>
                  <Text style={styles.revStatLabel}>Total Users</Text>
                  <Text style={styles.revStatValue}>{userAnalytics?.total || overview?.totalUsers || 0}</Text>
                </View>
                <View style={styles.revStat}>
                  <Text style={styles.revStatLabel}>Active Users</Text>
                  <Text style={[styles.revStatValue, { color: '#22d3ee' }]}>{userAnalytics?.active || overview?.activeUsers || 0}</Text>
                </View>
                <View style={styles.revStat}>
                  <Text style={styles.revStatLabel}>Inactive Users</Text>
                  <Text style={styles.revStatValue}>{userAnalytics?.inactive || 0}</Text>
                </View>
                <View style={styles.revStat}>
                  <Text style={styles.revStatLabel}>Engagement</Text>
                  <Text style={[styles.revStatValue, { color: '#4ade80' }]}>
                    {Math.round(((userAnalytics?.active || 0) / Math.max(userAnalytics?.total || 1, 1)) * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />
              <Text style={styles.cardSubTitle}>Users By Role</Text>
              {userAnalytics?.byRole && userAnalytics.byRole.length > 0 ? (
                userAnalytics.byRole.map((r: any) => {
                  const roleColors: Record<string, string> = {
                    USER: '#3b82f6',
                    BUSINESS_OWNER: '#f472b6',
                    ADMIN: '#fbbf24',
                  };
                  const color = roleColors[r._id] || theme.colors.primary;
                  return renderProgressBar(r._id, r.count, userAnalytics.total || 1, color);
                })
              ) : (
                <Text style={styles.emptyNotice}>No role breakdown data.</Text>
              )}
            </View>
          </View>
        )}

        {/* 3. BUSINESSES & MARKETPLACE */}
        {showBiz && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Businesses & Marketplace Catalog</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardSubTitle}>Business Verification Status</Text>
              {bizAnalytics?.byStatus && bizAnalytics.byStatus.length > 0 ? (
                bizAnalytics.byStatus.map((s: any) => {
                  const statusColors: Record<string, string> = {
                    APPROVED: '#10b981',
                    PENDING: '#f59e0b',
                    REJECTED: '#ef4444',
                    SUSPENDED: '#dc2626',
                  };
                  const color = statusColors[s._id] || theme.colors.textSecondary;
                  return renderProgressBar(s._id, s.count, bizAnalytics.total || 1, color);
                })
              ) : (
                <Text style={styles.emptyNotice}>No business verification data.</Text>
              )}

              {/* Top Business Categories */}
              {bizAnalytics?.byCategory && bizAnalytics.byCategory.length > 0 && (
                <>
                  <View style={styles.cardDivider} />
                  <Text style={styles.cardSubTitle}>Top Business Categories</Text>
                  {bizAnalytics.byCategory.map((cat: any) =>
                    renderProgressBar(cat._id || 'General', cat.count, bizAnalytics.total || 1, '#a855f7')
                  )}
                </>
              )}

              {/* Marketplace Listing Breakdown */}
              {mktAnalytics && (
                <>
                  <View style={styles.cardDivider} />
                  <Text style={styles.cardSubTitle}>Marketplace Listings</Text>
                  {renderProgressBar('Active Listings', mktAnalytics.active || 0, mktAnalytics.total || 1, '#10b981')}
                  {renderProgressBar('Inactive / Sold', mktAnalytics.inactive || 0, mktAnalytics.total || 1, '#64748b')}
                </>
              )}
            </View>
          </View>
        )}

        {/* 4. REVIEWS & CUSTOMER SENTIMENT */}
        {showReviews && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Reviews & Ratings</Text>
            <View style={styles.card}>
              <View style={styles.ratingHeader}>
                <View style={styles.ratingBigScore}>
                  <Text style={styles.ratingNumber}>
                    {reviewAnalytics?.avgRating ? reviewAnalytics.avgRating.toFixed(1) : '5.0'}
                  </Text>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={18}
                        color={i <= Math.round(reviewAnalytics?.avgRating || 5) ? '#fbbf24' : '#475569'}
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingMeta}>Based on {reviewAnalytics?.total || 0} reviews</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />
              <Text style={styles.cardSubTitle}>Rating Breakdown</Text>
              {reviewAnalytics?.byRating && reviewAnalytics.byRating.length > 0 ? (
                [5, 4, 3, 2, 1].map((stars) => {
                  const entry = reviewAnalytics.byRating.find((r: any) => r._id === stars);
                  const count = entry ? entry.count : 0;
                  return renderProgressBar(
                    `${stars} Stars`,
                    count,
                    reviewAnalytics.total || 1,
                    stars >= 4 ? '#fbbf24' : stars === 3 ? '#60a5fa' : '#ef4444'
                  );
                })
              ) : (
                <Text style={styles.emptyNotice}>No review breakdown for this time period.</Text>
              )}
            </View>
          </View>
        )}

        {/* 5. TOP PERFORMING BUSINESSES */}
        {showAll && topEntities?.topBusinesses && topEntities.topBusinesses.length > 0 && (
          <View style={[styles.section, styles.bottomSection]}>
            <Text style={styles.sectionTitle}>Top Performing Businesses</Text>
            <View style={styles.card}>
              {topEntities.topBusinesses.map((biz: any, index: number) => (
                <View key={biz._id || index} style={[styles.topEntityRow, index > 0 && styles.topEntityBorder]}>
                  <View style={styles.topEntityRank}>
                    <Text style={styles.topEntityRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.topEntityInfo}>
                    <Text style={styles.topEntityName} numberOfLines={1}>{biz.name || 'Business'}</Text>
                    <Text style={styles.topEntityMeta}>
                      {biz.ordersCount} orders • {formatCurrency(biz.revenue)}
                    </Text>
                  </View>
                  {biz.rating !== undefined && (
                    <View style={styles.topEntityRating}>
                      <Ionicons name="star" size={14} color="#fbbf24" />
                      <Text style={styles.topEntityRatingText}>{biz.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Admin Hub</Text>
          <Text style={styles.headerSubtitle}>
            Welcome, {user?.name || 'Administrator'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main Mode Tabs: Dashboard vs Analytics */}
      <View style={styles.mainTabContainer}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'dashboard' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <MaterialCommunityIcons
            name="view-dashboard-outline"
            size={18}
            color={activeTab === 'dashboard' ? '#fff' : theme.colors.textSecondary}
          />
          <Text style={[styles.mainTabText, activeTab === 'dashboard' && styles.mainTabTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === 'analytics' && styles.mainTabBtnActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <MaterialCommunityIcons
            name="chart-timeline-variant"
            size={18}
            color={activeTab === 'analytics' ? '#fff' : theme.colors.textSecondary}
          />
          <Text style={[styles.mainTabText, activeTab === 'analytics' && styles.mainTabTextActive]}>
            Analytics & Insights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Range Filter Bar */}
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

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Failed to Load Metrics</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
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
          {activeTab === 'dashboard' ? renderDashboardView() : renderAnalyticsView()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: theme.colors.background,
  },
  mainTabBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  mainTabTextActive: {
    color: '#fff',
  },
  rangeContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  rangeScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rangeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rangeBtnActive: {
    backgroundColor: theme.colors.surfaceHighlight,
    borderColor: theme.colors.primary,
  },
  rangeText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  rangeTextActive: {
    color: theme.colors.primary,
  },
  subFilterContainer: {
    marginBottom: 16,
  },
  subFilterScroll: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  subFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subFilterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subFilterText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  subFilterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  bottomSection: {
    marginBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  sectionActionText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: (width - 48) / 3,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    color: theme.colors.text,
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: (width - 44) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  kpiTextContainer: {
    flex: 1,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  kpiTitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  kpiArrow: {
    marginLeft: 4,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 14,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  healthItem: {
    flex: 1,
    alignItems: 'center',
  },
  healthValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  healthLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  healthDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.border,
  },
  intelligenceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  intelligenceTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  intelligenceTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  intelligenceDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  revGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  revStat: {
    width: '48%',
    marginBottom: 12,
  },
  revStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  revStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  progressRow: {
    marginBottom: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  progressPct: {
    color: theme.colors.textSecondary,
    fontWeight: 'normal',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyNotice: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginVertical: 6,
  },
  ratingHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  ratingBigScore: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  starRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  ratingMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  topEntityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  topEntityBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  topEntityRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topEntityRankText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  topEntityInfo: {
    flex: 1,
  },
  topEntityName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  topEntityMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  topEntityRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topEntityRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 14,
  },
  errorSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
