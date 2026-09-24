import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../services/api/reviewApi';
import { Review, ReviewStatus } from '../types/review';

export default function AdminReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modReason, setModReason] = useState('');
  const [modStatus, setModStatus] = useState<ReviewStatus>(ReviewStatus.HIDDEN);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewApi.getAdminReviews();
      if (res.success && res.data) {
        setReviews(res.data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch admin reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = (review: Review, status: ReviewStatus) => {
    setSelectedReview(review);
    setModStatus(status);
    setModReason('');
    setModalVisible(true);
  };

  const submitModeration = async () => {
    if (!selectedReview) return;
    try {
      await reviewApi.moderateReview(selectedReview._id, modStatus, modReason);
      setModalVisible(false);
      fetchReviews();
      if (Platform.OS === 'web') window.alert('Review moderated');
    } catch (error: any) {
      if (Platform.OS === 'web') window.alert('Failed to moderate review');
      else Alert.alert('Error', 'Failed to moderate review');
    }
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.authorName}>{item.author?.name || 'Unknown User'}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.ratingText}>★ {item.rating} - {item.business?.name || 'Unknown Business'}</Text>
      {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
      <Text style={styles.comment}>{item.comment}</Text>
      <Text style={styles.meta}>Reports: {item.reportCount}</Text>

      <View style={styles.actions}>
        {item.status !== ReviewStatus.HIDDEN && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: '#FF9800' }]}
            onPress={() => handleModerate(item, ReviewStatus.HIDDEN)}
          >
            <Text style={[styles.actionText, { color: '#FF9800' }]}>Hide</Text>
          </TouchableOpacity>
        )}
        
        {item.status !== ReviewStatus.REMOVED && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: '#FF5252' }]}
            onPress={() => handleModerate(item, ReviewStatus.REMOVED)}
          >
            <Text style={[styles.actionText, { color: '#FF5252' }]}>Remove</Text>
          </TouchableOpacity>
        )}

        {item.status !== ReviewStatus.PUBLISHED && (
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: '#4CAF50' }]}
            onPress={() => handleModerate(item, ReviewStatus.PUBLISHED)}
          >
            <Text style={[styles.actionText, { color: '#4CAF50' }]}>Restore</Text>
          </TouchableOpacity>
        )}
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
            <Text style={styles.emptyText}>No reviews found.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Moderate Review</Text>
            <Text style={styles.modalSubtitle}>Action: {modStatus}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Reason for moderation (optional)"
              placeholderTextColor="#666"
              value={modReason}
              onChangeText={setModReason}
              multiline
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitModeration}>
                <Text style={styles.submitBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  authorName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statusBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#ccc', fontSize: 12, fontWeight: 'bold' },
  ratingText: { color: '#FFD700', fontWeight: '600', marginBottom: 8 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  comment: { color: '#ccc', fontSize: 14, marginBottom: 8 },
  meta: { color: '#888', fontSize: 12, marginBottom: 12 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12 },
  actionButton: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 12 },
  actionText: { fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#666', fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { color: '#00E5FF', fontSize: 16, marginBottom: 16 },
  input: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#333', color: '#fff', padding: 12, borderRadius: 8, minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 12, marginRight: 12 },
  cancelBtnText: { color: '#ccc', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#00E5FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  submitBtnText: { color: '#000', fontWeight: 'bold' }
});
