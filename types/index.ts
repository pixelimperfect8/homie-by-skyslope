export type UserType = 'buyer' | 'owner';

export interface User {
  id: string;
  email: string;
  name: string;
  user_type?: UserType;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface QuickPrompt {
  id: string;
  text: string;
  user_type: UserType;
}

export interface Agent {
  id: string;
  name: string;
  company: string;
  rating: number;
  photo: string;
  email: string;
  phone: string;
}