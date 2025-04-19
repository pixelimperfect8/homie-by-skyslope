import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { Chrome as Home, Key, ChevronRight, ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Homie',
    subtitle: 'Your AI-powered real estate assistant',
    image: 'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '2',
    title: 'Expert Advice',
    subtitle: 'Get answers to all your real estate questions',
    image: 'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '3',
    title: 'Personalized Help',
    subtitle: 'Whether you\'re buying or already own a home',
    image: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export default function OnboardingScreen() {
  const { updateUserType } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUserType, setShowUserType] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const renderItem = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          {item.subtitle}
        </Text>
      </View>
    );
  };

  const handleNext = () => {
    if (currentIndex === slides.length - 1) {
      setShowUserType(true);
    } else {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  const handleSkip = () => {
    setShowUserType(true);
  };

  const handleSelectUserType = async (type: 'buyer' | 'owner') => {
    await updateUserType(type);
    router.replace('/chat');
  };

  const renderUserTypeSelection = () => {
    return (
      <View style={styles.userTypeContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          What best describes you?
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondary, marginBottom: 40 }]}>
          This helps us personalize your experience
        </Text>
        
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
          onPress={() => handleSelectUserType('buyer')}
        >
          <Key size={24} color={colors.primary} />
          <View style={styles.userTypeTextContainer}>
            <Text style={[styles.userTypeTitle, { color: colors.text }]}>
              I want to buy a home
            </Text>
            <Text style={[styles.userTypeDescription, { color: colors.secondary }]}>
              Get help with the home buying process
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.userTypeButton,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
          onPress={() => handleSelectUserType('owner')}
        >
          <Home size={24} color={colors.primary} />
          <View style={styles.userTypeTextContainer}>
            <Text style={[styles.userTypeTitle, { color: colors.text }]}>
              I already own a home
            </Text>
            <Text style={[styles.userTypeDescription, { color: colors.secondary }]}>
              Get help with home ownership
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (showUserType) {
    return renderUserTypeSelection();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor:
                  index === currentIndex ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>
      
      <View style={styles.buttonContainer}>
        {currentIndex > 0 ? (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.card }]}
            onPress={handlePrev}
          >
            <ChevronLeft size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
        
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.secondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <ChevronRight size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
  },
  userTypeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  userTypeTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userTypeDescription: {
    fontSize: 14,
  },
});