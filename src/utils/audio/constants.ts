// === AUDIO SYSTEM CONSTANTS ===

const BASE_AUDIO_PATH = '/assets/audio/';
const SFX_PATH = BASE_AUDIO_PATH + 'sfx';
const VO_PATH = BASE_AUDIO_PATH + 'vo';
const MUSIC_PATH = BASE_AUDIO_PATH + 'music';

/**
 * SFX Audio Assets Configuration
 * All paths are relative to public/ directory.
 */
export const AUDIO_ASSETS = {
  SFX: {
    // UI Sounds - Using select-option sounds for button presses and UI interactions
    BUTTON_PRESS: `${SFX_PATH}/button-press.mp3`,
    SELECT_OPTION_1: `${SFX_PATH}/select-option-1.mp3`,
    SELECT_OPTION_2: `${SFX_PATH}/select-option-2.mp3`,
    SELECT_OPTION_3: `${SFX_PATH}/select-option-3.mp3`,
    SELECT_OPTION_4: `${SFX_PATH}/select-option-4.mp3`,
    SWIPE: `${SFX_PATH}/swipe-1.mp3`,
    WHOOSH: `${SFX_PATH}/whoosh.mp3`,

    // Game Sounds - Evidence and item collection
    COLLECT_ITEM_1: `${SFX_PATH}/collect-item-1.mp3`,
    COLLECT_ITEM_2: `${SFX_PATH}/collect-item-2.mp3`,
    COLLECT_ITEM_3: `${SFX_PATH}/collect-item-3.mp3`,
    EVIDENCE_FOUND: `${SFX_PATH}/collect-item-1.mp3`, // Alias for evidence discovery
    STATIC: `${SFX_PATH}/static.mp3`,
    CAMERA: `${SFX_PATH}/camera.mp3`,
    GLITCH: `${SFX_PATH}/glitch.mp3`,

    // Notebook and Paper Interaction
    NOTEBOOK_OPEN: `${SFX_PATH}/notebookOpen.wav`,
    PAGE_TURN_1: `${SFX_PATH}/paper-page-1.mp3`,
    PAGE_TURN_2: `${SFX_PATH}/paper-page-2.mp3`,
    PAGE_TURN_3: `${SFX_PATH}/paper-page-3.mp3`,
    PAPER_SOUND: `${SFX_PATH}/paper-page-1.mp3`, // Alias for general paper sounds

    // Tool and Forensic sounds
    TOOL_OPEN: `${SFX_PATH}/toolOpen_01.wav`,
    TOOL_CLOSE: `${SFX_PATH}/toolClose_01.wav`,
    UV_LIGHT_DRAG: `${SFX_PATH}/uvLightDrag_01.wav`,
    FORENSIC_LENS_HUM: `${SFX_PATH}/forensic-lens-hum-1.mp3`,
    FORENSIC_SCAN: `${SFX_PATH}/forensic-lens-hum-1.mp3`, // Alias for forensic scanning

    // Word and Madlibs related sounds
    WORD_PICKUP: `${SFX_PATH}/wordPickup_01.wav`,
    WORD_DROP: `${SFX_PATH}/wordDrop_01.wav`,
    WORD_FLY: `${SFX_PATH}/wordFly_01.wav`,
    WORD_FOUND_1: `${SFX_PATH}/wordFound_01.wav`,
    WORD_FOUND_2: `${SFX_PATH}/wordFound_02.wav`,
    WORD_COLLECTED: `${SFX_PATH}/wordFound_01.wav`, // Alias for word collection

    // Case submission and feedback
    CASE_SUBMIT_1: `${SFX_PATH}/caseSubmit_01.wav`,
    CASE_SUBMIT_2: `${SFX_PATH}/caseSubmit_02.wav`,
    CASE_FAIL_1: `${SFX_PATH}/caseFail_1.wav`,
    CASE_FAIL_2: `${SFX_PATH}/caseFail_2.wav`,
    REPORT_SUBMIT: `${SFX_PATH}/caseSubmit_01.wav`, // Alias for report submission
    REPORT_FAIL: `${SFX_PATH}/caseFail_1.wav`, // Alias for report failure

    // Notifications and feedback
    NOTIFICATION_1: `${SFX_PATH}/notification-1.mp3`,
    NOTIFICATION_2: `${SFX_PATH}/notification-2.mp3`,
    NOTIFICATION_3: `${SFX_PATH}/notification-3.mp3`,
    NOTIFICATION_4: `${SFX_PATH}/notification-4.mp3`,
    NOTIFICATION_5: `${SFX_PATH}/notification-5.mp3`,
    INSIGHT_UNLOCKED: `${SFX_PATH}/notification-2.mp3`, // Alias for insights
    PHASE_COMPLETE: `${SFX_PATH}/notification-3.mp3`, // Alias for phase completion

    // Police/Investigation specific
    POLICE_RADIO_BEEP: `${SFX_PATH}/police-radio-beep.mp3`,
    RADIO_BEEP: `${SFX_PATH}/police-radio-beep.mp3`, // Alias for radio communications
  },

  VO: {
    // Detective Character Voice-Over Lines
    // Evidence and Collection Feedback
    ALL_EVIDENCE_COLLECTED: `${VO_PATH}/dc-all-evidence-collected-vo.mp3`,
    EVIDENCE_COLLECTED: `${VO_PATH}/dc-evidence-collected-vo.mp3`,
    GOOD_EYE_DETECTIVE: `${VO_PATH}/dc-good-eye-detective-vo.mp3`,
    GOOD_WORK: `${VO_PATH}/dc-good-work-vo.mp3`,

    // Progress and Achievement Feedback
    GETTING_THE_HANG_OF_THIS: `${VO_PATH}/dc-getting-the-hang-of-this-vo.mp3`,
    LOCATION_CLEARED: `${VO_PATH}/dc-location-cleared-vo.mp3`,
    SUSPECT_UNCOVERED: `${VO_PATH}/dc-suspect-uncovered-vo.mp3`,

    // Instructional and Guidance
    USE_FORENSIC_LENS: `${VO_PATH}/dc-use-forensic-lens-vo.mp3`,
  },

  MUSIC: {
    // Background music tracks
    MAIN_TRACK: `${MUSIC_PATH}/track_rust.mp3`,
  },
} as const;

/**
 * Audio category types for the sound system
 */
export type AudioCategory = 'SFX' | 'VO' | 'MUSIC';

/**
 * SFX sound effect keys derived from the AUDIO_ASSETS configuration
 */
export type SfxKey = keyof typeof AUDIO_ASSETS.SFX;

/**
 * VO (Voice-Over) keys derived from the AUDIO_ASSETS configuration
 */
export type VoKey = keyof typeof AUDIO_ASSETS.VO;

/**
 * Music keys derived from the AUDIO_ASSETS configuration
 */
export type MusicKey = keyof typeof AUDIO_ASSETS.MUSIC;

/**
 * localStorage keys for audio settings persistence
 * Using app_ prefix as specified in documentation
 */
export enum AUDIO_STORAGE_KEYS {
  SFX_ENABLED = 'app_sfx_enabled',
  SFX_VOLUME = 'app_sfx_volume',
  VO_ENABLED = 'app_vo_enabled',
  VO_VOLUME = 'app_vo_volume',
  AMBIENT_ENABLED = 'app_ambient_enabled',
  AMBIENT_VOLUME = 'app_ambient_volume',
  MUSIC_ENABLED = 'app_music_enabled',
  MUSIC_VOLUME = 'app_music_volume'
};

/**
 * Default audio settings following the documentation standards
 */
export const DEFAULT_AUDIO_SETTINGS: Record<AUDIO_STORAGE_KEYS, unknown> = {
  [AUDIO_STORAGE_KEYS.SFX_ENABLED]: true,
  [AUDIO_STORAGE_KEYS.SFX_VOLUME]: 0.5, // 50% volume as recommended in documentation
  [AUDIO_STORAGE_KEYS.VO_ENABLED]: true,
  [AUDIO_STORAGE_KEYS.VO_VOLUME]: 0.7, // Slightly higher volume for voice clarity
  [AUDIO_STORAGE_KEYS.AMBIENT_ENABLED]: true,
  [AUDIO_STORAGE_KEYS.AMBIENT_VOLUME]: 0.5, // 50% volume for ambient/location sounds
  [AUDIO_STORAGE_KEYS.MUSIC_ENABLED]: true,
  [AUDIO_STORAGE_KEYS.MUSIC_VOLUME]: 0.5,
} as const;

