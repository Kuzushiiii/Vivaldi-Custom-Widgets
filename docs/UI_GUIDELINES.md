# UI/UX & Styling Guidelines

## 1. Local Assets & Fallbacks (Offline-First UI)
- **No External Media:** All images, GIFs, and fonts MUST be referenced locally (`../assets/`).
- **Performance Attributes:** Large assets like GIFs MUST include `loading="lazy" decoding="async"`.
- **CSS Fallbacks:** Every image/GIF container MUST have an `onerror="this.classList.add('gif-load-failed')"` handler.

## 2. Layout & Typography
- **Centering:** Use Flexbox or CSS Grid. Avoid hardcoded `px` widths/heights; use `rem`, `%`, or `fr` for responsive scaling.
- **Root Sizing:** Use CSS Container Queries (`@container`) instead of Media Queries (`@media`) since widgets run inside iframes.

## 3. Theme Design Languages

### 1. Persona 5 (Neubrutalism)
- **Concept:** Edgy, dynamic, high-contrast Neubrutalism.
- **Colors:** Pure Red, Deep Black, Bright White, Warning Yellow.
- **Typography:** Heavy, italicized, bold sans-serifs.
- **Motifs:** Angled blocks, offset black drop-shadows, jagged edges.

### 2. Violet Evergarden (Vintage Automemories)
- **Concept:** 19th-century post office, analog mechanics.
- **Colors:** Sepia parchment, Crimson Red wax, Emerald Green, faded ink.
- **Typography:** Vintage Typewriter fonts, elegant cursive scripts.
- **Motifs:** Typewriter mechanisms, vinyl tonearms, letters, wax seals.

### 3. Frieren (Elven Grimoire)
- **Concept:** Pristine, magical, lore-accurate artifacts.
- **Colors:** White fabric bases, Gold trims, Cyan magic circles, Silver metallic.
- **Typography:** Classic Serif (e.g., *Cinzel*).
- **Motifs:** Himmel's Silver Lotus Ring, Fern's Crescent/Butterfly, Stark's Axe.
