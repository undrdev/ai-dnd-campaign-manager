# Cross-Platform Component Library - D&D AI Campaign Management System

## Overview
This document defines a comprehensive cross-platform component library that provides consistent, reusable UI components across Vue.js web and React Native mobile applications. Each component maintains the same API and behavior while adapting to platform-specific design patterns.

## Component Architecture

### **Design Principles**
1. **API Consistency**: Same props and events across platforms
2. **Platform Adaptation**: Respect native UI patterns and interactions
3. **Accessibility First**: WCAG 2.1 AA compliance built-in
4. **Themeable**: Support for light/dark modes and custom themes
5. **Performance**: Optimized for each platform's rendering engine

### **Component Structure**
```
Component Library
├── Foundation Components
│   ├── Button (Primary, Secondary, Ghost, Icon)
│   ├── Card (Glass, Standard, Elevated)
│   ├── Input (Text, Search, Password, Number)
│   ├── Modal (Dialog, Drawer, Bottom Sheet)
│   └── Typography (Heading, Body, Caption, Code)
├── Layout Components
│   ├── Container (Responsive, Fixed, Fluid)
│   ├── Grid (Responsive columns and rows)
│   ├── Stack (Vertical, Horizontal spacing)
│   └── Divider (Line, Space, Text)
├── Navigation Components
│   ├── Header (App bar, Navigation)
│   ├── Tabs (Horizontal, Vertical)
│   ├── Breadcrumb (Web only)
│   └── Pagination (Web only)
├── Data Display Components
│   ├── Table (Data table with sorting/filtering)
│   ├── List (Simple, Complex, Infinite)
│   ├── Avatar (Image, Initials, Icon)
│   └── Badge (Notification, Status, Count)
├── Feedback Components
│   ├── Alert (Success, Warning, Error, Info)
│   ├── Toast (Notification popup)
│   ├── Progress (Linear, Circular, Step)
│   └── Loading (Spinner, Skeleton, Overlay)
└── D&D Specific Components
    ├── DiceRoller (Interactive dice with animations)
    ├── CharacterSheet (Stat blocks and abilities)
    ├── CampaignCard (Campaign overview cards)
    └── SessionTimer (Live session countdown)
```

## Foundation Components

### **Button Component**

#### **Vue.js Implementation**
```vue
<!-- components/ui/AppButton.vue -->
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :type="type"
    @click="handleClick"
  >
    <!-- Loading State -->
    <div v-if="loading" class="button-loading">
      <v-progress-circular
        :size="iconSize"
        indeterminate
        :color="loadingColor"
      />
    </div>
    
    <!-- Normal State -->
    <template v-else>
      <v-icon
        v-if="prependIcon"
        :icon="prependIcon"
        :size="iconSize"
        class="button-icon button-icon--prepend"
      />
      
      <span v-if="$slots.default" class="button-text">
        <slot />
      </span>
      
      <v-icon
        v-if="appendIcon"
        :icon="appendIcon"
        :size="iconSize"
        class="button-icon button-icon--append"
      />
    </template>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  prependIcon?: string;
  appendIcon?: string;
  ariaLabel?: string;
  block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
  block: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => [
  'app-button',
  `app-button--${props.variant}`,
  `app-button--${props.size}`,
  {
    'app-button--disabled': props.disabled,
    'app-button--loading': props.loading,
    'app-button--block': props.block,
    'app-button--icon-only': !$slots.default && (props.prependIcon || props.appendIcon),
  },
]);

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 'small';
    case 'lg': return 'large';
    default: return 'default';
  }
});

const loadingColor = computed(() => {
  switch (props.variant) {
    case 'primary': return 'white';
    case 'secondary': return 'primary';
    case 'ghost': return 'primary';
    case 'danger': return 'white';
    default: return 'primary';
  }
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped lang="scss">
.app-button {
  @include liquid-glass(0.1, 20px);
  
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  
  font-family: var(--font-family-primary);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
  
  transition: all var(--duration-fast) var(--easing-ease-out);
  
  &:hover:not(&--disabled):not(&--loading) {
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  &:active:not(&--disabled):not(&--loading) {
    transform: translateY(0);
  }
  
  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
  
  // Variants
  &--primary {
    background: linear-gradient(135deg, 
      rgba(99, 102, 241, 0.9) 0%, 
      rgba(79, 70, 229, 0.9) 100%);
    color: white;
    border-color: rgba(99, 102, 241, 0.3);
  }
  
  &--secondary {
    background: linear-gradient(135deg, 
      rgba(245, 158, 11, 0.9) 0%, 
      rgba(217, 119, 6, 0.9) 100%);
    color: white;
    border-color: rgba(245, 158, 11, 0.3);
  }
  
  &--ghost {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-neutral-700);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  &--danger {
    background: linear-gradient(135deg, 
      rgba(239, 68, 68, 0.9) 0%, 
      rgba(220, 38, 38, 0.9) 100%);
    color: white;
    border-color: rgba(239, 68, 68, 0.3);
  }
  
  // Sizes
  &--sm {
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
    min-height: var(--spacing-8);
    border-radius: 8px;
  }
  
  &--md {
    padding: var(--spacing-3) var(--spacing-6);
    font-size: var(--font-size-base);
    min-height: var(--spacing-11); // 44px minimum touch target
    border-radius: 12px;
  }
  
  &--lg {
    padding: var(--spacing-4) var(--spacing-8);
    font-size: var(--font-size-lg);
    min-height: var(--spacing-12);
    border-radius: 16px;
  }
  
  // States
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  
  &--loading {
    cursor: wait;
  }
  
  &--block {
    width: 100%;
  }
  
  &--icon-only {
    aspect-ratio: 1;
    padding: var(--spacing-3);
  }
}

.button-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-text {
  white-space: nowrap;
}

.button-icon {
  flex-shrink: 0;
  
  &--prepend {
    margin-left: calc(var(--spacing-1) * -1);
  }
  
  &--append {
    margin-right: calc(var(--spacing-1) * -1);
  }
}
</style>
```

#### **React Native Implementation**
```typescript
// components/ui/AppButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../design-system/tokens';

interface AppButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  prependIcon?: keyof typeof Ionicons.glyphMap;
  appendIcon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  prependIcon,
  appendIcon,
  onPress,
  style,
  accessibilityLabel,
  testID,
}) => {
  const isIconOnly = !children && (prependIcon || appendIcon);
  
  const buttonStyle: ViewStyle[] = [
    styles.button,
    styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
    disabled && styles.buttonDisabled,
    loading && styles.buttonLoading,
    isIconOnly && styles.buttonIconOnly,
    style,
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
  ];

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const loadingColor = variant === 'ghost' ? tokens.colors.primary[500] : '#ffffff';

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      testID={testID}
    >
      <BlurView
        intensity={variant === 'ghost' ? 20 : 80}
        tint="light"
        style={styles.blurContainer}
      >
        {loading ? (
          <ActivityIndicator
            size={iconSize}
            color={loadingColor}
          />
        ) : (
          <View style={styles.content}>
            {prependIcon && (
              <Ionicons
                name={prependIcon}
                size={iconSize}
                color={textStyle[1]?.color || tokens.colors.primary[500]}
                style={styles.prependIcon}
              />
            )}
            
            {children && (
              <Text style={textStyle} numberOfLines={1}>
                {children}
              </Text>
            )}
            
            {appendIcon && (
              <Ionicons
                name={appendIcon}
                size={iconSize}
                color={textStyle[1]?.color || tokens.colors.primary[500]}
                style={styles.appendIcon}
              />
            )}
          </View>
        )}
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  buttonPrimary: {
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  
  buttonSecondary: {
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  
  buttonGhost: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  buttonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  
  // Sizes
  buttonSm: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    minHeight: tokens.spacing[8],
    borderRadius: 8,
  },
  
  buttonMd: {
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[3],
    minHeight: tokens.spacing[11], // 44px minimum touch target
    borderRadius: 12,
  },
  
  buttonLg: {
    paddingHorizontal: tokens.spacing[8],
    paddingVertical: tokens.spacing[4],
    minHeight: tokens.spacing[12],
    borderRadius: 16,
  },
  
  // Text styles
  text: {
    fontWeight: tokens.typography.weights.semibold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  
  textPrimary: {
    color: '#ffffff',
  },
  
  textSecondary: {
    color: '#ffffff',
  },
  
  textGhost: {
    color: tokens.colors.neutral[700],
  },
  
  textDanger: {
    color: '#ffffff',
  },
  
  textSm: {
    fontSize: tokens.typography.sizes.sm,
  },
  
  textMd: {
    fontSize: tokens.typography.sizes.base,
  },
  
  textLg: {
    fontSize: tokens.typography.sizes.lg,
  },
  
  // States
  buttonDisabled: {
    opacity: 0.5,
  },
  
  buttonLoading: {
    // Loading styles handled by ActivityIndicator
  },
  
  buttonIconOnly: {
    aspectRatio: 1,
    paddingHorizontal: tokens.spacing[3],
  },
  
  // Icon styles
  prependIcon: {
    marginRight: tokens.spacing[2],
    marginLeft: -tokens.spacing[1],
  },
  
  appendIcon: {
    marginLeft: tokens.spacing[2],
    marginRight: -tokens.spacing[1],
  },
});
```

### **Card Component**

#### **Vue.js Implementation**
```vue
<!-- components/ui/AppCard.vue -->
<template>
  <div
    :class="cardClasses"
    :role="role"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Card Header -->
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </slot>
      
      <div v-if="$slots.actions" class="card-actions">
        <slot name="actions" />
      </div>
    </div>
    
    <!-- Card Content -->
    <div v-if="$slots.default" class="card-content">
      <slot />
    </div>
    
    <!-- Card Footer -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'standard' | 'glass' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
  title?: string;
  role?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'standard',
  padding: 'md',
  clickable: false,
  role: 'article',
});

const emit = defineEmits<{
  click: [event: MouseEvent | KeyboardEvent];
}>();

const cardClasses = computed(() => [
  'app-card',
  `app-card--${props.variant}`,
  `app-card--padding-${props.padding}`,
  {
    'app-card--clickable': props.clickable,
  },
]);

const handleClick = (event: MouseEvent | KeyboardEvent) => {
  if (props.clickable) {
    emit('click', event);
  }
};
</script>

<style scoped lang="scss">
.app-card {
  border-radius: 16px;
  transition: all var(--duration-fast) var(--easing-ease-out);
  
  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
  
  // Variants
  &--standard {
    background: var(--color-neutral-0);
    border: 1px solid var(--color-neutral-200);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &--glass {
    @include liquid-glass(0.1, 20px);
  }
  
  &--elevated {
    background: var(--color-neutral-0);
    border: 1px solid var(--color-neutral-200);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  // Padding variants
  &--padding-none {
    .card-header,
    .card-content,
    .card-footer {
      padding: 0;
    }
  }
  
  &--padding-sm {
    .card-header,
    .card-content,
    .card-footer {
      padding: var(--spacing-3);
    }
  }
  
  &--padding-md {
    .card-header,
    .card-content,
    .card-footer {
      padding: var(--spacing-4);
    }
  }
  
  &--padding-lg {
    .card-header,
    .card-content,
    .card-footer {
      padding: var(--spacing-6);
    }
  }
  
  // Clickable state
  &--clickable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-neutral-200);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-4);
}

.card-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-neutral-900);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.card-content {
  flex: 1;
}

.card-footer {
  border-top: 1px solid var(--color-neutral-200);
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
}
</style>
```

#### **React Native Implementation**
```typescript
// components/ui/AppCard.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens } from '../../design-system/tokens';

interface AppCardProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  title?: string;
  variant?: 'standard' | 'glass' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  header,
  footer,
  actions,
  title,
  variant = 'standard',
  padding = 'md',
  clickable = false,
  onPress,
  style,
  testID,
}) => {
  const cardStyle = [
    styles.card,
    styles[`card${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
    clickable && styles.cardClickable,
    style,
  ];

  const paddingStyle = styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`];

  const CardWrapper = clickable ? TouchableOpacity : View;
  const wrapperProps = clickable
    ? {
        onPress,
        activeOpacity: 0.95,
        accessible: true,
        accessibilityRole: 'button' as const,
      }
    : {};

  const renderContent = () => (
    <>
      {/* Header */}
      {(header || title || actions) && (
        <View style={[styles.header, paddingStyle]}>
          <View style={styles.headerContent}>
            {header || (title && (
              <Text style={styles.title}>{title}</Text>
            ))}
          </View>
          
          {actions && (
            <View style={styles.actions}>
              {actions}
            </View>
          )}
        </View>
      )}
      
      {/* Content */}
      {children && (
        <View style={[styles.content, paddingStyle]}>
          {children}
        </View>
      )}
      
      {/* Footer */}
      {footer && (
        <View style={[styles.footer, paddingStyle]}>
          {footer}
        </View>
      )}
    </>
  );

  if (variant === 'glass') {
    return (
      <CardWrapper style={cardStyle} testID={testID} {...wrapperProps}>
        <BlurView
          intensity={80}
          tint="light"
          style={styles.blurContainer}
        >
          {renderContent()}
        </BlurView>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper style={cardStyle} testID={testID} {...wrapperProps}>
      {renderContent()}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  // Variants
  cardStandard: {
    backgroundColor: tokens.colors.neutral[0],
    borderWidth: 1,
    borderColor: tokens.colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  cardGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
  },
  
  cardElevated: {
    backgroundColor: tokens.colors.neutral[0],
    borderWidth: 1,
    borderColor: tokens.colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
  
  cardClickable: {
    // Handled by TouchableOpacity
  },
  
  blurContainer: {
    flex: 1,
  },
  
  // Padding variants
  paddingNone: {
    padding: 0,
  },
  
  paddingSm: {
    padding: tokens.spacing[3],
  },
  
  paddingMd: {
    padding: tokens.spacing[4],
  },
  
  paddingLg: {
    padding: tokens.spacing[6],
  },
  
  // Layout
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[200],
    marginBottom: tokens.spacing[4],
    paddingBottom: tokens.spacing[4],
  },
  
  headerContent: {
    flex: 1,
  },
  
  title: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.neutral[900],
  },
  
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  
  content: {
    flex: 1,
  },
  
  footer: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.neutral[200],
    marginTop: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
  },
});
```

## D&D Specific Components

### **Dice Roller Component**

#### **Vue.js Implementation**
```vue
<!-- components/dnd/DiceRoller.vue -->
<template>
  <div class="dice-roller">
    <div class="dice-input">
      <v-text-field
        v-model="diceNotation"
        label="Dice Notation"
        placeholder="1d20+3"
        variant="outlined"
        density="compact"
        :rules="[validateDiceNotation]"
        @keydown.enter="rollDice"
      />
      
      <app-button
        variant="primary"
        :loading="rolling"
        @click="rollDice"
      >
        <v-icon icon="mdi-dice-6" />
        Roll
      </app-button>
    </div>
    
    <div v-if="lastRoll" class="dice-result">
      <div class="result-summary">
        <span class="result-total">{{ lastRoll.total }}</span>
        <span class="result-notation">{{ lastRoll.notation }}</span>
      </div>
      
      <div class="result-breakdown">
        <div
          v-for="(die, index) in lastRoll.dice"
          :key="index"
          class="die-result"
          :class="{ 
            'die-result--critical': die.value === die.sides,
            'die-result--fumble': die.value === 1 && die.sides === 20
          }"
        >
          {{ die.value }}
        </div>
        
        <span v-if="lastRoll.modifier !== 0" class="modifier">
          {{ lastRoll.modifier > 0 ? '+' : '' }}{{ lastRoll.modifier }}
        </span>
      </div>
    </div>
    
    <div v-if="rollHistory.length > 0" class="roll-history">
      <h4>Recent Rolls</h4>
      <div class="history-list">
        <div
          v-for="(roll, index) in rollHistory.slice(0, 5)"
          :key="index"
          class="history-item"
        >
          <span class="history-notation">{{ roll.notation }}</span>
          <span class="history-total">{{ roll.total }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

interface DieRoll {
  value: number;
  sides: number;
}

interface RollResult {
  notation: string;
  dice: DieRoll[];
  modifier: number;
  total: number;
  timestamp: Date;
}

const diceNotation = ref('1d20');
const rolling = ref(false);
const lastRoll = ref<RollResult | null>(null);
const rollHistory = reactive<RollResult[]>([]);

const validateDiceNotation = (value: string) => {
  const diceRegex = /^(\d+)?d(\d+)([+-]\d+)?$/i;
  return diceRegex.test(value) || 'Invalid dice notation (e.g., 1d20+3)';
};

const rollDice = async () => {
  if (!validateDiceNotation(diceNotation.value) || rolling.value) return;
  
  rolling.value = true;
  
  // Add dramatic delay for animation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const result = parseDiceNotation(diceNotation.value);
  lastRoll.value = result;
  rollHistory.unshift(result);
  
  // Limit history to 20 rolls
  if (rollHistory.length > 20) {
    rollHistory.splice(20);
  }
  
  rolling.value = false;
};

const parseDiceNotation = (notation: string): RollResult => {
  const match = notation.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
  if (!match) throw new Error('Invalid dice notation');
  
  const count = parseInt(match[1] || '1');
  const sides = parseInt(match[2]);
  const modifier = parseInt(match[3] || '0');
  
  const dice: DieRoll[] = [];
  let total = modifier;
  
  for (let i = 0; i < count; i++) {
    const value = Math.floor(Math.random() * sides) + 1;
    dice.push({ value, sides });
    total += value;
  }
  
  return {
    notation,
    dice,
    modifier,
    total,
    timestamp: new Date(),
  };
};
</script>

<style scoped lang="scss">
.dice-roller {
  @include liquid-glass(0.05, 15px);
  padding: var(--spacing-6);
  border-radius: 16px;
}

.dice-input {
  display: flex;
  gap: var(--spacing-4);
  align-items: flex-end;
  margin-bottom: var(--spacing-6);
}

.dice-result {
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.result-summary {
  margin-bottom: var(--spacing-4);
}

.result-total {
  font-size: 3rem;
  font-weight: bold;
  color: var(--color-primary-500);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.result-notation {
  display: block;
  font-size: var(--font-size-lg);
  color: var(--color-neutral-600);
  margin-top: var(--spacing-2);
}

.result-breakdown {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.die-result {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--color-neutral-100);
  border: 2px solid var(--color-neutral-300);
  font-weight: bold;
  font-size: var(--font-size-lg);
  
  &--critical {
    background: var(--color-success-100);
    border-color: var(--color-success-500);
    color: var(--color-success-700);
  }
  
  &--fumble {
    background: var(--color-error-100);
    border-color: var(--color-error-500);
    color: var(--color-error-700);
  }
}

.modifier {
  font-size: var(--font-size-xl);
  font-weight: bold;
  color: var(--color-secondary-600);
}

.roll-history {
  h4 {
    margin: 0 0 var(--spacing-3) 0;
    font-size: var(--font-size-lg);
    color: var(--color-neutral-700);
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  font-size: var(--font-size-sm);
}

.history-notation {
  color: var(--color-neutral-600);
}

.history-total {
  font-weight: bold;
  color: var(--color-primary-600);
}
</style>
```

This cross-platform component library provides a comprehensive foundation for building consistent, accessible, and beautiful user interfaces across both Vue.js web and React Native mobile applications. Each component maintains the same functionality while adapting to platform-specific design patterns and interaction models.
