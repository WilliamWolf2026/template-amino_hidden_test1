// Re-export from shared - this controller is fully generic
export {
  createLevelCompletionController,
  playLevelCompleteSound,
  type LevelCompletionController,
  type LevelCompletionControllerConfig,
  type CompletionState,
  type CompletionEvents,
} from '~/game/shared/controllers/LevelCompletionController';
