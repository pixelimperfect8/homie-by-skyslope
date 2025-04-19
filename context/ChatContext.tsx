import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Conversation, Message, QuickPrompt } from '@/types';
import { generateResponse } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import uuid from 'react-native-uuid';
import { Alert, Platform } from 'react-native';

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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      // Set a timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('Loading timeout reached for chat data');
        setIsLoading(false);
        setError('Could not load conversations. Please try again later.');
      }, 15000); // 15 second timeout
      
      loadConversations();
      loadQuickPrompts();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setIsLoading(false);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [user]);

  const loadConversations = async () => {
    if (!user) {
      console.log('No user found, skipping conversation load');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting to load conversations for user:', user.id);
      
      // First, check if this user has any conversations at all
      console.log('Checking conversation count...');
      const { count, error: countError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (countError) {
        console.error('Error counting conversations:', countError);
        throw countError;
      }
      
      console.log(`Found ${count} conversations for user`);
      
      // If no conversations, set empty and exit early
      if (count === 0) {
        console.log('No conversations found for user');
        setConversations([]);
        setCurrentConversation(null);
        setIsLoading(false);
        
        // Clear the timeout since we've finished loading
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
        
        return;
      }
      
      // If there are conversations, fetch them
      console.log('Fetching conversations...');
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations');
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} conversations`);
      
      // Fetch messages for each conversation
      console.log('Starting to fetch messages for conversations...');
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conversation) => {
          try {
            console.log(`Fetching messages for conversation: ${conversation.id}`);
            const { data: messages, error: messagesError } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversation.id)
              .order('created_at', { ascending: true });

            if (messagesError) {
              console.error('Error fetching messages for conversation:', conversation.id, messagesError);
              // Return conversation with empty messages rather than failing completely
              return {
                ...conversation,
                messages: [],
              };
            }

            console.log(`Retrieved ${messages?.length || 0} messages for conversation ${conversation.id}`);
            return {
              ...conversation,
              messages: messages || [],
            };
          } catch (err) {
            console.error('Failed to load messages for conversation:', conversation.id, err);
            // Return conversation with empty messages rather than failing completely
            return {
              ...conversation,
              messages: [],
            };
          }
        })
      );

      console.log('Successfully processed all conversations with messages');
      setConversations(conversationsWithMessages);
      
      // If no current conversation, set the most recent one
      if (!currentConversation && conversationsWithMessages.length > 0) {
        console.log('Setting current conversation to most recent:', conversationsWithMessages[0].id);
        setCurrentConversation(conversationsWithMessages[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations. Please try refreshing.');
    } finally {
      console.log('Finished loading conversations');
      setIsLoading(false);
      // Clear the timeout since we've finished loading (success or failure)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };

  // Function to refresh conversations
  const refreshConversations = async () => {
    if (!user) return;
    setError(null);
    await loadConversations();
    // Reload quick prompts too
    await loadQuickPrompts();
  };

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
        throw error;
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
    if (!user) return;
    
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

      console.log('Saving new conversation to database');
      
      // Save conversation to Supabase
      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            id: newConversation.id,
            user_id: user.id,
            title: newConversation.title,
            created_at: newConversation.created_at,
            updated_at: newConversation.updated_at,
          }
        ])
        .select();

      if (error) {
        console.error('Error creating new conversation:', error);
        if (Platform.OS === 'web') {
          alert('Error creating new conversation: ' + error.message);
        } else {
          Alert.alert('Error', 'Could not create new conversation. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      console.log('Conversation created, now inserting messages');

      // Insert initial messages - handle each message individually to avoid batch failures
      for (const message of newConversation.messages) {
        try {
          const { error: messageError } = await supabase.from('messages').insert([
            {
              id: message.id,
              conversation_id: newConversation.id,
              role: message.role,
              content: message.content,
              created_at: message.created_at,
            }
          ]);
  
          if (messageError) {
            console.error('Error creating message:', messageError);
          }
        } catch (messageErr) {
          console.error('Failed to insert message:', messageErr);
        }
      }

      console.log('New conversation created with ID:', newConversationId);
      
      // Update local state immediately for better UX
      const updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      setCurrentConversation(newConversation);
      
      // Load conversations and messages again to ensure we have the latest data
      await refreshConversations();
      
    } catch (error) {
      console.error('Error creating new conversation:', error);
      setError('Failed to create new conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !currentConversation) return;
    
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

      // Save the message to Supabase
      const { error: messageError } = await supabase.from('messages').insert([
        {
          id: newMessage.id,
          conversation_id: currentConversation.id,
          role: newMessage.role,
          content: newMessage.content,
          created_at: newMessage.created_at,
        }
      ]);

      if (messageError) {
        console.error('Error saving user message:', messageError);
        throw new Error('Failed to save your message');
      }

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: now })
        .eq('id', currentConversation.id);

      // Get AI response
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

      // Save AI message to Supabase
      const { error: aiMessageError } = await supabase.from('messages').insert([
        {
          id: aiMessage.id,
          conversation_id: currentConversation.id,
          role: aiMessage.role,
          content: aiMessage.content,
          created_at: aiMessage.created_at,
        }
      ]);

      if (aiMessageError) {
        console.error('Error saving AI message:', aiMessageError);
      }

      // Update conversations list
      setConversations(
        conversations.map(convo => 
          convo.id === currentConversation.id ? finalConversation : convo
        )
      );

      // Auto-generate title after the first user message if still using default title
      if (currentConversation.title === 'New Conversation' && finalMessages.filter(m => m.role === 'user').length === 1) {
        generateTitle(finalConversation);
      }
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

  const loadConversation = (id: string) => {
    const conversation = conversations.find(convo => convo.id === id);
    if (conversation) {
      console.log('Loading conversation:', id);
      setCurrentConversation(conversation);
    } else {
      console.error('Conversation not found:', id);
      // If the conversation isn't found, try to refresh the list
      refreshConversations();
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