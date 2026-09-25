# Front-End Agent Instructions (Vivaldi Custom Widgets)

## Project Context
Highly optimized, offline-first local widget dashboard designed to run inside Vivaldi Browser via `file://` protocol. 
Vanilla JavaScript (ES6+), CSS3 (Container Queries), HTML5. Zero external frameworks.

## Documentation Map
- `CODEBASE.md`, deep technical reference: architecture, shared services, and structure. Read at session start.
- `UI_GUIDELINES.md`, design languages, aesthetics, and asset rules.

## Critical Rules (READ FIRST)
1. NEVER use `requestAnimationFrame` for elements that update infrequently (like clocks). ALWAYS use aligned `setInterval`.
2. NEVER append elements inside a loop. ALWAYS use `DocumentFragment` to batch DOM updates and trigger only ONE reflow.
3. NEVER make raw external API calls without an Exponential Backoff and `navigator.onLine` check wrapper.
4. ALWAYS enforce Deep Sleep: Wrap intervals, animations, and API polling with `visibilitychange` (and `blur`/`focus`) listeners. Pause them when `document.hidden` is true.
5. ALWAYS check `audioState.enabled`, `document.hidden`, and `prefers-reduced-motion` before allocating Web Audio API buffers (`AudioContext`). Use the Early Return pattern.
6. NEVER use external CDNs for assets. Everything MUST be local (`../assets/`).
7. NEVER duplicate business logic in `themes/`. If it calculates time, fetches data, or formats strings, it belongs in `shared/js/`.

## Non-Default Conventions (Things You'd Get Wrong)
- **Local file:// Execution:** The widgets run locally. Avoid CORS-restricted methods or features that require an HTTPS origin unless communicating with explicitly whitelisted APIs (e.g., Lanyard, Last.fm).
- **Graceful Fallbacks:** Always use `if (window.SharedService)` before calling a shared service to prevent `Uncaught ReferenceError` if the script fails to load.
- **Audio Synthesis:** Do not use `<audio>` tags for procedural sounds (like vinyl crackle). Use `AudioContext` oscillators, but strictly guard them.

## Git Workflow
- Working branches: `theme/<name>` for UI work, `perf/<feature>` for system/performance upgrades.
- NEVER commit unless explicitly requested by the user.
- Commit format: Conventional Commits (`feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `chore:`).
- ALWAYS merge `perf/` branches into `main` first, then inject `main` into the active `theme/` branch.

## Definition of Done
A widget task is done when:
1. Feature components follow the theme-based folder structure.
2. `node -c <file>.js` passes with zero syntax errors.
3. DevTools Performance profiling shows ~0% idle CPU and NO layout thrashing (reflows).
4. Disconnecting the internet does not break the UI or spam console errors.
5. `CODEBASE.md` or `UI_GUIDELINES.md` is updated if new folders or design languages are introduced.