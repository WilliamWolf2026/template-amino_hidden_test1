# Mobile Restrictor Implementation Plan

## Overview

Add a forced 9:16 (portrait) aspect ratio container for mobile games. This ensures consistent layout across devices and handles mobile browser quirks (address bar, keyboard, orientation).

---

## Current State

- No viewport constraints currently implemented
- Screens use `fixed inset-0` (full viewport)
- No dynamic viewport height handling
- No aspect ratio enforcement

---

## Components to Implement

### 1. Dynamic Viewport Height (--dynamic-vh)

Mobile browsers have variable viewport heights due to address bar showing/hiding. The CSS `100vh` is unreliable.

**Solution:** JavaScript-calculated viewport height variable.

**Location:** `entry-server.tsx` (inline script in `<head>`) + `entry-client.tsx`

```typescript
// Add to <head> in entry-server.tsx
<script>
  {`
    function setVH() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--dynamic-vh', vh + 'px');
    }
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
  `}
</script>
```

**Usage in CSS:**
```css
height: calc(var(--dynamic-vh, 1vh) * 100);
```

---

### 2. MobileContainer Component

A wrapper component that enforces 9:16 aspect ratio and constrains width.

**Location:** `scaffold/ui/MobileContainer.tsx`

**Features:**
- 9:16 aspect ratio (portrait)
- Max width constraint (default 640px)
- Centers content on larger screens
- Uses dynamic viewport height
- Optional transparent mode (no padding)

```typescript
interface MobileContainerProps {
  children: JSX.Element;
  maxWidth?: number;        // Default: 640
  transparent?: boolean;    // Skip padding on edges
  class?: string;
}
```

**Implementation:**
```tsx
export function MobileContainer(props: ParentProps<MobileContainerProps>) {
  const maxWidth = () => props.maxWidth ?? 640;

  const maxWidthStyle = () => {
    const vwConstraint = props.transparent ? "100vw" : "calc(100vw - 2rem)";
    return `min(${vwConstraint}, ${maxWidth()}px)`;
  };

  return (
    <div class="fixed inset-0 flex items-center justify-center bg-black">
      <div
        class={`aspect-[9/16] overflow-hidden flex flex-col ${props.class ?? ''}`}
        style={{
          "max-width": maxWidthStyle(),
          "max-height": "calc(var(--dynamic-vh, 1vh) * 100)",
          "width": "100%",
        }}
      >
        {props.children}
      </div>
    </div>
  );
}
```

---

### 3. Scaffold Config Extension

Add mobile/layout configuration to scaffold config.

**Location:** `scaffold/config.ts`

```typescript
export interface ScaffoldConfig {
  // ... existing
  layout: {
    aspectRatio: '9:16' | '16:9' | 'auto';
    maxWidth: number;
    forcePortrait: boolean;
  };
}

export const scaffoldConfig: ScaffoldConfig = {
  // ... existing
  layout: {
    aspectRatio: '9:16',
    maxWidth: 640,
    forcePortrait: true,
  },
};
```

---

### 4. Orientation Lock Warning (Optional)

Show a message when device is in landscape mode.

**Location:** `scaffold/ui/OrientationWarning.tsx`

```tsx
export function OrientationWarning() {
  const [isLandscape, setIsLandscape] = createSignal(false);

  onMount(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    onCleanup(() => window.removeEventListener('resize', checkOrientation));
  });

  return (
    <Show when={isLandscape()}>
      <div class="fixed inset-0 z-[99999] bg-black flex items-center justify-center">
        <div class="text-white text-center p-8">
          <RotateIcon class="w-16 h-16 mx-auto mb-4 animate-bounce" />
          <h2 class="text-2xl font-bold">Please Rotate</h2>
          <p class="text-gray-400 mt-2">This game is best played in portrait mode</p>
        </div>
      </div>
    </Show>
  );
}
```

---

## Integration Points

### Option A: Wrap at App Level

Wrap entire app in MobileContainer.

```tsx
// app.tsx
return (
  <GlobalBoundary>
    <MobileContainer>
      <TweakpaneConfig />
      <SettingsMenu /> {/* Move inside container */}
      <PauseProvider>
        {/* ... */}
      </PauseProvider>
    </MobileContainer>
  </GlobalBoundary>
);
```

**Pros:** Single wrapper, consistent everywhere
**Cons:** Settings menu also constrained

### Option B: Wrap at Screen Level

Each screen wraps its content in MobileContainer.

```tsx
// StartScreen.tsx
return (
  <MobileContainer>
    <div class="flex flex-col items-center justify-center h-full">
      {/* ... */}
    </div>
  </MobileContainer>
);
```

**Pros:** Per-screen control
**Cons:** Repetitive, easy to forget

### Option C: Wrap in ScreenRenderer (Recommended)

ScreenRenderer automatically wraps all screens.

```tsx
// systems/screens/ScreenRenderer.tsx
export function ScreenRenderer(props) {
  return (
    <MobileContainer>
      <Dynamic component={currentScreen()} />
    </MobileContainer>
  );
}
```

**Pros:** Automatic, no screen changes needed
**Cons:** All screens forced into container

---

## Implementation Checklist

### Phase 1: Dynamic Viewport Height
- [ ] Add setVH script to `entry-server.tsx` `<head>`
- [ ] Add setVH call in `entry-client.tsx` onMount
- [ ] Add CSS variable fallback in `app.css`

### Phase 2: MobileContainer Component
- [ ] Create `scaffold/ui/MobileContainer.tsx`
- [ ] Export from `scaffold/index.ts`
- [ ] Add layout config to `scaffold/config.ts`

### Phase 3: Integration
- [ ] Decide on integration point (A, B, or C)
- [ ] Update ScreenRenderer or app.tsx
- [ ] Update screens to use `h-full` instead of `fixed inset-0`

### Phase 4: Optional Enhancements
- [ ] Create OrientationWarning component
- [ ] Add to app.tsx above everything
- [ ] Test on various devices

---

## CSS Updates Required

### app.css additions:
```css
/* Dynamic viewport height fallback */
:root {
  --dynamic-vh: 1vh;
}

/* Prevent overscroll/bounce on iOS */
html, body {
  overscroll-behavior: none;
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}

/* Safe area insets for notched devices */
.safe-area-inset {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### entry-server.tsx viewport meta update:
```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
/>
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `entry-server.tsx` | Add setVH script, update viewport meta |
| `entry-client.tsx` | Add setVH initialization |
| `app.css` | Add CSS variables, overscroll prevention |
| `scaffold/config.ts` | Add layout configuration |
| `scaffold/ui/MobileContainer.tsx` | NEW - Container component |
| `scaffold/ui/OrientationWarning.tsx` | NEW - Optional landscape warning |
| `scaffold/index.ts` | Export new components |
| `app.tsx` OR `ScreenRenderer.tsx` | Wrap content in MobileContainer |

---

## Testing Checklist

- [ ] iPhone Safari (address bar hide/show)
- [ ] Android Chrome (address bar hide/show)
- [ ] iPad (split view)
- [ ] Desktop (centered with pillarboxing)
- [ ] Orientation change (portrait ↔ landscape)
- [ ] Notched devices (safe area insets)

---

## Questions to Decide

1. **Integration point** - Where to add MobileContainer?
   - App level (everything constrained)
   - Screen level (per-screen control)
   - ScreenRenderer (automatic, recommended)

2. **Landscape handling** - What to show in landscape?
   - Rotate warning (recommended for portrait games)
   - Allow with letterboxing
   - Auto-rotate content

3. **Settings menu position** - Should SettingsMenu be:
   - Inside MobileContainer (constrained)
   - Outside (fixed to viewport edge)

4. **Desktop behavior** - On wide screens:
   - Center with pillarboxing (black bars) ✓
   - Stretch to fill
   - Custom background behind container
