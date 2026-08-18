import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  onSubmit: (content: string) => Promise<void>;
};

export function CommentInput({ onSubmit }: Props) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent(''); // clear after success
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Add a comment..."
        placeholderTextColor={theme.colors.textSecondary}
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={500}
      />
      <TouchableOpacity 
        style={[styles.sendButton, (!content.trim() || isSubmitting) && styles.sendButtonDisabled]} 
        onPress={handleSubmit}
        disabled={!content.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={theme.colors.surface} />
        ) : (
          <Ionicons name="send" size={18} color={theme.colors.surface} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceHighlight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    minHeight: 40,
    maxHeight: 100,
    fontSize: theme.typography.sizes.sm,
    marginRight: theme.spacing.sm,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  }
});
