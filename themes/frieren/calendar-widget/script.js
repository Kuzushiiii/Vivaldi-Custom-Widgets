/**
 * FRIEREN: BEYOND JOURNEY'S END — CALENDAR WIDGET CONTROLLER
 * Aesthetic: Flamme's Ancient Grimoire, Open Manuscript Board, & Zoltraak Magic
 *
 * Architecture:
 * - Dynamic Calendar Matrix: Generates 7-column calendar grid with accurate leap year & overflow calculation.
 * - Current Day Highlight: Tags today with a breathing cyan mana aura and Blue Moon Weed sprout.
 * - Zoltraak Hover: Injects the SVG magic circle symbol into each day cell for 60fps GPU rotation.
 * - Shared Theme Persistence: Syncs 'frieren_day_theme' via localStorage with Day Progression widget.
 * - Zero Browser Tooltips: Strictly removes OS tooltips to preserve the ancient manuscript immersion.
 * - Zero Audio: Strictly peaceful, silent elven navigation.
 */

(function () {
  'use strict';

  // --- CONFIGURATION & CONSTANTS ---
  const ZERO_POINT_DATE_STR = '2026-01-01T00:00:00';
  const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  // --- DOM REFERENCES ---
  const rootEl = document.getElementById('frierenCalendarRoot');
  const currentMonthLabel = document.getElementById('currentMonthLabel');
  const currentYearLabel = document.getElementById('currentYearLabel');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const todayBtn = document.getElementById('todayBtn');
  const calendarGrid = document.getElementById('calendarGrid');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconEl = document.getElementById('themeIcon');
  const footerLoreText = document.getElementById('footerLoreText');

  // --- STATE ---
  let displayedDate = new Date();
  const realToday = new Date();

  // --- HIMMEL LORE CALCULATION ---
  function updateHimmelLoreFooter() {
    const zeroDate = new Date(ZERO_POINT_DATE_STR);
    const zeroMidnight = new Date(zeroDate.getFullYear(), zeroDate.getMonth(), zeroDate.getDate(), 0, 0, 0, 0);
    const nowMidnight = new Date(realToday.getFullYear(), realToday.getMonth(), realToday.getDate(), 0, 0, 0, 0);

    const diffMs = nowMidnight.getTime() - zeroMidnight.getTime();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysPassed = Math.max(1, Math.round(diffMs / MS_PER_DAY) + 1);

    if (footerLoreText) {
      footerLoreText.textContent = `Day ${daysPassed} after the passing of Hero Himmel · The journey continues`;
    }
  }

  // --- CALENDAR GENERATION ENGINE ---
  function renderCalendar() {
    if (!calendarGrid) return;

    const year = displayedDate.getFullYear();
    const month = displayedDate.getMonth();

    // 1. Update Month and Year Header
    if (currentMonthLabel) currentMonthLabel.textContent = MONTH_NAMES[month];
    if (currentYearLabel) currentYearLabel.textContent = String(year);

    // 2. Calendar Calculations
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Total cells: 5 rows (35) or 6 rows (42)
    const totalCells = (firstDayIndex + daysInCurrentMonth > 35) ? 42 : 35;

    // Clear previous cells
    calendarGrid.innerHTML = '';

    const fragment = document.createDocumentFragment();

    // 3. Populate Previous Month Overflow Days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const cell = createDayCell(dayNum, {
        isOtherMonth: true,
        year: month === 0 ? year - 1 : year,
        month: month === 0 ? 11 : month - 1,
        day: dayNum
      });
      fragment.appendChild(cell);
    }

    // 4. Populate Current Month Days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const isToday = (
        year === realToday.getFullYear() &&
        month === realToday.getMonth() &&
        day === realToday.getDate()
      );

      const dayOfWeek = (firstDayIndex + day - 1) % 7;
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

      const cell = createDayCell(day, {
        isOtherMonth: false,
        isToday,
        isWeekend,
        year,
        month,
        day
      });
      fragment.appendChild(cell);
    }

    // 5. Populate Trailing Next Month Overflow Days
    const trailingDays = totalCells - (firstDayIndex + daysInCurrentMonth);
    for (let day = 1; day <= trailingDays; day++) {
      const cell = createDayCell(day, {
        isOtherMonth: true,
        year: month === 11 ? year + 1 : year,
        month: month === 11 ? 0 : month + 1,
        day
      });
      fragment.appendChild(cell);
    }

    calendarGrid.appendChild(fragment);
  }

  /**
   * Constructs individual day cell with NO title attributes to kill native OS browser tooltips.
   */
  function createDayCell(dayNumber, meta) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('tabindex', '0');

    if (meta.isOtherMonth) cell.classList.add('cal-day-other');
    if (meta.isWeekend) cell.classList.add('cal-day-weekend');
    if (meta.isToday) cell.classList.add('cal-day-today');

    const padMonth = String(meta.month + 1).padStart(2, '0');
    const padDay = String(meta.day).padStart(2, '0');
    cell.dataset.date = `${meta.year}-${padMonth}-${padDay}`;
    // NOTE: Strictly NO cell.title attribute to prevent modern OS tooltip interruption!

    // 1. Injected SVG Zoltraak Magic Circle (for smooth GPU-accelerated hover rotation)
    const magicSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    magicSvg.setAttribute('class', 'day-magic-circle');
    magicSvg.setAttribute('aria-hidden', 'true');
    const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#zoltraakCircle');
    useEl.setAttribute('href', '#zoltraakCircle');
    magicSvg.appendChild(useEl);
    cell.appendChild(magicSvg);

    // 2. Day Number Label
    const numSpan = document.createElement('span');
    numSpan.className = 'day-num';
    numSpan.textContent = String(dayNumber);
    cell.appendChild(numSpan);

    // 3. Current Day Special Markers (Mana Stream Aura & Blue Moon Weed Sprout)
    if (meta.isToday) {
      const aura = document.createElement('div');
      aura.className = 'today-mana-aura';
      aura.setAttribute('aria-hidden', 'true');
      cell.appendChild(aura);

      const flowerSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      flowerSvg.setAttribute('class', 'today-flora-marker');
      flowerSvg.setAttribute('aria-hidden', 'true');
      const flowerUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      flowerUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#miniMoonWeed');
      flowerUse.setAttribute('href', '#miniMoonWeed');
      flowerSvg.appendChild(flowerUse);
      cell.appendChild(flowerSvg);
    }

    return cell;
  }

  // --- NAVIGATION LISTENERS ---
  function initNavigation() {
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        displayedDate.setMonth(displayedDate.getMonth() - 1);
        renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        displayedDate.setMonth(displayedDate.getMonth() + 1);
        renderCalendar();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        displayedDate = new Date();
        renderCalendar();
      });
    }
  }

  // --- SHARED THEME PERSISTENCE ---
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

    // Synchronize if Day Progression widget switches theme in another tile
    window.addEventListener('storage', (e) => {
      if (e.key === 'frieren_day_theme' && e.newValue) {
        setTheme(e.newValue);
      }
    });
  }

  function setTheme(theme) {
    rootEl.setAttribute('data-theme', theme);
    localStorage.setItem('frieren_day_theme', theme);

    if (themeIconEl) {
      themeIconEl.textContent = theme === 'night' ? '☀' : '☽';
    }
  }

  // --- INITIALIZATION ---
  initTheme();
  initNavigation();
  updateHimmelLoreFooter();
  renderCalendar();

})();
