import {
  createContext,
  useContext,
  onMount,
  createEffect,
  onCleanup,
  type JSX,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import { getUserData } from "./helper";
import { useAnalytics } from "./AnalyticsContext";
import { type PostHog } from "~/scaffold/lib/analytics";
import { GAME_STORAGE_PREFIX } from "~/game/config/identity";

// ============================================================================
// STRICT TYPE DEFINITIONS & CONSTANTS
// ============================================================================

export type DifficultyVariant = "easy_start" | "medium_start" | "hard_start";
export type ClueDisplayTime = "2s" | "3s" | "5s";

export interface FeatureFlags {
  difficulty_curve_variant: DifficultyVariant;
  county_theming_enabled: boolean;
  clue_display_time: ClueDisplayTime;
  clue_overlay_enabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  difficulty_curve_variant: "medium_start",
  county_theming_enabled: false,
  clue_display_time: "3s",
  clue_overlay_enabled: false,
};

const FETCH_TIMEOUT_MS = 2000;
const STORAGE_PREFIX = `${GAME_STORAGE_PREFIX}ff_`;


function isDifficultyVariant(value: unknown): value is DifficultyVariant {
  return (
    typeof value === "string" &&
    ["easy_start", "medium_start", "hard_start"].includes(value)
  );
}

function isClueDisplayTime(value: unknown): value is ClueDisplayTime {
  return typeof value === "string" && ["2s", "3s", "5s"].includes(value);
}

function safeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

// ============================================================================
// STORAGE HELPERS 
// ============================================================================

function getStorageKey(uid: string) {
  return `${STORAGE_PREFIX}${uid}`;
}

function loadCache(uid: string): FeatureFlags | null {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    
    // Validate schema integrity to prevent crashes from stale/bad cache
    return {
      difficulty_curve_variant: isDifficultyVariant(parsed.difficulty_curve_variant)
        ? parsed.difficulty_curve_variant
        : DEFAULT_FLAGS.difficulty_curve_variant,
      county_theming_enabled: safeBoolean(
        parsed.county_theming_enabled,
        DEFAULT_FLAGS.county_theming_enabled
      ),
      clue_display_time: isClueDisplayTime(parsed.clue_display_time)
        ? parsed.clue_display_time
        : DEFAULT_FLAGS.clue_display_time,
      clue_overlay_enabled: safeBoolean(
        parsed.clue_overlay_enabled,
        DEFAULT_FLAGS.clue_overlay_enabled
      ),
    };
  } catch {
    return null;
  }
}

function saveCache(uid: string, flags: FeatureFlags) {
  try {
    localStorage.setItem(getStorageKey(uid), JSON.stringify(flags));
  } catch { /* Ignore quota errors */ }
}


type FeatureFlagContextState = {
  flags: FeatureFlags;
  isReady: boolean;
};

const FeatureFlagContext = createContext<FeatureFlagContextState>();

export function FeatureFlagProvider(props: { children: JSX.Element }) {
  const { uid } = getUserData();
  const cached = loadCache(uid);
  const analytics = useAnalytics();

  // Initialize Store
  const [state, setState] = createStore<FeatureFlagContextState>({
    flags: cached ?? DEFAULT_FLAGS,
    isReady: !!cached, 
  });

  // Track if we have "settled" (successfully loaded or timed out)
  let isSettled = false;

  /**
   * Core logic: Reads from SDK, Validates, Updates State, Persists
   */
  const processFlags = (ph: PostHog, source: string) => {
    // 1. Fetch raw values from SDK
    const rawDifficulty = ph.getFeatureFlag("difficulty_curve_variant");
    const rawTheming = ph.isFeatureEnabled("county_theming_enabled");
    const rawDisplayTime = ph.getFeatureFlag("clue_display_time");
    const rawOverlay = ph.isFeatureEnabled("clue_overlay_enabled");

    // 2. Validate & Construct Safe Object
    const nextFlags: FeatureFlags = {
      difficulty_curve_variant: isDifficultyVariant(rawDifficulty)
        ? rawDifficulty
        : DEFAULT_FLAGS.difficulty_curve_variant,
      county_theming_enabled: safeBoolean(rawTheming, DEFAULT_FLAGS.county_theming_enabled),
      clue_display_time: isClueDisplayTime(rawDisplayTime)
        ? rawDisplayTime
        : DEFAULT_FLAGS.clue_display_time,
      clue_overlay_enabled: safeBoolean(rawOverlay, DEFAULT_FLAGS.clue_overlay_enabled),
    };

    // 3. Update Store & Persist
    setState("flags", nextFlags);
    setState("isReady", true); // Unblock UI
    saveCache(uid, nextFlags); // Update LocalStorage for next time

    //  Register properties for all future events
    ph.register({
      difficulty_variant: nextFlags.difficulty_curve_variant,
      county_theming: nextFlags.county_theming_enabled,
      clue_time: nextFlags.clue_display_time,
      overlay_enabled: nextFlags.clue_overlay_enabled
    });
    
    console.debug(`[FeatureFlags] Resolved via ${source}`, nextFlags);
    isSettled = true;
  };

  // --------------------------------------------------------------------------
  // Wait for PostHog to Initialize
  // --------------------------------------------------------------------------
  createEffect(() => {
    // We listen to the signal. When AnalyticsProvider initializes, this runs.
    const ph = analytics.posthog(); 
    
    if (ph) {
      // 1. Listen for Flag Updates (e.g. late load or mid-session change)
      const stopListening = ph.onFeatureFlags(() => processFlags(ph, "posthog_update"));

      // 2. Immediate Check (In case flags were pre-loaded by the snippet)
      //    We check a specific flag to see if the SDK has data yet.
      if (ph.getFeatureFlag("difficulty_curve_variant") !== undefined) {
        processFlags(ph, "immediate_check");
      }

      onCleanup(() => {
        // Cleanup listener if component unmounts
        if (typeof stopListening === "function") stopListening();
      });
    }
  });

  // --------------------------------------------------------------------------
  // Ensure Game Starts even if Analytics Fails
  // --------------------------------------------------------------------------
  onMount(() => {
    const timeoutId = window.setTimeout(() => {
      if (!isSettled) {
        console.warn("[FeatureFlags] Timeout exceeded. Unblocking UI with current data.");
        // We force isReady to true. 
        // The game will proceed with whatever is in state.flags (Defaults or Stale Cache).
        setState("isReady", true);
        isSettled = true;
      }
    }, FETCH_TIMEOUT_MS);

    onCleanup(() => clearTimeout(timeoutId));
  });

  return (
    <FeatureFlagContext.Provider value={state}>
      <Show when={state.isReady}>
          {props.children}
      </Show>
    </FeatureFlagContext.Provider>
  );
}
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagProvider");
  }
  return context;
}