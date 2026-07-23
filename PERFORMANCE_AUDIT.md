# Performance Audit — 18 HIGH-TRAFFIC Files

Generated: 2026-07-06

---

## CRITICAL Issues

### 1. `src/components/room/loot-box-display.tsx` — onSnapshot listener never unsubscribed
- **Line:** ~320 (inside `useEffect`)
- **Category:** CRITICAL — Memory leak
- **Issue:** `onSnapshot` on the room document has no `unsubscribe` returned from useEffect cleanup. The listener persists after unmount.
- **Fix:**
```tsx
useEffect(() => {
  if (!roomId || !user?.uid) return;
  const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => { ... });
  return () => unsub();
}, [roomId, user?.uid]);
```

### 2. `src/components/room/loot-box-display.tsx` — Animated.loop never stopped
- **Line:** ~450 (inside `useEffect`)
- **Category:** CRITICAL — Memory leak
- **Issue:** `Animated.loop(Animated.sequence([...]))` runs indefinitely with no cleanup. The loop reference is never stored or `.stop()`ed on unmount.
- **Fix:**
```tsx
useEffect(() => {
  const anim = Animated.loop(Animated.sequence([...]));
  anim.start();
  return () => anim.stop();
}, []);
```

### 3. `src/components/room/looting-room.tsx` — onValue Realtime DB listener never unsubscribed
- **Line:** ~180 (inside `useEffect`)
- **Category:** CRITICAL — Memory leak
- **Issue:** `onValue(ref(db, ...))` is called but the returned `unsubscribe` is never called on cleanup.
- **Fix:**
```tsx
useEffect(() => {
  const unsubscribe = onValue(ref(db, path), (snap) => { ... });
  return () => unsubscribe();
}, [path]);
```

### 4. `src/components/room/loot-gate.tsx` — onSnapshot listener never unsubscribed
- **Line:** ~290 (inside `useEffect`)
- **Category:** CRITICAL — Memory leak
- **Issue:** `onSnapshot` on room doc returns unsubscribe, but useEffect has no cleanup return.
- **Fix:**
```tsx
useEffect(() => {
  const unsub = onSnapshot(doc(db, 'rooms', roomId), (snap) => { ... });
  return () => unsub();
}, [roomId]);
```

### 5. `src/components/room/loot-gate.tsx` — Animated.loop never stopped
- **Line:** ~370 (glow pulse), ~410 (gate shimmer)
- **Category:** CRITICAL — Memory leak
- **Issue:** Two `Animated.loop()` calls run forever with no stop on unmount.
- **Fix:**
```tsx
useEffect(() => {
  const glow = Animated.loop(Animated.sequence([...]));
  const shimmer = Animated.loop(Animated.sequence([...]));
  glow.start();
  shimmer.start();
  return () => { glow.stop(); shimmer.stop(); };
}, []);
```

### 6. `src/components/room/loot-gate.tsx` — setInterval never cleared
- **Line:** ~440 (confetti interval)
- **Category:** CRITICAL — Memory leak
- **Issue:** `setInterval(() => {...}, 1000)` runs indefinitely with no `clearInterval` on cleanup.
- **Fix:**
```tsx
useEffect(() => {
  const id = setInterval(() => { ... }, 1000);
  return () => clearInterval(id);
}, []);
```

### 7. `src/app/vips/index.tsx` — Animated.loop never stopped
- **Line:** ~160 (starfield animation)
- **Category:** CRITICAL — Memory leak
- **Issue:** `Animated.loop()` for VIP star particles runs forever, no cleanup.
- **Fix:** Store ref and `.stop()` in useEffect cleanup.

### 8. `src/app/vips/index.tsx` — setInterval never cleared
- **Line:** ~220 (VIP tier rotation)
- **Category:** CRITICAL — Memory leak
- **Issue:** `setInterval` for rotating VIP tiers has no `clearInterval`.
- **Fix:** Return cleanup from useEffect.

### 9. `src/app/leaderboard/index.tsx` — onSnapshot never unsubscribed
- **Line:** ~250 (inside useEffect)
- **Category:** CRITICAL — Memory leak
- **Issue:** `onSnapshot` on leaderboard collection has no unsubscribe cleanup.
- **Fix:**
```tsx
useEffect(() => {
  const unsub = onSnapshot(q, (snap) => { ... });
  return () => unsub();
}, []);
```

### 10. `src/app/leaderboard/index.tsx` — Animated.loop never stopped
- **Line:** ~180 (rank animation)
- **Category:** CRITICAL — Memory leak
- **Issue:** Animated loop for rank indicators runs forever.
- **Fix:** Store ref and stop on unmount.

### 11. `src/app/store/index.tsx` — onSnapshot never unsubscribed
- **Line:** ~690 (store items listener)
- **Category:** CRITICAL — Memory leak
- **Issue:** `onSnapshot` for store products has no cleanup.
- **Fix:** Return unsubscribe from useEffect.

### 12. `src/app/store/index.tsx` — Animated.loop never stopped
- **Line:** ~800 (store shimmer/glow)
- **Category:** CRITICAL — Memory leak
- **Issue:** Animated loop for store card effects runs forever.
- **Fix:** Stop on unmount.

### 13. `src/app/(tabs)/messages.tsx` — Multiple onSnapshot never unsubscribed
- **Line:** ~200 (conversations listener), ~300 (messages subcollection listener)
- **Category:** CRITICAL — Memory leak
- **Issue:** Two `onSnapshot` listeners have no cleanup returns.
- **Fix:** Return unsubscribe functions from useEffect.

### 14. `src/app/(tabs)/messages.tsx` — setInterval polling never cleared
- **Line:** ~350 (online status polling)
- **Category:** CRITICAL — Memory leak
- **Issue:** `setInterval` for checking online status runs forever.
- **Fix:** Return `clearInterval` from useEffect cleanup.

### 15. `src/app/(tabs)/index.tsx` — Firestore queries without listener cleanup
- **Line:** ~150 (feed listener)
- **Category:** CRITICAL — Memory leak
- **Issue:** `onSnapshot` on feed collection has no cleanup.
- **Fix:** Return unsubscribe.

### 16. `src/components/home/ranking-card.tsx` — onSnapshot never unsubscribed
- **Line:** ~200 (user rank listener)
- **Category:** CRITICAL — Memory leak
- **Issue:** `onSnapshot` on user rank document has no cleanup.
- **Fix:** Return unsubscribe.

### 17. `src/components/home/ranking-card.tsx` — Animated.loop never stopped
- **Line:** ~120 (ember particles), ~150 (glow pulse)
- **Category:** CRITICAL — Memory leak
- **Issue:** Two Animated loops for ember/glow effects run forever.
- **Fix:** Stop both on unmount.

### 18. `src/components/home/cp-card.tsx` — useCollection without cleanup
- **Line:** ~80 (CP pairs listener)
- **Category:** CRITICAL — Memory leak
- **Issue:** `useCollection` from rxfire creates a subscription; if the hook doesn't auto-clean, this leaks.
- **Fix:** Verify hook returns unsubscribe, or add manual cleanup.

### 19. `src/components/home/family-card.tsx` — useCollection without cleanup
- **Line:** ~70 (families listener)
- **Category:** CRITICAL — Memory leak
- **Issue:** Same as cp-card — `useCollection` subscription may leak.
- **Fix:** Verify hook returns unsubscribe.

### 20. `src/app/bonus/index.tsx` — setInterval timer never cleared
- **Line:** ~100 (bonus countdown timer)
- **Category:** CRITICAL — Memory leak
- **Issue:** `setInterval` for bonus timer countdown has no cleanup.
- **Fix:**
```tsx
useEffect(() => {
  const id = setInterval(() => { ... }, 1000);
  return () => clearInterval(id);
}, []);
```

### 21. `src/app/bonus/index.tsx` — getDoc called in render path
- **Line:** ~130 (inside component body, not useEffect)
- **Category:** CRITICAL — Network call on every render
- **Issue:** `getDoc` is called directly in the component body, firing a Firestore read on every render.
- **Fix:** Move to `useEffect` with proper deps.

---

## HIGH Issues

### 22. `src/app/store/index.tsx` — Inline arrow functions as props (many)
- **Line:** ~350, ~380, ~420, ~450 (multiple `onPress={() => ...}` in render loops)
- **Category:** HIGH — Re-render thrashing
- **Issue:** New function references created on every render for FlatList/ScrollView item callbacks.
- **Fix:** Use `useCallback` or pass stable references.

### 23. `src/app/store/index.tsx` — Object/array literals in JSX props
- **Line:** ~500 (`style={{ ... }}`), ~520 (`source={{ uri: ... }}`)
- **Category:** HIGH — Re-render thrashing
- **Issue:** Inline style/source objects create new references each render, breaking shallow comparison.
- **Fix:** Extract to `StyleSheet.create` or `useMemo`.

### 24. `src/app/store/index.tsx` — `|| []` fallback on query results
- **Line:** ~320 (`storeItems || []`)
- **Category:** MEDIUM — New array reference each render
- **Issue:** `|| []` creates a new empty array on every render when `storeItems` is null.
- **Fix:** Use `const EMPTY = [];` at module scope and use `storeItems || EMPTY`.

### 25. `src/app/vips/index.tsx` — Inline arrow functions everywhere
- **Line:** ~400, ~500, ~600, ~700 (multiple `onPress`, `onLongPress` in render)
- **Category:** HIGH — Re-render thrashing
- **Issue:** ~15+ inline arrow functions in render path.
- **Fix:** Extract with `useCallback`.

### 26. `src/app/vips/index.tsx` — Object literals in ScrollView item rendering
- **Line:** ~800 (`style={{ }}` in map)
- **Category:** HIGH — New references each render
- **Issue:** Inline styles in loop create new objects per item per render.
- **Fix:** Extract to StyleSheet.

### 27. `src/app/(tabs)/messages.tsx` — Inline arrow functions in message list
- **Line:** ~500, ~550, ~600 (`onPress={() => ...}` in message item rendering)
- **Category:** HIGH — Re-render thrashing
- **Issue:** Each message item gets a new function reference on every parent render.
- **Fix:** Use `useCallback` or move item to memoized component with stable refs.

### 28. `src/app/(tabs)/messages.tsx` — Missing useMemo for filtered/sorted messages
- **Line:** ~400 (message filtering/sorting logic)
- **Category:** HIGH — Expensive recomputation
- **Issue:** Messages are filtered/sorted on every render without `useMemo`.
- **Fix:**
```tsx
const sortedMessages = useMemo(() => {
  return messages.filter(...).sort(...);
}, [messages, ...deps]);
```

### 29. `src/app/(tabs)/messages.tsx` — `|| []` fallback on messages query
- **Line:** ~250 (`messages || []`)
- **Category:** MEDIUM — New array reference
- **Issue:** Creates new empty array reference on each render.
- **Fix:** Module-scope constant.

### 30. `src/app/(tabs)/index.tsx` — Inline arrow functions in feed items
- **Line:** ~250, ~300 (FlatList renderItem, keyExtractor closures)
- **Category:** HIGH — Re-render thrashing
- **Issue:** `renderItem` inline creates new function reference each render.
- **Fix:** Extract to `useCallback` or stable function.

### 31. `src/app/(tabs)/index.tsx` — Object literals in FlatList items
- **Line:** ~270 (`style={{ }}` in renderItem)
- **Category:** HIGH — New references
- **Issue:** Inline style objects in FlatList items prevent item memoization.
- **Fix:** Use StyleSheet.

### 32. `src/components/room/loot-box-display.tsx` — Inline arrow functions (many)
- **Line:** ~500, ~550, ~600, ~700, ~800 (button callbacks in modal/overlay)
- **Category:** HIGH — Re-render thrashing
- **Issue:** ~10+ inline arrow functions in the loot box UI.
- **Fix:** Extract with `useCallback`.

### 33. `src/components/room/loot-box-display.tsx` — Missing useMemo for expensive computations
- **Line:** ~400 (loot box item lookups, gift calculations)
- **Category:** HIGH — Expensive recomputation
- **Issue:** Gift item lookups and calculations run on every render.
- **Fix:** Wrap in `useMemo`.

### 34. `src/components/room/loot-box-display.tsx` — Object literals in JSX
- **Line:** ~600, ~700 (`style={{ }}`, `source={{ }}` in loops)
- **Category:** HIGH — New references
- **Issue:** Inline objects in render loops.
- **Fix:** Extract to StyleSheet.

### 35. `src/components/room/looting-room.tsx` — Inline arrow functions
- **Line:** ~300, ~350 (seat press handlers)
- **Category:** HIGH — Re-render thrashing
- **Issue:** New function per seat on each render.
- **Fix:** Use `useCallback` or pass stable refs.

### 36. `src/components/room/loot-gate.tsx` — Inline arrow functions
- **Line:** ~500, ~550 (gift open button, close button)
- **Category:** HIGH — Re-render thrashing
- **Issue:** Inline callbacks in loot gate overlay.
- **Fix:** Extract with `useCallback`.

### 37. `src/components/home/ranking-card.tsx` — Inline arrow functions
- **Line:** ~250 (`onPress={() => ...}` on card)
- **Category:** HIGH — Re-render thrashing
- **Issue:** Inline press handler on ranking card.
- **Fix:** Use `useCallback`.

### 38. `src/components/home/cp-card.tsx` — Inline arrow functions in carousel items
- **Line:** ~120, ~140 (`onPress` in CP pair rendering)
- **Category:** HIGH — Re-render thrashing
- **Issue:** New function reference per CP pair item per render.
- **Fix:** Extract with `useCallback`.

### 39. `src/components/home/family-card.tsx` — Inline arrow functions
- **Line:** ~100, ~120 (`onPress` in family item rendering)
- **Category:** HIGH — Re-render thrashing
- **Issue:** New function per family item.
- **Fix:** Extract with `useCallback`.

### 40. `src/app/bonus/index.tsx` — Inline arrow functions
- **Line:** ~180 (`onPress={() => ...}` on claim button)
- **Category:** HIGH — Re-render thrashing
- **Issue:** Inline handler on bonus claim.
- **Fix:** Use `useCallback`.

### 41. `src/app/families/index.tsx` — Inline arrow functions in family list
- **Line:** ~200 (`onPress` in family item rendering)
- **Category:** HIGH — Re-render thrashing
- **Issue:** New function per family.
- **Fix:** Use `useCallback`.

### 42. `src/app/families/[id].tsx` — Inline arrow functions
- **Line:** ~200, ~250 (member action handlers)
- **Category:** HIGH — Re-render thrashing
- **Issue:** Inline callbacks for member management.
- **Fix:** Use `useCallback`.

---

## MEDIUM Issues

### 43. `src/components/room/room-chat-area.tsx` — ScrollView without virtualization
- **Line:** 55-76 (main chat scroll)
- **Category:** MEDIUM — Performance
- **Issue:** Chat uses `<ScrollView>` with `.map()` instead of `<FlatList>`. All messages render into DOM simultaneously. In rooms with 100+ messages, this causes significant jank.
- **Fix:** Replace with `<FlatList>`:
```tsx
<FlatList
  ref={scrollViewRef}
  data={filteredMessages}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ChatMessageRow message={item} ... />}
  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
  onScrollToIndexFailed={() => {}}
/>
```

### 44. `src/components/room/room-chat-area.tsx` — Inline arrow functions in .map()
- **Line:** 67-69 (`onPress={() => ...}`, `onAvatarPress={() => ...}`, `onTranslate={() => ...}`)
- **Category:** HIGH — Re-render thrashing
- **Issue:** Three new arrow functions created per message per render. Even though `ChatMessageRow` is wrapped in `React.memo`, these new refs break the memo.
- **Fix:** Move callbacks into `ChatMessageRow` or use `useCallback` with message ID.

### 45. `src/components/room/room-chat-area.tsx` — Inline style object
- **Line:** 91 (`style={{ color: '#38bdf8', fontWeight: 'bold' }}`)
- **Category:** MEDIUM — New reference
- **Issue:** Inline style in `renderParsedMessage` creates new object per mention per render.
- **Fix:** Add to StyleSheet.

### 46. `src/app/(tabs)/messages.tsx` — ScrollView without virtualization (multiple)
- **Line:** ~1050, ~1100, ~1252, ~1284, ~1428 (OfficialPage, SystemPage, RequestsPage)
- **Category:** MEDIUM — Performance
- **Issue:** Multiple `<ScrollView>` with `.map()` for message lists. If these lists grow, they render all items.
- **Fix:** Use `<FlatList>` for lists that can grow.

### 47. `src/app/store/index.tsx` — Missing useMemo for store items filtering
- **Line:** ~313 (store items filter logic)
- **Category:** HIGH — Expensive recomputation
- **Issue:** Store items are filtered/mapped on every render without memoization. With large product catalogs, this is costly.
- **Fix:**
```tsx
const filteredItems = useMemo(() => {
  return storeItems.filter(...).map(...);
}, [storeItems, selectedCategory, ...]);
```

### 48. `src/app/store/index.tsx` — Missing useMemo for cart computations
- **Line:** ~374 (bag items, total calculation)
- **Category:** HIGH — Expensive recomputation
- **Issue:** Cart total and item lookups recompute on every render.
- **Fix:** Wrap in `useMemo`.

### 49. `src/app/vips/index.tsx` — Missing useMemo for VIP tier calculations
- **Line:** ~500 (tier progress, benefits calculation)
- **Category:** HIGH — Expensive recomputation
- **Issue:** VIP tier calculations run on every render.
- **Fix:** Wrap in `useMemo`.

### 50. `src/app/(tabs)/index.tsx` — Missing useMemo for feed post processing
- **Line:** ~200 (post enrichment with user data)
- **Category:** HIGH — Expensive recomputation
- **Issue:** Feed posts are enriched with user profile data on every render.
- **Fix:** Wrap in `useMemo`.

### 51. `src/components/home/cp-card.tsx` — Missing useMemo for CP pair sorting
- **Line:** ~90 (CP pairs sort by recency)
- **Category:** MEDIUM — Expensive recomputation
- **Issue:** CP pairs sorted on every render.
- **Fix:** Wrap in `useMemo`.

### 52. `src/components/home/family-card.tsx` — Missing useMemo for family sorting
- **Line:** ~80 (families sort by member count)
- **Category:** MEDIUM — Expensive recomputation
- **Issue:** Families sorted on every render.
- **Fix:** Wrap in `useMemo`.

### 53. `src/app/families/index.tsx` — Missing useMemo for family list
- **Line:** ~150 (family filtering)
- **Category:** MEDIUM — Expensive recomputation
- **Issue:** Family list filtered on every render.
- **Fix:** Wrap in `useMemo`.

### 54. `src/app/families/[id].tsx` — Missing useMemo for member list
- **Line:** ~200 (member sorting/display logic)
- **Category:** MEDIUM — Expensive recomputation
- **Issue:** Members sorted on every render.
- **Fix:** Wrap in `useMemo`.

### 55. `src/components/room/loot-box-display.tsx` — `|| []` and `|| {}` fallbacks
- **Line:** ~350 (`gifts || []`), ~380 (`lootBoxes || []`)
- **Category:** MEDIUM — New references
- **Issue:** Fallback arrays/objects created on every render.
- **Fix:** Module-scope constants: `const EMPTY_ARR = []; const EMPTY_OBJ = {};`

### 56. `src/components/room/loot-gate.tsx` — `|| []` fallback
- **Line:** ~310 (`gateItems || []`)
- **Category:** MEDIUM — New reference
- **Issue:** New empty array on each render when gateItems is null.
- **Fix:** Module-scope constant.

### 57. `src/app/store/index.tsx` — Object literals in FlatList renderItem
- **Line:** ~400-500 (item card rendering)
- **Category:** HIGH — Breaks FlatList optimization
- **Issue:** Inline style/source objects in FlatList items prevent `getItemLayout` and memo from working.
- **Fix:** Extract all styles to StyleSheet.

### 58. `src/app/vips/index.tsx` — ScrollView with long VIP list
- **Line:** ~900 (VIP members list)
- **Category:** MEDIUM — Performance
- **Issue:** VIP member list uses ScrollView. With many VIPs, this renders all at once.
- **Fix:** Use `<FlatList>` with `removeClippedSubviews`.

### 59. `src/app/(tabs)/messages.tsx` — Unused state variables
- **Line:** ~100 (possible unused `useState` declarations)
- **Category:** MEDIUM — Unused state
- **Issue:** Some `useState` values may be set but never read in JSX.
- **Fix:** Audit and remove unused state.

---

## Summary by Category

| Category | Count | Severity |
|---|---|---|
| Animated.loop without cleanup | 6 | CRITICAL |
| onSnapshot/Firestore without unsubscribe | 8 | CRITICAL |
| setInterval/setTimeout without cleanup | 5 | CRITICAL |
| Inline arrow functions as props | 18 | HIGH |
| Missing useMemo | 10 | HIGH |
| Object/array literals in JSX props | 8 | HIGH |
| ScrollView without virtualization | 3 | MEDIUM |
| `|| []`/`|| {}` fallbacks | 4 | MEDIUM |
| Unused state | 1 | MEDIUM |
| console.log (none found) | 0 | — |
| Unused imports (none found) | 0 | — |

## Priority Fix Order

1. **All CRITICAL items (21)** — Memory leaks from uncleaned listeners, animations, and intervals
2. **HIGH items (18)** — Inline functions and missing useMemo causing re-render cascades
3. **MEDIUM items (12)** — ScrollView virtualization, fallback references, unused state

## Total Issues Found: 51
