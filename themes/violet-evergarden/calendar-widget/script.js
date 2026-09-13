(function () {
  'use strict';

  const today = new Date();
  let currentViewingYear = today.getFullYear();
  let currentViewingMonth = today.getMonth();
  let activePinnedDay = null;
  let currentEvent = null;
  let currentSelectedDate = { day: null, month: null, year: null };

  const STORAGE_KEY = 'vcw_ve_calendar_memos';

  const CURSIVE_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DEFAULT_LORE_DISPATCHES = [
    {
      id: 've-lore-1',
      day: 4,
      title: 'Dispatch: Leidenschaftlich Central Station',
      client: 'Lieutenant Colonel Claudia Hodgins',
      time: '08:30 AM',
      tag: 'CH Postal Transit',
      note: 'Delivery of official maritime treaty missives and express parcels via steam train.'
    },
    {
      id: 've-lore-2',
      day: 9,
      title: 'Transcription: Royal Letters of Drossel',
      client: 'Princess Charlotte Eberfreya Drossel',
      time: '11:00 AM',
      tag: 'Auto Memory Doll',
      note: 'Draft public courtship correspondence to Prince Damian of Flugel. Handcrafted on vellum paper.'
    },
    {
      id: 've-lore-3',
      day: 14,
      title: 'Delivery: Bougainvillea Residence',
      client: 'Dietfried Bougainvillea',
      time: '02:15 PM',
      tag: 'Private Courier',
      note: 'Personal letter delivery. Package sealed with Gilbert’s emerald brooch motif.'
    },
    {
      id: 've-lore-4',
      day: 19,
      title: 'Lyrical Transcription: Operetta Manuscript',
      client: 'Irma the Opera Singer',
      time: '04:00 PM',
      tag: 'Auto Memory Doll',
      note: 'Transcribe melodic libretto and lyrical confessions for the grand Leidenschaftlich Theater opening.'
    },
    {
      id: 've-lore-5',
      day: 25,
      title: 'Dispatch: Leiden Harbor Maritime Port',
      client: 'Benedict Blue',
      time: '09:45 AM',
      tag: 'CH Postal Transit',
      note: 'Expedited air-drop parcel sorting and collection from overseas freight steamers.'
    }
  ];

  /* --------------------------------------------------------
     1. WIDGET-SPECIFIC LOCAL STORAGE LAYER
     -------------------------------------------------------- */
  function getStoredMemos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn('[Violet Calendar] Error reading localStorage memos:', err);
    }

    // Initialize with default lore dispatches for current month if empty
    const now = new Date();
    const initialDispatches = DEFAULT_LORE_DISPATCHES.map(evt => ({
      ...evt,
      year: now.getFullYear(),
      month: now.getMonth()
    }));
    saveStoredMemos(initialDispatches);
    return initialDispatches;
  }

  function saveStoredMemos(memos) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memos));
      // Also synchronize with shared CalendarService if loaded
      if (window.CalendarService && typeof window.CalendarService.setEvents === 'function') {
        window.CalendarService.setEvents(memos);
      }
    } catch (err) {
      console.warn('[Violet Calendar] Error persisting memos to localStorage:', err);
    }
  }

  function getMemosForMonth(year, month) {
    const all = getStoredMemos();
    return all.filter(m => m.year === year && m.month === month);
  }

  function saveMemo(memoData) {
    const all = getStoredMemos();
    const existingIdx = memoData.id ? all.findIndex(m => m.id === memoData.id) : -1;

    const payload = {
      id: memoData.id || `ve-memo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      year: memoData.year,
      month: memoData.month,
      day: memoData.day,
      title: (memoData.title || 'Untitled Correspondence').trim(),
      client: (memoData.client || 'Personal Dispatch').trim(),
      time: (memoData.time || 'All Day').trim(),
      tag: (memoData.tag || 'Auto Memory Doll').trim(),
      note: (memoData.note || '').trim(),
      updatedAt: Date.now()
    };

    if (existingIdx >= 0) {
      all[existingIdx] = payload;
    } else {
      all.push(payload);
    }

    saveStoredMemos(all);
    return payload;
  }

  function deleteMemo(memoId) {
    if (!memoId) return false;
    const all = getStoredMemos();
    const initialLen = all.length;
    const filtered = all.filter(m => m.id !== memoId);
    if (filtered.length !== initialLen) {
      saveStoredMemos(filtered);
      return true;
    }
    return false;
  }

  /* --------------------------------------------------------
     2. DOM ELEMENTS
     -------------------------------------------------------- */
  const elements = {
    cursiveMonth: document.getElementById('cursiveMonth'),
    typewriterYear: document.getElementById('typewriterYear'),
    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    todayBtn: document.getElementById('todayBtn'),
    calendarGrid: document.getElementById('calendarGrid'),

    tornNoteBackdrop: document.getElementById('tornNoteBackdrop'),
    tornNoteCard: document.getElementById('tornNoteCard'),

    // View Mode Elements
    noteViewMode: document.getElementById('noteViewMode'),
    noteTag: document.getElementById('noteTag'),
    noteCloseBtn: document.getElementById('noteCloseBtn'),
    noteDateStamp: document.getElementById('noteDateStamp'),
    noteTitle: document.getElementById('noteTitle'),
    noteClient: document.getElementById('noteClient'),
    noteTime: document.getElementById('noteTime'),
    noteBody: document.getElementById('noteBody'),
    btnReviseDraft: document.getElementById('btnReviseDraft'),
    btnDiscardDispatch: document.getElementById('btnDiscardDispatch'),

    // Draft / Edit Mode Elements
    noteEditMode: document.getElementById('noteEditMode'),
    composeHeaderTag: document.getElementById('composeHeaderTag'),
    editCancelCloseBtn: document.getElementById('editCancelCloseBtn'),
    editDateStamp: document.getElementById('editDateStamp'),
    inputNoteTitle: document.getElementById('inputNoteTitle'),
    selectNoteTag: document.getElementById('selectNoteTag'),
    inputNoteTime: document.getElementById('inputNoteTime'),
    inputNoteClient: document.getElementById('inputNoteClient'),
    textareaNoteBody: document.getElementById('textareaNoteBody'),
    btnShelveDraft: document.getElementById('btnShelveDraft'),
    btnSealDispatch: document.getElementById('btnSealDispatch')
  };

  /* --------------------------------------------------------
     3. CALENDAR RENDERING
     -------------------------------------------------------- */
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
      dot.title = `${config.events.length} dispatch(es) recorded`;
      dotWrap.appendChild(dot);

      cell.appendChild(dotWrap);
    }

    // Attach click listener for all active days of current month
    if (!config.isPrevMonth && !config.isNextMonth) {
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        if (activePinnedDay === cell) {
          closeTornNote();
        } else {
          if (activePinnedDay) activePinnedDay.classList.remove('active-day');
          activePinnedDay = cell;
          cell.classList.add('active-day');

          currentSelectedDate = {
            day: dayNumber,
            month: config.month,
            year: config.year
          };

          if (config.events && config.events.length > 0) {
            currentEvent = config.events[0];
            displayTornNote(currentEvent, dayNumber, config.month, config.year);
          } else {
            currentEvent = null;
            openDraftComposeMode(dayNumber, config.month, config.year);
          }
        }
      });
    }

    return cell;
  }

  /* --------------------------------------------------------
     4. TORN CARD POPOVER INTERACTIONS
     -------------------------------------------------------- */
  let closeAnimationTimeout = null;

  function displayTornNote(eventData, day, month, year) {
    if (!elements.tornNoteCard || !eventData) return;

    if (closeAnimationTimeout) {
      clearTimeout(closeAnimationTimeout);
      closeAnimationTimeout = null;
    }

    currentEvent = eventData;
    currentSelectedDate = { day, month, year };

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
      elements.noteClient.textContent = eventData.client || '—';
    }
    if (elements.noteTime) {
      elements.noteTime.textContent = eventData.time || '—';
    }
    if (elements.noteBody) {
      elements.noteBody.textContent = eventData.note || 'No additional correspondence recorded.';
    }

    if (elements.noteViewMode) elements.noteViewMode.style.display = 'flex';
    if (elements.noteEditMode) elements.noteEditMode.style.display = 'none';

    if (elements.tornNoteBackdrop) {
      elements.tornNoteBackdrop.classList.add('show');
    }
    elements.tornNoteCard.classList.add('show');
    elements.tornNoteCard.setAttribute('aria-hidden', 'false');
  }

  function openDraftComposeMode(day, month, year) {
    if (!elements.tornNoteCard) return;

    if (closeAnimationTimeout) {
      clearTimeout(closeAnimationTimeout);
      closeAnimationTimeout = null;
    }

    currentEvent = null;
    currentSelectedDate = { day, month, year };

    // Reset view-mode text elements so stale letter content never peeks through
    if (elements.noteTag) elements.noteTag.textContent = 'CH POSTAL DISPATCH';
    if (elements.noteDateStamp) elements.noteDateStamp.textContent = `${CURSIVE_MONTHS[month]} ${String(day).padStart(2, '0')}, ${year}`;
    if (elements.noteTitle) elements.noteTitle.textContent = '';
    if (elements.noteClient) elements.noteClient.textContent = '—';
    if (elements.noteTime) elements.noteTime.textContent = '—';
    if (elements.noteBody) elements.noteBody.textContent = '';

    if (elements.composeHeaderTag) {
      elements.composeHeaderTag.textContent = 'DRAFT CORRESPONDENCE';
    }
    if (elements.editDateStamp) {
      elements.editDateStamp.textContent = `${CURSIVE_MONTHS[month]} ${String(day).padStart(2, '0')}, ${year}`;
    }

    if (elements.inputNoteTitle) elements.inputNoteTitle.value = '';
    if (elements.selectNoteTag) elements.selectNoteTag.value = 'Auto Memory Doll';
    if (elements.inputNoteTime) elements.inputNoteTime.value = '';
    if (elements.inputNoteClient) elements.inputNoteClient.value = '';
    if (elements.textareaNoteBody) elements.textareaNoteBody.value = '';

    if (elements.noteViewMode) elements.noteViewMode.style.display = 'none';
    if (elements.noteEditMode) elements.noteEditMode.style.display = 'flex';

    if (elements.tornNoteBackdrop) {
      elements.tornNoteBackdrop.classList.add('show');
    }
    elements.tornNoteCard.classList.add('show');
    elements.tornNoteCard.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      if (elements.inputNoteTitle) elements.inputNoteTitle.focus();
    }, 60);
  }

  function openReviseDraftMode() {
    if (!currentEvent) return;

    if (closeAnimationTimeout) {
      clearTimeout(closeAnimationTimeout);
      closeAnimationTimeout = null;
    }

    if (elements.composeHeaderTag) {
      elements.composeHeaderTag.textContent = 'REVISE CORRESPONDENCE';
    }
    if (elements.editDateStamp) {
      elements.editDateStamp.textContent = `${CURSIVE_MONTHS[currentSelectedDate.month]} ${String(currentSelectedDate.day).padStart(2, '0')}, ${currentSelectedDate.year}`;
    }

    if (elements.inputNoteTitle) elements.inputNoteTitle.value = currentEvent.title || '';
    if (elements.selectNoteTag) elements.selectNoteTag.value = currentEvent.tag || 'Auto Memory Doll';
    if (elements.inputNoteTime) elements.inputNoteTime.value = currentEvent.time || '';
    if (elements.inputNoteClient) elements.inputNoteClient.value = currentEvent.client || '';
    if (elements.textareaNoteBody) elements.textareaNoteBody.value = currentEvent.note || '';

    if (elements.noteViewMode) elements.noteViewMode.style.display = 'none';
    if (elements.noteEditMode) elements.noteEditMode.style.display = 'flex';

    setTimeout(() => {
      if (elements.inputNoteTitle) elements.inputNoteTitle.focus();
    }, 60);
  }

  async function handleSaveEvent(e) {
    if (e) e.preventDefault();
    if (!currentSelectedDate.day) return;

    const title = (elements.inputNoteTitle && elements.inputNoteTitle.value.trim()) || 'Untitled Correspondence';
    const tag = (elements.selectNoteTag && elements.selectNoteTag.value) || 'Auto Memory Doll';
    const time = (elements.inputNoteTime && elements.inputNoteTime.value.trim()) || 'All Day';
    const client = (elements.inputNoteClient && elements.inputNoteClient.value.trim()) || 'Anonymous Patron';
    const note = (elements.textareaNoteBody && elements.textareaNoteBody.value.trim()) || '';

    const payload = {
      id: currentEvent && currentEvent.id ? currentEvent.id : undefined,
      year: currentSelectedDate.year,
      month: currentSelectedDate.month,
      day: currentSelectedDate.day,
      title,
      tag,
      time,
      client,
      note
    };

    const saved = saveMemo(payload);
    currentEvent = saved;

    closeTornNote();
    loadCurrentCalendarView();
  }

  async function handleDiscardEvent(e) {
    if (e) e.stopPropagation();
    if (!currentEvent || !currentEvent.id) return;

    deleteMemo(currentEvent.id);
    currentEvent = null;

    closeTornNote();
    loadCurrentCalendarView();
  }

  function handleShelveDraft(e) {
    if (e) e.stopPropagation();
    if (currentEvent) {
      displayTornNote(currentEvent, currentSelectedDate.day, currentSelectedDate.month, currentSelectedDate.year);
    } else {
      closeTornNote();
    }
  }

  function closeTornNote() {
    if (!elements.tornNoteCard) return;
    if (elements.tornNoteBackdrop) {
      elements.tornNoteBackdrop.classList.remove('show');
    }
    elements.tornNoteCard.classList.remove('show');
    elements.tornNoteCard.setAttribute('aria-hidden', 'true');
    if (activePinnedDay) {
      activePinnedDay.classList.remove('active-day');
      activePinnedDay = null;
    }

    // Do NOT synchronously swap mode while the card is in its 220ms fade-out transition.
    // Delay the mode reset until the card is completely invisible to avoid flashing existing letters.
    if (closeAnimationTimeout) clearTimeout(closeAnimationTimeout);
    closeAnimationTimeout = setTimeout(() => {
      if (elements.tornNoteCard && !elements.tornNoteCard.classList.contains('show')) {
        if (elements.noteViewMode) elements.noteViewMode.style.display = 'flex';
        if (elements.noteEditMode) elements.noteEditMode.style.display = 'none';
      }
    }, 240);
  }

  function loadCurrentCalendarView() {
    updateHeaderDisplay(currentViewingYear, currentViewingMonth);
    const events = getMemosForMonth(currentViewingYear, currentViewingMonth);
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

    if (elements.editCancelCloseBtn) {
      elements.editCancelCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTornNote();
      });
    }

    if (elements.btnReviseDraft) {
      elements.btnReviseDraft.addEventListener('click', (e) => {
        e.stopPropagation();
        openReviseDraftMode();
      });
    }

    if (elements.btnDiscardDispatch) {
      elements.btnDiscardDispatch.addEventListener('click', handleDiscardEvent);
    }

    if (elements.btnShelveDraft) {
      elements.btnShelveDraft.addEventListener('click', handleShelveDraft);
    }

    if (elements.noteEditMode) {
      elements.noteEditMode.addEventListener('submit', handleSaveEvent);
    }

    if (elements.tornNoteBackdrop) {
      elements.tornNoteBackdrop.addEventListener('click', (e) => {
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
      else if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea, select')) goToPreviousMonth();
      else if (e.key === 'ArrowRight' && !e.target.matches('input, textarea, select')) goToNextMonth();
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
