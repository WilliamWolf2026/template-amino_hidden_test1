import gsap from 'gsap';
import type { CompanionCharacter } from '../ui/CompanionCharacter';
import type { DialogueBox } from '../ui/DialogueBox';

/**
 * GSAP animation timelines for companion character dialogue system
 * Follows GDD specifications:
 * - Character slides from RIGHT (not behind box)
 * - Character is STATIC (no idle animations)
 * - Dialogue box pops in before character
 */

/**
 * Slide in from right animation
 * Used for: Introduction Screen
 *
 * Sequence:
 * 1. Background darkens (0.3s)
 * 2. Dialogue box pops in with back ease (0.4s)
 * 3. Character slides from off-screen right (0.5s)
 *
 * @param character - CompanionCharacter instance (positioned at final x/y)
 * @param dialogueBox - DialogueBox instance
 * @param backgroundElement - Optional HTML element to darken
 * @returns GSAP timeline
 */
export function animateSlideInFromRight(
  character: CompanionCharacter,
  dialogueBox: DialogueBox,
  backgroundElement?: HTMLElement
): gsap.core.Timeline {
  const timeline = gsap.timeline();

  // Store final position
  const finalX = character.x;

  // Move character off-screen right before animation starts
  character.x = finalX + 300;

  // 1. Darken background (if provided)
  if (backgroundElement) {
    timeline.fromTo(
      backgroundElement,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
  }

  // 2. Dialogue box pops in (scale from 0)
  timeline.fromTo(
    dialogueBox,
    { alpha: 0, scale: { x: 0, y: 0 } },
    {
      alpha: 1,
      scale: { x: 1, y: 1 },
      duration: 0.4,
      ease: 'back.out(1.7)',
    },
    0.15 // Slight delay after background
  );

  // 3. Character slides from right
  timeline.to(
    character,
    {
      x: finalX,
      duration: 0.5,
      ease: 'power2.out',
    },
    0.4 // Overlaps with dialogue box animation
  );

  return timeline;
}

/**
 * Pop-in animation for level completion
 * Used for: Level completion (circular head mode)
 *
 * No slide animation - character and dialogue appear together
 * Character head will be masked by circular HTML overlay
 *
 * @param character - CompanionCharacter instance (head mode)
 * @param dialogueBox - DialogueBox instance
 * @returns GSAP timeline
 */
export function animateCompletionPopIn(
  character: CompanionCharacter,
  dialogueBox: DialogueBox
): gsap.core.Timeline {
  const timeline = gsap.timeline();

  // Both fade in simultaneously
  timeline.fromTo(
    [character, dialogueBox],
    { alpha: 0 },
    {
      alpha: 1,
      duration: 0.3,
      ease: 'power2.out',
    }
  );

  return timeline;
}

/**
 * Exit animation (fade out)
 * Used for: All dialogue dismissals
 *
 * Fades out character, dialogue box, and background simultaneously
 *
 * @param character - CompanionCharacter instance
 * @param dialogueBox - DialogueBox instance
 * @param backgroundElement - Optional HTML element to fade
 * @returns GSAP timeline
 */
export function animateCompanionExit(
  character: CompanionCharacter,
  dialogueBox: DialogueBox,
  backgroundElement?: HTMLElement
): gsap.core.Timeline {
  const timeline = gsap.timeline();

  // Fade out character and dialogue box
  timeline.to([character, dialogueBox], {
    alpha: 0,
    duration: 0.2,
    ease: 'power2.in',
  });

  // Fade out background (if provided)
  if (backgroundElement) {
    timeline.to(
      backgroundElement,
      {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      },
      0 // Same time as character/dialogue
    );
  }

  return timeline;
}

/**
 * Static appear animation
 * Used for: Chapter Start, Chapter End
 *
 * Character and dialogue appear instantly (no slide)
 * Quick fade in for polish
 *
 * @param character - CompanionCharacter instance
 * @param dialogueBox - DialogueBox instance
 * @param backgroundElement - Optional HTML element to darken
 * @returns GSAP timeline
 */
export function animateStaticAppear(
  character: CompanionCharacter,
  dialogueBox: DialogueBox,
  backgroundElement?: HTMLElement
): gsap.core.Timeline {
  const timeline = gsap.timeline();

  // Darken background
  if (backgroundElement) {
    timeline.fromTo(
      backgroundElement,
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: 'power2.out' }
    );
  }

  // Fade in character and dialogue together
  timeline.fromTo(
    [character, dialogueBox],
    { alpha: 0 },
    {
      alpha: 1,
      duration: 0.3,
      ease: 'power2.out',
    },
    0.1 // Slight overlap with background
  );

  return timeline;
}
