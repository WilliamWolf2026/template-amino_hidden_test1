/**
 * City Lines Game Controller
 *
 * Factory function that sets up all citylines-specific game logic,
 * Pixi objects, event wiring, and reactive effects for the GameScreen.
 *
 * Called at component top-level so Solid.js reactive primitives work.
 * Returns init/destroy lifecycle hooks for the screen to call.
 */

import { createEffect, createSignal } from 'solid-js';
import { Application, Graphics, Container, BlurFilter, Text } from 'pixi.js';
import gsap from 'gsap';

import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { IS_DEV_ENV } from '~/scaffold/dev/env';

import { CityLinesGame, CompanionCharacter, DialogueBox, CluePopup, LevelGenerationService, ChapterGenerationService, type GeneratedChapter } from '~/game/citylines';
import { TutorialHand } from '~/game/citylines/core/TutorialHand';
import { loadSectionConfig, getClueForLevel, getChapterLength, type SectionConfig } from '~/game/citylines/types/section';
import { setAtlasName } from '~/game/citylines/utils/atlasHelper';
import { ProgressBar } from '~/game/citylines/core/ProgressBar';
import { getCountyConfig } from '~/game/citylines/data/counties';
import type { ChapterRef } from '~/game/types/gameData';
import type { LevelConfig } from '~/game/citylines/types/level';

import { getTileBundleName, type GameTuning } from '~/game/tuning';
import { GameAudioManager } from '~/game/audio/manager';
import { gameState } from '~/game/state';
import { advanceLevel, saveTileState, getTileState, clearTileState, getCurrentChapter, startChapter, completeChapter } from '~/game/services/progress';
import { getDebugParams } from '~/game/utils/debugParams';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';
import { useGameData } from '~/game/hooks/useGameData';
import { chapterRefToLevelManifest, getChapterIntroduction, getChapterByIndex } from '~/game/services/chapterLoader';
import { initCatalog, getCatalog, setCatalogIndex, hasNextChapter, fetchNextChapter, fetchChapterAtIndex, findIndexByUid } from '~/game/services/chapterCatalog';

import type { ScaffoldTuning } from '~/scaffold';

/** Controller interface returned by setupCityLinesGame */
export interface GameScreenController {
  init(container: HTMLDivElement): Promise<void>;
  destroy(): void;
  ariaText: () => string;
}

/** Modal phase for the chapter start experience */
type ModalPhase = 'introduction' | 'loading-puzzle' | 'chapter-start' | 'playing';

/** Dependencies injected from the screen component */
export interface GameScreenDeps {
  coordinator: {
    getGpuLoader: () => unknown;
    loadBundle: (name: string) => Promise<void>;
    audio: {
      setMasterVolume: (volume: number) => void;
    };
  };
  tuning: {
    game: GameTuning;
    scaffold: ScaffoldTuning;
  };
  audio: {
    volume: () => number;
    musicEnabled: () => boolean;
  };
  gameData: ReturnType<typeof useGameData>;
  analytics: Pick<
    ReturnType<typeof import('~/scaffold/systems/telemetry/AnalyticsContext').useAnalytics>,
    'trackLevelStart' | 'trackLevelComplete' | 'trackChapterStart' | 'trackChapterComplete' | 'trackLandmarkConnected'
  >;
}

export function setupCityLinesGame(deps: GameScreenDeps): GameScreenController {
  const { coordinator, tuning, audio, gameData: gameDataHook, analytics } = deps;
  const { trackLevelStart, trackLevelComplete, trackChapterStart, trackChapterComplete, trackLandmarkConnected } = analytics;

  // Store references for reactive updates
  const [pixiApp, setPixiApp] = createSignal<Application | null>(null);
  const [gameInstance, setGameInstance] = createSignal<CityLinesGame | null>(null);
  const [audioManager, setAudioManager] = createSignal<GameAudioManager | null>(null);
  const [progressBar, setProgressBar] = createSignal<ProgressBar | null>(null);
  const [sectionConfig, setSectionConfig] = createSignal<SectionConfig | null>(null);
  const [generatedChapter, setGeneratedChapter] = createSignal<GeneratedChapter | null>(null);
  let resizeHandler: (() => void) | null = null;
  let skipKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  // Modal phase for the chapter start flow
  const [modalPhase, setModalPhase] = createSignal<ModalPhase>('introduction');

  // Active chapter ref from new backend schema (if available)
  const [activeChapterRef, setActiveChapterRef] = createSignal<ChapterRef | null>(null);

  // Companion dialogue references (reused for intro, chapter start, and completion)
  let companionGroup: Container | null = null;
  let companionDialogueBox: DialogueBox | null = null;
  let companionCharacter: CompanionCharacter | null = null;
  let darkOverlay: Graphics | null = null;
  let isCompanionAnimating = false;
  let isShowingCompletionClue = false;
  let tutorialHand: TutorialHand | null = null;
  const TUTORIAL_DONE_KEY = 'game-tutorial-done';

  // Pixi-based CluePopup for levels 1-9
  let cluePopup: CluePopup | null = null;

  // Chapter label text (above progress bar)
  let chapterLabel: Text | null = null;

  // Current level
  const [currentLevel, setCurrentLevel] = createSignal(
    LevelGenerationService.generateLevel(1, tuning.game.generator)
  );

  // Analytics tracking state
  let tileRotationCount = 0;
  let landmarkConnectionOrder = 0;
  let levelStartTimestamp = Date.now();
  let chapterStartTimestamp = Date.now();

  // Accessibility
  let ariaLiveRef: HTMLDivElement | undefined;

  /** Fire trackLevelStart with full context from current chapter and level */
  const fireTrackLevelStart = (level: LevelConfig, chapterRef: ChapterRef | null, chapterIndex: number) => {
    tileRotationCount = 0;
    landmarkConnectionOrder = 0;
    levelStartTimestamp = Date.now();

    trackLevelStart({
      chapter_id: chapterRef?.uid ?? 'default',
      chapter_count: chapterIndex + 1,
      county_theme: level.county,
      level_order: level.levelNumber,
      chapter_progress: `${gameState.currentLevel()}/${gameState.totalLevels()}`,
      level_id: `${chapterRef?.uid ?? 'default'}_L${level.levelNumber}`,
      level_difficulty: level.gridSize <= 4 ? 'easy' : level.gridSize <= 5 ? 'medium' : 'hard',
      is_tutorial: level.levelNumber === 1 && chapterIndex === 0,
      level_seed: level.seed ?? 0,
      grid_size: level.gridSize,
      landmarks_count: level.landmarks.length,
      road_tiles_count: level.roadTiles.length,
      min_path_length: level.roadTiles.length,
    });
  };

  // =========================================================================
  // Reactive effects (run at component top-level)
  // =========================================================================

  // Track previous background color for comparison guard
  let prevBgColor = '';

  createEffect(() => {
    const app = pixiApp();
    if (!app) return;
    const bgColor = tuning.game.visuals.backgroundColor;
    if (bgColor === prevBgColor) return;
    prevBgColor = bgColor;
    app.renderer.background.color = bgColor;
  });

  let prevGridValues = { tileSize: -1, padding: -1, cellGap: -1 };

  createEffect(() => {
    const app = pixiApp();
    const game = gameInstance();
    if (!app || !game) return;
    const { tileSize, padding, cellGap } = tuning.game.grid;
    const tileSizeChanged = tileSize !== prevGridValues.tileSize;
    const layoutChanged = padding !== prevGridValues.padding || cellGap !== prevGridValues.cellGap;
    if (!tileSizeChanged && !layoutChanged) return;
    prevGridValues = { tileSize, padding, cellGap };
    if (layoutChanged && tileSizeChanged) {
      game.setGridLayout(padding, cellGap, false);
      game.setTileSize(tileSize);
    } else if (layoutChanged) {
      game.setGridLayout(padding, cellGap);
    } else if (tileSizeChanged) {
      game.setTileSize(tileSize);
    }
    game.x = app.screen.width / 2;
    game.y = app.screen.height / 2;
  });

  let prevNineSlice = { leftWidth: -1, topHeight: -1, rightWidth: -1, bottomHeight: -1 };

  createEffect(() => {
    const game = gameInstance();
    if (!game) return;
    const { nineSlice } = tuning.game.grid;
    const changed =
      nineSlice.leftWidth !== prevNineSlice.leftWidth ||
      nineSlice.topHeight !== prevNineSlice.topHeight ||
      nineSlice.rightWidth !== prevNineSlice.rightWidth ||
      nineSlice.bottomHeight !== prevNineSlice.bottomHeight;
    if (!changed) return;
    prevNineSlice = { ...nineSlice };
    game.setNineSlice(nineSlice);
  });

  let prevRotationConfig = { duration: -1, easing: '' };

  createEffect(() => {
    const game = gameInstance();
    if (!game) return;
    const { tileRotateDuration, tileRotateEasing } = tuning.game.grid;
    if (tileRotateDuration === prevRotationConfig.duration && tileRotateEasing === prevRotationConfig.easing) return;
    prevRotationConfig = { duration: tileRotateDuration, easing: tileRotateEasing };
    game.setRotationAnimationConfig({ duration: tileRotateDuration, easing: tileRotateEasing });
  });

  let prevVfxConfig = { alpha: -1, sizePercent: -1 };

  createEffect(() => {
    const game = gameInstance();
    if (!game) return;
    const { rotateAlpha, rotateSizePercent } = tuning.game.grid.vfx;
    if (rotateAlpha === prevVfxConfig.alpha && rotateSizePercent === prevVfxConfig.sizePercent) return;
    prevVfxConfig = { alpha: rotateAlpha, sizePercent: rotateSizePercent };
    game.setVfxConfig({ alpha: rotateAlpha, sizePercent: rotateSizePercent });
  });

  let prevCompletionPaint = { staggerDelay: -1, tileDuration: -1, blastSizePercent: -1 };

  createEffect(() => {
    const game = gameInstance();
    if (!game) return;
    const { staggerDelay, tileDuration, easing, blastSizePercent } = tuning.game.completionPaint;
    if (
      staggerDelay === prevCompletionPaint.staggerDelay &&
      tileDuration === prevCompletionPaint.tileDuration &&
      blastSizePercent === prevCompletionPaint.blastSizePercent
    ) return;
    prevCompletionPaint = { staggerDelay, tileDuration, blastSizePercent };
    game.setCompletionPaintConfig({ staggerDelay, tileDuration, easing, blastSizePercent });
  });

  createEffect(() => {
    const bar = progressBar();
    if (!bar) return;
    const { tileTheme } = tuning.game.theme;
    const game = gameInstance();
    if (!game) return;
    const countyConfig = getCountyConfig('atlantic');
    bar.setTheme(0x007eff);
  });

  createEffect(() => {
    const volume = audio.volume();
    coordinator.audio.setMasterVolume(volume);
  });

  createEffect(() => {
    const manager = audioManager();
    if (!manager) return;
    if (audio.musicEnabled()) {
      manager.startGameMusic();
    } else {
      manager.stopMusic();
    }
  });

  // Regenerate level function (exposed to window for Tweakpane)
  const regenerateLevel = () => {
    const game = gameInstance();
    const app = pixiApp();
    if (!game || !app) return;
    const newLevel = LevelGenerationService.generateLevel(currentLevel().levelNumber, tuning.game.generator);
    setCurrentLevel(newLevel);
    game.loadLevel(newLevel);
    game.autoSizeToViewport(app.screen.width, app.screen.height, tuning.game.grid.tileSize, 80, 100);
    game.x = app.screen.width / 2;
    game.y = app.screen.height / 2;
    game.playLevelTransition().catch(err => {
      console.error('[GameScreen] Level transition animation error:', err);
    });
  };

  if (typeof window !== 'undefined') {
    (window as any).regenerateLevel = regenerateLevel;
  }

  // =========================================================================
  // Lifecycle
  // =========================================================================

  return {
    ariaText: () => `Chapter progress: ${gameState.currentLevel()} of ${gameState.totalLevels()}`,

    async init(container: HTMLDivElement) {
      // Check for saved progress (mid-level resume)
      const savedProgress = getCurrentChapter();
      const savedTileState = getTileState();

      let catalogIndex = 0;

      // Load chapter from catalog (index.json), fall back to baked-in game data
      try {
        let config: SectionConfig;

        await initCatalog();
        if (savedProgress) {
          if (savedProgress.catalogIndex != null) {
            catalogIndex = savedProgress.catalogIndex;
          } else if (savedProgress.chapterId) {
            const idx = findIndexByUid(savedProgress.chapterId);
            if (idx >= 0) catalogIndex = idx;
          }
          setCatalogIndex(catalogIndex);
        }

        const fetchedData = await fetchChapterAtIndex(catalogIndex);

        if (fetchedData && fetchedData.chapters?.length > 0) {
          const chapterRef = fetchedData.chapters[0];
          setActiveChapterRef(chapterRef);
          config = chapterRefToLevelManifest(chapterRef);
          console.log('[GameScreen] Loaded chapter from catalog:', chapterRef.name);
        } else {
          const gd = gameDataHook.gameData();
          if (gd && gd.chapters?.length > 0) {
            const chapterRef = getChapterByIndex(gd, 0)!;
            setActiveChapterRef(chapterRef);
            config = chapterRefToLevelManifest(chapterRef);
            console.log('[GameScreen] Loaded chapter from fallback game data:', chapterRef.name);
          } else {
            config = await loadSectionConfig();
          }
        }

        setSectionConfig(config);

        const chapter = ChapterGenerationService.generateChapter(config, tuning.game.generator);
        setGeneratedChapter(chapter);
        gameState.setTotalLevels(chapter.chapterLength);

        let levelIndex = 0;
        if (savedProgress && savedProgress.currentLevel > 1) {
          levelIndex = Math.min(savedProgress.currentLevel - 1, chapter.chapterLength - 1);
          gameState.setCurrentLevel(savedProgress.currentLevel);
          console.log('[GameScreen] Resuming from level', savedProgress.currentLevel);
          setModalPhase('playing');
        } else {
          const chapterRef = activeChapterRef();
          if (chapterRef) {
            startChapter({
              manifestUrl: '',
              chapterId: chapterRef.uid,
              countyName: chapterRef.county.name,
              chapterLength: chapter.chapterLength,
              catalogIndex,
            });
          }
        }

        setCurrentLevel(chapter.levels[levelIndex]);
      } catch (err) {
        console.error('[Game] Failed to load section config:', err);
      }

      const gameTuning = tuning.game;

      // Create Pixi application
      const app = new Application();
      await app.init({
        background: gameTuning.visuals.backgroundColor,
        resizeTo: container,
        antialias: true,
      });
      container.appendChild(app.canvas);
      setPixiApp(app);

      const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

      // Load game tiles bundle based on theme setting
      const tileTheme = gameTuning.theme.tileTheme;
      setAtlasName(tileTheme);
      const tileBundleName = getTileBundleName(tileTheme);
      await coordinator.loadBundle(tileBundleName);

      // Load VFX bundles
      await coordinator.loadBundle('vfx-rotate');
      await coordinator.loadBundle('vfx-blast');

      // Create City Lines game
      if (gpuLoader.hasSheet(tileBundleName)) {
        // Background - fit height, maintain aspect ratio, center horizontally
        const background = gpuLoader.createSprite(tileBundleName, 'background.png');
        const scale = app.screen.height / background.texture.height;
        background.scale.set(scale);
        background.anchor.set(0.5);
        background.x = app.screen.width / 2;
        background.y = app.screen.height / 2;
        const blurFilter = new BlurFilter({ strength: 8 });
        background.filters = [blurFilter];
        app.stage.addChild(background);

        const tileSize = gameTuning.grid.tileSize;
        const game = new CityLinesGame(gpuLoader, tileSize);

        const { padding, cellGap } = gameTuning.grid;
        game.setGridLayout(padding, cellGap, false);
        game.setLevelTransitionConfig(gameTuning.levelTransition);
        game.setCompletionPaintConfig(gameTuning.completionPaint);

        const isResuming = modalPhase() === 'playing';

        if (isResuming) {
          game.loadLevel(currentLevel());
          fireTrackLevelStart(currentLevel(), activeChapterRef(), catalogIndex);
          if (savedTileState?.rotations) {
            console.log('[GameScreen] Applying saved tile rotations');
            game.setTileRotations(savedTileState.rotations);
          }
        }

        app.stage.addChild(game);

        app.ticker.addOnce(() => {
          game.autoSizeToViewport(app.screen.width, app.screen.height, tileSize, 80, 100);
          game.x = app.screen.width / 2;
          game.y = app.screen.height / 2;
        });
        setGameInstance(game);

        // Create progress bar HUD
        const countyConfig = getCountyConfig(currentLevel().county);

        chapterLabel = new Text({
          text: `${gameState.currentLevel()} / ${gameState.totalLevels()}`,
          style: {
            fontFamily: GAME_FONT_FAMILY,
            fontSize: 24,
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: { color: '#000000', width: 5 },
            dropShadow: { color: '#000000', alpha: 0.5, blur: 3, distance: 2 },
          },
        });
        chapterLabel.anchor.set(0.5);
        app.stage.addChild(chapterLabel);
        const barWidth = Math.min(320, app.screen.width - 48);
        const bar = new ProgressBar({
          width: barWidth,
          height: 36,
          fontFamily: GAME_FONT_FAMILY,
          showLabel: false,
        });
        app.stage.addChild(bar);
        setProgressBar(bar);

        // Helper: Position progress bar and label above the grid
        const positionProgressUI = () => {
          const gridPixelSize = game.getGridPixelSize();
          const gridTop = app.screen.height / 2 - gridPixelSize / 2;
          const barY = Math.max(50, gridTop - 50);
          const barWidth = Math.min(320, app.screen.width - 48);
          bar.x = (app.screen.width - barWidth) / 2;
          bar.y = barY;
          if (chapterLabel) {
            chapterLabel.x = app.screen.width / 2;
            chapterLabel.y = Math.max(20, barY - 24);
          }
        };

        const fadeOutProgressUI = () => {
          gsap.to(bar, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
          if (chapterLabel) gsap.to(chapterLabel, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
        };

        const fadeInProgressUI = () => {
          gsap.to(bar, { alpha: 1, duration: 0.3, ease: 'power2.out' });
          if (chapterLabel) gsap.to(chapterLabel, { alpha: 1, duration: 0.3, ease: 'power2.out' });
        };

        // Helper: Load next level and play transition animation
        const loadNextLevelWithTransition = async () => {
          const controller = game.getCompletionController();
          controller.continue();

          const chapter = generatedChapter();
          if (!chapter) {
            console.error('[GameScreen] No chapter generated, cannot load next level');
            return;
          }

          const nextLevelNumber = currentLevel().levelNumber + 1;
          const nextIndex = (nextLevelNumber - 1) % chapter.chapterLength;
          const newLevel = chapter.levels[nextIndex];
          newLevel.levelNumber = nextLevelNumber;

          setCurrentLevel(newLevel);
          game.loadLevel(newLevel);
          fireTrackLevelStart(newLevel, activeChapterRef(), catalogIndex);

          game.autoSizeToViewport(app.screen.width, app.screen.height, gameTuning.grid.tileSize, 80, 100);
          game.x = app.screen.width / 2;
          game.y = app.screen.height / 2;
          positionProgressUI();

          try {
            await game.playLevelTransition();
            const current = gameState.currentLevel();
            const total = gameState.totalLevels();
            bar.setProgress(current, total);
            if (chapterLabel) chapterLabel.text = `${current} / ${total}`;
            if (ariaLiveRef) ariaLiveRef.textContent = `Chapter progress: ${current} of ${total}`;
          } catch (err) {
            console.error('[GameScreen] Level transition animation error:', err);
          }
        };

        positionProgressUI();

        // Create CluePopup for levels 1-9
        cluePopup = new CluePopup(gpuLoader);
        app.stage.addChild(cluePopup);

        // Debug support
        const debugParams = getDebugParams();
        if (debugParams.debugLevel !== undefined) {
          gameState.setCurrentLevel(debugParams.debugLevel);
          bar.setProgress(debugParams.debugLevel, 10, false);
        } else {
          bar.setProgress(gameState.currentLevel(), gameState.totalLevels(), false);
        }
        if (debugParams.debugProgressAnim) {
          bar.playFillAnimation();
        }

        // Update bar animation on every frame
        app.ticker.add(() => {
          bar.update();
        });

        // Create audio manager
        const manager = new GameAudioManager(coordinator.audio);
        setAudioManager(manager);

        // Wire game events to audio
        game.onGameEvent('tileRotated', () => {
          manager.playTileRotate();
          if (tutorialHand) {
            tutorialHand.hide();
            tutorialHand = null;
            localStorage.setItem(TUTORIAL_DONE_KEY, '1');
          }
          if (audio.musicEnabled() && !manager.isMusicPlaying()) {
            manager.startGameMusic();
          }
          const rotations = game.getTileRotations();
          const level = currentLevel();
          saveTileState(rotations, level.levelNumber);
          tileRotationCount++;
        });

        game.onGameEvent('levelComplete', (payload) => {
          manager.playLevelComplete();
          trackLevelComplete({
            moves_used: payload.moves,
            optimal_moves: currentLevel().roadTiles.length,
            time_spent: parseFloat((payload.durationMs / 1000).toFixed(2)),
            total_rotations: tileRotationCount,
          });
          clearTileState();
          advanceLevel();
          gameState.incrementLevel();
        });

        game.onGameEvent('landmarkConnected', (landmark) => {
          landmarkConnectionOrder++;
          const totalLandmarks = game.getTotalLandmarkCount();
          const connectedCount = game.getConnectedCount();
          const elapsedSeconds = parseFloat(((Date.now() - levelStartTimestamp) / 1000).toFixed(2));
          trackLandmarkConnected({
            landmark_id: landmark.type,
            landmark_type: landmark.type === 'house' || landmark.type === 'gas_station' || landmark.type === 'diner' || landmark.type === 'market' || landmark.type === 'school' ? 'common' : 'county_specific',
            connection_order: landmarkConnectionOrder,
            time_to_connect_seconds: elapsedSeconds,
            landmarks_remaining: totalLandmarks - connectedCount,
          });
        });

        // Wire completion events
        game.onGameEvent('completionStart', (_levelClue, levelNumber) => {
          const chapter = generatedChapter();
          const chapterLength = chapter?.chapterLength ?? 10;
          const isChapterEnd = levelNumber % chapterLength === 0;
          const config = sectionConfig();
          const storyClue = config ? getClueForLevel(config, levelNumber) : null;
          const clueText = storyClue ?? _levelClue;

          manager.playNewsReveal();

          if (isChapterEnd) {
            const displayText = config?.story.completion ?? clueText ?? 'Great work!';
            isShowingCompletionClue = true;
            showCompanion(displayText, gameTuning.companion.overlayAlpha);
          } else {
            if (cluePopup) {
              manager.playDogPant();
              fadeOutProgressUI();
              const gridPixelSize = game.getGridPixelSize();
              const gridTop = app.screen.height / 2 - gridPixelSize / 2;
              cluePopup.show(
                clueText,
                app.screen.width,
                gridTop,
                gameTuning.cluePopup.displayDuration,
                () => {
                  fadeInProgressUI();
                  loadNextLevelWithTransition();
                }
              );
            }
          }
        });

        // Create companion dialogue group
        companionGroup = new Container();
        companionGroup.label = 'companion-dialogue-group';

        companionDialogueBox = new DialogueBox(gpuLoader, app.screen.width, app.screen.height, 2.5);

        const config = sectionConfig();
        const chapterRef = activeChapterRef();
        const introText = chapterRef
          ? getChapterIntroduction(chapterRef)
          : (config?.story.summary ?? "Hi there, let's solve some tile puzzles to uncover a local news story!");
        companionDialogueBox.setText(introText);
        companionDialogueBox.alpha = 1;

        companionDialogueBox.x = 0;
        companionDialogueBox.y = 0;
        companionGroup.addChild(companionDialogueBox);

        companionCharacter = new CompanionCharacter('news_hound', gpuLoader, 'full');
        companionCharacter.alpha = 1;

        const charWidth = 222 * 0.8;
        const charHeight = 243 * 0.8;

        const dialogueBoxLeftEdge = -(companionDialogueBox.getWidth() / 2);
        companionCharacter.x = dialogueBoxLeftEdge + (charWidth / 2);
        companionCharacter.y = -(charHeight * 0.25);

        companionGroup.addChildAt(companionCharacter, 0);

        const groupTop = companionCharacter.y - (charHeight / 2);
        const groupBottom = companionDialogueBox.getHeight();
        const groupVerticalCenter = (groupTop + groupBottom) / 2;

        companionGroup.x = app.screen.width / 2;
        companionGroup.y = app.screen.height / 2 - groupVerticalCenter;

        const companionConfig = gameTuning.companion;

        // -- Helper: Slide companion in --
        const showCompanion = (text: string, overlayAlpha: number) => {
          if (!companionDialogueBox || !companionGroup || !darkOverlay) return;

          companionDialogueBox.setText(text);
          companionGroup.visible = true;
          companionGroup.x = app.screen.width + 400;
          companionGroup.alpha = 1;

          isCompanionAnimating = true;

          setTimeout(() => {
            gsap.to(darkOverlay, {
              alpha: overlayAlpha,
              duration: companionConfig.overlayFadeInDuration / 1000,
              ease: 'power2.out',
            });

            const gt = companionCharacter!.y - (charHeight / 2);
            const gb = companionDialogueBox!.getHeight();
            const gvc = (gt + gb) / 2;

            gsap.to(companionGroup, {
              x: app.screen.width / 2,
              y: app.screen.height / 2 - gvc,
              duration: companionConfig.slideInDuration / 1000,
              ease: companionConfig.slideInEasing,
              delay: 0.2,
              onComplete: () => {
                isCompanionAnimating = false;
                if (darkOverlay) {
                  darkOverlay.eventMode = 'static';
                }
                manager.playDogBark();
              },
            });
          }, companionConfig.slideInDelay);
        };

        // -- Helper: Slide companion out --
        const hideCompanion = (): Promise<void> => {
          return new Promise((resolve) => {
            if (!companionGroup || !darkOverlay) {
              resolve();
              return;
            }

            isCompanionAnimating = true;
            darkOverlay.eventMode = 'none';

            let slideOutDone = false;
            let overlayDone = false;

            const checkDone = () => {
              if (slideOutDone && overlayDone) {
                if (companionGroup) companionGroup.visible = false;
                isCompanionAnimating = false;
                resolve();
              }
            };

            gsap.to(companionGroup, {
              x: -400,
              alpha: 0,
              duration: companionConfig.slideOutDuration / 1000,
              ease: companionConfig.slideOutEasing,
              onComplete: () => { slideOutDone = true; checkDone(); },
            });

            gsap.to(darkOverlay, {
              alpha: 0,
              duration: companionConfig.overlayFadeOutDuration / 1000,
              ease: 'power2.in',
              onComplete: () => { overlayDone = true; checkDone(); },
            });
          });
        };

        // Dark overlay
        darkOverlay = new Graphics();
        darkOverlay.rect(0, 0, app.screen.width, app.screen.height);
        darkOverlay.fill({ color: 0x000000, alpha: 1.0 });
        darkOverlay.alpha = 0;
        darkOverlay.eventMode = 'none';
        darkOverlay.cursor = 'pointer';
        darkOverlay.on('pointertap', async () => {
          if (isCompanionAnimating || !darkOverlay) return;

          const phase = modalPhase();

          if (phase === 'introduction') {
            isCompanionAnimating = true;
            setModalPhase('loading-puzzle');

            const currentConfig = sectionConfig();
            const chapterStartText = currentConfig?.story.summary ?? "Let's begin!";

            const TEXT_FADE_OUT = 0.2;
            const BOX_FADE_OUT = 0.2;
            const DELAY_BEFORE_LEVEL = 0.4;
            const DELAY_BEFORE_BOX_IN = 0.6;
            const BOX_FADE_IN = 0.3;
            const TEXT_FADE_IN = 0.3;
            const DELAY_CHAR_SWAP = 0.3;

            const boxSprite = companionDialogueBox!.children[0];
            const textField = companionDialogueBox!.children[1];

            const textSwap = new Promise<void>((resolve) => {
              const tl = gsap.timeline({ onComplete: resolve });

              tl.to(textField, { alpha: 0, duration: TEXT_FADE_OUT, ease: 'power2.in' });
              tl.to(boxSprite, { alpha: 0, duration: BOX_FADE_OUT, ease: 'power2.in' });

              tl.call(() => {
                game.loadLevel(currentLevel());
                fireTrackLevelStart(currentLevel(), activeChapterRef(), catalogIndex);

                chapterStartTimestamp = Date.now();
                const chRef = activeChapterRef();
                if (chRef) {
                  trackChapterStart({
                    chapter_id: chRef.uid,
                    chapter_count: catalogIndex + 1,
                    county_theme: currentLevel().county,
                    is_tutorial: catalogIndex === 0,
                    chapter_size: generatedChapter()?.chapterLength ?? 10,
                    story_id: chRef.story.uid,
                    story_headline: chRef.story.headline,
                  });
                }

                game.autoSizeToViewport(app.screen.width, app.screen.height, gameTuning.grid.tileSize, 80, 100);
                game.x = app.screen.width / 2;
                game.y = app.screen.height / 2;
                positionProgressUI();

                game.playLevelTransition().catch((err) => {
                  console.error('[GameScreen] Level transition animation error:', err);
                });

                companionDialogueBox!.setText(chapterStartText);
              }, undefined, `+=${DELAY_BEFORE_LEVEL}`);

              tl.call(() => {
                companionCharacter!.setCharacterType('paper_kid');
              }, undefined, `+=${DELAY_CHAR_SWAP}`);

              tl.to(boxSprite, { alpha: 1, duration: BOX_FADE_IN, ease: 'power2.out', delay: DELAY_BEFORE_BOX_IN });
              tl.to(textField, { alpha: 1, duration: TEXT_FADE_IN, ease: 'power2.out' });
            });

            await textSwap;
            setModalPhase('chapter-start');
            isCompanionAnimating = false;

          } else if (phase === 'chapter-start') {
            await hideCompanion();
            setModalPhase('playing');

            if (
              currentLevel().levelNumber === 1 &&
              !localStorage.getItem(TUTORIAL_DONE_KEY) &&
              game.getFirstTilePosition()
            ) {
              const pos = game.getFirstTilePosition()!;
              tutorialHand = new TutorialHand(gpuLoader, gameTuning.tutorialHand);
              game.addChild(tutorialHand);
              tutorialHand.show(pos.x, pos.y);
            }

          } else if (isShowingCompletionClue) {
            isCompanionAnimating = true;
            darkOverlay!.eventMode = 'none';
            await new Promise<void>((resolve) => {
              gsap.to(companionGroup!, {
                x: -400,
                alpha: 0,
                duration: companionConfig.slideOutDuration / 1000,
                ease: companionConfig.slideOutEasing,
                onComplete: () => {
                  companionGroup!.visible = false;
                  isCompanionAnimating = false;
                  resolve();
                },
              });
            });

            isShowingCompletionClue = false;

            const completingChapterRef = activeChapterRef();
            if (completingChapterRef) {
              trackChapterComplete({
                chapter_id: completingChapterRef.uid,
                time_spent: parseFloat(((Date.now() - chapterStartTimestamp) / 1000).toFixed(2)),
                is_tutorial: catalogIndex === 0,
              });
            }
            completeChapter();

            if (hasNextChapter()) {
              const nextData = await fetchNextChapter();
              if (nextData && nextData.chapters?.length > 0) {
                const nextChapterRef = nextData.chapters[0];
                const nextConfig = chapterRefToLevelManifest(nextChapterRef);
                const nextChapter = ChapterGenerationService.generateChapter(nextConfig, gameTuning.generator);

                setActiveChapterRef(nextChapterRef);
                setSectionConfig(nextConfig);
                setGeneratedChapter(nextChapter);
                setCurrentLevel(nextChapter.levels[0]);

                gameState.setCurrentLevel(1);
                gameState.setTotalLevels(nextChapter.chapterLength);

                const cat = getCatalog();
                startChapter({
                  manifestUrl: '',
                  chapterId: nextChapterRef.uid,
                  countyName: nextChapterRef.county.name,
                  chapterLength: nextChapter.chapterLength,
                  catalogIndex: cat?.currentIndex ?? 0,
                });

                bar.setProgress(1, nextChapter.chapterLength, false);
                if (chapterLabel) chapterLabel.text = `1 / ${nextChapter.chapterLength}`;

                catalogIndex = cat?.currentIndex ?? 0;

                chapterStartTimestamp = Date.now();
                trackChapterStart({
                  chapter_id: nextChapterRef.uid,
                  chapter_count: catalogIndex + 1,
                  county_theme: nextChapterRef.county.name,
                  is_tutorial: false,
                  chapter_size: nextChapter.chapterLength,
                  story_id: nextChapterRef.story.uid,
                  story_headline: nextChapterRef.story.headline,
                });

                game.loadLevel(nextChapter.levels[0]);
                fireTrackLevelStart(nextChapter.levels[0], nextChapterRef, catalogIndex);
                game.autoSizeToViewport(app.screen.width, app.screen.height, gameTuning.grid.tileSize, 80, 100);
                game.x = app.screen.width / 2;
                game.y = app.screen.height / 2;
                positionProgressUI();
                game.playLevelTransition().catch((err) => {
                  console.error('[GameScreen] Level transition animation error:', err);
                });

                const chapterStartText = nextConfig.story.summary || "Let's begin!";
                setModalPhase('chapter-start');
                showCompanion(chapterStartText, companionConfig.overlayAlpha);

                console.log('[GameScreen] Started next chapter:', nextChapterRef.name);
              } else {
                loadNextLevelWithTransition();
              }
            } else {
              showCompanion(
                "Amazing work! You've completed all available dispatches. Check back soon for new deliveries!",
                companionConfig.overlayAlpha
              );
            }

          } else {
            await hideCompanion();
          }
        });
        app.stage.addChild(darkOverlay);

        companionGroup.x = app.screen.width + 400;
        companionGroup.y = app.screen.height / 2 - groupVerticalCenter;
        companionGroup.alpha = 1;
        app.stage.addChild(companionGroup);

        if (modalPhase() === 'introduction') {
          showCompanion(introText, companionConfig.overlayAlpha);
        } else {
          companionGroup.visible = false;
        }

        // Resize handler
        resizeHandler = () => {
          game.autoSizeToViewport(app.screen.width, app.screen.height, gameTuning.grid.tileSize, 80, 100);
          game.x = app.screen.width / 2;
          game.y = app.screen.height / 2;
          positionProgressUI();

          if (darkOverlay) {
            const currentAlpha = darkOverlay.alpha;
            darkOverlay.clear();
            darkOverlay.rect(0, 0, app.screen.width, app.screen.height);
            darkOverlay.fill({ color: 0x000000, alpha: 1.0 });
            darkOverlay.alpha = currentAlpha;
          }

          if (companionDialogueBox && companionCharacter) {
            companionDialogueBox.resize(app.screen.width, app.screen.height);
            const dialogueBoxLeftEdge = -(companionDialogueBox.getWidth() / 2);
            companionCharacter.x = dialogueBoxLeftEdge + (charWidth / 2);
            companionCharacter.y = -companionDialogueBox.getHeight() - (charHeight * 0.25);

            const groupTop = companionCharacter.y - (charHeight / 2);
            const groupBottom = 0;
            const groupVerticalCenter = (groupTop + groupBottom) / 2;

            if (companionGroup && companionGroup.visible) {
              companionGroup.x = app.screen.width / 2;
              companionGroup.y = app.screen.height / 2 - groupVerticalCenter;
            }
          }
        };

        window.addEventListener('resize', resizeHandler);

        // Dev only: 'S' key skips the current level
        if (IS_DEV_ENV) {
          const devSkipLevel = () => {
            const controller = game.getCompletionController();
            if (controller.state !== 'playing') {
              controller.reset();
            }
            clearTileState();
            advanceLevel();
            gameState.incrementLevel();
            bar.setProgress(gameState.currentLevel(), gameState.totalLevels());
            loadNextLevelWithTransition();
          };
          (window as any).skipLevel = devSkipLevel;
          skipKeyHandler = (e: KeyboardEvent) => {
            if (e.key === 's' || e.key === 'S') {
              e.preventDefault();
              console.log('[Dev] Skipping to next level');
              devSkipLevel();
            }
          };
          window.addEventListener('keydown', skipKeyHandler);
        }

        console.log('[Game] Started');
      }
    },

    destroy() {
      const app = pixiApp();
      if (app) {
        app.ticker.stop();
      }
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (skipKeyHandler) {
        window.removeEventListener('keydown', skipKeyHandler);
      }
    },
  };
}
