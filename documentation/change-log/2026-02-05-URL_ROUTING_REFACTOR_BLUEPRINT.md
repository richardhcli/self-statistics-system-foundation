# URL-Based Routing & Tab Component Refactor Blueprint

**Date**: February 5, 2026  
**Status**: ✅ Completed  
**Last Updated**: February 7, 2026  
**Scope**: Major architectural refactor — URL routing + global tab components + Firestore integration

---

## Executive Summary

### Goals
1. **URL-based routing**: Migrate from state-based navigation to URL patterns (`/app/settings/profile`)
2. **Global tab components**: Extract reusable horizontal and vertical tab navigation
3. **Firestore schema**: Implement subcollections for account-config and user-information
4. **Profile integration**: Add Google profile picture to header with navigation
5. **Smart sync**: Update only changed Firestore fields on login

### Impact Assessment
- **Breaking Changes**: Navigation pattern completely changes
- **Files Affected**: ~15-20 files (components, routes, app structure)
- **Testing Required**: Manual verification of all routes and navigation flows
- **Migration Strategy**: Complete replacement (no backward compatibility)

---

## Progress Update (February 6, 2026)

### Completed
- Phases 1-5 implemented (schema, tabs, routes, header profile, smart sync)
- Settings view refactored to URL-based layout (vertical tabs + Outlet)
- Debug feature uses URL sub-routes and tab nav
- Auth loading moved into AuthView with timeout fallback and reload option
- Settings sub-pages wired to Firestore for AI, Status, Privacy, and Notifications

### Completed
- Phase 6: Cleanup and verification (settings defaults, legacy UI-only toggles)

### Decisions Recorded
- Status Display: class stored in `user-information/profile-display`; visibility toggles in `account-config/ui-preferences`
- Privacy + Notifications: new docs under `account-config/privacy` and `account-config/notifications`
- Theme: localStorage for instant toggle + mirrored to Firestore

### Remaining Tasks
- None. All phases completed.

## Phase 1: Firestore Schema Design

### Current Structure
```
users/{uid}
  ├── uid: string
  ├── displayName: string
  ├── email: string
  ├── photoURL: string
  └── createdAt: Timestamp
```

### New Structure (Subcollections)
```
users/{uid}
  ├── uid: string
  ├── displayName: string
  ├── email: string
  ├── photoURL: string
  ├── createdAt: Timestamp
  ├── lastUpdated: Timestamp
  │
  ├── account-config/              # Subcollection
  │   ├── ai-settings
  │   │   ├── provider: "gemini" | "openai"
  │   │   ├── model
  │   │   │   ├── voiceTranscriptionModel: string
  │   │   │   └── abstractionModel: string
  │   │   ├── temperature: number
  │   │   └── maxTokens: number
  │   ├── ui-preferences
  │   │   ├── theme: "light" | "dark"
  │   │   ├── language: string
  │   │   ├── showCumulativeExp: boolean
  │   │   ├── showMasteryLevels: boolean
  │   │   ├── showRecentAction: boolean
  │   │   └── animateProgressBars: boolean
  │   ├── privacy
  │   │   ├── encryptionEnabled: boolean
  │   │   ├── visibilityMode: "private" | "team" | "public"
  │   │   └── biometricUnlock: boolean
  │   ├── notifications
  │   │   ├── pushEnabled: boolean
  │   │   ├── weeklySummaryEnabled: boolean
  │   │   └── instantFeedbackEnabled: boolean
  |   ├── billing-settings
  │   │   ├── plan: "free" | "pro" | "enterprise"
  │   │   └── status: "active" | "past_due" | "canceled"
  │   └── integrations
  │       ├── obsidianEnabled: boolean
  │       ├── webhookUrl: string
  │       └── webhookEnabled: boolean
  |--- admin-config/ #              # Subcollection, admin only edits
  |   |-- account-status:
  |       |----role: "user" | "developer" | "admin"
  └── user-information/            # Subcollection (future)
      ├── profile-display
      │   └── class: string
      ├── statistics
      │   ├── totalEntries: number
      │   └── lastEntryDate: Timestamp
      └── achievements
```

### Implementation Files
- **Update**: `src/features/auth/utils/login-google.ts`
  - Smart sync logic (only update changed fields)
  - Create default account-config on first login
- **New**: `src/lib/firebase/user-profile.ts`
  - `syncUserProfile(user: User): Promise<void>`
  - `loadUserProfile(uid: string): Promise<UserProfile>`
  - `updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void>`
  - `loadAccountConfig(uid: string, configType: AccountConfigType): Promise<T>`
  - `updateAccountConfig(uid: string, configType: AccountConfigType, updates: Partial<T>): Promise<void>`

---

## Phase 2: Global Tab Components

### Component Architecture

#### Shared Logic (Hook)
**File**: `src/components/tabs/use-tab-navigation.ts`

```typescript
export interface TabConfig<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  path?: string; // Optional URL path segment
}

export const useTabNavigation = <T extends string>(
  tabs: TabConfig<T>[],
  defaultTab: T,
  basePath?: string // e.g., "/app/settings"
) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse active tab from URL or use default
  const activeTab = parseTabFromUrl(location.pathname, tabs) ?? defaultTab;
  
  const setActiveTab = (tabId: T) => {
    if (basePath) {
      const tab = tabs.find(t => t.id === tabId);
      const path = tab?.path ?? tabId;
      navigate(`${basePath}/${path}`);
    }
  };
  
  return { activeTab, setActiveTab };
};
```

#### Horizontal Tab Component
**File**: `src/components/tabs/horizontal-tab-nav.tsx`

```typescript
interface HorizontalTabNavProps<T extends string> {
  tabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  isDraggable?: boolean;
}

export const HorizontalTabNav = <T extends string>({
  tabs,
  activeTab,
  onTabChange,
  isDraggable = true
}: HorizontalTabNavProps<T>) => {
  // Drag-to-scroll logic (existing from Header)
  // Render horizontal tabs with icons
};
```

#### Vertical Tab Component
**File**: `src/components/tabs/vertical-tab-nav.tsx`

```typescript
interface VerticalTabNavProps<T extends string> {
  tabs: TabConfig<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  sections?: { title: string; tabIds: T[] }[]; // Optional grouping
}

export const VerticalTabNav = <T extends string>({
  tabs,
  activeTab,
  onTabChange,
  sections
}: VerticalTabNavProps<T>) => {
  // Render vertical sidebar with optional sections
};
```

### Migration Targets
1. **Header** (`src/components/layout/header.tsx`)
   - Use `HorizontalTabNav`
   - Add profile picture to right side
   - Handle global navigation

2. **DebugView** (`src/features/debug/components/debug-tabs.tsx`)
   - Use `HorizontalTabNav`
   - Maintain existing tab structure

3. **SettingsView** (`src/features/settings/components/settings-view.tsx`)
   - Use `VerticalTabNav`
   - Add "User Settings" and "App Settings" sections

---

## Phase 3: URL Routing Architecture

### Current Pattern (State-Based)
```typescript
// app.tsx
const [view, setView] = useState<AppView>('journal');

// Navigation
setView('settings'); // Changes local state
```

### New Pattern (URL-Based)
```typescript
// Routes
/app                        → Journal (default)
/app/journal                → Journal
/app/graph                  → Concept Graph
/app/statistics             → Statistics
/app/integrations           → Integrations
/app/billing                → Billing
/app/settings               → Settings (status tab default)
/app/settings/status        → Settings > Status Display
/app/settings/profile       → Settings > Account Profile
/app/settings/ai-features   → Settings > AI Features
/app/settings/privacy       → Settings > Privacy & Security
/app/settings/notifications → Settings > Notifications
/app/debug                  → Debug (state tab default)
/app/debug/console          → Debug > Console Tools
/app/debug/graph            → Debug > Developer Graph
/app/debug/manual-journal-entry → Debug > Manual Journal Entry
```

### Implementation Strategy

#### 1. Update Route Definitions
**File**: `src/app/routes.tsx`

```typescript
// src/routes/index.tsx
export const AppRoutes = () => {
  const routes = [
    { path: '/auth/login', element: <AuthView /> },
    { path: '/', element: <Navigate to="/app" replace /> },
    {
      path: '/app',
      element: (
        <ProtectedRoute>
          <MainLayout /> 
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="journal" replace /> },
        // Feature Delegation: Use the wildcard "*" to allow sub-routers to take over
        { path: 'journal/*', element: <JournalFeature /> }, 
        { path: 'graph', element: <GraphView /> },
        { path: 'statistics', element: <StatisticsView /> },
        { path: 'integrations', element: <IntegrationView /> },
        { path: 'billing', element: <BillingView /> },
        { path: 'settings/*', element: <SettingsRoutes /> },
        { path: 'debug/*', element: <DebugRoutes /> },
      ],
    },
  ];

  return useRoutes(routes);
};
```

Key point: Modularity
* Each feature folder (e.g., src/features/journal) should have its own api/routes.tsx. This keeps the feature ("Journal") logic entirely contained.

```typescript
// src/features/settings/routes/index.tsx
export const SettingsRoutes = () => {
  return (
    <Routes>
      <Route element={<SettingsView />}>
        <Route index element={<Navigate to="status" replace />} />
        <Route path="status" element={<StatusDisplaySettings />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="ai-features" element={<AIFeaturesSettings />} />
        <Route path="privacy" element={<PrivacySettings />} />
        <Route path="notifications" element={<NotificationSettings />} />
      </Route>
    </Routes>
  );
};
```

#### 2. Create MainLayout
**File**: `src/components/layout/main-layout.tsx`

```typescript
/**
 * Dashboard layout wrapper with header and content area.
 * Replaces the current MainLayout + app.tsx pattern.
 */
export const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header /> {/* No longer needs view/setView props */}
      <main className="flex-1 overflow-auto">
        <Outlet /> {/* Renders nested routes */}
      </main>
    </div>
  );
};
```

#### 3. Update Header Component
**File**: `src/components/layout/header.tsx`

```typescript
export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const tabs: TabConfig<string>[] = [
    { id: 'journal', label: 'Journal', icon: History, path: '/app/journal' },
    { id: 'graph', label: 'Concept Graph', icon: Network, path: '/app/graph' },
    // ... other tabs
  ];
  
  // Determine active tab from URL
  const activeTab = tabs.find(t => location.pathname.startsWith(t.path))?.id ?? 'journal';
  
  const handleTabChange = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.path) navigate(tab.path);
  };
  
  const handleProfileClick = () => {
    navigate('/app/settings/profile');
  };
  
  return (
    <header>
      {/* Logo */}
      <HorizontalTabNav tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
      {/* Profile Picture */}
      <button onClick={handleProfileClick}>
        <img src={user?.photoURL} alt="Profile" />
      </button>
    </header>
  );
};
```

#### 4. Update SettingsView
**File**: `src/features/settings/components/settings-view.tsx`

```typescript
export const SettingsView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const tabs: TabConfig<SettingsTab>[] = [
    { id: 'status', label: 'Status Display', icon: Layout, path: 'status' },
    { id: 'profile', label: 'Account Profile', icon: User, path: 'profile' },
    // ...
  ];
  
  // Parse active tab from URL
  const pathParts = location.pathname.split('/');
  const activeTab = (pathParts[pathParts.length - 1] as SettingsTab) ?? 'status';
  
  const handleTabChange = (tab: SettingsTab) => {
    navigate(`/app/settings/${tab}`);
  };
  
  return (
    <div className="flex">
      <VerticalTabNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sections={[
          { title: 'User Settings', tabIds: ['status', 'profile'] },
          { title: 'App Settings', tabIds: ['ai-features', 'privacy', 'notifications'] }
        ]}
      />
      <main>
        <Outlet /> {/* Renders nested settings routes */}
      </main>
    </div>
  );
};
```

---

## Phase 4: Profile Picture & Navigation

### Header Layout Changes
**File**: `src/components/layout/header.tsx`

```
┌────────────────────────────────────────────────────────────┐
│ [Logo/Title]    [Tab Nav - Centered]    [Profile Picture]  │
└────────────────────────────────────────────────────────────┘
```

### Profile Component
**File**: `src/components/layout/profile-button.tsx`

```typescript
export const ProfileButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/app/settings/profile');
  };
  
  return (
    <button
      onClick={handleClick}
      className="profile-button"
      title={user?.displayName ?? 'Profile'}
    >
      <img
        src={user?.photoURL ?? '/default-avatar.png'}
        alt={user?.displayName ?? 'User'}
        className="w-10 h-10 rounded-full border-2 border-slate-200"
      />
    </button>
  );
};
```

---

## Phase 5: Smart Firestore Sync

### Update Login Logic
**File**: `src/features/auth/utils/login-google.ts`

```typescript
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    await syncUserProfile(user); // New helper function
    
    return user;
  } catch (error) {
    console.error("Error during Google Sign-In", error);
    throw error;
  }
};
```

### New Helper Function
**File**: `src/lib/firebase/user-profile.ts`

```typescript
/**
 * Syncs user profile with Firestore, only updating changed fields.
 */
export const syncUserProfile = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    // First login - create full profile + default config
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
    
    // Create default account-config subcollection
    await createDefaultAccountConfig(user.uid);
  } else {
    // Check for changes and update only modified fields
    const existingData = existing.data();
    const updates: Partial<UserProfile> = {};
    
    if (existingData.displayName !== user.displayName) {
      updates.displayName = user.displayName ?? "";
    }
    if (existingData.email !== user.email) {
      updates.email = user.email ?? "";
    }
    if (existingData.photoURL !== user.photoURL) {
      updates.photoURL = user.photoURL ?? "";
    }
    
    if (Object.keys(updates).length > 0) {
      updates.lastUpdated = serverTimestamp();
      await updateDoc(userRef, updates);
    }
  }
};

/**
 * Creates default account configuration subcollection.
 */
const createDefaultAccountConfig = async (uid: string) => {
  const configRef = collection(db, "users", uid, "account-config");
  
  // AI Settings
  await setDoc(doc(configRef, "ai-settings"), {
    provider: "gemini",
    model: {
      voiceTranscriptionModel: "gemini-2-flash",
      abstractionModel: "gemini-3-flash",
    },
    temperature: 0,
    maxTokens: 2048,
  });
  
  // UI Preferences
  await setDoc(doc(configRef, "ui-preferences"), {
    theme: "dark",
    language: "en",
    notifications: true,
  });
  
  // Integrations
  await setDoc(doc(configRef, "integrations"), {
    obsidianEnabled: false,
    webhookUrl: "",
    webhookEnabled: false,
  });

  // Billing Settings
  await setDoc(doc(configRef, "billing-settings"), {
    plan: "free",
    status: "active",
  });
};
```

---

## Phase 6: Settings Firestore Integration

### Update ProfileSettings
**File**: `src/features/settings/components/profile-settings.tsx`

```typescript
export const ProfileSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      loadUserProfile(user.uid)
        .then((data) => {
          setProfile(data);
          setDisplayName(data.displayName ?? "");
        })
        .finally(() => setLoading(false));
    }
  }, [user]);
  
  return (
    <form onSubmit={handleSave}>
      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <div>Google Account: {profile?.email}</div>
      <button type="submit">Save</button>
    </form>
  );
};
```

### New Helper Functions
**File**: `src/lib/firebase/user-profile.ts`

```typescript
export const loadUserProfile = async (uid: string): Promise<UserProfile> => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    throw new Error("User profile not found");
  }
  
  return snapshot.data() as UserProfile;
};

export const loadAccountConfig = async <T>(
  uid: string,
  configType: "ai-settings" | "ui-preferences" | "integrations"
): Promise<T> => {
  const configRef = doc(db, "users", uid, "account-config", configType);
  const snapshot = await getDoc(configRef);
  
  if (!snapshot.exists()) {
    throw new Error(`Config ${configType} not found`);
  }
  
  return snapshot.data() as T;
};

export const updateAccountConfig = async <T>(
  uid: string,
  configType: "ai-settings" | "ui-preferences" | "integrations",
  updates: Partial<T>
): Promise<void> => {
  const configRef = doc(db, "users", uid, "account-config", configType);
  await updateDoc(configRef, updates as any);
};
```

---

## Phase 7: Migration Checklist

### Files to Create
 [x] `src/components/tabs/use-tab-navigation.ts`
 [x] `src/components/tabs/horizontal-tab-nav.tsx`
 [x] `src/components/tabs/vertical-tab-nav.tsx`
 [x] `src/components/tabs/index.ts`
 [x] `src/components/layout/profile-button.tsx`
 [x] `src/lib/firebase/user-profile.ts`
 [x] `src/types/firestore.ts` (type definitions)
 [x] `src/components/layout/dashboard-layout.tsx` (skipped; using main-layout)

 [x] `src/app/routes.tsx` - Complete route restructure
 [x] `src/app/provider.tsx` - Remove Router wrapper from here
 [x] `src/app/app.tsx` - Remove view state, simplify to layout only
 [x] `src/components/layout/header.tsx` - Use new tab component + profile
 [x] `src/components/layout/main-layout.tsx` - Possibly delete/merge
 [x] `src/features/auth/utils/login-google.ts` - Add smart sync
 [x] `src/features/settings/components/settings-view.tsx` - Use vertical tabs + Outlet
 [x] `src/features/settings/components/profile-settings.tsx` - Load from Firestore
 [ ] `src/features/settings/components/ai-features-settings.tsx` - Load/save to Firestore
 [x] `src/features/debug/components/debug-view.tsx` - Use Outlet for sub-routes
 [ ] `src/features/debug/components/debug-tabs.tsx` - Use horizontal tab component 
- [ ] `src/features/debug/components/debug-tabs.tsx` - Use horizontal tab component
- [x] `documentation/authentication/authentication.md` - Update routing and Firestore schema
- [x] `documentation/docs-features/features-settings.md` - Update settings scope and Firestore use
- [x] `documentation/docs-features/features-debug.md` - Update URL routing notes
 [ ] `documentation/architecture/architecture.md` - Update navigation pattern
 [ ] Create `documentation/ROUTING_GUIDE.md` - New routing documentation
### Documentation to Update
- [ ] `documentation/AUTH_IMPLEMENTATION_SUMMARY.md` - Update routing section
- [ ] `documentation/architecture/architecture.md` - Update navigation pattern
- [ ] `ai-guidelines.md` - Add tab component usage patterns
- [ ] Create `documentation/ROUTING_GUIDE.md` - New routing documentation

### Testing Checklist
- [ ] All main routes accessible: `/app/journal`, `/app/graph`, etc.
- [ ] Settings sub-routes work: `/app/settings/profile`, etc.
- [ ] Debug sub-routes work: `/app/debug/console`, etc.
- [ ] Profile picture appears in header
- [ ] Profile picture click navigates to settings/profile
- [ ] Firestore profile syncs on login (check console)
- [ ] Settings load data from Firestore
- [ ] Browser back/forward buttons work correctly
- [ ] Direct URL access works (e.g., paste `/app/settings/profile`)
- [ ] Build succeeds: `npm run build`

---

## Implementation Order

### Step 1: Foundation (Day 1)
1. Create type definitions (`src/types/firestore.ts`)
2. Create Firestore helper functions (`src/lib/firebase/user-profile.ts`)
3. Update login logic with smart sync
4. Test Firestore writes manually

### Step 2: Tab Components (Day 1-2)
1. Create `use-tab-navigation` hook
2. Create `HorizontalTabNav` component
3. Create `VerticalTabNav` component
4. Create component exports

### Step 3: Routing Structure (Day 2)
1. Update `src/app/routes.tsx` with nested routes
2. Create `MainLayout` component (previously: DashboardLayout)
3. Update `AppProvider` to act as a pure provider wrapper (Router/Auth/ErrorBoundary only)
4. Render `AppRoutes` inside `src/app/app.tsx` after persistence initializes
5. Test basic routing (journal, graph, statistics)

### Step 4: Header Refactor (Day 2)
1. Update Header to use `HorizontalTabNav`
2. Add profile picture component
3. Implement profile click navigation
4. Test header navigation

### Step 5: Settings Integration (Day 3)
1. Update `SettingsView` to use `VerticalTabNav` + `Outlet`
2. Update settings sub-components to load from Firestore
3. Add save functionality to settings
4. Test settings navigation and data persistence

### Step 6: Debug Integration (Day 3)
1. Update `DebugView` to use URL-based tabs + `Outlet`
2. Add debug sub-routes: `console`, `graph`, `manual-journal-entry`
3. Test debug sub-routes

### Step 7: Cleanup & Documentation (Day 3)
1. Delete unused files
2. Update all documentation
3. Run full test suite
4. Commit with detailed message

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Breaking existing navigation** | High | Thorough manual testing of all routes |
| **Firestore permission errors** | Medium | Update security rules before deployment |
| **Performance (subcollection reads)** | Low | Acceptable for user config data |
| **Lost work if migration incomplete** | High | Git branch + incremental commits |
| **Build failures** | Medium | Test build after each major change |

---

## Rollback Plan

If critical issues arise:
1. **Git branch**: Create `feature/url-routing` before starting
2. **Incremental commits**: Commit after each phase
3. **Revert point**: Keep current working state in `main` until fully tested
4. **Firestore**: Subcollections are additive (won't break existing users/{uid} docs)

---

## Success Criteria

- [ ] All routes accessible via URL
- [ ] Browser back/forward buttons work correctly
- [ ] Profile picture displays and navigates correctly
- [ ] Settings load and save to Firestore subcollections
- [ ] No console errors in production build
- [ ] All documentation updated
- [ ] Manual testing completed for all routes

---

## Next Steps After Completion

1. Add URL query parameters for filtering (e.g., `/app/journal?date=2026-02-05`)
2. Implement breadcrumb navigation
3. Add route guards for feature flags
4. Implement lazy loading for route components
5. Add analytics tracking for route changes
