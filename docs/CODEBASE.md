# Frontend Codebase Reference (Vivaldi Custom Widgets)

Deep, factual reference for AI agents and developers. 
If you modify code that alters any architecture, shared services, or folder structures documented here, update this file in the same change.
Operational instructions & boundaries: [`AGENTS.md`](./AGENTS.md).

## 1. Stack

| Layer | Technology | Details |
|---|---|---|
| Environment | Vivaldi Browser | Chromium-based, running via `file://` |
| Logic | Vanilla JS (ES6+) | No transpilers, strict mode enabled (`'use strict';`) |
| Styling | Custom CSS3 | Native CSS Variables, Flexbox/Grid, Container Queries (`@container`) |
| DOM Manipulation| Native DOM API | `getElementById`, `DocumentFragment`, Event Delegation |
| Audio | Web Audio API | Procedural synthesis (Oscillators, BiquadFilters) with AudioGuard |
| Storage | LocalStorage | Synchronous key-value storage for settings (e.g., `p5_cal_sound`) |

## 2. Architecture (How Things Connect)

```text
Vivaldi Start Page (Iframe, `file://` protocol)
  → themes/<theme-name>/<widget-name>/index.html (Entry Point)
      │
      ├── [Stylesheets]
      │   ├── <link rel="stylesheet" href="../../../shared/css/..."> (Global resets & utility classes)
      │   ├── <link rel="stylesheet" href="../theme-base.css"> (Theme CSS Variables: colors, typography, motifs)
      │   └── <link rel="stylesheet" href="style.css"> (Widget-specific layout & @container queries)
      │
      ├── [Core Services Injection] (shared/js/)
      │   ├── Injects engine logic (e.g., `song-viewer-service.js`, `day-progression.js`)
      │   ├── Binds to global `window.<ServiceName>` for graceful fallback checks
      │   ├── Executes network requests with Exponential Backoff & `navigator.onLine` guards
      │   └── Utilizes `_memoCache` to prevent redundant `JSON.parse()` processing
      │
      └── [UI Controller] (script.js)
          ├── 1. State Initialization
          │   └── Reads `localStorage` (e.g., `p5_cal_sound`) to initialize `audioState.enabled`
          ├── 2. Hardware & Resource Guards (Deep Sleep)
          │   ├── Listens to `visibilitychange`, `blur`, `focus` to pause intervals/polling
          │   └── Checks `prefers-reduced-motion` to bypass heavy CSS transitions
          ├── 3. DOM Manipulation
          │   ├── Requests processed data from `window.<ServiceName>`
          │   └── Batches DOM updates into `DocumentFragment` to enforce exactly 1 DOM Reflow
          └── 4. Procedural Audio (Audio Guard)
              └── Applies Early Return pattern to block `new AudioContext()` allocation if muted or hidden
```

## 3. Project Structure

```text
Vivaldi-Custom-Widgets/
├── docs/                                  # Engineering Playbook & AI Guidelines (AGENTS.md, CODEBASE.md, UI_GUIDELINES.md)
├── shared/
│   └── js/                                # CORE LOGIC: Centralized services (e.g., day-progression.js, song-viewer-service.js). STRICTLY NO UI logic here.
├── themes/                                # UI & PRESENTATION: Visual implementations grouped by design language
│   ├── frieren/                           # Frieren Theme (Magic, Elven Grimoire aesthetic)
│   │   ├── calendar-widget/               # Widget: Calendar with DocumentFragment reflow optimization
│   │   ├── day-progression/               # Widget: Daily time progression
│   │   ├── song-viewer/                   # Widget: Music player API integration
│   │   └── theme-base.css                 # Source of truth for Frieren CSS variables (colors, fonts, metrics)
│   ├── persona-5/                         # Persona 5 Theme (Neubrutalism, High Contrast)
│   │   ├── assets/                        # Local offline fonts and images (e.g., Phantom Thieves motifs)
│   │   ├── calendar-widget/               # Widget: P5 stylized calendar
│   │   ├── day-progression/               # Widget: P5 daily phase tracking
│   │   ├── gif-widget/                    # Widget: Local GIF rendering with CSS fallback
│   │   ├── gif-widget-2/                  # Widget: Secondary local GIF rendering
│   │   ├── song-viewer/                   # Widget: P5 stylized music player
│   │   └── theme-base.css                 # Source of truth for Persona 5 CSS variables
│   └── violet-evergarden/                 # Violet Evergarden Theme (Vintage, Automemories, Typewriter)
│       ├── assets/                        # Local offline assets (e.g., violet-typing.gif, violet-flower.gif)
│       ├── calendar-widget/               # Widget: Vintage parchment calendar with page-turn AudioGuard
│       ├── day-progression/               # Widget: 1 FPS typewriter day progression
│       ├── gif-widget/                    # Widget: Local GIF rendering (offline-bundled)
│       ├── gif-widget-2/                  # Widget: Secondary local GIF rendering (offline-bundled)
│       ├── song-viewer/                   # Widget: Vinyl tonearm procedural WebAudio synth
│       └── theme-base.css                 # Source of truth for Violet Evergarden CSS variables
├── vivaldi-css/                           # Global browser-level custom CSS injects for Vivaldi Browser UI modifications
├── .gitignore                             # Git untracked files configuration
├── index.html                             # Main showroom/dashboard entry point for previewing all widgets
├── LICENSE                                # Project open-source license
└── README.md                              # High-level project overview
```