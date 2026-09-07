/**
 * Calendar Service
 * Shared module for building calendar grids, event management, and clock displays.
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
 * Thematic Auto Memory Doll & CH Postal Service Events Store.
 * Defaults are dynamically calculated around the current month so live indicators
 * always populate on load, while allowing custom events to be added.
 */
const _currentDateForDefaults = new Date();
const _defaultYear = _currentDateForDefaults.getFullYear();
const _defaultMonth = _currentDateForDefaults.getMonth();

let _calendarEvents = [
  {
    id: 'evt-1',
    year: _defaultYear,
    month: _defaultMonth,
    day: Math.min(4, new Date(_defaultYear, _defaultMonth + 1, 0).getDate()),
    title: 'Dispatch: Leidenschaftlich Central Station',
    client: 'Lieutenant Colonel Claudia Hodgins',
    time: '08:30 AM',
    tag: 'CH Postal Transit',
    note: 'Delivery of official maritime treaty missives and express parcels via steam train.'
  },
  {
    id: 'evt-2',
    year: _defaultYear,
    month: _defaultMonth,
    day: Math.min(9, new Date(_defaultYear, _defaultMonth + 1, 0).getDate()),
    title: 'Transcription: Royal Letters of Drossel',
    client: 'Princess Charlotte Eberfreya Drossel',
    time: '11:00 AM',
    tag: 'Auto Memory Doll',
    note: 'Draft public courtship correspondence to Prince Damian of Flugel. Handcrafted on vellum paper.'
  },
  {
    id: 'evt-3',
    year: _defaultYear,
    month: _defaultMonth,
    day: Math.min(14, new Date(_defaultYear, _defaultMonth + 1, 0).getDate()),
    title: 'Delivery: Bougainvillea Residence',
    client: 'Dietfried Bougainvillea',
    time: '02:15 PM',
    tag: 'Private Courier',
    note: 'Personal letter delivery. Package sealed with Gilbert’s emerald brooch motif.'
  },
  {
    id: 'evt-4',
    year: _defaultYear,
    month: _defaultMonth,
    day: Math.min(19, new Date(_defaultYear, _defaultMonth + 1, 0).getDate()),
    title: 'Lyrical Transcription: Operetta Manuscript',
    client: 'Irma the Opera Singer',
    time: '04:00 PM',
    tag: 'Song Transcription',
    note: 'Transcribing unfinished aria lyrics. Typewriter ribbon changed to dark indigo ink.'
  },
  {
    id: 'evt-5',
    year: _defaultYear,
    month: _defaultMonth,
    day: Math.min(24, new Date(_defaultYear, _defaultMonth + 1, 0).getDate()),
    title: 'Personal Correspondence: Letter to Gilbert',
    client: 'Violet Evergarden',
    time: '07:30 PM',
    tag: 'Personal Letter',
    note: '“To my dearest Major Gilbert: I am slowly learning what the words ‘I love you’ truly mean.”'
  },
  {
    id: 'evt-6',
    year: _defaultYear,
    month: _defaultMonth,
    day: Math.min(28, new Date(_defaultYear, _defaultMonth + 1, 0).getDate()),
    title: 'Monthly Postal Ledger Review',
    client: 'CH Postal Company Accounting',
    time: '05:00 PM',
    tag: 'Postal Ledger',
    note: 'Auditing postal receipts, wax seal reserves, and delivery routes for the upcoming month.'
  }
];

/**
 * Synchronously retrieves events for a given year and month.
 * @param {number} year
 * @param {number} month (0-11)
 * @returns {Array<Object>}
 */
function getCalendarEvents(year, month) {
  return _calendarEvents.filter(evt => evt.year === year && evt.month === month);
}

/**
 * Asynchronously fetches calendar events (simulates network/service latency).
 * @param {number} year
 * @param {number} month (0-11)
 * @returns {Promise<Array<Object>>}
 */
function fetchCalendarEvents(year, month) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCalendarEvents(year, month));
    }, 40);
  });
}

/**
 * Retrieves events for a specific calendar day.
 * @param {number} year
 * @param {number} month (0-11)
 * @param {number} day (1-31)
 * @returns {Array<Object>}
 */
function getEventsForDate(year, month, day) {
  return _calendarEvents.filter(
    evt => evt.year === year && evt.month === month && evt.day === day
  );
}

/**
 * Adds an event to the calendar service.
 * @param {Object} event
 */
function addCalendarEvent(event) {
  if (!event || typeof event.day !== 'number') return;
  const newEvt = {
    id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    year: typeof event.year === 'number' ? event.year : _defaultYear,
    month: typeof event.month === 'number' ? event.month : _defaultMonth,
    day: event.day,
    title: event.title || 'Untitled Letter',
    client: event.client || 'Anonymous Patron',
    time: event.time || '12:00 PM',
    tag: event.tag || 'Postal Memo',
    note: event.note || ''
  };
  _calendarEvents.push(newEvt);
  return newEvt;
}

/**
 * Builds calendar cells and appends them to container.
 * @param {HTMLElement} container - Container for day cells
 * @param {number} year 
 * @param {number} month (0-11)
 * @param {Date} today 
 * @param {Object} [options] - Optional configuration (events, callbacks)
 */
function buildCalendarGrid(container, year, month, today = new Date(), options = {}) {
  if (!container) return;
  container.innerHTML = '';

  const events = options.events || getCalendarEvents(year, month);
  const eventsByDay = new Map();
  events.forEach(evt => {
    if (!eventsByDay.has(evt.day)) eventsByDay.set(evt.day, []);
    eventsByDay.get(evt.day).push(evt);
  });

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
    d.dataset.day = day;
    d.dataset.month = month;
    d.dataset.year = year;

    if (currentColumn === 0) d.classList.add('sun');
    if (currentColumn === 6) d.classList.add('sat');
    if (today && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      d.classList.add('today');
    }

    const dayEvents = eventsByDay.get(day);
    if (dayEvents && dayEvents.length > 0) {
      d.classList.add('has-event');
      d.dataset.eventCount = dayEvents.length;
    }

    if (typeof options.onRenderDay === 'function') {
      options.onRenderDay(d, { day, month, year, events: dayEvents || [] });
    } else {
      d.textContent = day;
    }

    container.appendChild(d);
  }

  // Next month leading days
  const totalCells = firstDayIndex + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day prev-month next-month';
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

// Global CalendarService export for modern & module-style widget access
const CalendarService = {
  MONTHS_NAMES,
  DAYS_NAMES,
  padZero,
  getEvents: getCalendarEvents,
  fetchEvents: fetchCalendarEvents,
  getEventsForDate,
  addEvent: addCalendarEvent,
  buildCalendarGrid,
  initCalendarWidget
};

if (typeof window !== 'undefined') {
  window.CalendarService = CalendarService;
}

