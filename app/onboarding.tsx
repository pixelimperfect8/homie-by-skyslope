import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image, ViewToken, Animated } from 'react-native';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { Chrome as Home, Key, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import SmallLogo from '@/components/SmallLogo';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Homie',
    subtitle: 'Your AI-powered real estate assistant',
    image: require('@/assets/images/slide-1.png'),
  },
  {
    id: '2',
    title: 'Expert Advice',
    subtitle: 'Get answers to all your real estate questions',
    image: require('@/assets/images/slide-2.png'),
  },
  {
    id: '3',
    title: 'Personalized Help',
    subtitle: 'Whether you\'re buying or already own a home',
    image: require('@/assets/images/slide-3.png'),
  },
];

export default function OnboardingScreen() {
  const { updateUserType } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUserType, setShowUserType] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startFloatingAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startFloatingAnimation();
  }, []);

  const renderItem = ({ item }: { item: typeof slides[0] }) => {
    const translateY = floatingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10], // Adjust this value to control float height
    });

    return (
      <View style={[styles.slide, { width }]}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="cover"
          />
        </Animated.View>
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
      flatListRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      flatListRef.current?.scrollToOffset({ offset: prevIndex * width, animated: true });
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
    const translateY = floatingAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
    });

    return (
      <View style={styles.userTypeContainer}>
        <View style={styles.centerContainer}>
          <View style={styles.userTypeContent}>
            <Animated.View style={{ transform: [{ translateY }] }}>
              <Image
                source={require('@/assets/images/info.png')}
                style={styles.image}
                resizeMode="cover"
              />
            </Animated.View>
            <Text style={[styles.title, { color: colors.text }]}>
              What best describes you?
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              This helps us personalize your experience
            </Text>
          </View>
        </View>

        <View style={styles.userTypeButtonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleSelectUserType('buyer')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#00439A', '#3E75C2', '#86ACE3', '#92DDE7', '#47E9FF']}
              locations={[0, 0.21, 0.46, 0.67, 0.99]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorder}
            >
              <View style={styles.innerContainer}>
                <Text style={[styles.userTypeTitle, { color: '#09256C' }]}>
                  I want to buy a home
                </Text>
                <Text style={[styles.userTypeDescription, { color: colors.secondary }]}>
                  Get help with the home buying process
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.lastButton]}
            onPress={() => handleSelectUserType('owner')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#00439A', '#3E75C2', '#86ACE3', '#92DDE7', '#47E9FF']}
              locations={[0, 0.21, 0.46, 0.67, 0.99]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBorder}
            >
              <View style={styles.innerContainer}>
                <Text style={[styles.userTypeTitle, { color: '#09256C' }]}>
                  I already own a home
                </Text>
                <Text style={[styles.userTypeDescription, { color: colors.secondary }]}>
                  Get help with home ownership
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: {
    viewableItems: Array<ViewToken>;
  }) => {
    if (viewableItems[0]) {
      setCurrentIndex(Number(viewableItems[0].index));
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  if (showUserType) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.logoContainer}>
            <SmallLogo />
          </View>
        </View>
        {renderUserTypeSelection()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <SmallLogo />
        </View>
      </View>
      <View style={styles.contentContainer}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScroll={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            if (newIndex !== currentIndex) {
              setCurrentIndex(newIndex);
            }
          }}
          scrollEventThrottle={16}
          snapToInterval={width}
          snapToAlignment="center"
          decelerationRate="fast"
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
      
      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === currentIndex ? '#033291' : '#CBD5E0',
                },
              ]}
            />
          ))}
        </View>
        
        <View style={styles.skipButtonContainer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  flatList: {
    flexGrow: 0,
    height: 400,
  },
  flatListContent: {
    alignItems: 'center',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#718096',
    marginBottom: 32,
    width: '100%',
  },
  bottomContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  skipButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#033291',
  },
  userTypeContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTypeContent: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    marginBottom: 0,
  },
  gradientBorder: {
    borderRadius: 8,
    padding: 1,
  },
  innerContainer: {
    borderRadius: 7,
    backgroundColor: 'white',
    padding: 16,
    width: '100%',
    minHeight: 50,
  },
  textContainer: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userTypeDescription: {
    fontSize: 14,
  },
  lastButton: {
    marginBottom: 0,
  },
  userTypeButtonContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: 16,
  },
});