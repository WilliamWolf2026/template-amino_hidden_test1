# Guides

How-to documentation organized by topic.

---

## Quick Navigation

| Guide | Purpose | When to Use |
|-------|---------|-------------|
| [Shared Components](development/shared-components.md) | Reusable UI catalog | Adding game features |
| [Debugging](development/debugging.md) | Fix issues fast | Daily |
| [Animation Cookbook](development/animation-cookbook.md) | GSAP patterns | Adding animations |
| [Asset Pipeline](assets/asset-pipeline.md) | Sprites, fonts, atlases | Adding assets |
| [Performance](platform/performance.md) | Hit 60fps | Pre-launch |
| [Mobile](platform/mobile/index.md) | iOS/Android quirks | Pre-launch |
| [Troubleshooting](troubleshooting.md) | Common issues | When stuck |

---

## By Category

### Development (Daily Use)
- **[Shared Components](development/shared-components.md)** - Reusable component catalog, decision framework, integration checklist
- **[Debugging](development/debugging.md)** - Pixi DevTools, console helpers, common issues
- **[Animation Cookbook](development/animation-cookbook.md)** - GSAP patterns, easings, button states
- **[State Management](development/state-management.md)** - Solid.js signals, game state, persistence

### Assets & Media
- **[Naming Convention](assets/naming-convention.md)** - Standard naming rules for raw assets
- **[Asset Pipeline](assets/asset-pipeline.md)** - TexturePacker, sprites, fonts, atlases
- **[Audio Setup](assets/audio-setup.md)** - Howler.js, audio sprites, music
- **[UID Asset Storage](assets/uid-asset-storage.md)** - Cloud storage with UID-suffixed filenames

### Platform (Pre-Launch)
- **[Performance](platform/performance.md)** - 60fps targets, Pixi optimization, memory
- **[Mobile](platform/mobile/index.md)** - Comprehensive mobile guide
  - [Viewport](platform/mobile/viewport.md) - Dynamic viewport height
  - [Pull-to-Refresh](platform/mobile/pull-to-refresh.md) - Disable PTR
  - [Gestures](platform/mobile/gestures.md) - Block browser gestures
  - [Keyboard](platform/mobile/keyboard.md) - Prevent keyboard/selection
  - [Canvas Resize](platform/mobile/canvas-resize.md) - Pixi/Phaser resize

### Deployment & Infrastructure
- **[Environment Config](deployment/environment-config.md)** - Multi-environment setup (local, QA, prod)
- **[Unified Manifest Design](deployment/unified-manifest-design.md)** - Level manifests and GCS deployment

### Quality
- **[Testing Strategy](testing/testing-strategy.md)** - Unit tests, E2E with Playwright, QA checklist

### Getting Started
- **[New Game](getting-started/new-game.md)** - Create a new game or swap out existing one
- **[Configuration](getting-started/configuration.md)** - Tuning and config systems

### Reference
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

---

## Missing Guides (TODO)

### Nice to Have
- [ ] **Screen Transitions** - Navigation patterns, data passing
- [ ] **Accessibility** - Screen readers, keyboard nav, color contrast
- [ ] **Localization** - Multi-language, RTL layouts
- [ ] **Analytics** - PostHog events, funnel tracking
- [ ] **CI/CD** - Build pipeline, automated deployment
- [ ] **Release Process** - Versioning, changelogs, rollbacks

---

## Folder Structure

```
docs/guides/
├── index.md                 (this file)
├── troubleshooting.md
├── getting-started/
│   ├── new-game.md
│   └── configuration.md
├── development/
│   ├── shared-components.md
│   ├── debugging.md
│   ├── animation-cookbook.md
│   └── state-management.md
├── assets/
│   ├── naming-convention.md
│   ├── asset-pipeline.md
│   ├── audio-setup.md
│   └── uid-asset-storage.md
├── platform/
│   ├── performance.md
│   └── mobile/
│       ├── index.md
│       ├── viewport.md
│       ├── pull-to-refresh.md
│       ├── gestures.md
│       ├── keyboard.md
│       └── canvas-resize.md
├── deployment/
│   ├── environment-config.md
│   └── unified-manifest-design.md
└── testing/
    └── testing-strategy.md
```

---

## Guide Template

When adding a new guide:

```markdown
# Guide Title

Brief description of what this guide covers.

---

## Section

Content here.

---

## Related

- [Other Guide](other-guide.md)
```
