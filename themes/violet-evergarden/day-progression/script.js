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

  function pad(num, size = 2) {
    return String(num).padStart(size, '0');
  }

  function getTemporalPhase(hours, minutes) {
    const currentMinutes = hours * 60 + minutes;
    for (let i = 0; i < TEMPORAL_PHASES.length; i++) {
      if (currentMinutes < TEMPORAL_PHASES[i].maxMinutes) {
        return TEMPORAL_PHASES[i];
      }
    }
    return TEMPORAL_PHASES[TEMPORAL_PHASES.length - 1];
  }

  function calculateProgression() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const msPassed = now.getTime() - startOfDay.getTime();
    const percent = Math.min(100, Math.max(0, (msPassed / TOTAL_MS_IN_DAY) * 100));

    const remainingMs = Math.max(0, TOTAL_MS_IN_DAY - msPassed);
    const totalRemainingSecs = Math.floor(remainingMs / 1000);
    const remHours = Math.floor(totalRemainingSecs / 3600);
    const remMinutes = Math.floor((totalRemainingSecs % 3600) / 60);
    const remSeconds = totalRemainingSecs % 60;

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    return {
      msPassed,
      percent,
      formattedPercent: percent.toFixed(1),
      clockString: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
      remainingString: `${pad(remHours)}H ${pad(remMinutes)}M ${pad(remSeconds)}S`,
      phase: getTemporalPhase(hours, minutes)
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