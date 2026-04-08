# 02 — Game Loops: Recipe Hunt

## Section A: Meso Loop

```json
{
  "meso_loop": {
    "core_verb": "tap",
    "level_structure": {
      "ki": "Recipe card slides in showing required ingredients. Play area populates with scattered food items from seeded layout. Timer starts. Player scans the field and recipe card.",
      "sho": "Easy ingredients found first. Remaining items hide among look-alikes and dense clutter. Combo window pressures faster tapping. Timer ticks down.",
      "ten": "Last 1-2 ingredients buried in distractors. Timer under 10 seconds triggers ticking sound. One wrong tap could end the run. Combo multiplier is high — stakes peak.",
      "ketsu": "All ingredients found or timer expires. Score tallied with accuracy, combo, and time breakdown. Recipe dish illustration revealed on win. Share prompt offered."
    },
    "state_machine": {
      "states": ["READY", "PLAYING", "TAPPING", "CORRECT", "INCORRECT", "COMBO_CHECK", "HINT_PULSE", "WON", "LOST", "SCORING"],
      "transitions": [
        {"from": "READY", "to": "PLAYING", "on": "timer_start"},
        {"from": "PLAYING", "to": "TAPPING", "on": "tap_food_item"},
        {"from": "TAPPING", "to": "CORRECT", "on": "item_matches_ingredient"},
        {"from": "TAPPING", "to": "INCORRECT", "on": "item_is_distractor"},
        {"from": "CORRECT", "to": "COMBO_CHECK", "on": "item_removed_animation_done"},
        {"from": "COMBO_CHECK", "to": "PLAYING", "on": "ingredients_remain"},
        {"from": "COMBO_CHECK", "to": "WON", "on": "all_ingredients_found"},
        {"from": "INCORRECT", "to": "PLAYING", "on": "penalty_applied_and_timer_gt_0"},
        {"from": "INCORRECT", "to": "LOST", "on": "penalty_applied_and_timer_lte_0"},
        {"from": "PLAYING", "to": "HINT_PULSE", "on": "no_tap_for_10_seconds"},
        {"from": "HINT_PULSE", "to": "PLAYING", "on": "pulse_animation_done"},
        {"from": "PLAYING", "to": "LOST", "on": "timer_expired"},
        {"from": "WON", "to": "SCORING", "on": "win_animation_done"},
        {"from": "LOST", "to": "SCORING", "on": "loss_animation_done"}
      ],
      "max_states": 12,
      "max_transitions": 30
    },
    "scoring_rules": {
      "formula": "base = (ingredients_found * 100) + (time_remaining_seconds * 10). final_score = floor(base * accuracy_mult * combo_mult * speed_mult).",
      "components": ["ingredients_found", "time_remaining_seconds", "accuracy_ratio", "max_combo_streak", "completion_speed"],
      "multiplier_cascade": "accuracy_mult = 1.0 + (0.5 * (correct_taps / total_taps)). combo_mult = 1.0 + (0.1 * max_combo_streak). speed_mult = 1.3 if completed under half time limit, else 1.0. All multiply together: accuracy_mult * combo_mult * speed_mult.",
      "deterministic": true,
      "tie_breaking": "Higher accuracy_ratio wins. If still tied, fewer total taps wins."
    },
    "challenge_curve": {
      "sample_levels": 3,
      "difficulty_progression": "Level 1 (Ki): 3 ingredients, 20 distractors, 45s timer — teaches tap-to-find and recipe card reading. Level 8 (Sho): 5 ingredients, 35 distractors with mild look-alikes (tomato vs cherry tomato), 40s timer — tests scanning speed and accuracy. Level 25 (Ten): 8 ingredients, 55 distractors with strong look-alikes (red onion among white onions, lemon among limes), 30s timer — demands systematic scanning and combo mastery."
    },
    "social_artifact_contract": {
      "type": "certify",
      "format": "event_receipt",
      "spoils_answer": false,
      "curiosity_hook_template": "Recipe Hunt Lv.{level} — {dish_name} completed! {accuracy}% accuracy, x{max_combo} combo streak. Can you find all the ingredients faster?"
    }
  }
}
```

## Section B: Level Generation

```json
{
  "level_gen": {
    "archetype": "pattern_decoder_v1",
    "strategy": "forward_construction",
    "solver": "set_intersection_check",
    "solver_description": "Build level by selecting N required ingredients from the catalog, then filling the play area with distractors chosen from non-overlapping categories. Verify solvability: required_set is a strict subset of all_items_on_field, and every required item appears exactly once. Distractor set and required set have zero intersection.",
    "validated_levels": [
      {
        "level_id": "level_001",
        "solvable": true,
        "proof_method": "set_intersection_check",
        "proof_summary": "3 required ingredients placed among 20 distractors. Union = 23 items. Intersection of required and distractor sets = 0. All 3 required items present on field. Solvable by tapping all 3 within 45s."
      },
      {
        "level_id": "level_008",
        "solvable": true,
        "proof_method": "set_intersection_check",
        "proof_summary": "5 required ingredients among 35 distractors including 2 look-alike pairs. Each required item has unique item_id distinct from look-alike distractor_ids. Intersection = 0. Solvable by tapping all 5 within 40s."
      },
      {
        "level_id": "level_025",
        "solvable": true,
        "proof_method": "set_intersection_check",
        "proof_summary": "8 required ingredients among 55 distractors with 4 look-alike groups. All required item_ids unique and present on field. Intersection = 0. Greedy scan-bot finds all 8 in 22s average, well within 30s limit."
      }
    ],
    "generation_contract": {
      "strategy": "forward_construction",
      "solver": "set_intersection_check",
      "generation_steps": [
        "1. Seed RNG with level seed",
        "2. Select recipe from recipe_database by level index",
        "3. Extract required_ingredients list from recipe",
        "4. Select distractors from ingredient_catalog excluding required set, weighted by look-alike similarity per difficulty tier",
        "5. Place all items (required + distractors) on play_area using seeded random positions with minimum spacing of 44px",
        "6. Verify: required_set ∩ distractor_set = ∅ and all required items placed on field",
        "7. Store level data: seed, recipe_id, item_positions, params"
      ],
      "constraints": {
        "ingredient_catalog_size": 80,
        "required_range": [3, 10],
        "distractor_range": [15, 60],
        "min_tap_target_size_px": 44,
        "min_item_spacing_px": 44,
        "no_duplicate_required_ids": true,
        "zero_intersection_required_distractor": true,
        "all_required_items_on_field": true
      },
      "difficulty_parameters": {
        "tier_1": {"required": 3, "distractors": 20, "timer": 45, "look_alikes": 0},
        "tier_2": {"required": 5, "distractors": 35, "timer": 40, "look_alikes": 2},
        "tier_3": {"required": 7, "distractors": 50, "timer": 35, "look_alikes": 4},
        "tier_4": {"required": 10, "distractors": 60, "timer": 30, "look_alikes": 6}
      }
    },
    "all_levels_solvable": true
  }
}
```

## Section C: Macro Loop

```json
{
  "macro_loop": {
    "progression": {
      "total_levels": 80,
      "difficulty_curve": "Tier 1 (1-5): 3 ingredients, 20 distractors, 45s. Tier 2 (6-15): 5 ingredients, 35 distractors, 40s, mild look-alikes. Tier 3 (16-30): 7 ingredients, 50 distractors, 35s, strong look-alikes. Tier 4 (31-80): 8-10 ingredients, 60 distractors, 30s, quantity matching.",
      "escalate_breathe_rhythm": "Every 4th level is a breathe level: 3 required ingredients, 15 distractors, 50s timer, no look-alikes. Levels 10, 20, 30 are milestone recipes with bonus star rewards.",
      "unlock_milestones": [
        "Level 3: unlock combo tracker display",
        "Level 6: unlock look-alike ingredients",
        "Level 10: unlock Daily Special recipe",
        "Level 16: unlock strong look-alikes and quantity matching preview",
        "Level 25: unlock cookbook collection view",
        "Level 31: unlock quantity matching (find 3 tomatoes, not just 1)"
      ],
      "mastery_arc": "Sous Chef (1-5): learn tap, recipe card, basic scanning. Line Cook (6-20): handle look-alikes, build combo streaks, manage time. Head Chef (21-50): systematic scanning under pressure, quantity matching. Master Chef (51-80): dense fields, tight timers, perfect accuracy runs.",
      "daily_session_target_minutes": 6
    },
    "scoring": {
      "base_formula": "base = (ingredients_found * 100) + (time_remaining_seconds * 10). remaining_time scores only on win.",
      "multiplier_cascade": "accuracy_mult = 1.0 + (0.5 * (correct_taps / total_taps)). combo_mult = 1.0 + (0.1 * max_combo_streak). speed_mult = 1.3 if under half time, else 1.0. level_tier_mult = tier (1-4). final = floor(base * accuracy_mult * combo_mult * speed_mult * level_tier_mult). Multiplicative stacking throughout.",
      "components": ["completion", "speed", "streak", "chain", "risk", "level_mult"],
      "deterministic": true
    },
    "bot_playability": {
      "supports_headless_bot": true,
      "terminal_state_guaranteed": true,
      "replay_fn": "replay_fn(seed, actions) -> outcome",
      "bot_policies": [
        {"name": "random", "strategy": "Tap a random food item each step until all ingredients found or timer expires."},
        {"name": "perfect_scanner", "strategy": "Match each required ingredient to its item_id on the field, tap in recipe-card order with 0.5s delay between taps. Never taps a distractor."}
      ]
    },
    "content_contract": {
      "content_source": "data-pack",
      "hot_swappable": true,
      "schema_validated": true,
      "generation_strategy": "Recipe data-packs validated against ingredient_catalog of ~80 items. Each recipe: { name, ingredients: [{ item_id, quantity, display_name }], distractors: [item_id], tier, time_limit }. New packs swap in without code changes. Layouts generated procedurally from seed."
    },
    "macro_loop_description": "80 levels across 4 chef tiers. Every 4th level breathes. Ingredients, distractors, and look-alikes scale per tier. Scoring stacks accuracy * combo * speed * tier multiplicatively. Data-pack recipes with procedural layouts. Cookbook collection fills as levels complete."
  }
}
```

## Exit Criteria

- Given state machine, should have 10 states and 14 transitions (under 12/30 limits)
- Given all state paths, should reach WON or LOST terminal state — HINT_PULSE returns to PLAYING, no dead ends
- Given scoring formula, should be deterministic: floor(base * accuracy_mult * combo_mult * speed_mult), no randomness
- Given social artifact (event_receipt with accuracy/combo stats and dish name), should NOT spoil ingredient positions
- Given 3 sample levels (1, 8, 25), should follow Ki (3 ingredients, 45s) -> Sho (5 ingredients, look-alikes, 40s) -> Ten (8 ingredients, strong look-alikes, 30s)
- Given archetype pattern_decoder_v1, should use forward_construction strategy with set_intersection_check solver
- Given sample levels, each validated solvable with zero intersection between required and distractor sets
- Given seed + parameters, should produce same level deterministically via seeded RNG + recipe_id
- Given progression, should escalate difficulty with breathe level every 4th level (3 ingredients, 15 distractors, 50s, no look-alikes)
- Given scoring, should use multiplicative stacking: accuracy_mult * combo_mult * speed_mult * level_tier_mult
- Given bot policies, should have 2: random (baseline) + perfect_scanner (strategic)
- Given replay function, replay_fn(seed, actions) produces deterministic outcome
- Given macro loop description, should be 289 characters (under 400 limit)
