import { createSignal, onMount, onCleanup } from 'solid-js';
import { Application, Container, Sprite, Text, Graphics, type TextStyle } from 'pixi.js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { useTuning, type ScaffoldTuning } from '~/scaffold';
import { Logo } from '~/scaffold/ui/Logo';
import { gameState } from '~/game/state';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { Character } from '~/game/citylines/core/Character';
import { SpriteButton } from '~/game/citylines/core/SpriteButton';
import { getTileBundleName, type CityLinesTuning } from '~/game/tuning';
import { setAtlasName } from '~/game/citylines/utils/atlasHelper';
import { getStartScreenMode, markAsPlayed, hasPlayedBefore } from '~/game/citylines/utils/startScreenHelper';

// Text styles cached at module level to avoid per-frame allocations
const COUNTY_TEXT_STYLE: Partial<TextStyle> = {
  fontFamily: 'Sniglet, system-ui, sans-serif',
  fontSize: 34,
  fontWeight: 'bold',
  fill: '#FFFFFF',
  stroke: { color: '#2C3E50', width: 3 },
  dropShadow: {
    alpha: 0.25,
    angle: Math.PI / 4,
    blur: 3,
    distance: 2,
    color: '#000000',
  },
  align: 'center',
};

const GOAL_TEXT_STYLE: Partial<TextStyle> = {
  fontFamily: 'Sniglet, system-ui, sans-serif',
  fontSize: 20,
  fontWeight: '500',
  fill: '#2C3E50',
  align: 'center',
  wordWrap: true,
  wordWrapWidth: 400,
  lineHeight: 32,
  letterSpacing: 0.3,
};

const PROGRESS_TEXT_STYLE: Partial<TextStyle> = {
  fontFamily: 'Sniglet, system-ui, sans-serif',
  fontSize: 32,
  fontWeight: 'bold',
  fill: '#27AE60',
  stroke: { color: '#FFFFFF', width: 3 },
  dropShadow: {
    alpha: 0.2,
    angle: Math.PI / 4,
    blur: 2,
    distance: 2,
    color: '#000000',
  },
  align: 'center',
  letterSpacing: 1,
};

const FLAVOR_TEXT_STYLE: Partial<TextStyle> = {
  fontFamily: 'Sniglet, system-ui, sans-serif',
  fontSize: 20,
  fontStyle: 'italic',
  fontWeight: '600',
  fill: '#E67E22',
  stroke: { color: '#FFFFFF', width: 3 },
  dropShadow: {
    alpha: 0.15,
    angle: Math.PI / 4,
    blur: 2,
    distance: 1,
    color: '#000000',
  },
  align: 'center',
  letterSpacing: 0.5,
};

export function StartScreen() {
  const { goto } = useScreen();
  const { coordinator, initGpu, unlockAudio, loadCore, loadAudio } = useAssets();
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();
  const [loading, setLoading] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;
  let app: Application | null = null;
  let background: Sprite | null = null;
  let uiContainer: Container | null = null;
  let titleSprite: Sprite | null = null;
  let character: Character | null = null;
  let startButton: SpriteButton | null = null;
  let countyText: Text | null = null;
  let countyBadge: Graphics | null = null;
  let goalText: Text | null = null;
  let goalPanel: Graphics | null = null;
  let flavorText: Text | null = null;

  const handleStart = async () => {
    if (loading()) return;
    setLoading(true);

    // Disable button during loading
    startButton?.setEnabled(false);

    try {
      // Mark that player has played (for future sessions)
      markAsPlayed();

      unlockAudio();
      await initGpu();
      await loadCore();

      // Load audio with graceful degradation
      try {
        await loadAudio();
      } catch (error) {
        console.warn('Audio loading failed (assets may not exist yet):', error);
        // Continue without audio - game is still playable
      }

      gameState.reset();

      await new Promise((r) => setTimeout(r, 200));
      await goto('game');
    } catch (error) {
      console.error('Failed to start game:', error);
      setLoading(false);
      startButton?.setEnabled(true);
    }
  };

  const handleResize = () => {
    if (!app || !background || !uiContainer) return;

    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // Background - fit height, maintain aspect ratio, center horizontally
    const bgScale = screenHeight / background.texture.height;
    background.scale.set(bgScale);
    background.x = centerX;
    background.y = centerY;

    // Safe margins
    const topMargin = 40;
    const bottomMargin = 60;
    const availableHeight = screenHeight - topMargin - bottomMargin;

    // Calculate element heights
    const titleHeight = titleSprite?.height ?? 0;
    const countyHeight = (countyText?.height ?? 0) + 36;
    const goalHeight = (goalText?.height ?? 0) + 40;
    const characterHeight = character?.height ?? 0;
    const flavorHeight = flavorText?.height ?? 30;
    const buttonHeight = startButton?.height ?? 80;

    // Ideal gaps
    const idealGaps = {
      titleBottom: 28,
      countyBottom: 40,
      goalBottom: 60,
      characterBottom: 64,
      flavorBottom: 56,
    };

    // Minimum gaps
    const minGaps = {
      titleBottom: 12,
      countyBottom: 20,
      goalBottom: 24,
      characterBottom: 28,
      flavorBottom: 24,
    };

    // Calculate total content height with ideal gaps
    const totalIdealHeight =
      titleHeight +
      idealGaps.titleBottom +
      countyHeight +
      idealGaps.countyBottom +
      goalHeight +
      idealGaps.goalBottom +
      characterHeight +
      idealGaps.characterBottom +
      flavorHeight +
      idealGaps.flavorBottom +
      buttonHeight;

    // Adaptive gap calculation
    let gaps = { ...idealGaps };
    let contentScale = 1;

    if (totalIdealHeight > availableHeight) {
      // Calculate total min height
      const totalMinHeight =
        titleHeight +
        minGaps.titleBottom +
        countyHeight +
        minGaps.countyBottom +
        goalHeight +
        minGaps.goalBottom +
        characterHeight +
        minGaps.characterBottom +
        flavorHeight +
        minGaps.flavorBottom +
        buttonHeight;

      if (totalMinHeight > availableHeight) {
        // Need to scale everything down
        contentScale = availableHeight / totalMinHeight;
        gaps = { ...minGaps };
      } else {
        // Interpolate between min and ideal gaps
        const ratio = (availableHeight - totalMinHeight) / (totalIdealHeight - totalMinHeight);
        gaps = {
          titleBottom: minGaps.titleBottom + (idealGaps.titleBottom - minGaps.titleBottom) * ratio,
          countyBottom: minGaps.countyBottom + (idealGaps.countyBottom - minGaps.countyBottom) * ratio,
          goalBottom: minGaps.goalBottom + (idealGaps.goalBottom - minGaps.goalBottom) * ratio,
          characterBottom: minGaps.characterBottom + (idealGaps.characterBottom - minGaps.characterBottom) * ratio,
          flavorBottom: minGaps.flavorBottom + (idealGaps.flavorBottom - minGaps.flavorBottom) * ratio,
        };
      }
    }

    // Apply content scale to UI container only (not background)
    uiContainer.scale.set(contentScale);

    // Calculate positions from top
    const startY = topMargin / contentScale;
    const titleY = startY + titleHeight / 2;
    const countyY = titleY + titleHeight / 2 + gaps.titleBottom + countyHeight / 2;
    const goalY = countyY + countyHeight / 2 + gaps.countyBottom + goalHeight / 2;
    const characterY = goalY + goalHeight / 2 + gaps.goalBottom + characterHeight / 2;
    const flavorY = characterY + characterHeight / 2 + gaps.characterBottom + flavorHeight / 2;
    const buttonY = flavorY + flavorHeight / 2 + gaps.flavorBottom + buttonHeight / 2;

    // Position elements
    if (titleSprite) {
      titleSprite.x = centerX / contentScale;
      titleSprite.y = titleY;
    }

    if (countyBadge) {
      countyBadge.x = centerX / contentScale;
      countyBadge.y = countyY;
    }

    if (countyText) {
      countyText.x = centerX / contentScale;
      countyText.y = countyY;
    }

    if (goalPanel) {
      goalPanel.x = centerX / contentScale;
      goalPanel.y = goalY;
    }

    if (goalText) {
      goalText.x = centerX / contentScale;
      goalText.y = goalY;
    }

    if (character) {
      character.x = centerX / contentScale;
      character.y = characterY;
    }

    if (flavorText) {
      flavorText.x = centerX / contentScale;
      flavorText.y = flavorY;
    }

    if (startButton) {
      startButton.x = centerX / contentScale;
      startButton.y = buttonY;
    }
  };

  onMount(async () => {
    if (!containerRef) return;

    await initGpu();

    // Detect debug mode from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const debugProgress = urlParams.get('debugProgress') === '1';
    const screenConfig = getStartScreenMode(debugProgress);

    app = new Application();
    await app.init({
      background: '#B2DD53',
      resizeTo: containerRef,
    });
    containerRef.appendChild(app.canvas);

    // Load tile bundle based on theme setting
    const tileTheme = tuning.game.theme.tileTheme;
    setAtlasName(tileTheme); // Set global atlas name for all game entities
    const tileBundleName = getTileBundleName(tileTheme);
    await coordinator.loadBundle(tileBundleName);
    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

    if (gpuLoader?.hasSheet(tileBundleName)) {
      // Background with aspect-ratio cover scaling
      background = gpuLoader.createSprite(tileBundleName, 'background.png');
      background.anchor.set(0.5);
      app.stage.addChild(background);

      // UI container (separate from background for independent scaling)
      uiContainer = new Container();
      app.stage.addChild(uiContainer);

      // Title sprite
      titleSprite = gpuLoader.createSprite(tileBundleName, 'title.png');
      titleSprite.anchor.set(0.5);
      uiContainer.addChild(titleSprite);

      // County text (create first to measure)
      countyText = new Text({
        text: screenConfig.countyName,
        style: COUNTY_TEXT_STYLE,
      });
      countyText.anchor.set(0.5);

      // County badge (responsive to text width with padding)
      countyBadge = new Graphics();
      const countyPaddingX = 32;
      const countyPaddingY = 18;
      const badgeWidth = countyText.width + countyPaddingX * 2;
      const badgeHeight = countyText.height + countyPaddingY * 2;
      const badgeRadius = Math.min(badgeHeight / 2, 24);

      countyBadge.roundRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, badgeRadius);
      countyBadge.fill({ color: 0xe67e22, alpha: 0.95 });
      countyBadge.stroke({ color: 0xd35400, width: 3, alpha: 0.9 });
      uiContainer.addChild(countyBadge);
      uiContainer.addChild(countyText);

      // Goal/progress text (differs for new vs returning)
      const goalContent =
        screenConfig.mode === 'new'
          ? 'Connect landmarks to highways by rotating road tiles.\nTake your time and explore!'
          : `Level ${screenConfig.levelNumber} of ${screenConfig.totalLevels}`;

      const goalStyle = screenConfig.mode === 'new' ? GOAL_TEXT_STYLE : PROGRESS_TEXT_STYLE;

      goalText = new Text({
        text: goalContent,
        style: goalStyle,
      });
      goalText.anchor.set(0.5);

      // Goal panel (responsive to text size with cozy padding)
      goalPanel = new Graphics();
      const goalPaddingX = screenConfig.mode === 'new' ? 28 : 34;
      const goalPaddingY = screenConfig.mode === 'new' ? 20 : 18;
      const panelWidth = Math.min(goalText.width + goalPaddingX * 2, 460);
      const panelHeight = goalText.height + goalPaddingY * 2;
      const panelRadius = 18;

      goalPanel.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, panelRadius);
      goalPanel.fill({ color: 0xffffff, alpha: 0.88 });
      goalPanel.stroke({ color: 0xbdc3c7, width: 2, alpha: 0.6 });
      uiContainer.addChild(goalPanel);
      uiContainer.addChild(goalText);

      // Character (News Hound)
      character = new Character('news_hound', gpuLoader, 0.92);
      uiContainer.addChild(character);

      // Character flavor text
      const flavorContent = screenConfig.mode === 'new' ? "Let's connect some roads!" : 'Ready for more?';

      flavorText = new Text({
        text: flavorContent,
        style: FLAVOR_TEXT_STYLE,
      });
      flavorText.anchor.set(0.5);
      uiContainer.addChild(flavorText);

      // Start/Continue button with 9-slice
      const buttonLabel = screenConfig.mode === 'new' ? 'START' : 'CONTINUE';

      startButton = new SpriteButton(gpuLoader, {
        atlasName: tileBundleName,
        spriteName: 'button.png',
        label: buttonLabel,
        width: 200,
        height: 80,
        use9Slice: true,
        nineSliceBorders: {
          leftWidth: 32,
          topHeight: 32,
          rightWidth: 32,
          bottomHeight: 32,
        },
        labelStyle: {
          fontFamily: 'Sniglet, system-ui, sans-serif',
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: '#000000', width: 4 },
        },
        onClick: handleStart,
      });
      uiContainer.addChild(startButton);

      // Initial layout
      handleResize();

      // Listen for resize
      window.addEventListener('resize', handleResize);
    }
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
    if (app) {
      app.destroy(true, { children: true });
      app = null;
    }
  });

  return (
    <div class="fixed inset-0 bg-[#B2DD53]">
      {/* Pixi canvas container */}
      <div ref={containerRef} class="absolute inset-0" />

      {/* Logo at bottom center */}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Logo />
      </div>
    </div>
  );
}
