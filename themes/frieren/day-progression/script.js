/**
 * FRIEREN: BEYOND JOURNEY'S END — DAY PROGRESSION CONTROLLER
 * Aesthetic: Serene Fantasy, Melancholic Elven Magic, & Eternal Time
 *
 * Architecture:
 * - Dynamic Lore Subtitle: Computes days since hero Himmel's departure (1-indexed from 2026-01-01).
 * - Temporal Mana Stream: Calculates exact percentage of the 24-hour day elapsed.
 * - The Blue Moon Weed Beacon: Tracks the leading edge of the mana stream with smooth interpolation.
 * - Theme Switcher: Seamless toggling between Ancient Grimoire (Parchment) and Deep Night Sky.
 * - Performance: High-efficiency RAF loop (100ms throttle), zero CPU overhead, strictly no hover audio.
 */

(function () {
  'use strict';

  // --- CONFIGURATION & DOM ELEMENTS ---
  const ZERO_POINT_DATE_STR = '2026-01-01T00:00:00';
  const TOTAL_MS_IN_DAY = 86400000;

  const rootEl = document.getElementById('frierenDayRoot');
  const liveClockEl = document.getElementById('liveClock');
  const percentNumEl = document.getElementById('percentNum');
  const himmelLoreTextEl = document.getElementById('himmelLoreText');
  const phaseTitleEl = document.getElementById('phaseTitle');
  const phaseDescEl = document.getElementById('phaseDesc');
  const manaFillEl = document.getElementById('manaFill');
  const manaBeaconEl = document.getElementById('manaBeacon');
  const timeLeftEl = document.getElementById('timeLeft');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconEl = document.getElementById('themeIcon');

  // --- TEMPORAL PHASES (FRIEREN LORE & JOURNEY MOODS) ---
  const TEMPORAL_PHASES = [
    {
      maxMinutes: 5 * 60,
      title: 'ERA OF PEACE · NORTHERN SKIES',
      desc: "Stars shine quietly above the wanderer's campsite"
    },
    {
      maxMinutes: 8 * 60 + 30,
      title: 'ERA OF PEACE · DAWN MIST',
      desc: 'Morning mist drifts softly through ancient woods'
    },
    {
      maxMinutes: 12 * 60,
      title: 'ERA OF PEACE · MORNING STRIDE',
      desc: 'A calm, unhurried walk along cobblestone trails'
    },
    {
      maxMinutes: 15 * 60 + 30,
      title: 'ERA OF PEACE · GRIMOIRE STUDY',
      desc: 'Studying simple spells over a warm cup of tea'
    },
    {
      maxMinutes: 18 * 60 + 30,
      title: 'ERA OF PEACE · BLUE MOON WEED',
      desc: 'Petals blossom beneath the warm afternoon sun'
    },
    {
      maxMinutes: 21 * 60 + 30,
      title: 'ERA OF PEACE · SUNSET MEMORIES',
      desc: 'Remembering warm smiles from ten years spent together'
    },
    {
      maxMinutes: 24 * 60,
      title: 'ERA OF PEACE · SILENT NOCTURNE',
      desc: 'Time flows eternal beneath the blanket of night'
    }
  ];

  let lastFrameTime = 0;

  // --- HELPER FUNCTIONS ---
  function pad(num, size = 2) {
    return String(num).padStart(size, '0');
  }

  /**
   * Calculates the exact 1-indexed days passed since Hero Himmel's passing.
   * Day 1 is defined as January 1, 2026.
   */
  function calculateHimmelDays(now = new Date()) {
    const zeroDate = new Date(ZERO_POINT_DATE_STR);
    
    // Normalize both dates to local calendar midnight to ensure reliable midnight boundaries
    const zeroMidnight = new Date(zeroDate.getFullYear(), zeroDate.getMonth(), zeroDate.getDate(), 0, 0, 0, 0);
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const diffMs = nowMidnight.getTime() - zeroMidnight.getTime();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    
    // 1-indexed day count
    const daysPassed = Math.round(diffMs / MS_PER_DAY) + 1;
    return Math.max(1, daysPassed);
  }

  /**
   * Retrieves the thematic phase corresponding to the current time of day.
   */
  function getTemporalPhase(hours, minutes) {
    const currentMinutes = hours * 60 + minutes;
    for (let i = 0; i < TEMPORAL_PHASES.length; i++) {
      if (currentMinutes < TEMPORAL_PHASES[i].maxMinutes) {
        return TEMPORAL_PHASES[i];
      }
    }
    return TEMPORAL_PHASES[TEMPORAL_PHASES.length - 1];
  }

  /**
   * Computes telemetry data for current instant.
   */
  function calculateTelemetry() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const msPassed = now.getTime() - startOfDay.getTime();
    const percent = Math.min(100, Math.max(0, (msPassed / TOTAL_MS_IN_DAY) * 100));

    const remainingMs = Math.max(0, TOTAL_MS_IN_DAY - msPassed);
    const remHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    return {
      percent,
      formattedPercent: percent.toFixed(1),
      clockString: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      remainingString: `Time Left: ${pad(remHours)}h ${pad(remMinutes)}m`,
      himmelDays: calculateHimmelDays(now),
      phase: getTemporalPhase(hours, minutes)
    };
  }

  /**
   * Main render update function.
   */
  function updateWidget() {
    const data = calculateTelemetry();

    if (liveClockEl) {
      liveClockEl.textContent = data.clockString;
    }
    if (percentNumEl) {
      percentNumEl.textContent = data.formattedPercent;
    }
    if (timeLeftEl) {
      timeLeftEl.textContent = data.remainingString;
    }

    if (himmelLoreTextEl) {
      himmelLoreTextEl.textContent = `Day ${data.himmelDays} after the passing of Hero Himmel.`;
    }

    if (phaseTitleEl) {
      phaseTitleEl.textContent = data.phase.title;
    }
    if (phaseDescEl) {
      phaseDescEl.textContent = data.phase.desc;
    }

    if (manaFillEl) {
      manaFillEl.style.width = `${data.percent}%`;
    }
    if (manaBeaconEl) {
      manaBeaconEl.style.left = `${data.percent}%`;
    }
  }

  /**
   * High performance loop throttled to ~100ms.
   */
  function tick(timestamp) {
    if (timestamp - lastFrameTime >= 100) {
      updateWidget();
      lastFrameTime = timestamp;
    }
    requestAnimationFrame(tick);
  }

  // --- THEME SWITCHER (PARCHMENT <-> DEEP NIGHT SKY) ---
  function initTheme() {
    const savedTheme = localStorage.getItem('frieren_day_theme') || 'parchment';
    setTheme(savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = rootEl.getAttribute('data-theme') || 'parchment';
        const nextTheme = currentTheme === 'parchment' ? 'night' : 'parchment';
        setTheme(nextTheme);
      });
    }
  }

  function setTheme(theme) {
    rootEl.setAttribute('data-theme', theme);
    localStorage.setItem('frieren_day_theme', theme);

    if (themeIconEl) {
      themeIconEl.textContent = theme === 'night' ? '☀' : '☽';
    }
    if (themeToggleBtn) {
      themeToggleBtn.title = theme === 'night'
        ? 'Switch to Parchment Grimoire Mode'
        : 'Switch to Deep Night Sky Mode';
    }
  }

  // --- INITIALIZATION ---
  initTheme();
  updateWidget();
  requestAnimationFrame(tick);

})();
