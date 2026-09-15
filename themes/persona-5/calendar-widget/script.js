(function () {
  'use strict';

  
  const MASKS = [
    '../assets/Joker Mask.png',
    '../assets/Ann Mask.png',
    '../assets/Akechi Mask.png'
  ];

  function randomizeMask() {
    const mask = document.querySelector('.p5-mask, [data-random-mask]');
    if (!mask) return;
    const randomChoice = MASKS[Math.floor(Math.random() * MASKS.length)];
    mask.src = randomChoice;
  }

  
  let audioCtx = null;
  const audioState = {
    enabled: localStorage.getItem('p5_cal_sound') !== 'false'
  };

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playSlashSound() {
    if (!audioState.enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.09);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);

      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    } catch (_) {}
  }

  function playBlipSound() {
    if (!audioState.enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.035);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch (_) {}
  }

  function playCancelSound() {
    if (!audioState.enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (_) {}
  }

  
  const P5_PHASES = [
    { maxMinutes: 6 * 60, title: 'LATE NIGHT', desc: 'DARK HOUR // REST WELL' },
    { maxMinutes: 8 * 60 + 30, title: 'EARLY MORNING', desc: 'MORNING COMMUTE // READY UP' },
    { maxMinutes: 12 * 60 + 30, title: 'DAYTIME', desc: 'CLASS IN SESSION // STAY SHARP' },
    { maxMinutes: 15 * 60 + 30, title: 'AFTERNOON', desc: 'AFTERNOON CLASS // STAY ALERT' },
    { maxMinutes: 19 * 60, title: 'AFTER SCHOOL', desc: 'FREE TIME // INFILTRATE PALACE' },
    { maxMinutes: 24 * 60, title: 'EVENING', desc: 'NIGHT LIFE // CHILL AT LEBLANC' }
  ];

  const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const DAY_NAMES = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
  ];

  
  const dom = {
    root: document.getElementById('calendarRoot'),

    phaseText: document.getElementById('phaseText'),
    phaseDesc: document.getElementById('phaseDesc'),
    h1: document.getElementById('h1'),
    h2: document.getElementById('h2'),
    m1: document.getElementById('m1'),
    m2: document.getElementById('m2'),
    ampmBadge: document.getElementById('ampmBadge'),
    openScheduleBtn: document.getElementById('openScheduleBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    hudCenterpiece: document.getElementById('hudCenterpiece'),
    hudMonthLabel: document.getElementById('hudMonthLabel'),
    hudYearLabel: document.getElementById('hudYearLabel'),
    valDigitTens: document.getElementById('valDigitTens'),
    valDigitOnes: document.getElementById('valDigitOnes'),
    hudWeekdayText: document.getElementById('hudWeekdayText'),

    prevMonthBtn: document.getElementById('prevMonthBtn'),
    nextMonthBtn: document.getElementById('nextMonthBtn'),
    schedMonthName: document.getElementById('schedMonthName'),
    schedYearName: document.getElementById('schedYearName'),
    jumpTodayBtn: document.getElementById('jumpTodayBtn'),
    closeScheduleBtn: document.getElementById('closeScheduleBtn'),
    schedCalBody: document.getElementById('schedCalBody')
  };

  
  const today = new Date();
  let displayedYear = today.getFullYear();
  let displayedMonth = today.getMonth();
  let lastDateKey = '';

  function padZero(n) {
    return String(n).padStart(2, '0');
  }

  function updateSoundUI() {
    if (dom.soundIcon) {
      dom.soundIcon.textContent = audioState.enabled ? '🔊' : '🔇';
    }
  }

  function switchView(viewName) {
    if (!dom.root) return;
    const currentView = dom.root.dataset.activeView;
    if (currentView === viewName) return;

    dom.root.dataset.activeView = viewName;
    getAudioContext(); // Unlock audio context on user action

    if (viewName === 'schedule') {
      playSlashSound();
      renderScheduleGrid();
    } else {
      playCancelSound();
    }
  }

  function renderScheduleGrid() {
    if (!dom.schedCalBody) return;

    if (dom.schedMonthName) {
      dom.schedMonthName.textContent = MONTH_NAMES[displayedMonth];
    }
    if (dom.schedYearName) {
      dom.schedYearName.textContent = displayedYear;
    }

    const renderOptions = {
      onRenderDay: (dayElement, dayInfo) => {
        dayElement.textContent = dayInfo.day;

        dayElement.addEventListener('click', (e) => {
          e.stopPropagation();
          playBlipSound();
        });
      }
    };

    if (window.CalendarService && typeof window.CalendarService.buildCalendarGrid === 'function') {
      window.CalendarService.buildCalendarGrid(
        dom.schedCalBody,
        displayedYear,
        displayedMonth,
        new Date(),
        renderOptions
      );
    } else {

      dom.schedCalBody.innerHTML = '';
      const firstDayIndex = new Date(displayedYear, displayedMonth, 1).getDay();
      const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
      const prevDaysCount = new Date(displayedYear, displayedMonth, 0).getDate();
      const now = new Date();

      for (let i = 0; i < firstDayIndex; i++) {
        const d = document.createElement('div');
        d.className = 'cal-day prev-month' + (i === 0 ? ' sun' : '');
        d.textContent = prevDaysCount - firstDayIndex + 1 + i;
        dom.schedCalBody.appendChild(d);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const d = document.createElement('div');
        const col = (firstDayIndex + day - 1) % 7;
        d.className = 'cal-day' + (col === 0 ? ' sun' : col === 6 ? ' sat' : '');
        if (day === now.getDate() && displayedMonth === now.getMonth() && displayedYear === now.getFullYear()) {
          d.classList.add('today');
        }
        renderOptions.onRenderDay(d, { day, month: displayedMonth, year: displayedYear });
        dom.schedCalBody.appendChild(d);
      }

      const totalCells = firstDayIndex + daysInMonth;
      const remainingCells = (7 - (totalCells % 7)) % 7;
      for (let i = 1; i <= remainingCells; i++) {
        const d = document.createElement('div');
        const col = (totalCells + i - 1) % 7;
        d.className = 'cal-day prev-month next-month' + (col === 0 ? ' sun' : col === 6 ? ' sat' : '');
        d.textContent = i;
        dom.schedCalBody.appendChild(d);
      }
    }
  }

  function update() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();

    const displayH = h % 12 || 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hStr = padZero(displayH);
    const mStr = padZero(m);

    if (dom.h1) dom.h1.textContent = hStr[0];
    if (dom.h2) dom.h2.textContent = hStr[1];
    if (dom.m1) dom.m1.textContent = mStr[0];
    if (dom.m2) dom.m2.textContent = mStr[1];
    if (dom.ampmBadge) dom.ampmBadge.textContent = ampm;

    const curMinutes = h * 60 + m;
    let phase = P5_PHASES[P5_PHASES.length - 1];
    for (let i = 0; i < P5_PHASES.length; i++) {
      if (curMinutes < P5_PHASES[i].maxMinutes) {
        phase = P5_PHASES[i];
        break;
      }
    }

    if (dom.phaseText) dom.phaseText.textContent = phase.title;
    if (dom.phaseDesc) dom.phaseDesc.textContent = phase.desc;

    const dateNum = now.getDate();
    const dateStr = padZero(dateNum);

    if (dom.valDigitTens) dom.valDigitTens.textContent = dateStr[0];
    if (dom.valDigitOnes) dom.valDigitOnes.textContent = dateStr[1];

    if (dom.hudMonthLabel) dom.hudMonthLabel.textContent = MONTH_NAMES[now.getMonth()];
    if (dom.hudYearLabel) dom.hudYearLabel.textContent = now.getFullYear();
    if (dom.hudWeekdayText) dom.hudWeekdayText.textContent = DAY_NAMES[now.getDay()];

    const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (dateKey !== lastDateKey) {
      lastDateKey = dateKey;
      if (dom.root && dom.root.dataset.activeView === 'schedule') {
        renderScheduleGrid();
      }
    }
  }

  
  function initEvents() {

    if (dom.openScheduleBtn) {
      dom.openScheduleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchView('schedule');
      });
    }

    if (dom.hudCenterpiece) {
      dom.hudCenterpiece.addEventListener('click', () => {
        switchView('schedule');
      });
    }

    if (dom.closeScheduleBtn) {
      dom.closeScheduleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switchView('hud');
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.root && dom.root.dataset.activeView === 'schedule') {
        switchView('hud');
      }
    });

    if (dom.prevMonthBtn) {
      dom.prevMonthBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playBlipSound();
        displayedMonth--;
        if (displayedMonth < 0) {
          displayedMonth = 11;
          displayedYear--;
        }
        renderScheduleGrid();
      });
    }

    if (dom.nextMonthBtn) {
      dom.nextMonthBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playBlipSound();
        displayedMonth++;
        if (displayedMonth > 11) {
          displayedMonth = 0;
          displayedYear++;
        }
        renderScheduleGrid();
      });
    }

    if (dom.jumpTodayBtn) {
      dom.jumpTodayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playSlashSound();
        const now = new Date();
        displayedYear = now.getFullYear();
        displayedMonth = now.getMonth();
        renderScheduleGrid();
      });
    }

    if (dom.soundToggleBtn) {
      dom.soundToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        getAudioContext();
        audioState.enabled = !audioState.enabled;
        localStorage.setItem('p5_cal_sound', audioState.enabled);
        updateSoundUI();
        if (audioState.enabled) {
          playBlipSound();
        }
      });
    }
  }

  
  randomizeMask();
  updateSoundUI();
  initEvents();
  update();
  renderScheduleGrid();
  setInterval(update, 1000);
})();

