import { onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { Application, Graphics, Container, BlurFilter, Text } from 'pixi.js';
import gsap from 'gsap';

import { useAssets } from '~/scaffold/systems/assets';
import { PauseOverlay, useTuning, type ScaffoldTuning } from '~/scaffold';
import { Logo } from '~/scaffold/ui/Logo';
import { useAudio } from '~/scaffold/systems/audio';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { CityLinesGame, CompanionCharacter, DialogueBox, CluePopup, LevelGenerationService, ChapterGenerationService, type GeneratedChapter } from '~/game/citylines';
import { getTileBundleName, type CityLinesTuning } from '~/game/tuning';
import { loadSectionConfig, getClueForLevel, getChapterLength, type SectionConfig } from '~/game/citylines/types/section';
import { setAtlasName } from '~/game/citylines/utils/atlasHelper';
import { GameAudioManager } from '~/game/audio/manager';
import { ProgressBar } from '~/game/citylines/core/ProgressBar';
import { getCountyConfig } from '~/game/citylines/data/counties';
import { gameState } from '~/game/state';
import { advanceLevel, saveTileState, getTileState, clearTileState, getCurrentChapter, startChapter, completeChapter } from '~/game/services/progress';
import { getDebugParams } from '~/game/utils/debugParams';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';
import { useGameData } from '~/game/hooks/useGameData';
import { chapterRefToLevelManifest, getChapterIntroduction, getChapterByIndex } from '~/game/services/chapterLoader';
import { initCatalog, getCatalog, setCatalogIndex, hasNextChapter, fetchNextChapter, fetchChapterAtIndex, findIndexByUid } from '~/game/services/chapterCatalog';
import type { ChapterRef } from '~/game/citylines/types/gameData';
import { useAnalytics } from '~/contexts/AnalyticsContext';
import type { LevelConfig } from '~/game/citylines/types/level';

/** Modal phase for the chapter start experience */
type ModalPhase = 'introduction' | 'loading-puzzle' | 'chapter-start' | 'playing';

export function GameScreen() {
  const { coordinator } = useAssets();
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();
  const audio = useAudio();
  const { gameData } = useGameData();
  const {
    trackLevelStart,
    trackLevelComplete,
    trackChapterStart,
    trackChapterComplete,
    trackTileRotated,
    trackLandmarkConnected,
  } = useAnalytics();
  let containerRef: HTMLDivElement | undefined;

  // Store references for reactive updates
  const [pixiApp, setPixiApp] = createSignal<Application | null>(null);
  const [gameInstance, setGameInstance] = createSignal<CityLinesGame | null>(null);
  const [audioManager, setAudioManager] = createSignal<GameAudioManager | null>(null);
  const [progressBar, setProgressBar] = createSignal<ProgressBar | null>(null);
  const [sectionConfig, setSectionConfig] = createSignal<SectionConfig | null>(null);
  const [generatedChapter, setGeneratedChapter] = createSignal<GeneratedChapter | null>(null);
  let resizeHandler: (() => void) | null = null;

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
  let isShowingCompletionClue = false; // Track if currently showing level completion (chapter end overlay)

  // Pixi-based CluePopup for levels 1-9
  let cluePopup: CluePopup | null = null;

  // Chapter label text (above progress bar)
  let chapterLabel: Text | null = null;

  // Current level (set after chapter generation in onMount)
  // Using a lazy placeholder that will be replaced immediately
  const [currentLevel, setCurrentLevel] = createSignal(
    LevelGenerationService.generateLevel(1, tuning.game.generator)
  );

  // Analytics tracking state
  let tileRotationCount = 0;
  let landmarkConnectionOrder = 0;
  let levelStartTimestamp = Date.now();

  /** Fire trackLevelStart with full context from current chapter and level */
  const fireTrackLevelStart = (level: LevelConfig, chapterRef: ChapterRef | null, chapterIndex: number) => {
    // Reset per-level counters
    tileRotationCount = 0;
    landmarkConnectionOrder = 0;
    levelStartTimestamp = Date.now();

    trackLevelStart({
      // Level config context (sets context for subsequent level events)
      chapter_id: chapterRef?.uid ?? 'default',
      chapter_count: chapterIndex + 1,
      county_theme: level.county,
      level_order: level.levelNumber,
      chapter_progress: `${gameState.currentLevel()}/${gameState.totalLevels()}`,
      level_id: `${chapterRef?.uid ?? 'default'}_L${level.levelNumber}`,
      level_difficulty: level.gridSize <= 4 ? 'easy' : level.gridSize <= 5 ? 'medium' : 'hard',
      is_tutorial: level.levelNumber === 1 && chapterIndex === 0,
      level_seed: level.seed ?? 0,
      // Level-specific payload
      grid_size: level.gridSize,
      landmarks_count: level.landmarks.length,
      road_tiles_count: level.roadTiles.length,
      min_path_length: level.roadTiles.length,
    });
  };

  // Accessibility: aria-live announcements
  let ariaLiveRef: HTMLDivElement | undefined;

  onMount(async () => {
    if (!containerRef) return;

    // Check for saved progress (mid-level resume)
    const savedProgress = getCurrentChapter();
    const savedTileState = getTileState();

    // Track which catalog index we're on (used for analytics context)
    let catalogIndex = 0;

    // Load chapter from catalog (index.json), fall back to baked-in game data
    try {
      let config: SectionConfig;

      // Initialize chapter catalog from index.json
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

      // Fetch chapter from catalog (local or CDN)
      const fetchedData = await fetchChapterAtIndex(catalogIndex);

      if (fetchedData && fetchedData.chapters?.length > 0) {
        const chapterRef = fetchedData.chapters[0];
        setActiveChapterRef(chapterRef);
        config = chapterRefToLevelManifest(chapterRef);
        console.log('[GameScreen] Loaded chapter from catalog:', chapterRef.name);
      } else {
        // Fallback: try baked-in game data
        const gd = gameData();
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

      // Generate full chapter upfront
      const chapter = ChapterGenerationService.generateChapter(config, tuning.game.generator);
      setGeneratedChapter(chapter);

      // Set total levels based on chapter length
      gameState.setTotalLevels(chapter.chapterLength);

      // Determine which level to load (resume or start fresh)
      let levelIndex = 0;
      if (savedProgress && savedProgress.currentLevel > 1) {
        // Resume from saved level (1-indexed to 0-indexed)
        levelIndex = Math.min(savedProgress.currentLevel - 1, chapter.chapterLength - 1);
        gameState.setCurrentLevel(savedProgress.currentLevel);
        console.log('[GameScreen] Resuming from level', savedProgress.currentLevel);
        // Skip intro/chapter-start modals when resuming
        setModalPhase('playing');
      } else {
        // Fresh start — persist chapter progress
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

    // Get initial tuning values
    const gameTuning = tuning.game;

    // Create Pixi application
    const app = new Application();

    await app.init({
      background: gameTuning.visuals.backgroundColor,
      resizeTo: containerRef,
      antialias: true,
    });

    // Mount canvas
    containerRef.appendChild(app.canvas);
    setPixiApp(app);

    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

    // Load game tiles bundle based on theme setting
    const tileTheme = gameTuning.theme.tileTheme;
    setAtlasName(tileTheme); // Set global atlas name for all game entities
    const tileBundleName = getTileBundleName(tileTheme);
    await coordinator.loadBundle(tileBundleName);

    // Load VFX bundles
    await coordinator.loadBundle('vfx-rotate');
    await coordinator.loadBundle('vfx-blast');

    // Create City Lines game
    if (gpuLoader.hasSheet(tileBundleName)) {
      // Add background - fit height, maintain aspect ratio, center horizontally
      const background = gpuLoader.createSprite(tileBundleName, 'background.png');
      const scale = app.screen.height / background.texture.height;
      background.scale.set(scale);
      background.anchor.set(0.5);
      background.x = app.screen.width / 2;
      background.y = app.screen.height / 2;

      // Add blur filter to background
      const blurFilter = new BlurFilter({ strength: 8 });
      background.filters = [blurFilter];

      app.stage.addChild(background);

      const tileSize = gameTuning.grid.tileSize;
      const game = new CityLinesGame(gpuLoader, tileSize);

      // Set grid layout BEFORE loading level to ensure proper initial positioning
      const { padding, cellGap } = gameTuning.grid;
      game.setGridLayout(padding, cellGap, false);

      // Configure level transition animation
      game.setLevelTransitionConfig(gameTuning.levelTransition);

      // Configure completion paint animation
      game.setCompletionPaintConfig(gameTuning.completionPaint);

      // Defer tile painting based on modal phase:
      // - 'introduction': game container visible but no tiles painted yet
      // - 'playing': immediate load (resuming saved progress)
      const isResuming = modalPhase() === 'playing';

      if (isResuming) {
        game.loadLevel(currentLevel());
        fireTrackLevelStart(currentLevel(), activeChapterRef(), catalogIndex);

        // Apply saved tile rotations if resuming mid-level
        if (savedTileState?.rotations) {
          console.log('[GameScreen] Applying saved tile rotations');
          game.setTileRotations(savedTileState.rotations);
        }
      }
      // else: game container added to stage but loadLevel() deferred until after chapter start dialogue

      // Add to stage first so it's part of the render tree
      app.stage.addChild(game);

      // Wait one frame for Pixi to finalize screen dimensions (resizeTo is async)
      app.ticker.addOnce(() => {
        // Auto-size to viewport (shrink tiles if grid is too large)
        game.autoSizeToViewport(
          app.screen.width,
          app.screen.height,
          tileSize,  // max tile size from tuning
          80,        // reserved top (progress bar area)
          100        // reserved bottom (logo area)
        );

        // Center the game on screen (pivot is at grid center, so position at screen center)
        game.x = app.screen.width / 2;
        game.y = app.screen.height / 2;
      });
      setGameInstance(game);

      // Create progress bar HUD
      const countyConfig = getCountyConfig(currentLevel().county);

      // Create progress label text (positioned above progress bar)
      chapterLabel = new Text({
        text: `${gameState.currentLevel()} / ${gameState.totalLevels()}`,
        style: {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: '#000000', width: 5 },
          dropShadow: {
            color: '#000000',
            alpha: 0.5,
            blur: 3,
            distance: 2,
          },
        },
      });
      chapterLabel.anchor.set(0.5);
      app.stage.addChild(chapterLabel);
      const barWidth = Math.min(320, app.screen.width - 48);
      const bar = new ProgressBar(gpuLoader, tileBundleName, {
        width: barWidth,
        height: 36,
        themeColor: countyConfig?.themeColor,
        tileTheme: tileTheme,
        showLabel: false, // Label is shown above the bar instead
      });
      app.stage.addChild(bar);
      setProgressBar(bar);

      // Helper: Position progress bar and label above the grid
      const positionProgressUI = () => {
        const gridPixelSize = game.getGridPixelSize();
        const gridTop = app.screen.height / 2 - gridPixelSize / 2;
        // Ensure bar stays on screen with minimum top margin
        const barY = Math.max(50, gridTop - 50);
        const barWidth = Math.min(320, app.screen.width - 48);
        bar.x = (app.screen.width - barWidth) / 2;
        bar.y = barY;
        if (chapterLabel) {
          chapterLabel.x = app.screen.width / 2;
          chapterLabel.y = Math.max(20, barY - 24);
        }
      };

      // Helper: Fade out progress bar and label
      const fadeOutProgressUI = () => {
        gsap.to(bar, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
        if (chapterLabel) gsap.to(chapterLabel, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
      };

      // Helper: Fade in progress bar and label
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

        // Get next level from pre-generated chapter (wraps around at chapter end)
        const nextLevelNumber = currentLevel().levelNumber + 1;
        const nextIndex = (nextLevelNumber - 1) % chapter.chapterLength;
        const newLevel = chapter.levels[nextIndex];

        // Update level number for tracking (in case of chapter wrap)
        newLevel.levelNumber = nextLevelNumber;

        setCurrentLevel(newLevel);
        game.loadLevel(newLevel);
        fireTrackLevelStart(newLevel, activeChapterRef(), catalogIndex);

        game.autoSizeToViewport(
          app.screen.width,
          app.screen.height,
          gameTuning.grid.tileSize,
          80,
          100
        );
        game.x = app.screen.width / 2;
        game.y = app.screen.height / 2;

        // Reposition progress bar above new grid size
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

      // Position progress bar and label just above the tiles
      positionProgressUI();

      // Create CluePopup for levels 1-9 (Pixi-based)
      cluePopup = new CluePopup(gpuLoader);
      app.stage.addChild(cluePopup);

      // TEMPORARY DEBUG SUPPORT - Chapter Progress Fill Bar Ticket Only
      // TODO: Remove this block once real multi-level chapter progression is implemented
      // This debug logic allows testing progress bar states via URL params:
      // - ?debugLevel=N (0-10): simulates chapter progress
      // - ?debugProgressAnim=1: triggers fill animation
      const debugParams = getDebugParams();
      if (debugParams.debugLevel !== undefined) {
        gameState.setCurrentLevel(debugParams.debugLevel);
        bar.setProgress(debugParams.debugLevel, 10, false); // No animation on initial load
      } else {
        bar.setProgress(gameState.currentLevel(), gameState.totalLevels(), false); // No animation on initial load
      }

      if (debugParams.debugProgressAnim) {
        bar.playFillAnimation();
      }
      // END TEMPORARY DEBUG SUPPORT

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

        // Start music on first tile tap if it isn't playing yet
        // (handles resume case where audio context was suspended)
        if (audio.musicEnabled() && !manager.isMusicPlaying()) {
          manager.startGameMusic();
        }

        // Save tile state to localStorage for mid-level resume
        const rotations = game.getTileRotations();
        const level = currentLevel();
        saveTileState(rotations, level.levelNumber);

        // Track tile rotation
        tileRotationCount++;
        console.log('[GameScreen] Tracking tile rotation', tileRotationCount);
        trackTileRotated({
          tile_position: { x: 0, y: 0 }, // TODO: Pass actual tile position from CityLinesGame event payload
          rotation_direction: 'clockwise',
          total_rotations_in_level: tileRotationCount,
        });
      });

      game.onGameEvent('levelComplete', (payload) => {
        manager.playLevelComplete();

        // Track level complete
        trackLevelComplete({
          moves_used: payload.moves,
          optimal_moves: currentLevel().roadTiles.length, // Approximation: one move per tile
          time_spent: parseFloat((payload.durationMs / 1000).toFixed(2)),
        });

        // Clear tile state (level is done, next level starts fresh)
        clearTileState();

        // Persist progress to localStorage
        advanceLevel();

        // Note: Progress update is deferred until after level transition completes
        // This happens in the completionStart callback after playLevelTransition()
        gameState.incrementLevel();
      });

      // Landmark connected event (no sound - too noisy during gameplay)
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

      // Wire completion events - show CluePopup for mid-chapter levels, full overlay for chapter end
      game.onGameEvent('completionStart', (_levelClue, levelNumber) => {
        const chapter = generatedChapter();
        const chapterLength = chapter?.chapterLength ?? 10;
        const isChapterEnd = levelNumber % chapterLength === 0; // Last level of chapter
        const config = sectionConfig();

        // Get clue from section config if available, otherwise fall back to level clue
        const storyClue = config ? getClueForLevel(config, levelNumber) : null;
        const clueText = storyClue ?? _levelClue;

        // Play news reveal sound
        manager.playNewsReveal();

        if (isChapterEnd) {
          // Chapter end (level 10, 20, etc.) - show full companion overlay with story reveal
          const displayText = config
            ? `${config.story.headline}\n\n${config.story.summary}`
            : clueText;
          isShowingCompletionClue = true;
          showCompanion(displayText, gameTuning.companion.overlayAlpha);
        } else {
          // Regular level (1-9) - show lightweight Pixi CluePopup
          if (cluePopup) {
            manager.playDogPant();
            fadeOutProgressUI();

            // Calculate grid top position (game is centered, pivot at grid center)
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

      // Create companion dialogue group (reused for intro, chapter start, and completion)
      companionGroup = new Container();
      companionGroup.label = 'companion-dialogue-group';

      // Create dialogue box with text (store reference for reuse)
      companionDialogueBox = new DialogueBox(gpuLoader, app.screen.width, app.screen.height, 2.5);

      // Determine intro text: use story.info from new schema, fall back to story.summary
      const config = sectionConfig();
      const chapterRef = activeChapterRef();
      const introText = chapterRef
        ? getChapterIntroduction(chapterRef)
        : (config?.story.summary ?? "Hi there, let's solve some tile puzzles to uncover a local news story!");
      companionDialogueBox.setText(introText);
      companionDialogueBox.alpha = 1; // Make visible (constructor sets to 0)

      // Position dialogue box at center of screen
      companionDialogueBox.x = 0; // Relative to group
      companionDialogueBox.y = 0;
      companionGroup.addChild(companionDialogueBox);

      // Create character - positioned relative to dialogue box (store reference for reuse)
      companionCharacter = new CompanionCharacter('news_hound', gpuLoader, 'full');
      companionCharacter.alpha = 1; // Make visible

      // Calculate character dimensions
      const charWidth = 222 * 0.8;   // 177.6px
      const charHeight = 243 * 0.8;  // 194.4px

      // Position character on left side, with 3/4 above dialogue box top edge
      const dialogueBoxLeftEdge = -(companionDialogueBox.getWidth() / 2);
      companionCharacter.x = dialogueBoxLeftEdge + (charWidth / 2); // Left edge aligned
      companionCharacter.y = -(charHeight * 0.25); // 3/4 above box top, 1/4 overlapping

      // Add character BEFORE dialogue box (behind it)
      companionGroup.addChildAt(companionCharacter, 0);

      // Calculate vertical center offset for the group
      // Character top to dialogue box bottom (box now grows downward from y=0)
      const groupTop = companionCharacter.y - (charHeight / 2);
      const groupBottom = companionDialogueBox.getHeight();
      const groupVerticalCenter = (groupTop + groupBottom) / 2;

      // Position group at center of screen, adjusted for group's vertical center
      companionGroup.x = app.screen.width / 2;
      companionGroup.y = app.screen.height / 2 - groupVerticalCenter;

      // Get companion animation settings from tuning
      const companionConfig = gameTuning.companion;

      // -- Helper: Slide companion in with text and overlay --
      const showCompanion = (text: string, overlayAlpha: number) => {
        if (!companionDialogueBox || !companionGroup || !darkOverlay) return;

        companionDialogueBox.setText(text);
        companionGroup.visible = true;
        companionGroup.x = app.screen.width + 400; // Off-screen right
        companionGroup.alpha = 1;

        isCompanionAnimating = true;

        setTimeout(() => {
          // Fade in dark overlay to specified alpha
          gsap.to(darkOverlay, {
            alpha: overlayAlpha,
            duration: companionConfig.overlayFadeInDuration / 1000,
            ease: 'power2.out',
          });

          // Recalculate group center (dialogue box height may have changed from setText)
          const gt = companionCharacter!.y - (charHeight / 2);
          const gb = companionDialogueBox!.getHeight();
          const gvc = (gt + gb) / 2;

          // Slide group from right
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

      // -- Helper: Slide companion out, returns promise --
      // Waits for BOTH the slide-out and overlay fade to complete before resolving.
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
              if (companionGroup) {
                companionGroup.visible = false;
              }
              isCompanionAnimating = false;
              resolve();
            }
          };

          gsap.to(companionGroup, {
            x: -400,
            alpha: 0,
            duration: companionConfig.slideOutDuration / 1000,
            ease: companionConfig.slideOutEasing,
            onComplete: () => {
              slideOutDone = true;
              checkDone();
            },
          });

          gsap.to(darkOverlay, {
            alpha: 0,
            duration: companionConfig.overlayFadeOutDuration / 1000,
            ease: 'power2.in',
            onComplete: () => {
              overlayDone = true;
              checkDone();
            },
          });
        });
      };

      // Add dark overlay (blocks clicks, positioned UNDER companion group)
      darkOverlay = new Graphics();
      darkOverlay.rect(0, 0, app.screen.width, app.screen.height);
      darkOverlay.fill({ color: 0x000000, alpha: 1.0 }); // Fill with solid black
      darkOverlay.alpha = 0; // Start transparent (animate this property)
      darkOverlay.eventMode = 'none'; // Start disabled, enable after animation completes
      darkOverlay.cursor = 'pointer';
      darkOverlay.on('pointertap', async () => {
        // Prevent clicks during animation
        if (isCompanionAnimating || !darkOverlay) return;

        const phase = modalPhase();

        if (phase === 'introduction') {
          // Companion stays on screen — staggered text swap while level loads behind
          isCompanionAnimating = true;
          setModalPhase('loading-puzzle');

          const currentConfig = sectionConfig();
          const chapterStartText = currentConfig
            ? `${currentConfig.story.headline}\n\n${currentConfig.story.summary}`
            : "Let's begin!";

          // --- Timing delays (seconds) — adjust these to taste ---
          const TEXT_FADE_OUT = 0.2;   // text fades out
          const BOX_FADE_OUT = 0.2;   // box fades out after text
          const DELAY_BEFORE_LEVEL = 0.4;   // pause before level loads
          const DELAY_BEFORE_BOX_IN = 0.6;  // pause after level starts before box fades back
          const BOX_FADE_IN = 0.3;   // box fades back in
          const TEXT_FADE_IN = 0.3;   // text fades in after box
          const DELAY_CHAR_SWAP = 0.3;   // delay after level pop-in before character swap
          // ---

          // DialogueBox children: [0] = boxSprite, [1] = textField
          const boxSprite = companionDialogueBox!.children[0];
          const textField = companionDialogueBox!.children[1];

          // Staggered fade-out/swap/fade-in with level load in the gap
          const textSwap = new Promise<void>((resolve) => {
            const tl = gsap.timeline({ onComplete: resolve });

            // 1. Fade out text first
            tl.to(textField, { alpha: 0, duration: TEXT_FADE_OUT, ease: 'power2.in' });

            // 2. Fade out box sprite
            tl.to(boxSprite, { alpha: 0, duration: BOX_FADE_OUT, ease: 'power2.in' });

            // 3. Delay, then load level behind overlay
            tl.call(() => {
              game.loadLevel(currentLevel());
              fireTrackLevelStart(currentLevel(), activeChapterRef(), catalogIndex);

              // Track chapter start
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

              game.autoSizeToViewport(
                app.screen.width,
                app.screen.height,
                gameTuning.grid.tileSize,
                80,
                100
              );
              game.x = app.screen.width / 2;
              game.y = app.screen.height / 2;
              positionProgressUI();

              game.playLevelTransition().catch((err) => {
                console.error('[GameScreen] Level transition animation error:', err);
              });

              // Swap text while box is invisible
              companionDialogueBox!.setText(chapterStartText);
            }, undefined, `+=${DELAY_BEFORE_LEVEL}`);

            // 4. After level has started, swap character with a delay
            tl.call(() => {
              companionCharacter!.setCharacterType('paper_kid');
            }, undefined, `+=${DELAY_CHAR_SWAP}`);

            // 5. Delay, then fade box sprite back in
            tl.to(boxSprite, { alpha: 1, duration: BOX_FADE_IN, ease: 'power2.out', delay: DELAY_BEFORE_BOX_IN });

            // 6. Fade text back in
            tl.to(textField, { alpha: 1, duration: TEXT_FADE_IN, ease: 'power2.out' });
          });

          await textSwap;

          setModalPhase('chapter-start');
          isCompanionAnimating = false;

        } else if (phase === 'chapter-start') {
          // Chapter start dismissed — level is already loaded, slide out and begin gameplay
          await hideCompanion();
          setModalPhase('playing');

        } else if (isShowingCompletionClue) {
          // Chapter-end completion clue dismissed — advance to next chapter
          // Slide out companion but KEEP overlay dark (level loads behind it)
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

          // Mark current chapter as complete and track
          const completingChapterRef = activeChapterRef();
          if (completingChapterRef) {
            trackChapterComplete({
              chapter_id: completingChapterRef.uid,
              score: 0, // TODO: Implement scoring system
              erasers_used: 0, // TODO: Track eraser usage
              time_spent: parseFloat(((Date.now() - levelStartTimestamp) / 1000).toFixed(2)),
              is_tutorial: catalogIndex === 0,
            });
          }
          completeChapter();

          if (hasNextChapter()) {
            // Fetch and start the next chapter
            const nextData = await fetchNextChapter();
            if (nextData && nextData.chapters?.length > 0) {
              const nextChapterRef = nextData.chapters[0];
              const nextConfig = chapterRefToLevelManifest(nextChapterRef);
              const nextChapter = ChapterGenerationService.generateChapter(nextConfig, gameTuning.generator);

              // Update all signals
              setActiveChapterRef(nextChapterRef);
              setSectionConfig(nextConfig);
              setGeneratedChapter(nextChapter);
              setCurrentLevel(nextChapter.levels[0]);

              // Reset HUD
              gameState.setCurrentLevel(1);
              gameState.setTotalLevels(nextChapter.chapterLength);

              // Persist progress for new chapter
              const cat = getCatalog();
              startChapter({
                manifestUrl: '',
                chapterId: nextChapterRef.uid,
                countyName: nextChapterRef.county.name,
                chapterLength: nextChapter.chapterLength,
                catalogIndex: cat?.currentIndex ?? 0,
              });

              // Update progress bar
              bar.setProgress(1, nextChapter.chapterLength, false);
              if (chapterLabel) chapterLabel.text = `1 / ${nextChapter.chapterLength}`;

              // Update catalog index for analytics
              catalogIndex = cat?.currentIndex ?? 0;

              // Track new chapter start
              trackChapterStart({
                chapter_id: nextChapterRef.uid,
                chapter_count: catalogIndex + 1,
                county_theme: nextChapterRef.county.name,
                is_tutorial: false,
                chapter_size: nextChapter.chapterLength,
                story_id: nextChapterRef.story.uid,
                story_headline: nextChapterRef.story.headline,
              });

              // Load the first level behind the still-dark overlay (invisible to player)
              game.loadLevel(nextChapter.levels[0]);
              fireTrackLevelStart(nextChapter.levels[0], nextChapterRef, catalogIndex);
              game.autoSizeToViewport(
                app.screen.width,
                app.screen.height,
                gameTuning.grid.tileSize,
                80,
                100
              );
              game.x = app.screen.width / 2;
              game.y = app.screen.height / 2;
              positionProgressUI();
              game.playLevelTransition().catch((err) => {
                console.error('[GameScreen] Level transition animation error:', err);
              });

              // Show chapter-start modal (overlay still dark, one tap to dismiss)
              const chapterStartText = `${nextConfig.story.headline}\n\n${nextConfig.story.summary}`;
              setModalPhase('chapter-start');
              showCompanion(chapterStartText, companionConfig.overlayAlpha);

              console.log('[GameScreen] Started next chapter:', nextChapterRef.name);
            } else {
              // Fetch failed — wrap around same chapter as fallback
              loadNextLevelWithTransition();
            }
          } else {
            // All chapters complete
            showCompanion(
              "Amazing work! You've completed all available patrols. Check back soon for new routes!",
              companionConfig.overlayAlpha
            );
          }

        } else {
          // Default dismiss (shouldn't normally reach here)
          await hideCompanion();
        }
      });
      app.stage.addChild(darkOverlay);

      // Add companion group to stage ABOVE overlay (starts off-screen right)
      companionGroup.x = app.screen.width + 400; // Off-screen right
      companionGroup.y = app.screen.height / 2 - groupVerticalCenter; // Set initial y position
      companionGroup.alpha = 1;
      app.stage.addChild(companionGroup);

      // Show companion intro (or skip if resuming)
      if (modalPhase() === 'introduction') {
        // Introduction phase: game container visible but no tiles painted yet
        showCompanion(introText, companionConfig.overlayAlpha);
      } else {
        // Resuming: companion starts hidden, no intro
        companionGroup.visible = false;
      }

      // Resize handler for responsive behavior
      resizeHandler = () => {
        // Auto-size game to new viewport dimensions
        game.autoSizeToViewport(
          app.screen.width,
          app.screen.height,
          gameTuning.grid.tileSize,  // max tile size from tuning
          80,        // reserved top (progress bar area)
          100        // reserved bottom (logo area)
        );

        // Re-center game
        game.x = app.screen.width / 2;
        game.y = app.screen.height / 2;

        // Reposition progress bar and chapter label
        positionProgressUI();

        // Update dark overlay size
        if (darkOverlay) {
          const currentAlpha = darkOverlay.alpha; // Preserve current alpha
          darkOverlay.clear();
          darkOverlay.rect(0, 0, app.screen.width, app.screen.height);
          darkOverlay.fill({ color: 0x000000, alpha: 1.0 }); // Always solid black
          darkOverlay.alpha = currentAlpha; // Restore alpha
        }

        // Update dialogue box dimensions
        if (companionDialogueBox && companionCharacter) {
          companionDialogueBox.resize(app.screen.width, app.screen.height);

          // Recalculate character position relative to new dialogue box size
          const dialogueBoxLeftEdge = -(companionDialogueBox.getWidth() / 2);
          companionCharacter.x = dialogueBoxLeftEdge + (charWidth / 2);
          companionCharacter.y = -companionDialogueBox.getHeight() - (charHeight * 0.25);

          // Recalculate vertical center offset
          const groupTop = companionCharacter.y - (charHeight / 2);
          const groupBottom = 0;
          const groupVerticalCenter = (groupTop + groupBottom) / 2;

          // Reposition group at center
          if (companionGroup && companionGroup.visible) {
            companionGroup.x = app.screen.width / 2;
            companionGroup.y = app.screen.height / 2 - groupVerticalCenter;
          }
        }
      };

      window.addEventListener('resize', resizeHandler);

      console.log('[Game] Started');
    }
  });

  // Track previous background color for comparison guard
  let prevBgColor = '';

  // Reactive: Background color changes
  createEffect(() => {
    const app = pixiApp();
    if (!app) return;

    const bgColor = tuning.game.visuals.backgroundColor;

    // Guard: Skip if unchanged
    if (bgColor === prevBgColor) return;

    prevBgColor = bgColor;
    app.renderer.background.color = bgColor;
  });

  // Track previous grid values for comparison guards
  let prevGridValues = { tileSize: -1, padding: -1, cellGap: -1 };

  // Reactive: Grid layout changes (tile size, padding, cell gap)
  // With stores, this effect only runs when grid values actually change
  createEffect(() => {
    const app = pixiApp();
    const game = gameInstance();
    if (!app || !game) return;

    const { tileSize, padding, cellGap } = tuning.game.grid;

    // Guard: Check what actually changed
    const tileSizeChanged = tileSize !== prevGridValues.tileSize;
    const layoutChanged = padding !== prevGridValues.padding || cellGap !== prevGridValues.cellGap;

    // Skip if nothing changed (can happen on initial mount)
    if (!tileSizeChanged && !layoutChanged) {
      return;
    }

    // Update previous values
    prevGridValues = { tileSize, padding, cellGap };

    // Only call the method that needs updating to avoid double updateLayout calls
    if (layoutChanged && tileSizeChanged) {
      // Both changed - call setGridLayout with animate=false, then setTileSize with animation
      // This prevents two competing animations
      game.setGridLayout(padding, cellGap, false);
      game.setTileSize(tileSize);
    } else if (layoutChanged) {
      game.setGridLayout(padding, cellGap);
    } else if (tileSizeChanged) {
      game.setTileSize(tileSize);
    }

    // Keep game at screen center (pivot is at grid center)
    game.x = app.screen.width / 2;
    game.y = app.screen.height / 2;
  });

  // Track previous 9-slice values for comparison guards
  let prevNineSlice = { leftWidth: -1, topHeight: -1, rightWidth: -1, bottomHeight: -1 };

  // Reactive: 9-slice border changes
  // With stores, this effect only runs when nineSlice values actually change
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { nineSlice } = tuning.game.grid;

    // Guard: Check if anything actually changed
    const changed =
      nineSlice.leftWidth !== prevNineSlice.leftWidth ||
      nineSlice.topHeight !== prevNineSlice.topHeight ||
      nineSlice.rightWidth !== prevNineSlice.rightWidth ||
      nineSlice.bottomHeight !== prevNineSlice.bottomHeight;

    if (!changed) return;

    prevNineSlice = { ...nineSlice };
    game.setNineSlice(nineSlice);
  });

  // Track previous rotation config for comparison guards
  let prevRotationConfig = { duration: -1, easing: '' };

  // Reactive: Rotation animation config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { tileRotateDuration, tileRotateEasing } = tuning.game.grid;

    // Guard: Skip if unchanged
    if (tileRotateDuration === prevRotationConfig.duration && tileRotateEasing === prevRotationConfig.easing) {
      return;
    }

    prevRotationConfig = { duration: tileRotateDuration, easing: tileRotateEasing };
    game.setRotationAnimationConfig({
      duration: tileRotateDuration,
      easing: tileRotateEasing,
    });
  });

  // Track previous VFX config for comparison guards
  let prevVfxConfig = { alpha: -1, sizePercent: -1 };

  // Reactive: VFX config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { rotateAlpha, rotateSizePercent } = tuning.game.grid.vfx;

    // Guard: Skip if unchanged
    if (rotateAlpha === prevVfxConfig.alpha && rotateSizePercent === prevVfxConfig.sizePercent) {
      return;
    }

    prevVfxConfig = { alpha: rotateAlpha, sizePercent: rotateSizePercent };
    game.setVfxConfig({
      alpha: rotateAlpha,
      sizePercent: rotateSizePercent,
    });
  });

  // Track previous completion paint config for comparison guards
  let prevCompletionPaint = { staggerDelay: -1, tileDuration: -1, blastSizePercent: -1 };

  // Reactive: Completion paint animation config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { staggerDelay, tileDuration, easing, blastSizePercent } = tuning.game.completionPaint;

    // Guard: Skip if unchanged
    if (
      staggerDelay === prevCompletionPaint.staggerDelay &&
      tileDuration === prevCompletionPaint.tileDuration &&
      blastSizePercent === prevCompletionPaint.blastSizePercent
    ) {
      return;
    }

    prevCompletionPaint = { staggerDelay, tileDuration, blastSizePercent };
    game.setCompletionPaintConfig({ staggerDelay, tileDuration, easing, blastSizePercent });
  });

  // Progress bar theme changes
  createEffect(() => {
    const bar = progressBar();
    if (!bar) return;

    const { tileTheme } = tuning.game.theme;
    const game = gameInstance();
    if (!game) return;

    // Get current county from level config (future: track active county)
    // For now, default to atlantic if not set
    const countyConfig = getCountyConfig('atlantic');
    bar.setTheme(countyConfig?.themeColor, tileTheme);
  });

  // Reactive: Audio volume changes
  createEffect(() => {
    const volume = audio.volume();
    coordinator.audio.setMasterVolume(volume);
  });

  // Reactive: Music enabled/disabled
  createEffect(() => {
    const manager = audioManager();
    if (!manager) return;

    if (audio.musicEnabled()) {
      manager.startGameMusic();
    } else {
      manager.stopMusic();
    }
  });

  // Function to regenerate current level with new config
  const regenerateLevel = () => {
    const game = gameInstance();
    const app = pixiApp();
    if (!game || !app) return;

    const newLevel = LevelGenerationService.generateLevel(
      currentLevel().levelNumber,
      tuning.game.generator
    );
    setCurrentLevel(newLevel);

    game.loadLevel(newLevel);

    // Auto-size to viewport (regenerated level may have different grid size)
    game.autoSizeToViewport(
      app.screen.width,
      app.screen.height,
      tuning.game.grid.tileSize,
      80,
      100
    );

    game.x = app.screen.width / 2;
    game.y = app.screen.height / 2;

    // Play level transition animation
    game.playLevelTransition().catch(err => {
      console.error('[GameScreen] Level transition animation error:', err);
    });
  };

  // Expose regenerateLevel to window for Tweakpane button
  if (typeof window !== 'undefined') {
    (window as any).regenerateLevel = regenerateLevel;
  }

  onCleanup(() => {
    const app = pixiApp();
    if (app) {
      app.ticker.stop();
    }

    // Clean up resize listener
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
  });

  return (
    <div class="fixed inset-0 bg-black">
      {/* Engine canvas container */}
      <div
        ref={containerRef}
        class="absolute inset-0"
      />

      {/* Accessibility: Screen reader announcements */}
      <div
        ref={ariaLiveRef}
        class="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        Chapter progress: {gameState.currentLevel()} of {gameState.totalLevels()}
      </div>

      {/* Pause overlay */}
      <PauseOverlay />

      {/* CluePopup is now Pixi-based, rendered in the Pixi stage */}

      {/* Wolf Games logo at bottom center */}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Logo />
      </div>

      {/* Level completion companion overlay is handled by Pixi (for chapter end only) */}
    </div>
  );
}
