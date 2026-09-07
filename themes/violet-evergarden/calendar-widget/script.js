/**
 * Violet Evergarden Calendar Widget Logic
 * 
 * Demonstrates integration with shared/js/calendar-service.js to fetch
 * dynamic calendar events, manage Victorian stationery UI states, render
 * wax seal current day highlights, and display typewriter torn notes.
 */

(function () {
  'use strict';

  // State management
  const today = new Date();
  let currentViewingYear = today.getFullYear();
  let currentViewingMonth = today.getMonth(); // 0 - 11
  let activePinnedDay = null; // Track clicked/locked day for torn note

  // Month names for cursive header display
  const CURSIVE_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // DOM Elements
  const elements = {
    cursiveMonth: document.getElementById('cursiveMonth'),
    typewriterYear: document.getElementById('typewriterYear'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    todayBtn: document.getElementById('todayBtn'),
    calendarGrid: document.getElementById('calendarGrid'),

    // Torn Note Popover Elements
    tornNoteCard: document.getElementById('tornNoteCard'),
    noteTag: document.getElementById('noteTag'),
    noteCloseBtn: document.getElementById('noteCloseBtn'),
    noteDateStamp: document.getElementById('noteDateStamp'),
    noteTitle: document.getElementById('noteTitle'),
    noteClient: document.getElementById('noteClient'),
    noteTime: document.getElementById('noteTime'),
    noteBody: document.getElementById('noteBody')
  };

  /**
   * =========================================================================
   * HOOK INTO CALENDAR-SERVICE.JS
   * =========================================================================
   * Fetches monthly events from CalendarService asynchronously.
   * If CalendarService is unavailable, gracefully falls back to empty events.
   * 
   * @param {number} year
   * @param {number} month
   * @returns {Promise<Array<Object>>}
   */
  async function fetchEventsFromService(year, month) {
    if (window.CalendarService && typeof window.CalendarService.fetchEvents === 'function') {
      try {
        return await window.CalendarService.fetchEvents(year, month);
      } catch (err) {
        console.warn('[Violet Calendar] Error fetching events from CalendarService:', err);
        return [];
      }
    } else if (typeof getCalendarEvents === 'function') {
      return getCalendarEvents(year, month);
    }
    return [];
  }

  /**
   * Updates Header: Cursive Month & Typewriter Year
   */
  function updateHeaderDisplay(year, month) {
    if (elements.cursiveMonth) {
      elements.cursiveMonth.textContent = CURSIVE_MONTHS[month];
    }
    if (elements.typewriterYear) {
      elements.typewriterYear.textContent = year;
    }
  }

  /**
   * Renders the Calendar Grid for the specified year and month.
   * Constructs previous-month trailing days, active-month days, and
   * next-month leading days with delicate ink styling.
   * 
   * @param {number} year
   * @param {number} month
   * @param {Array<Object>} events
   */
  function renderCalendarGrid(year, month, events = []) {
    const grid = elements.calendarGrid;
    if (!grid) return;

    grid.innerHTML = '';
    closeTornNote();

    // Map events by day number for fast lookup
    const eventsMap = new Map();
    events.forEach(evt => {
      if (!eventsMap.has(evt.day)) {
        eventsMap.set(evt.day, []);
      }
      eventsMap.get(evt.day).push(evt);
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // 1. Render Trailing Days from Previous Month
    for (let i = 0; i < firstDayIndex; i++) {
      const dayNum = prevMonthDays - firstDayIndex + 1 + i;
      const cell = createDayCell(dayNum, { isPrevMonth: true, isSun: i === 0 });
      grid.appendChild(cell);
    }

    // 2. Render Current Month Days
    for (let day = 1; day <= daysInMonth; day++) {
      const colIndex = (firstDayIndex + day - 1) % 7;
      const isToday = (
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      );
      const dayEvents = eventsMap.get(day) || [];

      const cell = createDayCell(day, {
        isToday,
        isSun: colIndex === 0,
        isSat: colIndex === 6,
        events: dayEvents,
        year,
        month
      });

      grid.appendChild(cell);
    }

    // 3. Render Leading Days for Next Month (to complete 7-day grid rows)
    const totalRendered = firstDayIndex + daysInMonth;
    const remainingCells = (7 - (totalRendered % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const colIndex = (totalRendered + i - 1) % 7;
      const cell = createDayCell(i, {
        isNextMonth: true,
        isSun: colIndex === 0,
        isSat: colIndex === 6
      });
      grid.appendChild(cell);
    }
  }

  /**
   * Helper to construct individual calendar day cell elements.
   */
  function createDayCell(dayNumber, config = {}) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.setAttribute('role', 'gridcell');

    if (config.isPrevMonth || config.isNextMonth) {
      cell.classList.add('prev-month');
    }
    if (config.isSun) cell.classList.add('sun');
    if (config.isSat) cell.classList.add('sat');

    // Number container
    const numSpan = document.createElement('span');
    numSpan.className = 'day-num';
    numSpan.textContent = dayNumber;
    cell.appendChild(numSpan);

    // Current date Wax Seal highlight
    if (config.isToday) {
      cell.classList.add('today');
      cell.setAttribute('aria-current', 'date');
      cell.title = `Today's Date: ${CURSIVE_MONTHS[config.month]} ${dayNumber}, ${config.year}`;
    }

    // Event Indicators (Muted Emerald Brooch Dot)
    if (config.events && config.events.length > 0) {
      cell.classList.add('has-event');
      if (config.events.length > 1) cell.classList.add('multi-event');

      const dotWrap = document.createElement('div');
      dotWrap.className = 'event-dot-wrap';

      const dot = document.createElement('span');
      dot.className = 'event-dot';
      dot.title = `${config.events.length} event(s) recorded`;
      dotWrap.appendChild(dot);

      cell.appendChild(dotWrap);

      // Event interaction handler: Click only (avoids hover trap flicker)
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePinnedDay === cell) {
          // Toggle off if clicking the already pinned day
          activePinnedDay = null;
          cell.classList.remove('active-day');
          closeTornNote();
        } else {
          // Pin this day's note
          if (activePinnedDay) activePinnedDay.classList.remove('active-day');
          activePinnedDay = cell;
          cell.classList.add('active-day');
          displayTornNote(config.events[0], dayNumber, config.month, config.year);
        }
      });
    }

    return cell;
  }

  /**
   * Populates and reveals the Typewriter Torn Note Popover with event data.
   * 
   * @param {Object} eventData
   * @param {number} day
   * @param {number} month
   * @param {number} year
   */
  function displayTornNote(eventData, day, month, year) {
    if (!elements.tornNoteCard || !eventData) return;

    if (elements.noteTag) {
      elements.noteTag.textContent = eventData.tag || 'CH POSTAL DISPATCH';
    }
    if (elements.noteDateStamp) {
      elements.noteDateStamp.textContent = `${CURSIVE_MONTHS[month]} ${String(day).padStart(2, '0')}, ${year}`;
    }
    if (elements.noteTitle) {
      elements.noteTitle.textContent = eventData.title || 'Untitled Correspondence';
    }
    if (elements.noteClient) {
      elements.noteClient.textContent = eventData.client || 'Anonymous';
    }
    if (elements.noteTime) {
      elements.noteTime.textContent = eventData.time || 'All Day';
    }
    if (elements.noteBody) {
      elements.noteBody.textContent = eventData.note || 'No additional correspondence recorded.';
    }

    elements.tornNoteCard.classList.add('show');
    elements.tornNoteCard.setAttribute('aria-hidden', 'false');
  }

  /**
   * Hides the Torn Note Popover.
   */
  function closeTornNote() {
    if (!elements.tornNoteCard) return;
    elements.tornNoteCard.classList.remove('show');
    elements.tornNoteCard.setAttribute('aria-hidden', 'true');
    if (activePinnedDay) {
      activePinnedDay.classList.remove('active-day');
      activePinnedDay = null;
    }
  }

  /**
   * Loads and renders the calendar for the currently viewed month and year.
   */
  async function loadCurrentCalendarView() {
    updateHeaderDisplay(currentViewingYear, currentViewingMonth);
    // Fetch data using calendar-service.js
    const events = await fetchEventsFromService(currentViewingYear, currentViewingMonth);
    renderCalendarGrid(currentViewingYear, currentViewingMonth, events);
  }

  /**
   * Month Navigation Handlers
   */
  function goToPreviousMonth() {
    currentViewingMonth--;
    if (currentViewingMonth < 0) {
      currentViewingMonth = 11;
      currentViewingYear--;
    }
    loadCurrentCalendarView();
  }

  function goToNextMonth() {
    currentViewingMonth++;
    if (currentViewingMonth > 11) {
      currentViewingMonth = 0;
      currentViewingYear++;
    }
    loadCurrentCalendarView();
  }

  function goToToday() {
    currentViewingYear = today.getFullYear();
    currentViewingMonth = today.getMonth();
    loadCurrentCalendarView();
  }

  /**
   * Attach UI Event Listeners
   */
  function attachListeners() {
    if (elements.prevMonthBtn) {
      elements.prevMonthBtn.addEventListener('click', goToPreviousMonth);
    }
    if (elements.nextMonthBtn) {
      elements.nextMonthBtn.addEventListener('click', goToNextMonth);
    }
    if (elements.todayBtn) {
      elements.todayBtn.addEventListener('click', goToToday);
    }
    if (elements.noteCloseBtn) {
      elements.noteCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTornNote();
      });
    }

    // Dismiss note when clicking anywhere outside on the stationery
    document.addEventListener('click', (e) => {
      if (elements.tornNoteCard && !elements.tornNoteCard.contains(e.target)) {
        closeTornNote();
      }
    });

    // Keyboard navigation (Escape closes popover, Left/Right arrows navigate months)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTornNote();
      } else if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
        goToPreviousMonth();
      } else if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
        goToNextMonth();
      }
    });
  }

  /**
   * Initialize Widget on DOM ready
   */
  function init() {
    attachListeners();
    loadCurrentCalendarView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
