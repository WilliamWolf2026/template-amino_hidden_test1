# 03 — Presentation: Recipe Hunt

## Section A: Visual Design

```json
{
  "visual_design": {
    "aesthetic_signature": "Glossy food items scattered on a warm butcher-block countertop, lit like a cooking-show close-up with soft overhead warmth and crisp specular pops on every tomato and pepper.",
    "target_feeling": "The tactile hunger of browsing a farmers market — everything looks fresh, grabbable, and slightly oversized.",

    "chromatic_architecture": {
      "primary": "#E85D3A (roasted tomato red)",
      "secondary": "#F5C842 (golden saffron)",
      "accent": "#4CAF50 (fresh basil green)",
      "background": "#D2A86E (warm butcher-block oak)",
      "shadow_tint": "#6B3A1F (burnt umber — hue-shifted dark, never pure black)",
      "highlight_tint": "#FFF5E1 (cream butter — hue-shifted light, never pure white)",
      "emotional_intent": "Warm, appetizing, and inviting — like stepping into a sunlit kitchen"
    },

    "lighting_model": {
      "direction": "315 (top-left)",
      "elevation": "medium",
      "warmth": "warm",
      "consistency": "ALL objects lit from 315 degrees top-left, no exceptions"
    },

    "object_rendering": {
      "recipe_per_layer": [
        "1. Base fill — flat color matching the food item's dominant hue",
        "2. Internal shadow — darker hue-shifted region on bottom-right, gives roundness to fruits/vegetables",
        "3. External shadow — soft drop shadow offset 2px bottom-right in burnt umber, grounds item on countertop",
        "4. Highlight — specular cream-butter spot on top-left quadrant, sharper on wet/glossy foods",
        "5. Edge definition — 1px darker outline with subtle rim light on top-left edge"
      ],
      "materials": [
        {
          "name": "glossy_produce",
          "used_for": "tomatoes, peppers, apples, cherries, eggplant",
          "base_treatment": "Saturated radial gradient from center outward",
          "internal_shadow": "Hue-shifted 20 degrees darker on bottom-right hemisphere",
          "external_shadow": "Soft 4px burnt-umber drop shadow, 60% opacity",
          "highlight": "Sharp elliptical specular in cream-butter, 80% opacity",
          "special_effect": "Wet-sheen shimmer on hover — highlight slides 2px toward tap point",
          "tactile_verb": "squishy"
        },
        {
          "name": "matte_grain",
          "used_for": "bread, rice, flour, oats, pasta",
          "base_treatment": "Warm beige with visible grain noise texture overlay",
          "internal_shadow": "Soft amber-brown gradient on bottom half",
          "external_shadow": "Contact shadow, 3px spread, 40% opacity",
          "highlight": "Broad diffuse cream patch, low opacity",
          "special_effect": "Subtle crumb particles on tap — 3-4 tiny dots scatter",
          "tactile_verb": "weighty"
        },
        {
          "name": "leafy_organic",
          "used_for": "lettuce, basil, spinach, herbs, celery",
          "base_treatment": "Layered greens with vein-line detail strokes",
          "internal_shadow": "Deep forest green in leaf folds and curl shadows",
          "external_shadow": "Thin contact shadow, leaves appear to rest lightly",
          "highlight": "Dewy specular dots scattered on leaf surface",
          "special_effect": "Gentle wobble on hover — leaf bounces as if breeze-touched",
          "tactile_verb": "snappy"
        },
        {
          "name": "paper_card",
          "used_for": "recipe card, score display, cookbook pages",
          "base_treatment": "Off-white (#FDF6E3) with subtle fiber texture",
          "internal_shadow": "Soft fold shadow along left edge from card curl",
          "external_shadow": "Layered drop shadow suggesting card lifted off surface",
          "highlight": "Top-left corner catch light, very subtle",
          "special_effect": "Soft fold animation on slide-in, paper settles with bounce",
          "tactile_verb": "snappy"
        }
      ]
    },

    "scene_atmosphere": {
      "backdrop": "Butcher-block wood grain — horizontal oak planks with visible knots, warm gradient darkening at edges. Subtle scratches and flour-dust speckles for lived-in kitchen feel.",
      "depth_layers": "3 layers: (1) countertop surface with wood grain, (2) scattered food items at varying slight rotations, (3) recipe card floating above with stronger drop shadow",
      "ambient_particles": "Faint flour-dust motes drifting slowly downward, warm-tinted, very sparse",
      "vignette": "true, 15% intensity — darkens corners to focus eyes on center play area",
      "sense_of_place": "Standing at a bustling kitchen counter with ingredients spread out, about to cook something wonderful."
    },

    "affordance_system": {
      "touchable_objects": "Full 5-layer rendering, brightest specular highlights, scale up 1.02x on hover, subtle bounce idle animation",
      "press_response": "Shadow shrinks from 4px to 1px, highlight shifts 1px toward center, item compresses 0.95x scale toward countertop",
      "ambient_objects": "Reduced to 3 layers (base fill, internal shadow, edge). Muted saturation at 70%. No hover or press response.",
      "hierarchy_rule": "Touchable food items are ALWAYS more dimensional and saturated than ambient countertop elements"
    },

    "typography": {"heading": "Fredoka One — rounded, friendly, bold", "body": "Nunito — clean, readable, warm", "score": "Fredoka One tabular-nums — consistent digit widths for score counter"},
    "sprite_strategy": "css_graphics",
    "layout": {
      "base_resolution": "390x844",
      "orientation": "portrait",
      "safe_areas": true,
      "scaling": "proportional"
    },
    "framework": "vanilla DOM with CSS custom properties for theming",
    "renderer": "pixi.js",
    "state_store": "single immutable state object with pure reducer — same as step_fn"
  }
}
```

## Section B: Sound Design

```json
{
  "sound_design": {
    "profile": "organic",
    "events": {
      "input_feedback": [
        {"moment": "tap_food_item", "sound_character": "soft fingertip thud on wood", "intensity": "low"},
        {"moment": "hover_food_item", "sound_character": "quiet wooden creak", "intensity": "low"}
      ],
      "verb_execution": [
        {"moment": "correct_ingredient_found", "sound_character": "crisp veggie pop with wet snap", "intensity": "medium"},
        {"moment": "wrong_item_tapped", "sound_character": "dull wooden knock, slightly flat", "intensity": "medium"}
      ],
      "reward": [
        {"moment": "combo_3_streak", "sound_character": "rising sizzle with pan hiss", "intensity": "medium"},
        {"moment": "combo_5_streak", "sound_character": "bright knife-chop flourish", "intensity": "high"},
        {"moment": "recipe_complete", "sound_character": "oven ding with warm chime chord", "intensity": "high"},
        {"moment": "perfect_recipe_badge", "sound_character": "chef kiss pop with sparkle", "intensity": "high"}
      ],
      "tension": [
        {"moment": "timer_under_10s", "sound_character": "kitchen egg-timer ticking", "intensity": "medium"},
        {"moment": "timer_under_5s", "sound_character": "faster tick with rising pitch", "intensity": "high"},
        {"moment": "last_ingredient_remaining", "sound_character": "subtle heartbeat-like pulse", "intensity": "low"}
      ],
      "failure": [
        {"moment": "wrong_tap_penalty", "sound_character": "soft buzzer with pan clang", "intensity": "medium"},
        {"moment": "combo_reset", "sound_character": "deflating whoosh downward", "intensity": "low"},
        {"moment": "timer_expired_loss", "sound_character": "oven buzzer, low disappointed tone", "intensity": "high"}
      ],
      "state_change": [
        {"moment": "level_start_recipe_slide", "sound_character": "paper card sliding on wood", "intensity": "low"},
        {"moment": "score_screen_appear", "sound_character": "cookbook page turn with soft flap", "intensity": "medium"},
        {"moment": "hint_pulse_trigger", "sound_character": "gentle shimmering bell note", "intensity": "low"}
      ]
    },
    "variations": {
      "high_frequency_sounds": "correct_ingredient_found: 5 pop variants with pitch shift. tap_food_item: 4 thud variants.",
      "medium_frequency": "wrong_tap_penalty: 3 clang variants. combo_3_streak: 2 sizzle variants.",
      "rare_sounds": "recipe_complete: 1 variant. timer_expired_loss: 1 variant."
    },
    "mix": {
      "master_volume": 0.8,
      "sfx_channel": 0.7,
      "overlap_policy": "allow"
    },
    "music_plan": {
      "has_bgm": true,
      "tracks": [
        {"name": "kitchen_groove", "loop": true, "mood": "upbeat jazzy kitchen bustle, light percussion", "priority": "required"},
        {"name": "tension_layer", "loop": true, "mood": "layered over kitchen_groove when timer < 10s, adds urgency with faster tempo", "priority": "nice-to-have"}
      ],
      "volume_percent": "25% of master"
    },
    "accessibility": {
      "mute_toggle": true,
      "playable_on_mute": true,
      "volume_control": true,
      "music_toggle_independent": true
    }
  }
}
```

## Section C: Juice

```json
{
  "juice": {
    "feedback_tiers": {
      "tier_1_subtle": {
        "moments": ["tap_any_food_item", "hover_food_item", "recipe_card_ingredient_highlight"],
        "effects": ["scale_punch(1.05x, 50ms)", "small particles(2-3 crumb dots)", "number popup(+100 on correct tap)"]
      },
      "tier_2_noticeable": {
        "moments": ["combo_3_reached", "wrong_tap_penalty", "hint_pulse_trigger", "timer_under_10s"],
        "effects": ["screen_shake(2px, 80ms)", "color_flash(red 100ms on wrong tap, gold on combo)", "freeze_frame(2 frames on combo hit)", "medium particles(6-8 sparkles on combo)"]
      },
      "tier_3_dramatic": {
        "moments": ["recipe_complete", "perfect_recipe_badge", "timer_expired_loss", "combo_5_plus"],
        "effects": ["confetti(food-emoji shaped, 40 particles, 1200ms)", "camera zoom(1.1x on recipe card, 300ms)", "slam effect(recipe stamp on perfect)", "screen_shake(4px, 150ms on loss)"]
      }
    },
    "particle_budget": {
      "max_concurrent": 50,
      "shapes": ["circle (crumb dots)", "star (combo sparkle)", "food emoji silhouettes (confetti)"],
      "colors_from_palette": true
    },
    "combo_escalation": {
      "effect_scaling": "Combo 1-2: tier 1 only. Combo 3-4: tier 2 (screen shake + gold flash). Combo 5+: tier 3 (confetti burst + freeze frame). Each tier multiplies particle count by 1.5x.",
      "pitch_shift": "Correct-tap pop pitch rises by 1 semitone per combo step, capped at +5 semitones at combo 5",
      "max_escalation_at": 5
    },
    "animation_timing_ms": {
      "scale_punch": 50,
      "color_flash": 100,
      "screen_shake": 80,
      "number_popup": 600,
      "confetti": 1200
    },
    "sound_sync": "all visual juice triggers on same frame as corresponding audio",
    "performance_target": "60fps on lowest target device"
  }
}
```

## Exit Criteria

- Given aesthetic signature, should be identifiable from a single screenshot: glossy food on butcher-block countertop with warm overhead lighting
- Given chromatic architecture, shadow_tint is #6B3A1F (burnt umber), highlight_tint is #FFF5E1 (cream butter) — no pure black or white
- Given lighting model, direction 315 degrees top-left, medium elevation, warm warmth, applied to ALL objects consistently
- Given object rendering, every game object uses all 5 layers: base fill, internal shadow, external shadow, highlight, edge definition
- Given 4 materials (glossy_produce, matte_grain, leafy_organic, paper_card), each defines base, internal shadow, external shadow, highlight, and signature physical effect
- Given scene atmosphere, backdrop is textured butcher-block wood grain with 3 depth layers and flour-dust ambient particles
- Given every ludemic moment (tap, correct find, wrong tap, combo, timer tick, recipe complete, hint pulse, level transitions), each has a mapped sound event
- Given core verb "tap", correct_ingredient_found has 5 pop variants with pitch shift
- Given reward sounds, combo escalates from sizzle at 3-streak to knife-chop flourish at 5-streak to oven ding on complete
- Given mute mode, game is fully playable — all feedback has visual equivalents (checkmarks, shakes, flashes)
- Given every player input (tap, hover), each has tier 1 subtle feedback (scale_punch 1.05x, 50ms)
- Given combo escalation, effects scale multiplicatively: particle count multiplied by 1.5x per tier, pitch rises 1 semitone per combo step
- Given sound sync, all visual juice triggers on same frame as corresponding audio
- Given juice layer, no effects modify game state — juice sits on top of logic only
- Given performance target, maintains 60fps on lowest target device with max 50 concurrent particles
- Given the output, should be at design/03-presentation.md
