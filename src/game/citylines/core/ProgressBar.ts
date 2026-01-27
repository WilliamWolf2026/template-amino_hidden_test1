import { Container, Graphics, Text } from 'pixi.js';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

export interface ProgressBarConfig {
  width: number;
  height: number;
  themeColor?: number;
  tileTheme?: 'regular' | 'fall' | 'winter';
}

const DEFAULT_CONFIG: ProgressBarConfig = {
  width: 280,
  height: 36,
  themeColor: 0x27ae60,
  tileTheme: 'regular',
};

/**
 * Chapter progress bar HUD - smooth, playful, rewarding
 */
export class ProgressBar extends Container {
  private config: ProgressBarConfig;
  private gpuLoader: PixiLoader;
  private atlasName: string;

  // Visual components
  private backgroundGraphics: Graphics;
  private fillGraphics: Graphics;
  private glowGraphics: Graphics;
  private milestoneGraphics: Graphics;
  private borderGraphics: Graphics;
  private labelText: Text;

  // Animation state
  private currentProgress = 0;
  private totalLevels = 10;
  private targetFillWidth = 0;
  private currentFillWidth = 0;
  private isAnimating = false;
  private animationTime = 0;
  private animationDuration = 0.8;
  private glowPulse = 0;

  constructor(gpuLoader: PixiLoader, atlasName: string, config: Partial<ProgressBarConfig> = {}) {
    super();

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.gpuLoader = gpuLoader;
    this.atlasName = atlasName;

    // Layers (back to front)
    this.backgroundGraphics = new Graphics();
    this.addChild(this.backgroundGraphics);

    this.glowGraphics = new Graphics();
    this.addChild(this.glowGraphics);

    this.fillGraphics = new Graphics();
    this.addChild(this.fillGraphics);

    this.milestoneGraphics = new Graphics();
    this.addChild(this.milestoneGraphics);

    this.borderGraphics = new Graphics();
    this.addChild(this.borderGraphics);

    this.labelText = new Text({
      text: '0 / 10',
      style: {
        fontFamily: 'Comic Sans MS, cursive, sans-serif',
        fontSize: 20,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 5 },
        dropShadow: {
          color: '#000000',
          alpha: 0.5,
          blur: 3,
          distance: 3,
        },
      },
    });
    this.labelText.anchor.set(0.5);
    this.addChild(this.labelText);

    this.updateVisuals();
  }

  setProgress(current: number, total: number = 10): void {
    this.currentProgress = Math.max(0, Math.min(current, total));
    this.totalLevels = Math.max(1, total);

    const fillRatio = this.currentProgress / this.totalLevels;
    this.targetFillWidth = (this.config.width - 8) * fillRatio;

    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animationTime = 0;
    }

    this.labelText.text = `${this.currentProgress} / ${this.totalLevels}`;
    this.updateMilestones();
  }

  setTheme(countyColor?: number, tileTheme?: 'regular' | 'fall' | 'winter'): void {
    if (countyColor !== undefined) {
      this.config.themeColor = countyColor;
    }
    if (tileTheme !== undefined) {
      this.config.tileTheme = tileTheme;
    }
    this.updateVisuals();
    this.updateMilestones();
  }

  update(): void {
    // Gentle glow pulse
    this.glowPulse = (Math.sin(Date.now() * 0.002) + 1) / 2;

    if (this.isAnimating) {
      this.animationTime += 0.016;
      const progress = Math.min(1, this.animationTime / this.animationDuration);
      
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      this.currentFillWidth = this.targetFillWidth * eased;

      if (progress >= 1) {
        this.currentFillWidth = this.targetFillWidth;
        this.isAnimating = false;
      }
    }

    this.updateVisuals();
  }

  playFillAnimation(): void {
    this.currentFillWidth = 0;
    this.animationTime = 0;
    this.isAnimating = true;
  }

  private updateVisuals(): void {
    const { width, height } = this.config;
    const padding = 4;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    const radius = 10;
    const colors = this.getThemeColors();

    // Background
    this.backgroundGraphics.clear();
    this.backgroundGraphics.roundRect(0, 0, width, height, radius);
    this.backgroundGraphics.fill({ color: colors.bgOuter, alpha: 0.95 });

    this.backgroundGraphics.roundRect(padding, padding, innerWidth, innerHeight, radius - 2);
    this.backgroundGraphics.fill({ color: colors.bgInner, alpha: 0.9 });

    // Glow layer (pulsing subtly)
    this.glowGraphics.clear();
    if (this.currentFillWidth > 0) {
      const glowWidth = Math.max(radius * 2, this.currentFillWidth);
      const glowAlpha = 0.25 + this.glowPulse * 0.15;
      
      this.glowGraphics.roundRect(
        padding - 2,
        padding - 2,
        glowWidth + 4,
        innerHeight + 4,
        radius
      );
      this.glowGraphics.fill({ color: colors.fill, alpha: glowAlpha });
    }

    // Fill bar
    this.fillGraphics.clear();
    if (this.currentFillWidth > 0) {
      const fillWidth = Math.max(radius * 2, this.currentFillWidth);
      
      // Main fill (bold, saturated)
      this.fillGraphics.roundRect(padding, padding, fillWidth, innerHeight, radius - 2);
      this.fillGraphics.fill(colors.fill);

      // Highlight stripe (top third)
      const highlightHeight = innerHeight * 0.35;
      this.fillGraphics.roundRect(padding, padding, fillWidth, highlightHeight, radius - 2);
      this.fillGraphics.fill({ color: colors.highlight, alpha: 0.4 });

      // Edge shimmer
      const shimmerWidth = 10;
      const shimmerX = Math.max(padding + radius, fillWidth + padding - shimmerWidth);
      this.fillGraphics.rect(shimmerX, padding + 2, shimmerWidth, innerHeight - 4);
      this.fillGraphics.fill({ color: colors.shimmer, alpha: 0.3 });
    }

    // Border
    this.borderGraphics.clear();
    this.borderGraphics.roundRect(0, 0, width, height, radius);
    this.borderGraphics.stroke({ color: colors.border, width: 3, alpha: 0.7 });

    // Label
    this.labelText.x = width / 2;
    this.labelText.y = height / 2;
  }

  private updateMilestones(): void {
    this.milestoneGraphics.clear();

    const { width, height } = this.config;
    const padding = 4;
    const innerWidth = width - padding * 2;
    const spacing = innerWidth / this.totalLevels;
    const yPos = height / 2;
    const colors = this.getThemeColors();

    for (let i = 0; i <= this.totalLevels; i++) {
      const xPos = padding + i * spacing;
      const isCompleted = i <= this.currentProgress;
      const isCurrent = i === this.currentProgress;
      
      const dotRadius = isCurrent ? 5 : 4;
      
      if (isCompleted) {
        // Glow halo
        this.milestoneGraphics.circle(xPos, yPos, dotRadius + 3);
        this.milestoneGraphics.fill({
          color: colors.fill,
          alpha: isCurrent ? 0.5 : 0.25,
        });
        
        // Dot
        this.milestoneGraphics.circle(xPos, yPos, dotRadius);
        this.milestoneGraphics.fill({ color: colors.milestone, alpha: 1 });
      } else {
        // Incomplete
        this.milestoneGraphics.circle(xPos, yPos, dotRadius);
        this.milestoneGraphics.fill({ color: 0x444444, alpha: 0.4 });
      }
    }
  }

  private getThemeColors(): {
    bgOuter: number;
    bgInner: number;
    fill: number;
    highlight: number;
    shimmer: number;
    border: number;
    milestone: number;
  } {
    const baseColor = this.config.themeColor ?? 0x27ae60;

    switch (this.config.tileTheme) {
      case 'fall':
        // Warm, cozy autumn tones
        return {
          bgOuter: 0x2a1810,
          bgInner: 0x1a0f08,
          fill: this.blendColors(baseColor, 0xff7f3f, 0.5),
          highlight: 0xffb380,
          shimmer: 0xffd9a3,
          border: 0xd4956b,
          milestone: 0xffd9a3,
        };
      
      case 'winter':
        return {
          bgOuter: 0x1a1f2e,
          bgInner: 0x0f1420,
          fill: this.blendColors(baseColor, 0x4db8e8, 0.5),
          highlight: 0x87ceeb,
          shimmer: 0xc8e6f5,
          border: 0x7fb8d4,
          milestone: 0xc8e6f5,
        };
      
      default:
        return {
          bgOuter: 0x1a2e1f,
          bgInner: 0x0f1912,
          fill: this.boostSaturation(baseColor, 1.4),
          highlight: 0x90ee90,
          shimmer: 0xc8ffc8,
          border: 0x6bb86b,
          milestone: 0xc8ffc8,
        };
    }
  }

  private boostSaturation(color: number, factor: number): number {
    const r = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
    const g = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
    const b = Math.min(255, Math.round((color & 0xff) * factor));
    return (r << 16) | (g << 8) | b;
  }

  private blendColors(color1: number, color2: number, factor: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.min(255, Math.round(r1 + (r2 - r1) * factor));
    const g = Math.min(255, Math.round(g1 + (g2 - g1) * factor));
    const b = Math.min(255, Math.round(b1 + (b2 - b1) * factor));

    return (r << 16) | (g << 8) | b;
  }

  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    const fillRatio = this.currentProgress / this.totalLevels;
    this.targetFillWidth = (width - 8) * fillRatio;
    this.currentFillWidth = this.targetFillWidth;

    this.updateVisuals();
    this.updateMilestones();
  }
}
