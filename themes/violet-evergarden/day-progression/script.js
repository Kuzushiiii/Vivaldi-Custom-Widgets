(function () {
  'use strict';

  const widget = document.getElementById('dayProgressionWidget');
  const liveClockEl = document.getElementById('liveClock');
  const percentNumEl = document.getElementById('percentNum');
  const ribbonFillEl = document.getElementById('ribbonFill');
  const timeRemainingEl = document.getElementById('timeRemaining');
  const phaseTitleEl = document.getElementById('phaseTitle');
  const phaseDescEl = document.getElementById('phaseDesc');
  const carriageReturnBtn = document.getElementById('carriageReturnBtn');

  const TEMPORAL_PHASES = [
    { maxMinutes: 6 * 60, title: 'QUIET WATCH', desc: 'Rest well under the midnight stars' },
    { maxMinutes: 9 * 60, title: 'DAWN DISPATCH', desc: 'Morning post arriving from Leiden' },
    { maxMinutes: 12 * 60, title: 'MEMORY DOLL DUTY', desc: 'Transcribing heartfelt letters' },
    { maxMinutes: 14 * 60, title: 'MIDDAY RESPITE', desc: 'Warm tea & violet blossoms' },
    { maxMinutes: 18 * 60, title: 'AFTERNOON MEMOIRS', desc: 'Ink flows across vintage parchment' },
    { maxMinutes: 22 * 60, title: 'DUSK TRANSCRIPTION', desc: 'Sealing envelopes with crimson wax' },
    { maxMinutes: 24 * 60, title: 'LATE NOCTURNE', desc: 'Final correspondence before midnight' }
  ];

  const TOTAL_MS_IN_DAY = 86400000;
  let isReturning = false;
  let lastMsPassed = null;

  function calculateProgression() {
    // Use shared service when available for single source of truth
    if (window.DayProgressionService) {
      return window.DayProgressionService.calculateDayProgression(new Date(), TEMPORAL_PHASES);
    }

    // Fallback phase lookup when shared service unavailable (offline cache miss)
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const totalSecs = (h * 3600) + (m * 60) + s;
    const percent = Math.min(100, Math.max(0, (totalSecs / 86400) * 100));
    const remSecs = Math.max(0, 86400 - totalSecs);
    const remH = Math.floor(remSecs / 3600);
    const remM = Math.floor((remSecs % 3600) / 60);
    const remS = remSecs % 60;
    const curMin = h * 60 + m;
    let phase = TEMPORAL_PHASES[TEMPORAL_PHASES.length - 1];
    for (const p of TEMPORAL_PHASES) if (curMin < p.maxMinutes) { phase = p; break; }

    return {
      msPassed: totalSecs * 1000,
      percent,
      formattedPercent: percent.toFixed(1),
      clockString: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
      remainingString: `${String(remH).padStart(2,'0')}H ${String(remM).padStart(2,'0')}M ${String(remS).padStart(2,'0')}S`,
      phase
    };
  }

  function triggerCarriageReturn() {
    if (isReturning) return;
    isReturning = true;

    // Play typewriter bell ding sound
    const dingSound = document.getElementById('typewriterDing');
    if (dingSound) {
      dingSound.currentTime = 0;
      dingSound.play().catch(e => console.log('Audio play blocked:', e));
    }

    widget.classList.add('carriage-return-active');
    ribbonFillEl.style.width = '0%';

    setTimeout(() => {
      widget.classList.remove('carriage-return-active');
      isReturning = false;
      const data = calculateProgression();
      ribbonFillEl.style.width = `${data.percent}%`;
    }, 450);
  }

  function updateWidget() {
    const data = calculateProgression();

    if (liveClockEl) liveClockEl.textContent = data.clockString;
    if (percentNumEl) percentNumEl.textContent = data.formattedPercent;
    if (timeRemainingEl) timeRemainingEl.textContent = data.remainingString;
    if (phaseTitleEl) phaseTitleEl.textContent = data.phase.title;
    if (phaseDescEl) phaseDescEl.textContent = data.phase.desc;

    if (!isReturning && ribbonFillEl) {
      ribbonFillEl.style.width = `${data.percent}%`;
    }

    if (lastMsPassed !== null && lastMsPassed > 86300000 && data.msPassed < 5000) {
      triggerCarriageReturn();
    }
    lastMsPassed = data.msPassed;
  }

  let tickerId = null;

  function startTicker() {
    if (tickerId) return;
    
    const now = new Date();
    const msToNextSecond = 1000 - now.getMilliseconds();

    setTimeout(() => {
      updateWidget();
      tickerId = setInterval(updateWidget, 1000);
    }, msToNextSecond);
  }

  function stopTicker() {
    if (tickerId) {
      clearInterval(tickerId);
      tickerId = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTicker();
    } else {
      updateWidget();
      startTicker();
    }
  });

  window.addEventListener('blur', stopTicker);
  window.addEventListener('focus', () => {
    updateWidget();
    startTicker();
  });

  if (carriageReturnBtn) {
    carriageReturnBtn.addEventListener('click', triggerCarriageReturn);
  }

  updateWidget();
  startTicker();

})();