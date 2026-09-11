(function () {
  'use strict';

  const today = new Date();
  let currentViewingYear = today.getFullYear();
  let currentViewingMonth = today.getMonth();
  let activePinnedDay = null;

  const CURSIVE_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const elements = {
    cursiveMonth: document.getElementById('cursiveMonth'),
    typewriterYear: document.getElementById('typewriterYear'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    todayBtn: document.getElementById('todayBtn'),
    calendarGrid: document.getElementById('calendarGrid'),

    tornNoteCard: document.getElementById('tornNoteCard'),
    noteTag: document.getElementById('noteTag'),
    noteCloseBtn: document.getElementById('noteCloseBtn'),
    noteDateStamp: document.getElementById('noteDateStamp'),
    noteTitle: document.getElementById('noteTitle'),
    noteClient: document.getElementById('noteClient'),
    noteTime: document.getElementById('noteTime'),
    noteBody: document.getElementById('noteBody')
  };

  const DEFAULT_EVENTS = [
    {
      day: 4,
      title: 'Dispatch: Leidenschaftlich Central Station',
      client: 'Lieutenant Colonel Claudia Hodgins',
      time: '08:30 AM',
      tag: 'CH Postal Transit',
      note: 'Delivery of official maritime treaty missives and express parcels via steam train.'
    },
    {
      day: 9,
      title: 'Transcription: Royal Letters of Drossel',
      client: 'Princess Charlotte Eberfreya Drossel',
      time: '11:00 AM',
      tag: 'Auto Memory Doll',
      note: 'Draft public courtship correspondence to Prince Damian of Flugel. Handcrafted on vellum paper.'
    },
    {
      day: 14,
      title: 'Delivery: Bougainvillea Residence',
      client: 'Dietfried Bougainvillea',
      time: '02:15 PM',
      tag: 'Private Courier',
      note: 'Personal letter delivery. Package sealed with Gilbert’s emerald brooch motif.'
    },
    {
      day: 19,
      title: 'Lyrical Transcription: Operetta Manuscript',
      client: 'Irma the Opera Singer',
      time: '04:00 PM',
      tag: 'Song Transcription',
      note: 'Transcribe melodic libretto and lyrical confessions for the grand Leidenschaftlich Theater opening.'
    },
    {
      day: 25,
      title: 'Dispatch: Leiden Harbor Maritime Port',
      client: 'Benedict Blue',
      time: '09:45 AM',
      tag: 'Special Courier',
      note: 'Expedited air-drop parcel sorting and collection from overseas freight steamers.'
    }
  ];

  async function fetchEventsFromService(year, month) {
    let serviceEvents = [];
    if (window.CalendarService && typeof window.CalendarService.fetchEvents === 'function') {
      try {
        serviceEvents = await window.CalendarService.fetchEvents(year, month);
      } catch (err) {
        console.warn('[Violet Calendar] Error fetching events from CalendarService:', err);
      }
    }
    if (serviceEvents && serviceEvents.length > 0) {
      return serviceEvents;
    }
    if (year === today.getFullYear() && month === today.getMonth()) {
      return DEFAULT_EVENTS.map(evt => ({ ...evt, year, month }));
    }
    return [];
  }

  function updateHeaderDisplay(year, month) {
    if (elements.cursiveMonth) {
      elements.cursiveMonth.textContent = CURSIVE_MONTHS[month];
    }
    if (elements.typewriterYear) {
      elements.typewriterYear.textContent = year;
    }
  }

  function renderCalendarGrid(year, month, events = []) {
    const grid = elements.calendarGrid;
    if (!grid) return;

    grid.innerHTML = '';
    closeTornNote();

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

    // Previous month trailing days
    for (let i = 0; i < firstDayIndex; i++) {
      const dayNum = prevMonthDays - firstDayIndex + 1 + i;
      const cell = createDayCell(dayNum, { isPrevMonth: true, isSun: i === 0 });
      grid.appendChild(cell);
    }

    // Current month days
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

    // Next month leading days
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

  function createDayCell(dayNumber, config = {}) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.setAttribute('role', 'gridcell');

    if (config.isPrevMonth || config.isNextMonth) {
      cell.classList.add('prev-month');
    }
    if (config.isSun) cell.classList.add('sun');
    if (config.isSat) cell.classList.add('sat');

    const numSpan = document.createElement('span');
    numSpan.className = 'day-num';
    numSpan.textContent = dayNumber;
    cell.appendChild(numSpan);

    if (config.isToday) {
      cell.classList.add('today');
      cell.setAttribute('aria-current', 'date');
      cell.title = `Today's Date: ${CURSIVE_MONTHS[config.month]} ${dayNumber}, ${config.year}`;
    }

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

      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePinnedDay === cell) {
          activePinnedDay = null;
          cell.classList.remove('active-day');
          closeTornNote();
        } else {
          if (activePinnedDay) activePinnedDay.classList.remove('active-day');
          activePinnedDay = cell;
          cell.classList.add('active-day');
          displayTornNote(config.events[0], dayNumber, config.month, config.year);
        }
      });
    }

    return cell;
  }

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

  function closeTornNote() {
    if (!elements.tornNoteCard) return;
    elements.tornNoteCard.classList.remove('show');
    elements.tornNoteCard.setAttribute('aria-hidden', 'true');
    if (activePinnedDay) {
      activePinnedDay.classList.remove('active-day');
      activePinnedDay = null;
    }
  }

  async function loadCurrentCalendarView() {
    updateHeaderDisplay(currentViewingYear, currentViewingMonth);
    const events = await fetchEventsFromService(currentViewingYear, currentViewingMonth);
    renderCalendarGrid(currentViewingYear, currentViewingMonth, events);
  }

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

  function attachListeners() {
    if (elements.prevMonthBtn) elements.prevMonthBtn.addEventListener('click', goToPreviousMonth);
    if (elements.nextMonthBtn) elements.nextMonthBtn.addEventListener('click', goToNextMonth);
    if (elements.todayBtn) elements.todayBtn.addEventListener('click', goToToday);
    if (elements.noteCloseBtn) {
      elements.noteCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTornNote();
      });
    }

    document.addEventListener('click', (e) => {
      if (elements.tornNoteCard && !elements.tornNoteCard.contains(e.target)) {
        closeTornNote();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeTornNote();
      else if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) goToPreviousMonth();
      else if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) goToNextMonth();
    });
  }

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
