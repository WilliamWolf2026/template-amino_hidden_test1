/**
 * Daily Dispatch Game Controller
 *
 * Factory function that sets up all game logic, Pixi objects, event wiring,
 * and reactive effects for the GameScreen.
 *
 * Called at component top-level so Solid.js reactive primitives work.
 * Returns init/destroy lifecycle hooks for the screen to call.
 */

import { createEffect, createSignal } from 'solid-js';
import { Application, Graphics, Container, Text } from 'pixi.js';
import gsap from 'gsap';

import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import type { AudioLoader } from '~/core/systems/assets/loaders/audio';
import { IS_DEV_ENV } from '~/core/dev/env';

import { DailyDispatchGame } from '~/game/dailydispatch/core/DailyDispatchGame';
import { CompanionCharacter } from '~/game/dailydispatch/ui/companion/CompanionCharacter';
import { DialogueBox } from '~/game/dailydispatch/ui/companion/DialogueBox';
import { CluePopup } from '~/game/dailydispatch/ui/CluePopup';
import { LevelCompleteOverlay } from '~/game/dailydispatch/ui/LevelCompleteOverlay';
import { TruckCloseOverlay } from '~/game/dailydispatch/ui/TruckCloseOverlay';
import { LevelPointsOverlay } from '~/game/dailydispatch/ui/LevelPointsOverlay';
import { SpriteButton } from '~/game/dailydispatch/core/SpriteButton';
import { loadSectionConfig, getClueForLevel, getChapterLength, type SectionConfig } from '~/game/dailydispatch/types/section';
import { setAtlasName, getAtlasName } from '~/game/dailydispatch/utils/atlasHelper';
import type { ChapterRef } from '~/game/types/gameData';
import type { LevelConfig } from '~/game/dailydispatch/types/level';
import { SAMPLE_PUZZLE } from '~/game/dailydispatch/data/samplePuzzle';
import { ChapterGenerationService } from '~/game/dailydispatch/services/ChapterGenerationService';

import { getTileBundleName, type GameTuning } from '~/game/tuning';
import { GameAudioManager } from '~/game/audio/manager';
import { gameState } from '~/game/state';
import { advanceLevel, clearBlockState, getCurrentChapter, startChapter, completeChapter } from '~/game/services/progress';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';
import { useGameData } from '~/game/hooks/useGameData';
import { chapterRefToLevelManifest, getChapterIntroduction, getChapterByIndex } from '~/game/services/chapterLoader';
import { initCatalog, getCatalog, setCatalogIndex, hasNextChapter, fetchNextChapter, fetchChapterAtIndex, findIndexByUid } from '~/game/services/chapterCatalog';

import type { ScaffoldTuning } from '~/core';

/** Controller interface returned by setupDailyDispatchGame */
export interface GameScreenController {
  init(container: HTMLDivElement): Promise<void>;
  destroy(): void;
  ariaText: () => string;
}

/** Modal phase for the chapter start experience */
type ModalPhase = 'introduction' | 'loading-puzzle' | 'chapter-start' | 'playing' | 'chapter-end';

/** Dependencies injected from the screen component */
export interface GameScreenDeps {
  coordinator: {
    getGpuLoader: () => unknown;
    loadBundle: (name: string) => Promise<void>;
    audio: AudioLoader;
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
    ReturnType<typeof import('~/game/setup/AnalyticsContext').useAnalytics>,
    'trackLevelStart' | 'trackLevelComplete' | 'trackChapterStart' | 'trackChapterComplete'
  >;
}

export function setupDailyDispatchGame(deps: GameScreenDeps): GameScreenController {
  const { coordinator, tuning, audio, gameData: gameDataHook, analytics } = deps;
  const { trackLevelStart, trackLevelComplete, trackChapterStart, trackChapterComplete } = analytics;

  const [pixiApp, setPixiApp] = createSignal<Application | null>(null);
  const [gameInstance, setGameInstance] = createSignal<DailyDispatchGame | null>(null);
  const [audioManager, setAudioManager] = createSignal<GameAudioManager | null>(null);
  const [sectionConfig, setSectionConfig] = createSignal<SectionConfig | null>(null);
  const [modalPhase, setModalPhase] = createSignal<ModalPhase>('introduction');
  const [activeChapterRef, setActiveChapterRef] = createSignal<ChapterRef | null>(null);

  let resizeHandler: (() => void) | null = null;
  let skipKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  // Companion UI
  let companionGroup: Container | null = null;
  let companionDialogueBox: DialogueBox | null = null;
  let companionCharacter: CompanionCharacter | null = null;
  let darkOverlay: Graphics | null = null;
  let isCompanionAnimating = false;
  let isShowingCompletionClue = false;

  let cluePopup: CluePopup | null = null;
  let levelCompleteOverlay: LevelCompleteOverlay | null = null;
  let truckCloseOverlay: TruckCloseOverlay | null = null;
  let levelPointsOverlay: LevelPointsOverlay | null = null;
  let chapterLabel: Text | null = null;
  let moveText: Text | null = null;
  let audioButton: SpriteButton | null = null;
  let deleteButton: SpriteButton | null = null;
  let restartButton: SpriteButton | null = null;

  // Level management — generated from chapter seeds
  let generatedLevels: LevelConfig[] = [SAMPLE_PUZZLE]; // fallback until chapter loads
  const [currentLevelIndex, setCurrentLevelIndex] = createSignal(0);
  const getCurrentLevel = () => generatedLevels[currentLevelIndex()] ?? generatedLevels[0];

  // Analytics state
  let catalogIndex = 0;
  let levelStartTimestamp = Date.now();
  let chapterStartTimestamp = Date.now();

  const fireTrackLevelStart = (levelNum: number, chapterRef: ChapterRef | null) => {
    levelStartTimestamp = Date.now();
    trackLevelStart({
      chapter_id: chapterRef?.uid ?? 'default',
      chapter_count: catalogIndex + 1,
      county_theme: 'warehouse',
      level_order: levelNum,
      chapter_progress: `${gameState.currentLevel()}/${gameState.totalLevels()}`,
      level_id: `${chapterRef?.uid ?? 'default'}_L${levelNum}`,
      level_difficulty: levelNum <= 3 ? 'easy' : levelNum <= 7 ? 'medium' : 'hard',
      is_tutorial: levelNum === 1 && catalogIndex === 0,
      level_seed: 0,
      grid_size: 6,
      landmarks_count: 0,
      road_tiles_count: 0,
      min_path_length: 0,
    });
  };

  // ── Reactive effects ──

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

  // ── Lifecycle ──

  return {
    ariaText: () => `Level ${gameState.currentLevel()} of ${gameState.totalLevels()}`,

    async init(container: HTMLDivElement) {
      const savedProgress = getCurrentChapter();

      // Load chapter from catalog
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
        } else {
          const gd = gameDataHook.gameData();
          if (gd && gd.chapters?.length > 0) {
            const chapterRef = getChapterByIndex(gd, 0)!;
            setActiveChapterRef(chapterRef);
            config = chapterRefToLevelManifest(chapterRef);
          } else {
            config = await loadSectionConfig();
          }
        }

        setSectionConfig(config);
        const chapterLength = getChapterLength(config);
        gameState.setTotalLevels(chapterLength);

        // Generate all levels for this chapter from seeds + difficulty progression
        const generated = ChapterGenerationService.generateChapter(config);
        generatedLevels = generated.levels;

        if (savedProgress && savedProgress.currentLevel > 1) {
          const levelIndex = Math.min(savedProgress.currentLevel - 1, chapterLength - 1);
          setCurrentLevelIndex(levelIndex);
          gameState.setCurrentLevel(savedProgress.currentLevel);
          setModalPhase('playing');
        } else {
          const chapterRef = activeChapterRef();
          if (chapterRef) {
            startChapter({
              manifestUrl: '',
              chapterId: chapterRef.uid,
              countyName: chapterRef.county?.name ?? 'warehouse',
              chapterLength,
              catalogIndex,
            });
          }
        }
      } catch (err) {
        console.error('[GameScreen] Failed to load chapter:', err);
      }

      const gameTuning = tuning.game;

      // Create Pixi app
      const app = new Application();
      await app.init({
        background: '#4A3728',
        resizeTo: container,
        antialias: true,
      });
      container.appendChild(app.canvas);
      setPixiApp(app);

      const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

      // Load atlas
      const tileTheme = gameTuning.theme.tileTheme;
      setAtlasName(tileTheme);
      const tileBundleName = getTileBundleName(tileTheme);
      await coordinator.loadBundle(tileBundleName);

      if (!gpuLoader.hasSheet(tileBundleName)) {
        console.error('[GameScreen] Atlas not loaded');
        return;
      }

      // Load VFX bundles (local assets)
      await Promise.all([
        coordinator.loadBundle('vfx-flash_fx_shape_04'),
        coordinator.loadBundle('vfx-mg_glow_09'),
        coordinator.loadBundle('vfx-mg_noglow_01'),
      ]);

      // Background
      const background = gpuLoader.createSprite(tileBundleName, 'bg-gameboard.png');
      const bgScale = app.screen.height / background.texture.height;
      background.scale.set(bgScale);
      background.anchor.set(0.5);
      background.x = app.screen.width / 2;
      background.y = app.screen.height / 2;
      app.stage.addChild(background);

      // Create game
      const cellSize = 72;
      const game = new DailyDispatchGame(gpuLoader, cellSize);
      game.setSlideAnimConfig(gameTuning.slideAnimation);

      const isResuming = modalPhase() === 'playing';

      if (isResuming) {
        game.loadLevel(getCurrentLevel());
        fireTrackLevelStart(gameState.currentLevel(), activeChapterRef());
      }

      // Center game in viewport
      const positionGame = () => {
        const gridPx = game.getGridPixelSize();
        const margin = 63;
        const availW = app.screen.width - margin * 2;
        const availH = app.screen.height - margin * 2 - 120;
        const scale = Math.min(1, availW / gridPx, availH / gridPx);
        game.scale.set(scale);
        game.x = (app.screen.width - gridPx * scale) / 2;
        game.y = (app.screen.height - gridPx * scale) / 2 + 40;
      };

      app.stage.addChild(game);
      app.ticker.addOnce(() => positionGame());
      setGameInstance(game);

      // ── HUD ──

      chapterLabel = new Text({
        text: `Level: ${gameState.currentLevel()}`,
        style: {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: '#000000', width: 5 },
          dropShadow: { color: '#000000', alpha: 0.5, blur: 3, distance: 2 },
        },
      });
      chapterLabel.anchor.set(0.5, 0);
      app.stage.addChild(chapterLabel);

      moveText = new Text({
        text: 'Moves: 00',
        style: {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: 20,
          fill: '#ffffff',
          stroke: { color: '#000000', width: 3 },
        },
      });
      moveText.anchor.set(0.5, 0);
      app.stage.addChild(moveText);

      // ── HUD Buttons ──

      const btnSize = 48;
      const atlasName = getAtlasName();

      // Delete button — top left
      deleteButton = new SpriteButton(gpuLoader, {
        atlasName,
        spriteName: 'ui-button_delete.png',
        width: btnSize,
        height: btnSize,
        onClick: () => {
          audioManager()?.playButtonClick();
          // Toggle eraser mode on the game
          const gi = gameInstance();
          if (gi) {
            // Simple erase-mode toggle (highlight blocks, next tap erases)
            console.log('[HUD] Delete button pressed');
          }
        },
      });
      app.stage.addChild(deleteButton);

      // Restart button — top right
      restartButton = new SpriteButton(gpuLoader, {
        atlasName,
        spriteName: 'ui-button_restart.png',
        width: btnSize,
        height: btnSize,
        onClick: () => {
          audioManager()?.playButtonClick();
          const gi = gameInstance();
          if (gi) {
            gi.loadLevel(getCurrentLevel());
            positionGame();
            if (chapterLabel) chapterLabel.text = `Level: ${gameState.currentLevel()}`;
            if (moveText) moveText.text = 'Moves: 00';
          }
        },
      });
      app.stage.addChild(restartButton);

      // Audio button — bottom left
      audioButton = new SpriteButton(gpuLoader, {
        atlasName,
        spriteName: 'ui-button_audio.png',
        width: btnSize,
        height: btnSize,
        onClick: () => {
          audioManager()?.playButtonClick();
          const vol = audio.volume();
          coordinator.audio.setMasterVolume(vol > 0 ? 0 : 1);
          console.log('[HUD] Audio button pressed');
        },
      });
      app.stage.addChild(audioButton);

      const positionHUD = () => {
        if (chapterLabel) {
          chapterLabel.x = app.screen.width / 2;
          chapterLabel.y = 16;
        }
        if (moveText) {
          moveText.x = app.screen.width / 2;
          moveText.y = 16 + 28;
        }
        // Delete button — top left
        if (deleteButton) {
          deleteButton.x = 24 + btnSize / 2;
          deleteButton.y = 16 + btnSize / 2;
        }
        // Restart button — top right
        if (restartButton) {
          restartButton.x = app.screen.width - 24 - btnSize / 2;
          restartButton.y = 16 + btnSize / 2;
        }
        // Audio button — bottom left
        if (audioButton) {
          audioButton.x = 24 + btnSize / 2;
          audioButton.y = app.screen.height - 24 - btnSize / 2;
        }
      };

      positionHUD();

      const formatMoves = (n: number) => String(n).padStart(2, '0');

      const fadeOutHUD = () => {
        if (chapterLabel) gsap.to(chapterLabel, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
        if (moveText) gsap.to(moveText, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
      };
      const fadeInHUD = () => {
        if (chapterLabel) gsap.to(chapterLabel, { alpha: 1, duration: 0.3, ease: 'power2.out' });
        if (moveText) gsap.to(moveText, { alpha: 1, duration: 0.3, ease: 'power2.out' });
      };

      cluePopup = new CluePopup(gpuLoader);
      app.stage.addChild(cluePopup);

      // ── Load next level ──

      const loadNextLevelWithTransition = () => {
        const nextIdx = currentLevelIndex() + 1;
        setCurrentLevelIndex(nextIdx);

        game.loadLevel(getCurrentLevel());
        fireTrackLevelStart(gameState.currentLevel(), activeChapterRef());
        positionGame();
        positionHUD();

        const current = gameState.currentLevel();
        if (chapterLabel) chapterLabel.text = `Level: ${current}`;
        if (moveText) moveText.text = 'Moves: 00';
      };

      // ── Load next chapter or show "all done" ──

      const loadNextChapterOrEnd = async () => {
        if (hasNextChapter()) {
          const nextData = await fetchNextChapter();
          if (nextData && nextData.chapters?.length > 0) {
            const nextChapterRef = nextData.chapters[0];
            const nextConfig = chapterRefToLevelManifest(nextChapterRef);
            const nextLen = getChapterLength(nextConfig);

            setActiveChapterRef(nextChapterRef);
            setSectionConfig(nextConfig);
            setCurrentLevelIndex(0);
            gameState.setCurrentLevel(1);
            gameState.setTotalLevels(nextLen);

            // Generate levels for the new chapter
            const nextGenerated = ChapterGenerationService.generateChapter(nextConfig);
            generatedLevels = nextGenerated.levels;

            const cat = getCatalog();
            startChapter({
              manifestUrl: '',
              chapterId: nextChapterRef.uid,
              countyName: nextChapterRef.county?.name ?? 'warehouse',
              chapterLength: nextLen,
              catalogIndex: cat?.currentIndex ?? 0,
            });

            if (chapterLabel) chapterLabel.text = 'Level: 1';
            if (moveText) moveText.text = 'Moves: 00';
            catalogIndex = cat?.currentIndex ?? 0;

            chapterStartTimestamp = Date.now();
            trackChapterStart({
              chapter_id: nextChapterRef.uid,
              chapter_count: catalogIndex + 1,
              county_theme: nextChapterRef.county?.name ?? 'warehouse',
              is_tutorial: false,
              chapter_size: nextLen,
              story_id: nextChapterRef.story.uid,
              story_headline: nextChapterRef.story.headline,
            });

            game.loadLevel(getCurrentLevel());
            fireTrackLevelStart(1, nextChapterRef);
            positionGame();
            positionHUD();

            const chapterStartText = nextConfig.story.summary || "Let's sort more packages!";
            setModalPhase('chapter-start');
            showCompanion(chapterStartText, companionConfig.overlayAlpha);
          } else {
            loadNextLevelWithTransition();
          }
        } else {
          showCompanion(
            "Amazing work! You've delivered all the packages. Check back soon for more!",
            companionConfig.overlayAlpha,
          );
        }
      };

      // ── Sound events (fire at precise animation moments) ──

      game.onSoundEvent('blockSlide', () => audioManager()?.playBlockSlide());
      game.onSoundEvent('blockExit', () => audioManager()?.playBlockExit());
      game.onSoundEvent('truckClose', () => audioManager()?.playTruckClose());
      game.onSoundEvent('truckDriveAway', () => audioManager()?.playTruckDriveAway());

      // ── Game events ──

      game.onGameEvent('blockMoved', () => {
        if (moveText) {
          moveText.text = `Moves: ${formatMoves(game.getMoveCount())}`;
        }
      });

      game.onGameEvent('levelComplete', (moveCount) => {
        const config = sectionConfig();
        const levelNum = gameState.currentLevel();
        const chapterLength = config ? getChapterLength(config) : 10;
        const isChapterEnd = levelNum >= chapterLength;
        const clueText = config ? getClueForLevel(config, levelNum) : null;

        trackLevelComplete({
          moves_used: moveCount,
          optimal_moves: getCurrentLevel().optimalMoves ?? 0,
          time_spent: parseFloat(((Date.now() - levelStartTimestamp) / 1000).toFixed(2)),
          total_rotations: 0,
        });
        clearBlockState();
        advanceLevel();
        gameState.incrementLevel();

        if (isChapterEnd) {
          audioManager()?.playChapterComplete();
          const displayText = config?.story.completion ?? clueText ?? 'Great work!';
          isShowingCompletionClue = true;
          showCompanion(displayText, gameTuning.companion.overlayAlpha);
        } else if (cluePopup) {
          audioManager()?.playLevelComplete();
          fadeOutHUD();
          const gridTop = game.y;
          cluePopup.show(
            clueText ?? 'Nice work!',
            app.screen.width,
            gridTop,
            gameTuning.cluePopup.displayDuration,
            () => {
              fadeInHUD();
              loadNextLevelWithTransition();
            },
          );
        }
      });

      // ── Companion system ──

      const companionConfig = gameTuning.companion;
      const charWidth = 135;
      const charHeight = 244;

      companionGroup = new Container();
      companionGroup.label = 'companion-dialogue-group';

      companionDialogueBox = new DialogueBox(gpuLoader, app.screen.width, app.screen.height, 2.5);

      const config = sectionConfig();
      const chapterRef = activeChapterRef();
      const introText = chapterRef
        ? getChapterIntroduction(chapterRef)
        : (config?.story.summary ?? "Hey there! I'm Marty. Let's sort these packages!");
      companionDialogueBox.setText(introText);
      companionDialogueBox.alpha = 1;
      companionDialogueBox.x = 0;
      companionDialogueBox.y = 0;
      companionGroup.addChild(companionDialogueBox);

      companionCharacter = new CompanionCharacter('marty', gpuLoader, 'full');
      companionCharacter.alpha = 1;
      companionCharacter.x = 0;
      companionCharacter.y = companionDialogueBox.getHeight() + (charHeight / 2);
      companionGroup.addChild(companionCharacter);

      const groupBottom = companionCharacter.y + (charHeight / 2);
      const groupVerticalCenter = groupBottom / 2;

      companionGroup.x = app.screen.width / 2;
      companionGroup.y = app.screen.height / 2 - groupVerticalCenter;

      const showCompanion = (text: string, overlayAlpha: number) => {
        if (!companionDialogueBox || !companionGroup || !darkOverlay) return;
        companionDialogueBox.setText(text);
        companionGroup.visible = true;
        companionGroup.x = app.screen.width + 400;
        companionGroup.alpha = 1;
        isCompanionAnimating = true;

        setTimeout(() => {
          gsap.to(darkOverlay!, {
            alpha: overlayAlpha,
            duration: companionConfig.overlayFadeInDuration / 1000,
            ease: 'power2.out',
          });

          const gb = companionCharacter!.y + (charHeight / 2);
          const gvc = gb / 2;

          gsap.to(companionGroup!, {
            x: app.screen.width / 2,
            y: app.screen.height / 2 - gvc,
            duration: companionConfig.slideInDuration / 1000,
            ease: companionConfig.slideInEasing,
            delay: 0.2,
            onComplete: () => {
              isCompanionAnimating = false;
              if (darkOverlay) darkOverlay.eventMode = 'static';
            },
          });
        }, companionConfig.slideInDelay);
      };

      const hideCompanion = (): Promise<void> => {
        return new Promise((resolve) => {
          if (!companionGroup || !darkOverlay) { resolve(); return; }
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
            x: -400, alpha: 0,
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
          const chapterStartText = currentConfig?.story.summary ?? "Let's sort these packages!";
          const boxSprite = companionDialogueBox!.children[0];
          const textField = companionDialogueBox!.children[1];

          const textSwap = new Promise<void>((resolve) => {
            const tl = gsap.timeline({ onComplete: resolve });
            tl.to(textField, { alpha: 0, duration: 0.2, ease: 'power2.in' });
            tl.to(boxSprite, { alpha: 0, duration: 0.2, ease: 'power2.in' });
            tl.call(() => {
              game.loadLevel(getCurrentLevel());
              fireTrackLevelStart(1, activeChapterRef());
              chapterStartTimestamp = Date.now();

              const chRef = activeChapterRef();
              if (chRef) {
                trackChapterStart({
                  chapter_id: chRef.uid,
                  chapter_count: catalogIndex + 1,
                  county_theme: chRef.county?.name ?? 'warehouse',
                  is_tutorial: catalogIndex === 0,
                  chapter_size: gameState.totalLevels(),
                  story_id: chRef.story.uid,
                  story_headline: chRef.story.headline,
                });
              }

              positionGame();
              positionHUD();
              companionDialogueBox!.setText(chapterStartText);
            }, undefined, '+=0.4');
            tl.to(boxSprite, { alpha: 1, duration: 0.3, ease: 'power2.out', delay: 0.6 });
            tl.to(textField, { alpha: 1, duration: 0.3, ease: 'power2.out' });
          });

          await textSwap;
          setModalPhase('chapter-start');
          isCompanionAnimating = false;

        } else if (phase === 'chapter-start') {
          await hideCompanion();
          setModalPhase('playing');

        } else if (isShowingCompletionClue) {
          isCompanionAnimating = true;
          darkOverlay.eventMode = 'none';

          // Slide out companion
          await new Promise<void>((resolve) => {
            gsap.to(companionGroup!, {
              x: -400, alpha: 0,
              duration: companionConfig.slideOutDuration / 1000,
              ease: companionConfig.slideOutEasing,
              onComplete: () => {
                companionGroup!.visible = false;
                isCompanionAnimating = false;
                resolve();
              },
            });
          });
          gsap.to(darkOverlay!, { alpha: 0, duration: 0.3, ease: 'power2.in' });

          isShowingCompletionClue = false;

          // Track chapter completion
          const completingRef = activeChapterRef();
          if (completingRef) {
            trackChapterComplete({
              chapter_id: completingRef.uid,
              time_spent: parseFloat(((Date.now() - chapterStartTimestamp) / 1000).toFixed(2)),
              is_tutorial: catalogIndex === 0,
            });
          }
          completeChapter();
          setModalPhase('chapter-end');

          // Step 1: LevelCompleteOverlay
          await new Promise<void>((resolve) => {
            levelCompleteOverlay?.show(app.screen.width, app.screen.height, 0, null, resolve);
          });

          // Step 2: TruckCloseOverlay
          await new Promise<void>((resolve) => {
            truckCloseOverlay?.show(app.screen.width, app.screen.height, resolve);
          });

          // Step 3: LevelPointsOverlay
          const chRef = activeChapterRef();
          const cfg = sectionConfig();
          await new Promise<void>((resolve) => {
            levelPointsOverlay?.show({
              screenWidth: app.screen.width,
              screenHeight: app.screen.height,
              totalLevels: gameState.totalLevels(),
              totalMoves: game.getMoveCount(),
              headline: chRef?.story.headline ?? cfg?.story.headline ?? 'Great work!',
              articleUrl: chRef?.story.articleUrl ?? cfg?.story.articleUrl ?? '',
              onNext: resolve,
            });
          });

          // Load next chapter or show end
          await loadNextChapterOrEnd();
        } else {
          await hideCompanion();
        }
      });

      app.stage.addChild(darkOverlay);

      companionGroup.x = app.screen.width + 400;
      companionGroup.y = app.screen.height / 2 - groupVerticalCenter;
      companionGroup.alpha = 1;
      app.stage.addChild(companionGroup);

      // Chapter-end overlays (on top of everything)
      levelCompleteOverlay = new LevelCompleteOverlay(gpuLoader);
      app.stage.addChild(levelCompleteOverlay);
      truckCloseOverlay = new TruckCloseOverlay(gpuLoader);
      app.stage.addChild(truckCloseOverlay);
      levelPointsOverlay = new LevelPointsOverlay(gpuLoader);
      app.stage.addChild(levelPointsOverlay);

      if (modalPhase() === 'introduction') {
        showCompanion(introText, companionConfig.overlayAlpha);
      } else {
        companionGroup.visible = false;
      }

      // ── Audio ──

      const manager = new GameAudioManager(coordinator.audio);
      setAudioManager(manager);

      // ── Resize ──

      resizeHandler = () => {
        positionGame();
        positionHUD();

        const bgScale2 = app.screen.height / background.texture.height;
        background.scale.set(bgScale2);
        background.x = app.screen.width / 2;
        background.y = app.screen.height / 2;

        if (darkOverlay) {
          const currentAlpha = darkOverlay.alpha;
          darkOverlay.clear();
          darkOverlay.rect(0, 0, app.screen.width, app.screen.height);
          darkOverlay.fill({ color: 0x000000, alpha: 1.0 });
          darkOverlay.alpha = currentAlpha;
        }

        if (companionDialogueBox && companionCharacter) {
          companionDialogueBox.resize(app.screen.width, app.screen.height);
          companionCharacter.x = 0;
          companionCharacter.y = companionDialogueBox.getHeight() + (charHeight / 2);

          const gb2 = companionCharacter.y + (charHeight / 2);
          const gvc2 = gb2 / 2;

          if (companionGroup && companionGroup.visible) {
            companionGroup.x = app.screen.width / 2;
            companionGroup.y = app.screen.height / 2 - gvc2;
          }
        }
      };
      window.addEventListener('resize', resizeHandler);

      // ── Dev shortcuts ──

      if (IS_DEV_ENV) {
        skipKeyHandler = (e: KeyboardEvent) => {
          if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            clearBlockState();
            advanceLevel();
            gameState.incrementLevel();
            loadNextLevelWithTransition();
          }
        };
        window.addEventListener('keydown', skipKeyHandler);
      }

      console.log('[DailyDispatch] Game started');
    },

    destroy() {
      const app = pixiApp();
      if (app) app.ticker.stop();
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (skipKeyHandler) window.removeEventListener('keydown', skipKeyHandler);

      levelCompleteOverlay?.destroy();
      levelCompleteOverlay = null;
      truckCloseOverlay?.destroy();
      truckCloseOverlay = null;
      levelPointsOverlay?.destroy();
      levelPointsOverlay = null;
    },
  };
}
