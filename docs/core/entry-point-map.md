# Entry Point Map

Visual traversal from Vite entry through providers, screens, game phases, and core systems.

See also: [entry-points.md](entry-points.md) (detailed text), [architecture-map.md](architecture-map.md), [context-map.md](context-map.md)

---

```mermaid
graph TD
    subgraph Build
        DIST["dist/index.html"]
    end

    subgraph Entry
        IDX["index.html"]
    end

    subgraph Providers
        APP["app.tsx onMount"]
        GB["GlobalBoundary"]
        TP["TuningProvider"]
        ANA["AnalyticsProvider"]
        FF["FeatureFlagProvider"]
        VMW["ViewportModeWrapper"]
        PP["PauseProvider"]
        MP["ManifestProvider\n(manifest, defaultGameData,\nserverStorageUrl)"]
        AP["AssetProvider"]
        SP["ScreenProvider"]
        SR["ScreenRenderer"]
    end

    subgraph Screens
        LS["LoadingScreen"]
        SS["StartScreen"]
        GS["GameScreen"]
        RS["ResultsScreen"]
    end

    subgraph GamePhases
        INTRO["Introduction"]
        LOADP["Loading Puzzle"]
        CS["Chapter Start"]
        PLAY["Playing"]
        CLUE["CluePopup\nmid-chapter"]
        COMP["CompanionOverlay\nchapter end"]
    end

    subgraph Core
        CLG["CityLinesGame"]
        CGS["ChapterGenerationService"]
        LGS["LevelGenerationService"]
        GAM["GameAudioManager"]
        TH["TutorialHand"]
    end

    subgraph Modules
        SB["SpriteButton\nprimitives"]
        PBM["ProgressBar\nprimitives"]
        DB["DialogueBox\nprimitives"]
        CSP["CharacterSprite\nprimitives"]
        AVP["AvatarPopup\nprefabs"]
        LCC["LevelCompletionController\nlogic"]
    end

    subgraph State
        GState["gameState singleton"]
        PROG["progress.ts"]
        CAT["chapterCatalog.ts"]
    end

    DIST --> IDX
    IDX --> APP
    APP --> GB
    GB --> TP
    TP --> ANA
    ANA --> FF
    FF --> VMW
    VMW --> PP
    PP --> MP
    MP --> AP
    AP --> SP
    SP --> SR

    SR --> LS
    LS -->|new game| SS
    LS -->|resume| GS
    SS --> GS
    GS --> RS
    RS -->|play again| GS
    RS -->|main menu| SS

    GS --> INTRO
    INTRO --> LOADP
    LOADP --> CS
    CS --> PLAY
    PLAY --> CLUE
    PLAY --> COMP
    CLUE -->|next level| PLAY
    COMP -->|next chapter| INTRO

    GS --> CLG
    GS --> GAM
    GS --> CGS
    CLG --> LGS
    CLG --> TH

    CLG --> SB
    CLG --> PBM
    CLG --> DB
    CLG --> CSP
    CLG --> AVP
    CLG --> LCC

    GS --> GState
    GS --> PROG
    GS --> CAT
```
