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

import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import type { AudioLoader } from '~/scaffold/systems/assets/loaders/audio';
import { IS_DEV_ENV } from '~/scaffold/dev/env';

import { DailyDispatchGame } from '~/game/dailydispatch/core/DailyDispatchGame';
import { CompanionCharacter } from '~/game/dailydispatch/ui/companion/CompanionCharacter';
import { DialogueBox } from '~/game/dailydispatch/ui/companion/DialogueBox';
import { CluePopup } from '~/game/dailydispatch/ui/CluePopup';
import { ProgressBar } from '~/game/shared/components/ProgressBar';
import { loadSectionConfig, getClueForLevel, getChapterLength, type SectionConfig } from '~/game/dailydispatch/types/section';
import { setAtlasName } from '~/game/dailydispatch/utils/atlasHelper';
import type { ChapterRef } from '~/game/types/gameData';
import type { LevelConfig } from '~/game/dailydispatch/types/level';
import { SAMPLE_PUZZLE, SAMPLE_PUZZLE_MEDIUM } from '~/game/dailydispatch/data/samplePuzzle';

import { getTileBundleName, type GameTuning } from '~/game/tuning';
import { GameAudioManager } from '~/game/audio/manager';
import { gameState } from '~/game/state';
import { advanceLevel, clearBlockState, getCurrentChapter, startChapter, completeChapter } from '~/game/services/progress';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';
import { useGameData } from '~/game/hooks/useGameData';
import { chapterRefToLevelManifest, getChapterIntroduction, getChapterByIndex } from '~/game/services/chapterLoader';
import { initCatalog, getCatalog, setCatalogIndex, hasNextChapter, fetchNextChapter, fetchChapterAtIndex, findIndexByUid } from '~/game/services/chapterCatalog';

import type { ScaffoldTuning } from '~/scaffold';

/** Controller interface returned by setupDailyDispatchGame */
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
    ReturnType<typeof import('~/scaffold/systems/telemetry/AnalyticsContext').useAnalytics>,
    'trackLevelStart' | 'trackLevelComplete' | 'trackChapterStart' | 'trackChapterComplete'
  >;
}

export function setupDailyDispatchGame(deps: GameScreenDeps): GameScreenController {
  const { coordinator, tuning, audio, gameData: gameDataHook, analytics } = deps;
  const { trackLevelStart, trackLevelComplete, trackChapterStart, trackChapterComplete } = analytics;

  const [pixiApp, setPixiApp] = createSignal<Application | null>(null);
  const [gameInstance, setGameInstance] = createSignal<DailyDispatchGame | null>(null);
  const [audioManager, setAudioManager] = createSignal<GameAudioManager | null>(null);
  const [progressBar, setProgressBar] = createSignal<ProgressBar | null>(null);
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
  let chapterLabel: Text | null = null;
  let moveText: Text | null = null;

  // Level management — Phase 4 will replace with generated levels
  const testLevels: LevelConfig[] = [SAMPLE_PUZZLE, SAMPLE_PUZZLE_MEDIUM];
  const [currentLevelIndex, setCurrentLevelIndex] = createSignal(0);
  const getCurrentLevel = () => testLevels[currentLevelIndex() % testLevels.length];

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
        const margin = 80;
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
      bar.setProgress(gameState.currentLevel(), gameState.totalLevels(), false);

      moveText = new Text({
        text: 'Moves: 0',
        style: {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: 20,
          fill: '#ffffff',
          stroke: { color: '#000000', width: 3 },
        },
      });
      moveText.anchor.set(1, 0);
      app.stage.addChild(moveText);

      const positionHUD = () => {
        const gridTop = game.y;
        const barY = Math.max(50, gridTop - 50);
        const bw = Math.min(320, app.screen.width - 48);
        bar.x = (app.screen.width - bw) / 2;
        bar.y = barY;
        if (chapterLabel) {
          chapterLabel.x = app.screen.width / 2;
          chapterLabel.y = Math.max(20, barY - 24);
        }
        if (moveText) {
          moveText.x = app.screen.width - 24;
          moveText.y = Math.max(20, barY - 24);
        }
      };

      positionHUD();

      const fadeOutHUD = () => {
        gsap.to(bar, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
        if (chapterLabel) gsap.to(chapterLabel, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
      };
      const fadeInHUD = () => {
        gsap.to(bar, { alpha: 1, duration: 0.3, ease: 'power2.out' });
        if (chapterLabel) gsap.to(chapterLabel, { alpha: 1, duration: 0.3, ease: 'power2.out' });
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
        const total = gameState.totalLevels();
        bar.setProgress(current, total);
        if (chapterLabel) chapterLabel.text = `${current} / ${total}`;
        if (moveText) moveText.text = 'Moves: 0';
      };

      // ── Game events ──

      game.onGameEvent('blockMoved', () => {
        if (moveText) moveText.text = `Moves: ${game.getMoveCount()}`;
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
          const displayText = config?.story.completion ?? clueText ?? 'Great work!';
          isShowingCompletionClue = true;
          showCompanion(displayText, gameTuning.companion.overlayAlpha);
        } else if (cluePopup) {
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
      const dle = -(companionDialogueBox.getWidth() / 2);
      companionCharacter.x = dle + (charWidth / 2);
      companionCharacter.y = -(charHeight * 0.25);
      companionGroup.addChildAt(companionCharacter, 0);

      const groupTop = companionCharacter.y - (charHeight / 2);
      const groupBottom = companionDialogueBox.getHeight();
      const groupVerticalCenter = (groupTop + groupBottom) / 2;

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

          const gt = companionCharacter!.y - (charHeight / 2);
          const gb = companionDialogueBox!.getHeight();
          const gvc = (gt + gb) / 2;

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

          isShowingCompletionClue = false;

          const completingRef = activeChapterRef();
          if (completingRef) {
            trackChapterComplete({
              chapter_id: completingRef.uid,
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
              const nextLen = getChapterLength(nextConfig);

              setActiveChapterRef(nextChapterRef);
              setSectionConfig(nextConfig);
              setCurrentLevelIndex(0);
              gameState.setCurrentLevel(1);
              gameState.setTotalLevels(nextLen);

              const cat = getCatalog();
              startChapter({
                manifestUrl: '',
                chapterId: nextChapterRef.uid,
                countyName: nextChapterRef.county?.name ?? 'warehouse',
                chapterLength: nextLen,
                catalogIndex: cat?.currentIndex ?? 0,
              });

              bar.setProgress(1, nextLen, false);
              if (chapterLabel) chapterLabel.text = `1 / ${nextLen}`;
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
              if (moveText) moveText.text = 'Moves: 0';

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
          const dle2 = -(companionDialogueBox.getWidth() / 2);
          companionCharacter.x = dle2 + (charWidth / 2);
          companionCharacter.y = -companionDialogueBox.getHeight() - (charHeight * 0.25);

          const gt2 = companionCharacter.y - (charHeight / 2);
          const gvc2 = (gt2 + 0) / 2;

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
            bar.setProgress(gameState.currentLevel(), gameState.totalLevels());
            loadNextLevelWithTransition();
          }
        };
        window.addEventListener('keydown', skipKeyHandler);
      }

      app.ticker.add(() => bar.update());

      console.log('[DailyDispatch] Game started');
    },

    destroy() {
      const app = pixiApp();
      if (app) app.ticker.stop();
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (skipKeyHandler) window.removeEventListener('keydown', skipKeyHandler);
    },
  };
}
