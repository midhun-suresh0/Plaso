import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AdminService from '../services/admin.service';
import { theme } from '../constants/theme';
import { PlasoCard } from '../components/PlasoCard';
import { PlasoAvatar } from '../components/PlasoAvatar';
import { format } from 'date-fns';

export default function AdminReportsScreen({ navigation }: any) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    try {
      const data = await AdminService.getReports(1, 50, '', 'OPEN');
      setReports(data.items || []);
    } catch (error) {
      console.error('Error loading reports', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await AdminService.updateReportStatus(id, 'RESOLVED', 'Resolved by admin');
      loadReports();
    } catch (error) {
      console.error('Error resolving report', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await AdminService.updateReportStatus(id, 'DISMISSED', 'Dismissed by admin');
      loadReports();
    } catch (error) {
      console.error('Error dismissing report', error);
    }
  };

  const renderReport = ({ item }: { item: any }) => (
    <PlasoCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.reporterInfo}>
          <PlasoAvatar uri={item.reporter?.profileImage} name={item.reporter?.name} size="sm" />
          <View style={styles.reporterText}>
            <Text style={styles.reporterName}>{item.reporter?.name}</Text>
            <Text style={styles.reportDate}>{format(new Date(item.createdAt), 'MMM d, yyyy')}</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.reason}</Text>
        </View>
      </View>
      
      <Text style={styles.description}>{item.description || 'No additional description provided.'}</Text>
      
      <View style={styles.targetInfo}>
        <Text style={styles.targetText}>Target: {item.targetType} ({item.targetId})</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.dismissBtn]} onPress={() => handleDismiss(item._id)}>
          <Text style={styles.dismissBtnText}>Dismiss</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.resolveBtn]} onPress={() => handleResolve(item._id)}>
          <Text style={styles.resolveBtnText}>Resolve</Text>
        </TouchableOpacity>
      </View>
    </PlasoCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moderation Queue</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReports(); }} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="check-circle-outline" size={64} color={theme.colors.success} />
              <Text style={styles.emptyText}>Moderation queue is empty!</Text>
            </View>
          }
        />
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reporterText: {
    marginLeft: 10,
  },
  reporterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  reportDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  badge: {
    backgroundColor: theme.colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 12,
  },
  targetInfo: {
    backgroundColor: theme.colors.background,
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  targetText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dismissBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dismissBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  resolveBtn: {
    backgroundColor: theme.colors.primary,
  },
  resolveBtnText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
});
