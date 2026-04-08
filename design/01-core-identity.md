# 01 — Core Identity: Recipe Hunt

## Section A: LISA Program

```json
{
  "lisa_program": {
    "main_program": {
      "initialization": [
        "LOAD recipe_database and ingredient_catalog",
        "SPAWN recipe_card with ingredient_list from level_data",
        "SPAWN scattered food_items on play_area from seeded layout",
        "SET timer to level_time_limit",
        "DISPLAY recipe_card overlay and play_area"
      ],
      "subroutine_calls": [
        "handle_tap_input",
        "evaluate_ingredient_match",
        "update_recipe_checklist",
        "apply_combo_tracker",
        "check_level_completion"
      ]
    },
    "mechanical_layer": {
      "operations": [
        "INPUT tap on food_item",
        "CMP tapped_item against recipe.required_ingredients",
        "BRANCH match → KILL item from play_area, SET ingredient.found = true",
        "BRANCH mismatch → TRIG strike_penalty, MOD timer -= 3",
        "MOD combo_counter += 1 on consecutive correct taps within 2s window",
        "LOOP check_all_ingredients_found",
        "CMP timer <= 0 → BRANCH level_fail",
        "DISPLAY checkmark on recipe_card for found ingredient",
        "SOUND pop_confirm on correct, buzzer on wrong"
      ],
      "state_contract": {
        "target": "json",
        "max_size_kb": 1.5
      }
    },
    "strategic_layer": {
      "operations": [
        "TEACH recipe_card as visual shopping list — day 1 uses 3 distinct ingredients",
        "ESCALATE ingredient count 3 → 5 → 8 across first 10 levels",
        "ESCALATE distractor density 20 → 40 → 60 items on screen",
        "ESCALATE look-alike confusion: red onion among white onions, lemon among limes",
        "REWARD combo bonus for 3+ correct taps within 2s each",
        "PUNISH wrong tap with 3-second time penalty and combo reset",
        "AFFORD recipe_card always visible so player never guesses",
        "COMPRESS time pressure in later levels with shorter timers",
        "BREATHE easy palette-cleanser level every 4th level"
      ],
      "motivations": [
        "Pattern scanning satisfaction — eyes lock onto target in clutter",
        "Checklist completion drive — crossing off every ingredient",
        "Speed mastery — finishing with maximum time remaining",
        "Score chasing — perfect runs with zero misses and full combo"
      ]
    },
    "narrative_layer": {
      "operations": [
        "INVEST player in completing the recipe — unfinished checklist creates tension",
        "REVEAL recipe name and dish illustration on level complete",
        "PRIDE perfect recipe badge for zero-miss completion",
        "GROW from simple salads to complex multi-course dishes",
        "HINT ingredient silhouette pulse after 10s of no progress",
        "BOND player to cookbook collection that fills over time"
      ],
      "theme_tokens": ["kitchen", "cookbook", "chef", "market", "pantry", "fresh"]
    },
    "emergent_behaviors": [
      "Players develop spatial scanning patterns — systematic sweeps across the play area",
      "Combo chasing creates risk: tapping fast increases chance of misidentifying look-alikes",
      "Recipe familiarity lets returning players pre-scan for known ingredients before reading the full card"
    ]
  }
}
```

## Section B: Game Design Document

```json
{
  "gdd": {
    "title": "Recipe Hunt",
    "high_concept": "Tap the right ingredients from a cluttered food market to complete recipes — a visual scanning game about quick identification under time pressure.",
    "core_gameplay_loop": [
      "Read recipe card listing required ingredients and quantities",
      "Visually scan the dense play area of scattered food items",
      "Tap a food item to select it as an ingredient",
      "Correct tap: ingredient checks off recipe card with pop animation",
      "Wrong tap: 3-second time penalty, item shakes, combo resets",
      "Repeat until all ingredients found (win) or timer expires (lose)",
      "Score summary: time bonus + combo bonus + accuracy bonus"
    ],
    "system_design": {
      "scoring": {
        "base_formula": "base = (ingredients_found * 100) + (time_remaining_seconds * 10)",
        "multiplier_cascade": [
          "accuracy_multiplier: 1.0 + (0.5 * (correct_taps / total_taps))",
          "combo_multiplier: 1.0 + (0.1 * max_combo_streak)",
          "speed_multiplier: 1.0 + 0.3 if completed in under half the time limit"
        ],
        "deterministic": true
      },
      "progression": {
        "mastery_tiers": [
          "Sous Chef (levels 1-5): 3 ingredients, 20 distractors, 45s timer",
          "Line Cook (levels 6-15): 5 ingredients, 35 distractors, 40s timer, mild look-alikes",
          "Head Chef (levels 16-30): 6-8 ingredients, 50 distractors, 35s timer, strong look-alikes",
          "Master Chef (levels 31+): 8-10 ingredients, 60 distractors, 30s timer, quantity matching"
        ],
        "daily_unlocks": [
          "Daily Special: one unique recipe per day with bonus star reward",
          "Ingredient of the Day: featured ingredient in golden variant for bonus points"
        ],
        "teaching_model": "Scaffolded complexity — level 1 has only correct ingredients plus 5 obvious distractors. Each level adds 2-3 distractors and introduces one new confusion type (similar color, similar shape, similar name)."
      },
      "onboarding": {
        "day_1": "3 levels with highlight on first ingredient, recipe card tutorial, tap mechanic established",
        "day_2": "Introduce combo mechanic, first look-alike pair (tomato vs cherry tomato), time bonus explained",
        "day_3": "Introduce quantity matching (find 3 tomatoes not just 1), unlock Daily Special",
        "day_4": "Full difficulty ramp active, cookbook collection visible, score leaderboard unlocked"
      },
      "content_generation": {
        "source": "data-pack",
        "schema_validation": "Each recipe: { name, ingredients: [{ item_id, quantity, display_name }], distractors: [item_id], tier, time_limit }. Validated against ingredient_catalog of ~80 food items."
      }
    },
    "theme_and_presentation": {
      "visual_style": "Bright food emoji on warm wooden-table background. Recipe card as cream index card with handwritten-style font. Green checkmark stamp on found ingredients. Scattered organic layout, not a rigid grid.",
      "audio_style": "Upbeat kitchen ambiance loop. Crisp pop on correct tap, soft buzzer on wrong tap, sizzle on combo streak, chime on recipe complete. Ticking clock in last 10 seconds.",
      "accessibility": [
        "All food items have aria-labels with ingredient names",
        "Recipe card text minimum 16px, high contrast on cream background",
        "Wrong-tap uses both red flash and shake animation — not color alone",
        "Tap targets minimum 44x44px",
        "Optional colorblind mode adds text labels beneath food items"
      ]
    },
    "social_artifact": "Completed recipe card screenshot showing dish name, time, accuracy %, and star rating — no ingredient positions revealed so others can still play the same level."
  }
}
```

## Section C: Micro Loop (Fun Refiner)

```json
{
  "micro_loop": {
    "core_verb": "tap",
    "interaction_model": "Tap a food item on the play area. If it matches a required recipe ingredient, remove it from the field and mark it found on the recipe card. If not, apply a strike and time penalty.",
    "headless_step_fn": "step(state, { type: 'TAP', itemId }) => if recipe.required.includes(itemId) && !found.includes(itemId): { ...state, found: [...found, itemId], combo: combo+1, lastTapTime: action.time } else { ...state, strikes: strikes+1, combo: 0, timer: timer - 3 }",
    "entities": [
      { "name": "RecipeCard", "role": "target", "behavior": "Displays required ingredients and quantities. Checks off items as found. Always visible." },
      { "name": "FoodItem", "role": "target", "behavior": "Tappable element on play area. Either correct ingredient or distractor. Correct items animate out on tap. Distractors shake on wrong tap." },
      { "name": "Timer", "role": "boundary", "behavior": "Counts down from level time limit. Reduced by 3 seconds on wrong tap. Level fails at zero." },
      { "name": "ComboTracker", "role": "obstacle", "behavior": "Tracks consecutive correct taps within 2-second windows. Resets on wrong tap or timeout. Multiplies score at 3+ streak." }
    ],
    "feedback": {
      "on_success": "Food item scales up 1.2x then fades out (150ms). Recipe card ingredient gets green checkmark stamp. Combo counter bounces. Crisp pop sound.",
      "on_failure": "Food item shakes horizontally (200ms). Red flash overlay. Timer bar flashes and loses visible chunk. Soft buzzer. Combo resets with deflate animation."
    },
    "tti_seconds_target": 2,
    "gps_archetype": "pattern_decoder_v1",
    "miyamoto_test": "Tapping the correct food item among clutter triggers the recognition moment — eyes find the needle in the haystack and the finger confirms it. The pop-and-vanish feedback makes each tap feel like plucking ripe fruit. Even without scoring, visually scanning, locking on, and tapping is tactile, decisive, and immediately rewarding."
  }
}
```

## Exit Criteria

- Given the LISA program, should have opcodes from all three layers: mechanical (INPUT, CMP, BRANCH, KILL, SET, MOD, TRIG, LOOP, DISPLAY, SOUND), strategic (TEACH, ESCALATE, REWARD, PUNISH, AFFORD, COMPRESS, BREATHE), narrative (INVEST, REVEAL, PRIDE, GROW, HINT, BOND)
- Given state contract, should be under 2KB at 1.5KB max — holds recipe_id, found[] (max 10 items), strikes (int), combo (int), timer (int), score (int)
- Given the GDD, should specify: title "Recipe Hunt", core verb "tap", scoring formula "base = (ingredients_found * 100) + (time_remaining * 10)", entities RecipeCard/FoodItem/Timer/ComboTracker, progression Sous Chef/Line Cook/Head Chef/Master Chef
- Given scoring, should include base formula + 3 multiplier stages (accuracy, combo, speed), all deterministic
- Given progression, should include 4 mastery_tiers with specific level ranges and parameters, teaching model is scaffolded complexity
- Given core verb, should be exactly "tap"
- Given step function, should be pure — no render calls, no Math.random(), returns new state from (state, action)
- Given TTI target, should be 2 seconds — under the 3-second maximum
- Given GPS archetype, should be pattern_decoder_v1 — tap verb with category_set matching ingredient identification
- Given Miyamoto test, should describe visual scanning lock-on satisfaction and pop-and-vanish reward independent of scoring
- Given micro loop description, should be under 200 characters: "Scan cluttered food items, tap the ones matching your recipe card, feel the pop as each ingredient checks off" (109 characters)
- Given the output, should be at design/01-core-identity.md
