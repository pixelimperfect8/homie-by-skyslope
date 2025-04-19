import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, ActivityIndicator, TouchableOpacity, ScrollView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import ChatBubble from '@/components/ChatBubble';
import MessageInput from '@/components/MessageInput';
import QuickPromptButton from '@/components/QuickPromptButton';
import ConversationItem from '@/components/ConversationItem';
import { Menu, Plus, RefreshCw, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function ChatScreen() {
  const { 
    conversations, 
    currentConversation, 
    quickPrompts,
    isLoading, 
    isSending,
    error,
    createNewConversation,
    sendMessage,
    loadConversation,
    sendQuickPrompt,
    refreshConversations,
  } = useChat();
  
  const { user } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const chatListRef = useRef<FlatList>(null);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create a timeout to handle cases where loading takes too long
  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoadingTimeout(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  // Create a new conversation if none exists
  useEffect(() => {
    if (!isLoading && !currentConversation && Array.isArray(conversations) && conversations.length === 0) {
      console.log('No conversations found, creating a new one');
      createNewConversation();
    }
  }, [isLoading, currentConversation, conversations]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (currentConversation?.messages?.length) {
      setTimeout(() => {
        if (chatListRef.current && Platform.OS !== 'web') {
          chatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [currentConversation?.messages?.length]);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    Animated.timing(drawerAnim, {
      toValue: isDrawerOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshConversations();
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const drawerTranslate = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0],
  });

  const renderChatMessage = ({ item }) => {
    if (!item) return null;
    return <ChatBubble message={item} />;
  };

  // Create icon components with platform-specific props
  const MenuIcon = () => <Menu size={24} color={colors.text} strokeWidth={2} />;
  const PlusIcon = () => <Plus size={24} color={colors.primary} strokeWidth={2} />;
  const SmallPlusIcon = () => <Plus size={20} color={colors.primary} strokeWidth={2} />;
  const RefreshIcon = () => <RefreshCw size={20} color={colors.primary} strokeWidth={2} />;
  const AlertIcon = () => <AlertCircle size={20} color={colors.error} strokeWidth={2} />;

  if (isLoading && !loadingTimeout) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.secondary }]}>Loading conversations...</Text>
      </View>
    );
  }

  if (loadingTimeout) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <AlertIcon />
        <Text style={[styles.errorText, { color: colors.error, marginTop: 10 }]}>
          It's taking longer than usual to load your conversations.
        </Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
        >
          <RefreshIcon />
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.altButton, { borderColor: colors.primary }]}
          onPress={createNewConversation}
        >
          <Text style={[styles.altButtonText, { color: colors.primary }]}>Start New Conversation</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
          <MenuIcon />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {currentConversation?.title || 'New Conversation'}
        </Text>
        <TouchableOpacity onPress={createNewConversation} style={styles.newChatButton}>
          <PlusIcon />
        </TouchableOpacity>
      </View>

      {/* Drawer - Full height */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.background,
            borderRightColor: colors.border,
            transform: [{ translateX: drawerTranslate }],
            top: 0,
            height: '100%',
          },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.drawerTitle, { color: colors.text }]}>Your Conversations</Text>
            <TouchableOpacity onPress={createNewConversation}>
              <SmallPlusIcon />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={conversations || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationItem
                conversation={item}
                isActive={currentConversation?.id === item.id}
                onPress={() => {
                  loadConversation(item.id);
                  toggleDrawer();
                }}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  No conversations yet
                </Text>
                <TouchableOpacity 
                  style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    createNewConversation();
                    toggleDrawer();
                  }}
                >
                  <Text style={styles.emptyStateButtonText}>Start New Chat</Text>
                </TouchableOpacity>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        </SafeAreaView>
      </Animated.View>

      {/* Chat Content */}
      <View style={styles.chatContainer}>
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <AlertIcon />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { borderColor: colors.primary }]}
              onPress={handleRefresh}
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {currentConversation ? (
          <>
            <FlatList
              ref={chatListRef}
              data={(currentConversation.messages || []).filter(m => m?.role !== 'system')}
              renderItem={renderChatMessage}
              keyExtractor={(item) => item?.id || Math.random().toString()}
              contentContainerStyle={styles.chatContent}
              ListEmptyComponent={
                <View style={styles.emptyChatContainer}>
                  <Text style={[styles.emptyChatText, { color: colors.secondary }]}>
                    No messages yet. Start chatting below!
                  </Text>
                </View>
              }
              ListFooterComponent={
                isSending ? (
                  <View style={styles.loadingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
            
            {/* Always show quick prompts for empty conversations */}
            {Array.isArray(currentConversation.messages) && 
             currentConversation.messages.filter(m => m?.role === 'user').length === 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPromptsContainer}
              >
                {/* Force render of quick prompts even if quickPrompts is empty */}
                {(quickPrompts && quickPrompts.length > 0 ? quickPrompts : [
                  { id: '1', text: "What are the steps to purchase a home?", user_type: 'buyer' },
                  { id: '2', text: "What if inspections go poorly?", user_type: 'buyer' },
                  { id: '3', text: "What if I need to get out of this deal?", user_type: 'buyer' },
                  { id: '4', text: "🧭 Explore Timelines", user_type: 'buyer' },
                  { id: '5', text: "How much home can I afford?", user_type: 'buyer' },
                  { id: '6', text: "What are closing costs?", user_type: 'buyer' },
                ]).map((prompt) => (
                  <QuickPromptButton
                    key={prompt.id}
                    text={prompt.text}
                    onPress={() => sendQuickPrompt(prompt.text)}
                  />
                ))}
              </ScrollView>
            )}
            
            <MessageInput
              onSend={sendMessage}
              disabled={isSending}
            />
          </>
        ) : (
          <View style={styles.emptyChatContainer}>
            <Text style={[styles.emptyChatText, { color: colors.secondary }]}>
              Start a new conversation by clicking the + button
            </Text>
            <TouchableOpacity 
              style={[styles.newChatButtonLarge, { backgroundColor: colors.primary }]}
              onPress={createNewConversation}
            >
              <PlusIcon />
              <Text style={styles.newChatButtonText}>New Conversation</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Overlay to close drawer when tapped */}
      {isDrawerOpen && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleDrawer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  newChatButton: {
    padding: 4,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    borderRightWidth: 1,
    zIndex: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 15,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingIndicator: {
    padding: 16,
    alignItems: 'center',
  },
  quickPromptsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyChatText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  errorContainer: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    marginVertical: 8,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  refreshButtonText: {
    marginLeft: 8,
    color: 'white',
    fontWeight: '500',
  },
  altButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  altButtonText: {
    fontWeight: '500',
  },
  newChatButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
});