# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo application for tracking supermarket expenses ("super-compras" in Portuguese). Built with Expo SDK v53, React Native 0.79.3, and TypeScript. The app allows users to scan product barcodes, create shopping lists, and track spending.

## Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Platform-specific development
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in web browser

# Linting
npm run lint

# Reset to blank project (moves current code to /app-example)
npm run reset-project
```

## Architecture & Structure

### File-Based Routing (Expo Router)
- Routes defined in `/app` directory
- `(tabs)` folder contains tab navigation screens
- Modal screens: `scanner.tsx`, `product-details.tsx`
- Main screens: `shopping-list.tsx`

### Key Directories
- `/app` - Application screens and navigation
- `/src/components` - Reusable UI components
- `/src/contexts` - React Context for state management (ShoppingContext)
- `/src/services` - API and storage services
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions (formatting)
- `/hooks` - Custom React hooks for theme
- `/assets` - Static resources (fonts, images, sounds)

### Core Features
1. **Barcode Scanner** - Using expo-camera to scan product barcodes
2. **Product API** - Integration with Open Food Facts API
3. **Local Storage** - AsyncStorage for offline functionality
4. **Shopping Lists** - Create, edit, and manage shopping lists
5. **Image Management** - Custom images for products with local storage
6. **Complete Gamification System** - XP, levels, achievements, challenges, combos

### State Management
- Context API with `ShoppingContext` for global state
- Context API with `GameContext` for gamification system
- Handles shopping lists, current list, and product management
- Persists data using AsyncStorage

### Data Structure
```typescript
ShoppingList {
  id: string
  date: string
  supermarket: string
  items: Product[]
  total: number
  budget?: number
}

Product {
  barcode: string
  name: string
  brand: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
  imageUrl?: string
}
```

### Theme System
- Light/dark mode support throughout
- Colors defined in `/constants/Colors.ts`
- Theme-aware components using `useThemeColor` hook

## Development Notes

### API Integration
- Open Food Facts API: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- Products cached locally for offline use
- Manual price entry (API doesn't provide prices)

### Platform-Specific Code
- Camera permissions required for barcode scanning
- Haptic feedback on successful scans
- iOS-specific blur effects on tab bar

### Current Implementation
- ✅ Home screen with shopping lists
- ✅ Barcode scanner with product lookup
- ✅ Shopping list management
- ✅ Product editing (quantity/price)
- ✅ Image management for products
- ✅ Complete gamification system
- ✅ Offline support with AsyncStorage

## Gamification System

### Core Components
- **GameManager** - Central system managing XP, levels, achievements, combos
- **GameContext** - React Context for gamification state management
- **GameStorage** - AsyncStorage persistence for game data

### Features Implemented
1. **XP and Levels** - 50 levels with progressive XP requirements
2. **Achievements** - 10 different achievements with progress tracking
3. **Daily Challenges** - Auto-generated daily tasks with rewards
4. **Combo System** - Scan products rapidly for XP multipliers
5. **Haptic Feedback** - Physical feedback for game events
6. **Animated UI** - Level up modals, achievement popups, XP bars

### Game Actions
- `onProductScanned()` - +10 XP, combo increment
- `onListCompleted()` - +50 XP, budget check bonuses
- `onManualPriceEntry()` - +15 XP for manual price input
- `updateDailyStreak()` - +20 XP for consecutive days

### Visual Components
- `<XPBar />` - Animated progress bar showing current level progress
- `<ComboCounter />` - Floating combo display with particles
- `<AchievementPopup />` - Modal with confetti for unlocked achievements
- `<LevelUpModal />` - Celebration modal for level increases
- `<GameStatsScreen />` - Complete gamification dashboard

### Expo Configuration
- App scheme: `supercomprasapp`
- Orientation: Portrait only
- Camera and barcode scanner permissions required