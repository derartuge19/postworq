# Frontend Project Structure

## Directory Layout

```
src/
├── components/
│   ├── index.js                 # Component exports
│   ├── SplashScreen.jsx         # Landing/splash screen
│   ├── LoginScreen.jsx          # User login
│   ├── RegisterScreen.jsx       # User registration (multi-step)
│   ├── OnboardingScreen.jsx     # Onboarding tutorial
│   ├── AppShell.jsx             # Main app layout with navigation
│   ├── Inp.jsx                  # Reusable input component
│   └── GradBtn.jsx              # Reusable gradient button
├── constants/
│   └── theme.js                 # Design tokens & plans
├── api.js                       # API service layer
├── App.jsx                      # Main app router
└── main.jsx                     # React entry point

index.html                        # HTML template
vite.config.js                   # Vite configuration
package.json                     # Dependencies
```

## Component Breakdown

### SplashScreen
- Landing page with sign up / login buttons
- No state management needed
- Props: `onLogin`, `onRegister`

### LoginScreen
- Email/password login form
- Calls API for authentication
- Props: `onSuccess`, `onRegister`, `onBack`
- State: email, password, loading, error

### RegisterScreen
- Multi-step registration (5 steps)
- Step 0: Details (name, email, password)
- Step 1: Phone number
- Step 2: OTP verification
- Step 3: Privacy preferences
- Step 4: Plan selection
- Props: `onSuccess`, `onLogin`, `onBack`
- State: form data, OTP, loading, error, preferences, plan

### OnboardingScreen
- Tutorial/welcome screens
- 4 onboarding steps with animations
- Props: `user`, `onDone`
- State: current step

### AppShell
- Main app container with bottom navigation
- 3 tabs: Feed, Quests, Profile
- Props: `user`, `onLogout`
- State: current tab

### Reusable Components

#### Inp
- Input field with icon support
- Props: `label`, `type`, `value`, `onChange`, `placeholder`, `icon`, `right`

#### GradBtn
- Gradient button with loading state
- Props: `children`, `onClick`, `disabled`, `style`, `small`

## API Integration

All API calls go through `src/api.js`:
- `api.register()` - Create new account
- `api.login()` - User login
- `api.getProfile()` - Get user profile
- `api.addXP()` - Add XP points
- `api.dailyCheckIn()` - Daily check-in
- `api.getReels()` - Get reels feed
- `api.voteReel()` - Vote on reel
- `api.getQuests()` - Get available quests
- `api.completeQuest()` - Complete quest
- `api.getSubscription()` - Get subscription info
- `api.upgradeSubscription()` - Upgrade plan
- `api.getNotificationPrefs()` - Get notification settings
- `api.updateNotificationPrefs()` - Update notification settings

## Theme & Design Tokens

All colors and design constants are in `src/constants/theme.js`:
- Primary color: `#DA9B2A` (gold)
- Dark background: `#0C1A12`
- Text color: `#1C1917`
- Border color: `#E7E5E4`

## State Management

Currently using React hooks (useState). For future scaling:
- Consider Context API for global auth state
- Or Redux/Zustand for complex state

## Next Steps to Implement

1. **Feed Tab** - Display reels with voting
2. **Quests Tab** - Show available quests and progress
3. **Profile Tab** - User stats, XP, level, streak
4. **Reel Upload** - Camera/gallery integration
5. **Real-time Updates** - WebSocket for live notifications
6. **Offline Support** - Service workers for offline mode
