/**
 * Calendar Service
 * Core service for calendar grids, date calculations, and generic event storage.
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

let _calendarEvents = [];

function setCalendarEvents(events = []) {
  _calendarEvents = Array.isArray(events) ? [...events] : [];
}

function getCalendarEvents(year, month) {
  return _calendarEvents.filter(evt => evt.year === year && evt.month === month);
}

function fetchCalendarEvents(year, month) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getCalendarEvents(year, month));
    }, 20);
  });
}

function getEventsForDate(year, month, day) {
  return _calendarEvents.filter(
    evt => evt.year === year && evt.month === month && evt.day === day
  );
}

function addCalendarEvent(event) {
  if (!event || typeof event.day !== 'number') return null;
  const now = new Date();
  const newEvt = {
    id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    year: typeof event.year === 'number' ? event.year : now.getFullYear(),
    month: typeof event.month === 'number' ? event.month : now.getMonth(),
    day: event.day,
    title: event.title || 'Untitled Event',
    client: event.client || '',
    time: event.time || '',
    tag: event.tag || '',
    note: event.note || ''
  };
  _calendarEvents.push(newEvt);
  return newEvt;
}

function buildCalendarGrid(container, year, month, today = new Date(), options = {}) {
  if (!container) return;
  const frag = document.createDocumentFragment();

  const events = options.events || getCalendarEvents(year, month);
  const eventsByDay = new Map();
  events.forEach(evt => {
    if (!eventsByDay.has(evt.day)) eventsByDay.set(evt.day, []);
    eventsByDay.get(evt.day).push(evt);
  });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysCount = new Date(year, month, 0).getDate();

  const appendDayNumber = (el, num) => {
    if (options.wrapDayNum) {
      const span = document.createElement('span');
      span.className = 'day-num';
      span.textContent = num;
      el.appendChild(span);
    } else {
      el.textContent = num;
    }
  };

  // Previous month trailing days
  for (let i = 0; i < firstDayIndex; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day prev-month' + (i === 0 ? ' sun' : '');
    d.setAttribute('role', 'gridcell');
    appendDayNumber(d, prevDaysCount - firstDayIndex + 1 + i);
    frag.appendChild(d);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = document.createElement('div');
    const currentColumn = (firstDayIndex + day - 1) % 7;
    d.className = 'cal-day';
    d.setAttribute('role', 'gridcell');
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

    appendDayNumber(d, day);

    if (typeof options.onRenderDay === 'function') {
      options.onRenderDay(d, { day, month, year, events: dayEvents, isSun: currentColumn === 0, isSat: currentColumn === 6, isToday: d.classList.contains('today') });
    }

    frag.appendChild(d);
  }

  // Next month leading days
  const totalCells = firstDayIndex + daysInMonth;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = document.createElement('div');
    const currentColumn = (totalCells + i - 1) % 7;
    d.className = 'cal-day prev-month next-month' + (currentColumn === 0 ? ' sun' : currentColumn === 6 ? ' sat' : '');
    d.setAttribute('role', 'gridcell');
    appendDayNumber(d, i);
    frag.appendChild(d);
  }

  container.innerHTML = '';
  container.appendChild(frag);
}

const CalendarService = {
  MONTHS_NAMES,
  DAYS_NAMES,
  padZero,
  getEvents: getCalendarEvents,
  setEvents: setCalendarEvents,
  fetchEvents: fetchCalendarEvents,
  getEventsForDate,
  addEvent: addCalendarEvent,
  buildCalendarGrid
};

if (typeof window !== 'undefined') {
  window.CalendarService = CalendarService;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CalendarService;
}
