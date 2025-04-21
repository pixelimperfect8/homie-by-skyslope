import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { Conversation } from '@/types';
import { formatDistanceToNow } from '@/utils/dateFormatter';
import { useChat } from '@/context/ChatContext';
import { Ionicons } from '@expo/vector-icons';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onPress: () => void;
}

export default function ConversationItem({ 
  conversation, 
  isActive, 
  onPress 
}: ConversationItemProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { deleteConversation } = useChat();

  // Get the most recent message that's not a system message
  const lastMessage = conversation.messages && conversation.messages.length > 0
    ? [...conversation.messages]
        .reverse()
        .find(msg => msg && msg.role !== 'system')
    : null;

  const preview = lastMessage 
    ? lastMessage.content.length > 40 
      ? `${lastMessage.content.substring(0, 40)}...` 
      : lastMessage.content
    : 'No messages yet';

  const formattedDate = lastMessage 
    ? formatDistanceToNow(new Date(lastMessage.created_at)) 
    : formatDistanceToNow(new Date(conversation.created_at || Date.now()));

  const handleDelete = () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(conversation.id),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && { backgroundColor: colors.card },
        { borderBottomColor: colors.border }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        <Text style={[
          styles.title, 
          { color: colors.text },
          isActive && { fontWeight: '600' }
        ]}>
          {conversation.title}
        </Text>
        <Text style={[styles.preview, { color: colors.muted }]} numberOfLines={1}>
          {preview}
        </Text>
        <Text style={[styles.time, { color: colors.secondary }]}>
          {formattedDate}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color={colors.muted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  preview: {
    fontSize: 14,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});