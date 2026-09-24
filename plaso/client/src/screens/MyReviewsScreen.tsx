import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../services/api/reviewApi';
import { Review } from '../types/review';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyReviewsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewApi.getMyReviews();
      if (res.success && res.data) {
        setReviews(res.data.reviews);
      }
    } catch (error: any) {
      console.error('Failed to fetch my reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to delete this review?')
      : await new Promise((resolve) => {
          Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Delete', onPress: () => resolve(true), style: 'destructive' }
          ]);
        });
        
    if (!confirmDelete) return;

    try {
      await reviewApi.deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      if (Platform.OS === 'web') window.alert('Review deleted');
    } catch (error: any) {
      if (Platform.OS === 'web') window.alert('Failed to delete review');
      else Alert.alert('Error', 'Failed to delete review');
    }
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.businessName}>{item.business?.name || 'Business'}</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      
      {item.listing && (
        <Text style={styles.listingName}>Item: {item.listing.title}</Text>
      )}

      {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
      <Text style={styles.comment}>{item.comment}</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateReview', {
            orderId: item.order,
            businessId: item.business._id || item.business,
            listingId: item.listing?._id,
            reviewId: item._id
          })}
        >
          <Ionicons name="pencil" size={18} color="#00E5FF" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDelete(item._id)}
        >
          <Ionicons name="trash" size={18} color="#FF5252" />
          <Text style={[styles.actionText, { color: '#FF5252' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && reviews.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        renderItem={renderReview}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>You haven't written any reviews yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  listingName: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  comment: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    color: '#00E5FF',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  }
});
