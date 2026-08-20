/**
 * Calendar Service
 * Shared module for building calendar grids and updating clock displays.
 */

const MONTHS_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const DAYS_NAMES = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
];

function padZero(n) {
  return String(n).padStart(2, '0');
}

/**
 * Builds calendar cells and appends them to container.
 * @param {HTMLElement} container - Container for day cells
 * @param {number} year 
 * @param {number} month (0-11)
 * @param {Date} today 
 */
function buildCalendarGrid(container, year, month, today = new Date()) {
  if (!container) return;
  container.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysCount = new Date(year, month, 0).getDate();

  // Previous month trailing days
  for (let i = 0; i < firstDayIndex; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day prev-month';
    if (i === 0) d.classList.add('sun');
    d.textContent = prevDaysCount - firstDayIndex + 1 + i;
    container.appendChild(d);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = document.createElement('div');
    const currentColumn = (firstDayIndex + day - 1) % 7;
    d.className = 'cal-day';
    if (currentColumn === 0) d.classList.add('sun');
    if (currentColumn === 6) d.classList.add('sat');
    if (today && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      d.classList.add('today');
    }
    d.textContent = day;
    container.appendChild(d);
  }

  // Next month leading days
  const totalCells = firstDayIndex + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day prev-month';
    const currentColumn = (totalCells + i - 1) % 7;
    if (currentColumn === 0) d.classList.add('sun');
    if (currentColumn === 6) d.classList.add('sat');
    d.textContent = i;
    container.appendChild(d);
  }
}

/**
 * Initializes clock and calendar updates
 */
function initCalendarWidget(config = {}) {
  const elements = {
    h1: document.getElementById(config.h1Id || 'h1'),
    h2: document.getElementById(config.h2Id || 'h2'),
    m1: document.getElementById(config.m1Id || 'm1'),
    m2: document.getElementById(config.m2Id || 'm2'),
    monthName: document.getElementById(config.monthNameId || 'monthName'),
    dayLabel: document.getElementById(config.dayLabelId || 'dayLabel'),
    calBody: document.getElementById(config.calBodyId || 'calBody'),
  };

  let lastRenderedDateKey = '';

  function update() {
    const now = new Date();
    const h = padZero(now.getHours());
    const m = padZero(now.getMinutes());

    if (elements.h1) elements.h1.textContent = h[0];
    if (elements.h2) elements.h2.textContent = h[1];
    if (elements.m1) elements.m1.textContent = m[0];
    if (elements.m2) elements.m2.textContent = m[1];

    if (elements.monthName) {
      elements.monthName.textContent = `${MONTHS_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    }
    if (elements.dayLabel) {
      elements.dayLabel.textContent = DAYS_NAMES[now.getDay()];
    }

    const currentDateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (currentDateKey !== lastRenderedDateKey && elements.calBody) {
      buildCalendarGrid(elements.calBody, now.getFullYear(), now.getMonth(), now);
      lastRenderedDateKey = currentDateKey;
    }

    if (typeof config.onUpdate === 'function') {
      config.onUpdate({ now, hours: h, minutes: m });
    }
  }

  update();
  return setInterval(update, config.interval || 1000);
}
