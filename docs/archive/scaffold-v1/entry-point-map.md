# Entry Point Map

Visual traversal from build output through providers, screens, game phases, and core systems.

See also: [entry-points.md](entry-points.md) (detailed text), [architecture.md](architecture.md), [context-map.md](context-map.md)

---

```mermaid
graph TD
    subgraph Build
        SERVER[".output/server/index.mjs"]
        HTML[".output/public/index.html"]
    end

    subgraph Entry
        EC["entry-client.tsx"]
        ES["entry-server.tsx"]
    end

    subgraph Providers
        APP["app.tsx onMount"]
        GB["GlobalBoundary"]
        TP["TuningProvider"]
        VMW["ViewportModeWrapper"]
        PP["PauseProvider"]
        MP["ManifestProvider"]
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

    subgraph State
        GState["gameState singleton"]
        PROG["progress.ts"]
        CAT["chapterCatalog.ts"]
    end

    SERVER --> ES
    HTML --> EC
    EC --> APP
    ES --> APP
    APP --> GB
    GB --> TP
    TP --> VMW
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

    GS --> GState
    GS --> PROG
    GS --> CAT
```
