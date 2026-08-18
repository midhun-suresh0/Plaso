import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { postApi } from '../services/postApi';
import { Comment, Post } from '../types/post';
import { PlasoScreen } from '../components/PlasoScreen';
import { CommentItem } from '../components/CommentItem';
import { CommentInput } from '../components/CommentInput';
import { PostCard } from '../components/PostCard';

type RootStackParamList = {
  PostDetails: { post: Post };
};

type PostDetailsScreenRouteProp = RouteProp<RootStackParamList, 'PostDetails'>;

type Props = {
  navigation: NativeStackNavigationProp<any, 'PostDetails'>;
  route: PostDetailsScreenRouteProp;
};

export default function PostDetailsScreen({ navigation, route }: Props) {
  const { post } = route.params;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchComments = async (pageNumber: number) => {
    try {
      const response = await postApi.getComments(post._id, pageNumber);
      if (response.success && response.data) {
        if (pageNumber === 1) {
          setComments(response.data.comments);
        } else {
          setComments(prev => [...prev, ...response.data!.comments]);
        }
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage);
    }
  };

  const handleSend = async (commentContent: string) => {
    try {
      const response = await postApi.addComment(post._id, commentContent);
      if (response.success && response.data) {
        setComments([response.data, ...comments]);
      } else {
        Alert.alert('Error', response.message || 'Failed to add comment');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await postApi.deleteComment(commentId);
            setComments(comments.filter(c => c._id !== commentId));
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete comment');
          }
        }
      }
    ]);
  };

  return (
    <PlasoScreen>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={
              <View style={styles.postContainer}>
                <PostCard post={post} disabled />
                <View style={styles.commentHeaderRow}>
                  <Text style={styles.commentHeaderTitle}>Comments</Text>
                </View>
              </View>
            }
            renderItem={({ item }) => <CommentItem comment={item} onDelete={handleDelete} />}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
              </View>
            }
            ListFooterComponent={
              hasMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : null
            }
          />
        )}

        <CommentInput onSubmit={handleSend} />
      </KeyboardAvoidingView>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  postContainer: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  commentHeaderRow: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  commentHeaderTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
});
