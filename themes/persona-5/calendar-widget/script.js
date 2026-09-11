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
    mask.src = MASKS[Math.floor(Math.random() * MASKS.length)];
  }

  const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const DAY_NAMES = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
  ];

  const elements = {
    h1: document.getElementById('h1'),
    h2: document.getElementById('h2'),
    m1: document.getElementById('m1'),
    m2: document.getElementById('m2'),
    monthName: document.getElementById('monthName'),
    dayLabel: document.getElementById('dayLabel'),
    calBody: document.getElementById('calBody')
  };

  let lastDateKey = '';

  function padZero(n) {
    return String(n).padStart(2, '0');
  }

  function update() {
    const now = new Date();
    const h = padZero(now.getHours());
    const m = padZero(now.getMinutes());

    if (elements.h1) elements.h1.textContent = h[0];
    if (elements.h2) elements.h2.textContent = h[1];
    if (elements.m1) elements.m1.textContent = m[0];
    if (elements.m2) elements.m2.textContent = m[1];

    if (elements.monthName) {
      elements.monthName.textContent = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    }
    if (elements.dayLabel) {
      elements.dayLabel.textContent = DAY_NAMES[now.getDay()];
    }

    const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (dateKey !== lastDateKey && elements.calBody) {
      if (window.CalendarService && typeof window.CalendarService.buildCalendarGrid === 'function') {
        window.CalendarService.buildCalendarGrid(elements.calBody, now.getFullYear(), now.getMonth(), now);
      } else if (typeof buildCalendarGrid === 'function') {
        buildCalendarGrid(elements.calBody, now.getFullYear(), now.getMonth(), now);
      }
      lastDateKey = dateKey;
    }
  }

  randomizeMask();
  update();
  setInterval(update, 1000);
})();
