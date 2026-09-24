import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { reviewApi } from '../services/api/reviewApi';
import { useAuth } from '../context/AuthContext';

type CreateReviewRouteProp = RouteProp<RootStackParamList, 'CreateReview'>;

export default function CreateReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute<CreateReviewRouteProp>();
  const { orderId, businessId, listingId, reviewId } = route.params;
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    // If reviewId is provided, we are editing an existing review.
    // However, since we don't have a getReviewById endpoint yet, we might need to rely on the parent passing data
    // or fetch from MyReviews. For simplicity, we assume creation or just a dummy fetch if editing is fully implemented later.
  }, [reviewId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      if (Platform.OS === 'web') window.alert('Please select a rating');
      else Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      if (Platform.OS === 'web') window.alert('Please enter a comment');
      else Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setLoading(true);
    try {
      if (reviewId) {
        await reviewApi.updateReview(reviewId, {
          rating,
          title,
          comment,
        });
        if (Platform.OS === 'web') window.alert('Review updated successfully!');
        else Alert.alert('Success', 'Review updated successfully!');
      } else {
        await reviewApi.createReview({
          order: orderId,
          business: businessId,
          listing: listingId,
          rating,
          title,
          comment,
        });
        if (Platform.OS === 'web') window.alert('Review submitted successfully!');
        else Alert.alert('Success', 'Review submitted successfully!');
      }
      navigation.goBack();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to submit review';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? '#FFD700' : '#ccc'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>{reviewId ? 'Edit Review' : 'Rate Your Experience'}</Text>

      <Text style={styles.label}>Rating</Text>
      {renderStars()}

      <Text style={styles.label}>Title (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Sum up your experience"
        placeholderTextColor="#666"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      <Text style={styles.label}>Comment</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Tell us more about it..."
        placeholderTextColor="#666"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={6}
        maxLength={2000}
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading || fetching}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
    marginTop: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  input: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#00E5FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
