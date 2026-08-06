# Implementation Plan: React Native to Pure Native Migration (Same to Same)

Migrate all features, UI, and logic from the React Native (Expo) project to the Pure Native (Jetpack Compose) project. This will ensure consistency in user experience, real-time data, and branding across both platforms.

## User Review Required

> [!IMPORTANT]
> The migration will use the existing Firebase configuration taaki real-time data (users, coins, rooms) remain identical.
> We will prioritize high-fidelity UI matching using Jetpack Compose.

## Proposed Changes

### Phase 1: Foundation & Authentication
Migrate the entry point, splash, and login flows to match the React Native implementation exactly.

#### [MODIFY] [MainActivity.kt](file:///D:/Ummy_Dev_Live/ummy-android-native/app/src/main/java/app/vercel/ummy_chat/twa/MainActivity.kt)
- Update navigation graph to match React Native's Expo Router structure.

#### [NEW] [LoginScreen.kt](file:///D:/Ummy_Dev_Live/ummy-android-native/app/src/main/java/app/vercel/ummy_chat/twa/ui/auth/LoginScreen.kt)
- Implement high-fidelity UI with gradients and floating animations.
- Integrate Google Sign-In, Facebook Login, and Phone Auth (OTP) logic.
- Implement `syncUserIdentity` logic for new user creation with 6-digit IDs.

### Phase 2: Dashboard & Home
Migrate the main landing screen with category filters, room cards, and real-time presence.

#### [MODIFY] [MainDashboardScreen.kt](file:///D:/Ummy_Dev_Live/ummy-android-native/app/src/main/java/app/vercel/ummy_chat/twa/ui/dashboard/MainDashboardScreen.kt)
- Match the neon-styled bottom tab bar exactly.
- Implement global unread message dot listener.

#### [NEW] [HomeScreen.kt](file:///D:/Ummy_Dev_Live/ummy-android-native/app/src/main/java/app/vercel/ummy_chat/twa/ui/home/HomeScreen.kt)
- Implement category filters (All, Chat, Game, Music, Party).
- Integrate Realtime Database for live user counts per room.
- Implement "Recommend" and "Me" tabs logic.

### Phase 3: Voice Room & Agora
Migrate the core 9-seat voice room logic with Agora integration.

#### [MODIFY] [RoomScreen.kt](file:///D:/Ummy_Dev_Live/ummy-android-native/app/src/main/java/app/vercel/ummy_chat/twa/ui/room/RoomScreen.kt)
- Implement 3x3 seat grid with speaking animations.
- Integrate Firestore listeners for participants and messages.
- Implement global gift and loot level broadcast banners (Patti).

## Verification Plan

### Automated Tests
- Build the native project to ensure no compilation errors.
- Run `gradlew test` for unit tests (if applicable).

### Manual Verification
- Deploy to an Android device.
- Verify Login flow (Google/Phone).
- Verify real-time presence count matches React Native app.
- Verify Voice Room entry and Agora audio quality.
