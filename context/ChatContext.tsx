import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Conversation, Message, QuickPrompt } from '@/types';
import { generateResponse } from '@/lib/openai';
import { supabase, checkSupabaseHealth } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import uuid from 'react-native-uuid';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  quickPrompts: QuickPrompt[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  createNewConversation: () => void;
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (id: string) => void;
  sendQuickPrompt: (prompt: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Cache keys
const CONVERSATIONS_CACHE_KEY = 'conversations_cache';
const CACHE_TIMESTAMP_KEY = 'conversations_cache_timestamp';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour instead of 30 minutes

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueue = useRef<Array<{ content: string; resolve: () => void }>>([]);
  const isProcessingQueue = useRef(false);

  // Load cached conversations
  const loadCachedConversations = async () => {
    try {
      console.log('Attempting to load cached conversations...');
      const [cachedData, timestamp] = await Promise.all([
        AsyncStorage.getItem(CONVERSATIONS_CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY)
      ]);
      
      if (cachedData && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);
        console.log(`Cache age: ${cacheAge}ms, Expiry: ${CACHE_EXPIRY}ms`);
        
        if (cacheAge < CACHE_EXPIRY) {
          console.log('Cache is valid, loading from cache');
          const parsedData = JSON.parse(cachedData);
          setConversations(parsedData);
          if (parsedData.length > 0 && !currentConversation) {
            setCurrentConversation(parsedData[0]);
          }
          return true;
        } else {
          console.log('Cache expired, will load from database');
        }
      } else {
        console.log('No cache found, will load from database');
      }
    } catch (error) {
      console.error('Error loading cached conversations:', error);
    }
    return false;
  };

  // Save conversations to cache
  const saveConversationsToCache = async (conversations: Conversation[]) => {
    try {
      await AsyncStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(conversations));
      await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving conversations to cache:', error);
    }
  };

  const loadConversations = async (isRetry = false) => {
    if (!user) {
      console.log('No user found, skipping conversation load');
      setConversations([]);
      setCurrentConversation(null);
      setIsLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        console.log('Loading conversations for user:', user.id);
        setError(null);
        setRetryCount(0);
        setIsLoading(true);

        // Try to load from cache first
        const cacheHit = await loadCachedConversations();
        if (cacheHit) {
          console.log('Successfully loaded from cache');
          setIsLoading(false);
          return;
        }
      }

      // Clear any existing timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Check Supabase health before making the request
      const isHealthy = await checkSupabaseHealth();
      if (!isHealthy) {
        console.log('Database connection is not healthy, retrying...');
        if (retryCount < maxRetries) {
          const backoffTime = Math.pow(2, retryCount) * 1000;
          console.log(`Will retry in ${backoffTime}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            loadConversations(true);
          }, backoffTime);
          
          return;
        } else {
          throw new Error('Database connection is not available after multiple retries');
        }
      }

      console.log('Loading conversations from database...');
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          messages:messages(
            id,
            role,
            content,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (conversationsError) {
        console.error('Error loading conversations:', conversationsError);
        throw conversationsError;
      }

      if (conversationsData) {
        console.log(`Loaded ${conversationsData.length} conversations from database`);
        const formattedConversations = conversationsData.map(convo => ({
          ...convo,
          messages: convo.messages || []
        }));
        
        setConversations(formattedConversations);
        
        // Only set current conversation if none is selected
        if (!currentConversation && formattedConversations.length > 0) {
          setCurrentConversation(formattedConversations[0]);
        }
        
        // Save to cache
        await saveConversationsToCache(formattedConversations);
        setRetryCount(0);
        setError(null);
      } else {
        console.log('No conversations found in database');
        setConversations([]);
        setError(null);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      
      if (retryCount < maxRetries) {
        const backoffTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadConversations(true);
        }, backoffTime);
        
        setError(`Loading conversations... (attempt ${retryCount + 1}/${maxRetries})`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Could not load conversations. Please try again later.';
        console.error('Final error loading conversations:', errorMessage);
        setError(errorMessage);
        
        // Try to load from cache as fallback
        await loadCachedConversations();
      }
    } finally {
      if (!retryTimeoutRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Add a cleanup effect for timeouts
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Add an effect to load conversations when the user changes
  useEffect(() => {
    if (user) {
      console.log('User changed, loading conversations for:', user.id);
      loadConversations();
    } else {
      console.log('No user, clearing conversations');
      setConversations([]);
      setCurrentConversation(null);
      setIsLoading(false);
    }
  }, [user?.id]); // Only reload when user ID changes

  const loadQuickPrompts = async () => {
    if (!user || !user.user_type) {
      console.log("No user or user_type, setting default quick prompts");
      setQuickPrompts(getDefaultPrompts('buyer')); // Default to buyer prompts
      return;
    }
    
    try {
      console.log('Loading quick prompts for user type:', user.user_type);
      const { data, error } = await supabase
        .from('quick_prompts')
        .select('*')
        .eq('user_type', user.user_type);

      if (error) {
        console.error('Error fetching quick prompts:', error);
        // Fall back to default prompts on error
        const defaultPrompts = getDefaultPrompts(user.user_type);
        console.log('Using default prompts:', JSON.stringify(defaultPrompts));
        setQuickPrompts(defaultPrompts);
        return;
      }

      const prompts = data && data.length > 0 ? data : getDefaultPrompts(user.user_type);
      console.log(`Loaded ${prompts.length} quick prompts`);
      console.log('Quick prompts:', JSON.stringify(prompts));
      setQuickPrompts(prompts);
    } catch (error) {
      console.error('Error loading quick prompts:', error);
      // Fall back to default prompts on error
      const defaultPrompts = getDefaultPrompts(user.user_type);
      console.log('Using default prompts:', JSON.stringify(defaultPrompts));
      setQuickPrompts(defaultPrompts);
    }
  };

  const getDefaultPrompts = (userType: 'buyer' | 'owner'): QuickPrompt[] => {
    if (userType === 'buyer') {
      return [
        { id: '1', text: "What are the steps to purchase a home?", user_type: 'buyer' },
        { id: '2', text: "What if inspections go poorly?", user_type: 'buyer' },
        { id: '3', text: "What if I need to get out of this deal?", user_type: 'buyer' },
        { id: '4', text: "🧭 Explore Timelines", user_type: 'buyer' },
        { id: '5', text: "How much home can I afford?", user_type: 'buyer' },
        { id: '6', text: "What are closing costs?", user_type: 'buyer' },
      ];
    } else {
      return [
        { id: '1', text: "Calculate my home affordability", user_type: 'owner' },
        { id: '2', text: "Find a real estate agent", user_type: 'owner' },
        { id: '3', text: "Show me a timeline of the typical home-buying process", user_type: 'owner' },
        { id: '4', text: "🧭 Explore Timelines", user_type: 'owner' },
      ];
    }
  };

  const createNewConversation = async () => {
    if (!user) {
      console.log('No user found, cannot create conversation');
      return;
    }
    
    try {
      console.log('Creating new conversation for user:', user.id);
      setIsLoading(true);
      setError(null);
      
      const newConversationId = uuid.v4().toString();
      const now = new Date().toISOString();
      
      const systemPrompt = `You are Homie, an AI assistant specialized in real estate for ${user.user_type === 'buyer' ? 'home buyers' : 'home owners'}. Provide helpful, accurate, and concise information on real estate topics. Be conversational and friendly.

If the user asks about "Explore Timelines" or mentions timelines, respond with:
"Here are some timelines I can walk you through:

🏡 Home Buying Timeline

🏠 Home Selling Timeline

💰 Mortgage Application Timeline

🛠️ Home Renovation Timeline

Which one would you like to explore?"

If the user selects any of these timelines, provide a structured timeline with 5-6 steps. Each step should have a title, a short description, and a time range. Format the timeline in a clean, step-by-step progression.`;
      
      // Create the conversation object
      const newConversation: Conversation = {
        id: newConversationId,
        title: 'New Conversation',
        messages: [
          {
            id: uuid.v4().toString(),
            role: 'system',
            content: systemPrompt,
            created_at: now,
          },
          {
            id: uuid.v4().toString(),
            role: 'assistant',
            content: `Hi ${user.name || 'there'}! I'm Homie, your AI real estate assistant. I'm here to help with any questions you might have about ${user.user_type === 'buyer' ? 'buying a home' : 'home ownership'}. Feel free to ask me anything or try one of the suggested prompts below.`,
            created_at: now,
          }
        ],
        created_at: now,
        updated_at: now,
      };

      // Update local state immediately
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      
      // Try to save to database in the background
      try {
        const { error: saveError } = await supabase
          .from('conversations')
          .insert([
            {
              id: newConversation.id,
              user_id: user.id,
              title: newConversation.title,
              created_at: newConversation.created_at,
              updated_at: newConversation.updated_at,
            }
          ]);

        if (saveError) {
          console.error('Error saving conversation:', saveError);
          // Don't throw error, just log it since we've already updated local state
        } else {
          // Save to cache
          await saveConversationsToCache([newConversation, ...conversations]);
        }
      } catch (error) {
        console.error('Error saving conversation to database:', error);
        // Don't throw error, just log it since we've already updated local state
      }
      
    } catch (error) {
      console.error('Error in createNewConversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to create new conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processMessageQueue = async () => {
    if (isProcessingQueue.current || messageQueue.current.length === 0) return;
    
    isProcessingQueue.current = true;
    try {
      while (messageQueue.current.length > 0) {
        const { content, resolve } = messageQueue.current[0];
        await sendMessage(content);
        resolve();
        messageQueue.current.shift();
      }
    } finally {
      isProcessingQueue.current = false;
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !currentConversation) return;
    
    // If we're already processing a message, queue this one
    if (isProcessingQueue.current) {
      return new Promise<void>((resolve) => {
        messageQueue.current.push({ content, resolve });
      });
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      // Create a new message from the user
      const newMessageId = uuid.v4().toString();
      const now = new Date().toISOString();
      
      const newMessage: Message = {
        id: newMessageId,
        role: 'user',
        content,
        created_at: now,
      };

      // Update local state immediately for UI responsiveness
      const updatedMessages = Array.isArray(currentConversation.messages) 
        ? [...currentConversation.messages, newMessage]
        : [newMessage];
        
      const updatedConversation = {
        ...currentConversation,
        messages: updatedMessages,
        updated_at: now,
      };
      
      setCurrentConversation(updatedConversation);

      // Get AI response before saving to database for better UX
      const messagesForAI = (updatedMessages || [])
        .filter(msg => msg && (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant'))
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      console.log('Generating AI response...');
      const aiResponse = await generateResponse(messagesForAI);

      // Create a new message for the AI response
      const aiMessageId = uuid.v4().toString();
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: aiResponse.content,
        created_at: new Date().toISOString(),
      };

      // Update local state with AI response
      const finalMessages = [...updatedMessages, aiMessage];
      const finalConversation = {
        ...updatedConversation,
        messages: finalMessages,
        updated_at: new Date().toISOString(),
      };
      
      setCurrentConversation(finalConversation);

      // Batch save both messages and update conversation in a single transaction
      const { error: saveError } = await supabase.rpc('save_chat_messages', {
        p_conversation_id: currentConversation.id,
        p_messages: [
          {
            id: newMessage.id,
            role: newMessage.role,
            content: newMessage.content,
            created_at: newMessage.created_at,
          },
          {
            id: aiMessage.id,
            role: aiMessage.role,
            content: aiMessage.content,
            created_at: aiMessage.created_at,
          }
        ],
        p_updated_at: new Date().toISOString(),
      });

      if (saveError) {
        console.error('Error saving messages:', saveError);
        throw new Error('Failed to save messages');
      }

      // Update conversations list and cache
      const updatedConversations = conversations.map(convo => 
        convo.id === currentConversation.id ? finalConversation : convo
      );
      setConversations(updatedConversations);
      await saveConversationsToCache(updatedConversations);

      // Auto-generate title after the first user message if still using default title
      if (currentConversation.title === 'New Conversation' && finalMessages.filter(m => m.role === 'user').length === 1) {
        generateTitle(finalConversation);
      }

      // Process any queued messages
      processMessageQueue();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Refresh conversations to ensure we have the most up-to-date data
      await refreshConversations();
    } finally {
      setIsSending(false);
    }
  };

  const sendQuickPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const generateTitle = async (conversation: Conversation) => {
    try {
      const firstUserMessage = conversation.messages?.find(m => m.role === 'user');
      if (!firstUserMessage) return;

      console.log('Generating title from first message');
      const { content: title } = await generateResponse([
        { 
          role: 'system', 
          content: 'Generate a short, concise title (3-5 words) for a conversation that starts with this message. Return ONLY the title text without quotes or explanation.' 
        },
        { role: 'user', content: firstUserMessage.content }
      ]);

      const newTitle = title.slice(0, 50).trim() || 'Real Estate Chat';
      console.log('Generated title:', newTitle);
      
      // Update local state
      const updatedConversation = { ...conversation, title: newTitle };
      setCurrentConversation(updatedConversation);
      setConversations(
        conversations.map(convo => 
          convo.id === conversation.id ? updatedConversation : convo
        )
      );

      // Update in database
      await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversation.id);
    } catch (error) {
      console.error('Error generating title:', error);
      // Non-critical error, so we don't need to show it to the user or update state
    }
  };

  const loadConversation = async (id: string) => {
    try {
      console.log('Loading conversation:', id);
      setIsLoading(true);
      setError(null);

      // First find the conversation in our local state
      const conversation = conversations.find(convo => convo.id === id);
      if (!conversation) {
        console.error('Conversation not found in local state:', id);
        // If the conversation isn't found, try to refresh the list
        await refreshConversations();
        return;
      }

      // Fetch messages for this conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        setError('Failed to load messages. Please try again.');
        return;
      }

      // Update the conversation with the fetched messages
      const updatedConversation = {
        ...conversation,
        messages: messages || [],
      };

      setCurrentConversation(updatedConversation);
      
      // Update the conversation in the conversations list
      setConversations(
        conversations.map(convo => 
          convo.id === id ? updatedConversation : convo
        )
      );
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConversations = async () => {
    if (!user) return;
    setError(null);
    await loadConversations();
    // Reload quick prompts too
    await loadQuickPrompts();
  };

  const deleteConversation = async (id: string) => {
    if (!user) {
      console.log('No user found, cannot delete conversation');
      return;
    }

    try {
      console.log('Deleting conversation:', id);
      setError(null);

      // Delete from database
      const { error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting conversation:', deleteError);
        throw deleteError;
      }

      // Update local state
      setConversations(prev => prev.filter(convo => convo.id !== id));
      
      // If the deleted conversation was the current one, set current to null
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }

      // Update cache
      const updatedConversations = conversations.filter(convo => convo.id !== id);
      await saveConversationsToCache(updatedConversations);

      console.log('Successfully deleted conversation');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete conversation. Please try again.');
    }
  };

  const value = {
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
    deleteConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}