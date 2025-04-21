import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

type StageKey = keyof typeof STAGES;

// Define the stages of the home buying/selling process
const STAGES = {
  INITIAL: {
    id: 'initial',
    title: 'Getting Started',
    description: 'Learning about the process',
    keywords: ['start', 'begin', 'first', 'new', 'learn'],
  },
  FINANCING: {
    id: 'financing',
    title: 'Financing',
    description: 'Understanding mortgage options',
    keywords: ['mortgage', 'loan', 'finance', 'pre-approval', 'credit'],
  },
  SEARCHING: {
    id: 'searching',
    title: 'Home Search',
    description: 'Looking for the right property',
    keywords: ['search', 'find', 'property', 'home', 'house', 'listing'],
  },
  OFFER: {
    id: 'offer',
    title: 'Making an Offer',
    description: 'Preparing and submitting offers',
    keywords: ['offer', 'bid', 'price', 'negotiate'],
  },
  INSPECTION: {
    id: 'inspection',
    title: 'Home Inspection',
    description: 'Evaluating the property',
    keywords: ['inspect', 'inspection', 'appraisal', 'evaluate'],
  },
  CLOSING: {
    id: 'closing',
    title: 'Closing Process',
    description: 'Finalizing the purchase',
    keywords: ['close', 'closing', 'escrow', 'title', 'final'],
  },
} as const;

export default function ProgressScreen() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { conversations } = useChat();
  const [currentStage, setCurrentStage] = useState<StageKey>('INITIAL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyzeProgress = () => {
      if (!conversations || conversations.length === 0) {
        setCurrentStage('INITIAL');
        setIsLoading(false);
        return;
      }

      // Combine all messages from all conversations
      const allMessages = conversations.flatMap(conv => conv.messages || []);
      
      // Count keyword occurrences for each stage
      const stageScores = Object.entries(STAGES).map(([key, stage]) => {
        const score = stage.keywords.reduce((total, keyword) => {
          const matches = allMessages.filter(msg => 
            msg.content.toLowerCase().includes(keyword.toLowerCase())
          ).length;
          return total + matches;
        }, 0);
        return { stage: key as StageKey, score };
      });

      // Find the stage with the highest score
      const highestScore = Math.max(...stageScores.map(s => s.score));
      const currentStage = stageScores.find(s => s.score === highestScore)?.stage || 'INITIAL';
      
      setCurrentStage(currentStage);
      setIsLoading(false);
    };

    analyzeProgress();
  }, [conversations]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#00439A', '#3E75C2', '#86ACE3', '#92DDE7', '#47E9FF']}
        locations={[0, 0.21, 0.46, 0.67, 0.99]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>
            Track your home buying journey
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        <View style={styles.timeline}>
          {Object.entries(STAGES).map(([key, stage], index) => {
            const isCompleted = index < Object.keys(STAGES).indexOf(currentStage);
            const isCurrent = key === currentStage;
            
            return (
              <View key={stage.id} style={styles.timelineItem}>
                <View style={[
                  styles.timelineDot,
                  { 
                    backgroundColor: isCompleted ? colors.primary : colors.border,
                    borderColor: isCurrent ? colors.primary : 'transparent',
                  }
                ]} />
                <View style={[
                  styles.timelineContent,
                  { 
                    borderLeftColor: isCompleted ? colors.primary : colors.border,
                    backgroundColor: colors.card,
                  }
                ]}>
                  <Text style={[
                    styles.stageTitle,
                    { 
                      color: isCompleted || isCurrent ? colors.primary : colors.text,
                      fontWeight: isCurrent ? '600' : '400'
                    }
                  ]}>
                    {stage.title}
                  </Text>
                  <Text style={[styles.stageDescription, { color: colors.secondary }]}>
                    {stage.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  timeline: {
    padding: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 16,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 2,
    shadowColor: 'rgb(5, 52, 145)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  stageTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  stageDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 