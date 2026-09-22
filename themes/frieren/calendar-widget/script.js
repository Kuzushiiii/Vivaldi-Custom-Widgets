/**
 * FRIEREN: BEYOND JOURNEY'S END — CALENDAR WIDGET CONTROLLER
 * Aesthetic: Frieren Adventuring Outfit (White Robe, Gold Trim, Teal Magic, Ruby Gem)
 *
 * Architecture:
 * - Dynamic Calendar Matrix: Computes accurate 7-column calendar with leap year & overflow calculation.
 * - Navigation: Jump to today, navigate previous/next months.
 * - Himmel Chronometry: Accurately computes days elapsed since the passing of Hero Himmel.
 * - Clean DOM: Zero unnecessary wrapper bloat, 100% vanilla JS.
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
  const currentMonthLabel = document.getElementById('currentMonthLabel');
  const currentYearLabel = document.getElementById('currentYearLabel');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const todayBtn = document.getElementById('todayBtn');
  const calendarGrid = document.getElementById('calendarGrid');
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
      footerLoreText.textContent = `Day ${daysPassed} after the passing of Hero Himmel`;
    }
  }

  // --- CALENDAR GENERATION ENGINE ---
  function renderCalendar() {
    if (!calendarGrid) return;

    const year = displayedDate.getFullYear();
    const month = displayedDate.getMonth();

    // 1. Update Month and Year Header Inscriptions
    if (currentMonthLabel) currentMonthLabel.textContent = MONTH_NAMES[month];
    if (currentYearLabel) currentYearLabel.textContent = String(year);

    // 2. Calendar Date Calculations
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
   * Constructs individual floating day cell.
   * Special days like today receive .cal-day-today (styled as glowing ruby gem).
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

    // Inline SVG: Himmel's Mirrored Lotus Ring for Today, or Blooming Spell for regular days
    const svgHtml = meta.isToday
      ? `<svg class="silver-lotus-magic" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M 20 34 Q 6 20 20 6 Q 34 20 20 34 M 20 30 Q 12 20 20 10 Q 28 20 20 30" fill="none" stroke="rgba(136, 212, 208, 0.85)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
        </svg>`
      : `<svg class="bloom-magic" viewBox="0 0 40 40" aria-hidden="true">
          <path d="M 20 35 C 11 35 5 28 5 20 C 5 11 11 5 20 5 C 22 1 27 2 26 6 C 25 8 22 7 20 5 C 29 5 35 11 35 20 C 35 28 29 35 21 35 C 17 35 15 31 18 29 C 21 27 24 30 22 33" pathLength="100" fill="none" stroke="var(--teal-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>`;

    cell.innerHTML = `
      ${svgHtml}
      <span class="day-num">${dayNumber}</span>
    `;

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

  // --- INITIALIZATION ---
  initNavigation();
  updateHimmelLoreFooter();
  renderCalendar();

})();
