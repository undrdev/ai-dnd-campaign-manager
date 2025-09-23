# React Native Mobile Applications - D&D AI Campaign Management System

## Overview
This document defines comprehensive React Native mobile applications for iOS and Android, built with Expo for rapid development and native performance. The mobile apps focus on core gaming functionality, real-time session participation, and touch-optimized interfaces with liquid glass design elements.

## Technology Stack

### **Core Framework**
- **React Native**: Cross-platform native mobile development
- **Expo**: Managed workflow for faster development and deployment
- **TypeScript**: Full type safety across the application
- **Expo Router**: File-based routing with native navigation

### **UI & Design**
- **React Native Elements**: Comprehensive UI component library
- **Liquid Glass Design System**: Custom glassmorphism components
- **React Native Reanimated**: High-performance animations
- **React Native Gesture Handler**: Native gesture recognition
- **React Native Vector Icons**: Icon library with multiple sets

### **State Management**
- **Redux Toolkit**: Predictable state management
- **RTK Query**: Data fetching and caching
- **Redux Persist**: State persistence across app launches
- **Async Storage**: Local data storage

### **Navigation & Routing**
- **React Navigation 6**: Native navigation with stack, tab, and drawer navigators
- **Deep Linking**: URL-based navigation and sharing
- **Navigation State Persistence**: Resume navigation state

### **Native Features**
- **Expo Camera**: Camera integration for character photos
- **Expo Audio**: Voice messages and sound effects
- **Expo Notifications**: Push notifications and local alerts
- **Expo SecureStore**: Secure token storage
- **Expo Biometrics**: Biometric authentication
- **Expo Location**: Location services for local groups

### **Real-time & Networking**
- **WebSocket**: Real-time session updates
- **Axios**: HTTP client for API requests
- **React Query**: Server state management
- **Offline Support**: React Native NetInfo for connectivity

## Application Architecture

### **Project Structure**
```typescript
mobile-app/
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── GlassCard.tsx
│   │   ├── liquid/                # Liquid glass effects
│   │   │   ├── GlassButton.tsx
│   │   │   ├── GlassHeader.tsx
│   │   │   └── GlassBackground.tsx
│   │   ├── forms/                 # Form components
│   │   │   ├── CampaignForm.tsx
│   │   │   ├── CharacterForm.tsx
│   │   │   └── LoginForm.tsx
│   │   ├── campaign/              # Campaign components
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── SessionView.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── character/             # Character components
│   │   │   ├── CharacterSheet.tsx
│   │   │   ├── CharacterAvatar.tsx
│   │   │   └── StatBlock.tsx
│   │   └── native/                # Platform-specific components
│   │       ├── CameraView.tsx
│   │       ├── AudioRecorder.tsx
│   │       └── BiometricAuth.tsx
│   ├── screens/
│   │   ├── auth/                  # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── dashboard/             # Main dashboard
│   │   │   └── DashboardScreen.tsx
│   │   ├── campaigns/             # Campaign screens
│   │   │   ├── CampaignListScreen.tsx
│   │   │   ├── CampaignDetailScreen.tsx
│   │   │   ├── SessionScreen.tsx
│   │   │   └── CreateCampaignScreen.tsx
│   │   ├── characters/            # Character screens
│   │   │   ├── CharacterListScreen.tsx
│   │   │   ├── CharacterDetailScreen.tsx
│   │   │   └── CreateCharacterScreen.tsx
│   │   ├── session/               # Live session screens
│   │   │   ├── SessionLobbyScreen.tsx
│   │   │   ├── ActiveSessionScreen.tsx
│   │   │   └── SessionHistoryScreen.tsx
│   │   └── profile/               # Profile screens
│   │       ├── ProfileScreen.tsx
│   │       └── SettingsScreen.tsx
│   ├── navigation/                # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── types.ts
│   ├── store/                     # Redux store
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── campaignSlice.ts
│   │   │   ├── characterSlice.ts
│   │   │   └── sessionSlice.ts
│   │   └── api/
│   │       ├── authApi.ts
│   │       ├── campaignApi.ts
│   │       └── characterApi.ts
│   ├── services/                  # Service layer
│   │   ├── api.ts
│   │   ├── websocket.ts
│   │   ├── storage.ts
│   │   ├── notifications.ts
│   │   └── analytics.ts
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCampaigns.ts
│   │   ├── useWebSocket.ts
│   │   └── usePermissions.ts
│   ├── utils/                     # Utility functions
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   ├── design-system/             # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── themes.ts
│   └── assets/                    # Static assets
│       ├── images/
│       ├── fonts/
│       └── sounds/
├── app.config.js                  # Expo configuration
├── babel.config.js               # Babel configuration
├── metro.config.js               # Metro bundler configuration
└── package.json
```

## Core Mobile Features

### **1. Touch-Optimized Interface**
The mobile application prioritizes touch interactions with:

- **Minimum 44px touch targets** for all interactive elements
- **Gesture-based navigation** with swipe, pinch, and tap gestures
- **One-handed operation** with bottom navigation and thumb-friendly layouts
- **Haptic feedback** for important actions and confirmations
- **Pull-to-refresh** for data updates and synchronization

### **2. Liquid Glass Design System**
Modern glassmorphism effects throughout the interface:

```typescript
// GlassCard Component
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 80,
  tint = 'light'
}) => {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[
        {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        },
        style
      ]}
    >
      <View style={{ padding: 16 }}>
        {children}
      </View>
    </BlurView>
  );
};
```

### **3. Real-time Session Participation**
Core mobile functionality for live D&D sessions:

```typescript
// ActiveSessionScreen Component
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useWebSocket } from '../hooks/useWebSocket';
import { GlassCard } from '../components/ui/GlassCard';
import { QuickActions } from '../components/campaign/QuickActions';
import { CharacterSheet } from '../components/character/CharacterSheet';

export const ActiveSessionScreen: React.FC = () => {
  const { socket, isConnected } = useWebSocket();
  const [sessionData, setSessionData] = useState(null);
  const [myTurn, setMyTurn] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('session:update', handleSessionUpdate);
      socket.on('turn:start', () => setMyTurn(true));
      socket.on('turn:end', () => setMyTurn(false));
    }

    return () => {
      if (socket) {
        socket.off('session:update');
        socket.off('turn:start');
        socket.off('turn:end');
      }
    };
  }, [socket]);

  const handleSessionUpdate = (data: any) => {
    setSessionData(data);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Session Status */}
      <GlassCard style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[
            styles.connectionIndicator,
            { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </Text>
        </View>
        
        {myTurn && (
          <View style={styles.turnIndicator}>
            <Text style={styles.turnText}>Your Turn!</Text>
          </View>
        )}
      </GlassCard>

      {/* Quick Actions */}
      <GlassCard style={styles.actionsCard}>
        <QuickActions
          onRollDice={handleDiceRoll}
          onSendMessage={handleSendMessage}
          onUseAbility={handleUseAbility}
        />
      </GlassCard>

      {/* Character Sheet */}
      <GlassCard style={styles.characterCard}>
        <CharacterSheet compact />
      </GlassCard>

      {/* Session Chat */}
      <GlassCard style={styles.chatCard}>
        <SessionChat />
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  turnIndicator: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  turnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  actionsCard: {
    marginBottom: 16,
  },
  characterCard: {
    marginBottom: 16,
  },
  chatCard: {
    marginBottom: 16,
  },
});
```

## Native Platform Integration

### **1. Camera Integration**
Character photo capture and map scanning:

```typescript
// CameraView Component
import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export const CameraView: React.FC<{
  onCapture: (uri: string) => void;
  onClose: () => void;
}> = ({ onCapture, onClose }) => {
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef<Camera>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      onCapture(photo.uri);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={type}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setType(
                type === CameraType.back
                  ? CameraType.front
                  : CameraType.back
              )}
            >
              <Ionicons name="camera-reverse" size={32} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </View>
      </Camera>
    </View>
  );
};
```

### **2. Push Notifications**
Real-time notifications for session updates:

```typescript
// NotificationService
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  }

  static async scheduleSessionReminder(sessionTime: Date, campaignName: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Session Starting Soon!',
        body: `Your ${campaignName} session starts in 15 minutes`,
        sound: 'default',
      },
      trigger: {
        date: new Date(sessionTime.getTime() - 15 * 60 * 1000), // 15 minutes before
      },
    });
  }

  static async notifyTurnStart(characterName: string) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "It's Your Turn!",
        body: `${characterName}, make your move!`,
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  }
}
```

## Offline Capability

### **1. Local Data Storage**
Core data persistence for offline usage:

```typescript
// Storage Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character, Campaign } from '../types';

export class StorageService {
  // Character data
  static async saveCharacter(character: Character): Promise<void> {
    const key = `character_${character.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(character));
  }

  static async getCharacter(characterId: string): Promise<Character | null> {
    const key = `character_${characterId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static async getAllCharacters(): Promise<Character[]> {
    const keys = await AsyncStorage.getAllKeys();
    const characterKeys = keys.filter(key => key.startsWith('character_'));
    const characters = await AsyncStorage.multiGet(characterKeys);
    
    return characters
      .map(([_, value]) => value ? JSON.parse(value) : null)
      .filter(Boolean);
  }

  // Campaign data
  static async saveCampaign(campaign: Campaign): Promise<void> {
    const key = `campaign_${campaign.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(campaign));
  }

  // Session cache
  static async cacheSessionData(sessionId: string, data: any): Promise<void> {
    const key = `session_${sessionId}`;
    await AsyncStorage.setItem(key, JSON.stringify({
      ...data,
      cachedAt: new Date().toISOString(),
    }));
  }
}
```

## Performance Optimization

### **1. Image Optimization**
Efficient image handling and caching:

```typescript
// Optimized Image Component
import React from 'react';
import { Image, ImageProps } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  width?: number;
  height?: number;
  quality?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  width = 300,
  height = 300,
  quality = 0.8,
  ...props
}) => {
  const [optimizedUri, setOptimizedUri] = useState<string>(uri);

  useEffect(() => {
    const optimizeImage = async () => {
      try {
        const result = await manipulateAsync(
          uri,
          [{ resize: { width, height } }],
          { compress: quality, format: SaveFormat.JPEG }
        );
        setOptimizedUri(result.uri);
      } catch (error) {
        console.warn('Image optimization failed:', error);
      }
    };

    if (uri && uri.startsWith('http')) {
      optimizeImage();
    }
  }, [uri, width, height, quality]);

  return <Image {...props} source={{ uri: optimizedUri }} />;
};
```

### **2. List Optimization**
Efficient rendering for large datasets:

```typescript
// Optimized Campaign List
import React from 'react';
import { FlatList, ListRenderItem } from 'react-native';
import { Campaign } from '../types';
import { CampaignCard } from '../components/campaign/CampaignCard';

interface CampaignListProps {
  campaigns: Campaign[];
  onCampaignPress: (campaign: Campaign) => void;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  onCampaignPress,
}) => {
  const renderCampaign: ListRenderItem<Campaign> = ({ item }) => (
    <CampaignCard
      campaign={item}
      onPress={() => onCampaignPress(item)}
    />
  );

  const keyExtractor = (item: Campaign) => item.id;

  return (
    <FlatList
      data={campaigns}
      renderItem={renderCampaign}
      keyExtractor={keyExtractor}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={5}
      getItemLayout={(data, index) => ({
        length: 120, // Estimated item height
        offset: 120 * index,
        index,
      })}
    />
  );
};
```

## Development & Deployment

### **1. Expo Configuration**
```javascript
// app.config.js
export default {
  expo: {
    name: 'D&D AI Campaign Manager',
    slug: 'dnd-ai-campaign-manager',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1a1a1a'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dndai.campaignmanager',
      buildNumber: '1.0.0',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1a1a1a'
      },
      package: 'com.dndai.campaignmanager',
      versionCode: 1,
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-camera',
      'expo-audio',
      'expo-notifications',
      [
        'expo-build-properties',
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
          ios: {
            flipper: false,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'your-project-id'
      }
    }
  }
};
```

This React Native mobile application specification provides a comprehensive foundation for building high-performance, feature-rich mobile apps that complement the Vue.js web application while leveraging AI development assistance for rapid iteration and development.
