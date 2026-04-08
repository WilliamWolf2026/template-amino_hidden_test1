/**
 * Recipe Hunt — Meso Loop State Machine
 *
 * 10 states, 14 transitions. Pure — no DOM, no side effects.
 * Tracks the current meso-loop phase for the game controller.
 */

export type MesoState =
  | 'READY'
  | 'PLAYING'
  | 'TAPPING'
  | 'CORRECT'
  | 'INCORRECT'
  | 'COMBO_CHECK'
  | 'HINT_PULSE'
  | 'WON'
  | 'LOST'
  | 'SCORING';

export type MesoEvent =
  | 'timer_start'
  | 'tap_food_item'
  | 'item_matches_ingredient'
  | 'item_is_distractor'
  | 'item_removed_animation_done'
  | 'ingredients_remain'
  | 'all_ingredients_found'
  | 'penalty_applied_and_timer_gt_0'
  | 'penalty_applied_and_timer_lte_0'
  | 'no_tap_for_10_seconds'
  | 'pulse_animation_done'
  | 'timer_expired'
  | 'win_animation_done'
  | 'loss_animation_done';

interface Transition {
  from: MesoState;
  to: MesoState;
  on: MesoEvent;
}

/** All 14 transitions from the design doc. */
const TRANSITIONS: Transition[] = [
  { from: 'READY', to: 'PLAYING', on: 'timer_start' },
  { from: 'PLAYING', to: 'TAPPING', on: 'tap_food_item' },
  { from: 'TAPPING', to: 'CORRECT', on: 'item_matches_ingredient' },
  { from: 'TAPPING', to: 'INCORRECT', on: 'item_is_distractor' },
  { from: 'CORRECT', to: 'COMBO_CHECK', on: 'item_removed_animation_done' },
  { from: 'COMBO_CHECK', to: 'PLAYING', on: 'ingredients_remain' },
  { from: 'COMBO_CHECK', to: 'WON', on: 'all_ingredients_found' },
  { from: 'INCORRECT', to: 'PLAYING', on: 'penalty_applied_and_timer_gt_0' },
  { from: 'INCORRECT', to: 'LOST', on: 'penalty_applied_and_timer_lte_0' },
  { from: 'PLAYING', to: 'HINT_PULSE', on: 'no_tap_for_10_seconds' },
  { from: 'HINT_PULSE', to: 'PLAYING', on: 'pulse_animation_done' },
  { from: 'PLAYING', to: 'LOST', on: 'timer_expired' },
  { from: 'WON', to: 'SCORING', on: 'win_animation_done' },
  { from: 'LOST', to: 'SCORING', on: 'loss_animation_done' },
];

export interface MesoStateMachine {
  /** Current state. */
  state(): MesoState;
  /** Attempt a transition. Returns the new state, or the current state if invalid. */
  transition(event: MesoEvent): MesoState;
  /** Reset to READY. */
  reset(): void;
}

/**
 * Create a new meso-loop state machine starting in READY.
 */
export function createMesoStateMachine(): MesoStateMachine {
  let current: MesoState = 'READY';

  return {
    state(): MesoState {
      return current;
    },

    transition(event: MesoEvent): MesoState {
      const match = TRANSITIONS.find(
        (t) => t.from === current && t.on === event,
      );
      if (match) {
        current = match.to;
      }
      return current;
    },

    reset(): void {
      current = 'READY';
    },
  };
}
