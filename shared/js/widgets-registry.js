/**
 * Vivaldi Custom Widgets Registry
 * Central metadata registry for themes and widgets.
 * Allows adding new themes and widgets without modifying index.html.
 */

const THEMES_REGISTRY = [
  {
    id: "persona-5",
    name: "Persona 5",
    badgeClass: "persona",
    badgeColor: "#ff334b",
    icon: `<polygon points="12,2 22,9 18,22 6,22 2,9"/><path d="M7 11c1-1 3-1 4 1M17 11c-1-1-3-1-4 1"/>`
  },
  {
    id: "violet-evergarden",
    name: "Violet Evergarden",
    badgeClass: "violet",
    badgeColor: "#d4af37",
    icon: `<rect x="3" y="5" width="18" height="14"/><polyline points="3,7 12,13 21,7"/>`
  },
  {
    id: "frieren",
    name: "Sousou no Frieren",
    badgeClass: "frieren",
    badgeColor: "#6ee7b7",
    icon: `<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>`
  }
];

const WIDGETS_REGISTRY = [
  // ==========================================
  // PERSONA 5 WIDGETS
  // ==========================================
  {
    theme: "persona-5",
    category: "calendar",
    title: "Calendar & Clock",
    fullName: "Persona 5 Calendar & Clock",
    desc: "Comic digital clock, day indicator & Phantom mask.",
    path: "themes/persona-5/calendar-widget/index.html"
  },
  {
    theme: "persona-5",
    category: "day-progression",
    title: "Day Progression",
    fullName: "Persona 5 Day Progression",
    desc: "Meta-Nav daily infiltration percentage & phases.",
    path: "themes/persona-5/day-progression/index.html"
  },
  {
    theme: "persona-5",
    category: "song-viewer",
    title: "Song Viewer (Radio HUD)",
    fullName: "Persona 5 Song Viewer (Phantom Radio HUD)",
    desc: "Now-Playing HUD with Lanyard, Last.fm & 'Life Will Change'.",
    path: "themes/persona-5/song-viewer/index.html"
  },
  {
    theme: "persona-5",
    category: "gif",
    title: "Royal GIF Cut-In",
    fullName: "Persona 5 GIF Cut-in Banner",
    desc: "Dynamic Royal cut-in animation banner.",
    path: "themes/persona-5/gif-widget/index.html"
  },
  {
    theme: "persona-5",
    category: "gif",
    title: "All-Out Attack GIF",
    fullName: "Persona 5 Atmospheric Cut-in 2",
    desc: "Aesthetic alternate character cut-in banner.",
    path: "themes/persona-5/gif-widget-2/index.html"
  },

  // ==========================================
  // VIOLET EVERGARDEN WIDGETS
  // ==========================================
  {
    theme: "violet-evergarden",
    category: "calendar",
    title: "Letterhead Calendar",
    fullName: "Violet Evergarden Auto Memory Doll Calendar",
    desc: "Wax seal, typewriter torn notes & paper sound DSP.",
    path: "themes/violet-evergarden/calendar-widget/index.html"
  },
  {
    theme: "violet-evergarden",
    category: "day-progression",
    title: "Typewriter Carriage",
    fullName: "Violet Evergarden Typewriter Carriage Day Progression",
    desc: "Platen roller, dual-tone ribbon & brass margin scale.",
    path: "themes/violet-evergarden/day-progression/index.html"
  },
  {
    theme: "violet-evergarden",
    category: "song-viewer",
    title: "Postal Phonograph",
    fullName: "Violet Evergarden CH Postal Phonograph",
    desc: "Vintage vinyl gramophone, tonearm needle & 'Sincerely'.",
    path: "themes/violet-evergarden/song-viewer/index.html"
  },
  {
    theme: "violet-evergarden",
    category: "gif",
    title: "Typing GIF Banner",
    fullName: "Violet Evergarden Typing GIF Banner",
    desc: "Atmospheric animated banner of Violet typing letters.",
    path: "themes/violet-evergarden/gif-widget/index.html"
  },
  {
    theme: "violet-evergarden",
    category: "gif",
    title: "Bougainvillea Flowers GIF",
    fullName: "Violet Evergarden Bougainvillea Flowers GIF",
    desc: "Aesthetic anime floral banner with bougainvillea motif.",
    path: "themes/violet-evergarden/gif-widget-2/index.html"
  },
  {
    theme: "frieren",
    category: "calendar",
    title: "Grimoire Calendar",
    fullName: "Frieren Flamme's Grimoire Calendar",
    desc: "Zoltraak runes, Blue Moon Weed markers & ancient parchment memo notes.",
    path: "themes/frieren/calendar-widget/index.html"
  },
  {
    theme: "frieren",
    category: "day-progression",
    title: "Era of Peace Day Progression",
    fullName: "Frieren Era of Peace Day Progression",
    desc: "Temporal chronometer, daily phase tracker & starlight night sky toggle.",
    path: "themes/frieren/day-progression/index.html"
  },
  {
    theme: "frieren",
    category: "song-viewer",
    title: "Elven Staff Crystal",
    fullName: "Frieren Elven Staff Crystal Song Viewer",
    desc: "Zoltraak magic circles visualizer, Lanyard, Last.fm & 'Anytime Anywhere'.",
    path: "themes/frieren/song-viewer/index.html"
  },
  {
    theme: "frieren",
    category: "gif",
    title: "Sleeping Frieren GIF",
    fullName: "Frieren Sleeping GIF Widget",
    desc: "Aesthetic animated banner of Frieren sleeping peacefully.",
    path: "themes/frieren/gif-widget/index.html"
  }
];

if (typeof window !== "undefined") {
  window.THEMES_REGISTRY = THEMES_REGISTRY;
  window.WIDGETS_REGISTRY = WIDGETS_REGISTRY;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { THEMES_REGISTRY, WIDGETS_REGISTRY };
}
