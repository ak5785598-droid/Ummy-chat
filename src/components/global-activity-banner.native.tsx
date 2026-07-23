// src/components/global-activity-banner.native.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function GlobalActivityBanner() {
  const firestore = useFirestore();

  const activityQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'globalActivity'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
  }, [firestore]);

  const { data: activities } = useCollection<any>(activityQuery, { silent: true });
  const activeEvent = activities?.[0];

  let isRecent = false;
  try {
    const timestamp = activeEvent?.timestamp;
    if (timestamp) {
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
      isRecent = date.getTime() > (Date.now() - 60000);
    }
  } catch {}

  const slideY = useRef(new Animated.Value(-80)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-100)).current;

  const [visible, setVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isRecent || !activeEvent) return;

    setCurrentEvent(activeEvent);
    setVisible(true);
    slideX.setValue(0);
    opacity.setValue(0);
    slideY.setValue(-80);

    Animated.parallel([
      Animated.spring(slideY, { toValue: 12, tension: 80, friction: 9, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Loop shine light sweep
    Animated.loop(
      Animated.timing(shineAnim, { toValue: SCREEN_WIDTH, duration: 2200, useNativeDriver: true })
    ).start();

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideX, { toValue: -SCREEN_WIDTH, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        setVisible(false);
        setCurrentEvent(null);
      });
    }, 6000);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [activeEvent?.timestamp?.toString?.()]);

  if (!visible || !currentEvent) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY: slideY }, { translateX: slideX }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Outer 3D Gold Glow Box */}
      <View style={styles.outerGlow}>
        <LinearGradient
          colors={['#FFE89C', '#F5C57A', '#E4A95A', '#D08C3A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goldBorder}
        >
          <LinearGradient
            colors={['#1E1B4B', '#31103F', '#0F172A']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.innerGradient}
          >
            {/* Animated Shine Light Sweep */}
            <Animated.View
              style={[
                styles.shineBar,
                { transform: [{ translateX: shineAnim }] }
              ]}
            />

            {/* Left Crown/Badge & User Avatar */}
            <View style={styles.leftGroup}>
              <View style={styles.avatarRing}>
                {currentEvent?.userAvatar ? (
                  <Image
                    source={{ uri: currentEvent.userAvatar }}
                    style={styles.userAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.crownEmoji}>👑</Text>
                )}
              </View>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>ROYAL</Text>
              </View>
            </View>

            {/* Main Broadcast Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.mainText} numberOfLines={1}>
                <Text style={styles.userNameText}>{currentEvent.userName}</Text>
                {' sent '}
                <Text style={styles.giftNameText}>{currentEvent.giftName}</Text>
                {' in '}
                <Text style={styles.roomNameText}>#{currentEvent.roomNumber || currentEvent.roomName || 'Room'}</Text>
              </Text>
            </View>

            {/* Right Gift Preview Icon */}
            {currentEvent?.giftIcon ? (
              <Image source={{ uri: currentEvent.giftIcon }} style={styles.giftIconImage} contentFit="contain" />
            ) : (
              <View style={styles.giftEmojiBox}>
                <Text style={styles.giftEmoji}>🎁</Text>
              </View>
            )}
          </LinearGradient>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  outerGlow: {
    width: '94%',
    maxWidth: 480,
    borderRadius: 24,
    shadowColor: '#F5C57A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  goldBorder: {
    padding: 1.8,
    borderRadius: 24,
  },
  innerGradient: {
    height: 42,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  shineBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ skewX: '-30deg' }],
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE566',
    backgroundColor: '#3b1800',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userAvatar: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
  },
  crownEmoji: {
    fontSize: 16,
  },
  badgePill: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: '#F5C57A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFE566',
    letterSpacing: 0.5,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  mainText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userNameText: {
    color: '#FFE566',
    fontWeight: '900',
  },
  giftNameText: {
    color: '#FF3B81',
    fontWeight: '900',
  },
  roomNameText: {
    color: '#34D399',
    fontWeight: '900',
  },
  giftEmojiBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftEmoji: {
    fontSize: 18,
  },
  giftIconImage: {
    width: 32,
    height: 32,
  },
});
