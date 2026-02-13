import { createContext, useContext, JSX, onMount, createSignal } from "solid-js";
import { useAnalytics } from "./AnalyticsContext";
import { getEnvConfig } from "~/scaffold";
import { getUserData } from "./helper";
import { validate as isUuid } from "uuid";

export type FeatureFlags = {
  difficulty_curve_variant: string;
  county_theming_enabled: boolean;
  clue_display_time: number;
  clue_overlay_enabled: boolean;
};

const FEATURE_FLAG_DEFAULTS: FeatureFlags = {
  difficulty_curve_variant: "control",
  county_theming_enabled: false,
  clue_display_time: 5000,
  clue_overlay_enabled: false,
};

const FEATURE_FLAG_KEYS = Object.keys(FEATURE_FLAG_DEFAULTS) as (keyof FeatureFlags)[];

// Dynamic storage key based on current user
const getStorageKey = () => `citylines_ff_${getUserData().uid ?? "anon"}`;

function loadCachedFlags(): FeatureFlags {
  try {
    const cached = localStorage.getItem(getStorageKey());
    if (cached) return { ...FEATURE_FLAG_DEFAULTS, ...JSON.parse(cached) };
  } catch { /* noop */ }
  return { ...FEATURE_FLAG_DEFAULTS };
}

function saveFlagsToStorage(flags: FeatureFlags) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(flags));
  } catch { /* noop */ }
}

type FeatureFlagContextType = {
  getFeatureFlagValue: (flag: string) => boolean | string;
  getGameOverride: (articleIdentifier: string) => string | null;
  isReady: () => boolean; // Optional: expose readiness state
};

const FeatureFlagContext = createContext<FeatureFlagContextType>();

export function FeatureFlagProvider(props: { children: JSX.Element }) {
  const analytics = useAnalytics();
  const [isReady, setIsReady] = createSignal(false);
  const [cachedFlags, setCachedFlags] = createSignal(loadCachedFlags());

  const getFeatureFlagValue = (flag: string): boolean | string => {
    const ph = analytics.posthog();
    
    // Only read from PostHog if ready
    if (isReady() && ph) {
      const val = ph.getFeatureFlag(flag);
      if (val !== undefined && val !== null) return val;
    }
    
    // Fallback to cached/default
    const cached = cachedFlags();
    const known = (cached as Record<string, unknown>)[flag];
    if (typeof known === "boolean" || typeof known === "string") return known;
    return false;
  };

  const getGameOverride = (articleIdentifier: string): string | null => {
    const variant = getFeatureFlagValue(`game_override_${articleIdentifier}`);
    if (typeof variant !== "string" || variant.length === 0) return null;
    return isUuid(variant) ? variant : null;
  };

  onMount(() => {
    const posthogEnabled = getEnvConfig().posthog.enabled;

    if (!posthogEnabled) {
      setIsReady(true);
      return;
    }

    const ph = analytics.posthog();
    const timeout = setTimeout(() => setIsReady(true), 2000);

    if (ph) {
      ph.onFeatureFlags(() => {
        clearTimeout(timeout);
        
        const flags = { ...FEATURE_FLAG_DEFAULTS };
        for (const key of FEATURE_FLAG_KEYS) {
          const val = ph.getFeatureFlag(key);
          if (val !== undefined && val !== null) {
            (flags as Record<string, unknown>)[key] = val;
          }
        }
        
        saveFlagsToStorage(flags);
        setCachedFlags(flags); // Update signal for reactive reads
        setIsReady(true);
      });
    } else {
      clearTimeout(timeout);
      setIsReady(true);
    }
  });

  return (
    <FeatureFlagContext.Provider value={{ getFeatureFlagValue, getGameOverride, isReady }}>
      {props.children}
    </FeatureFlagContext.Provider>
  );
}

export const useFeatureFlag = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) throw new Error("useFeatureFlag must be used within FeatureFlagProvider");
  return context;
};
