/**
 * Day Progression Service
 * Core calculation module for daily time progression, remaining hours/minutes, and time phases.
 */

const DEFAULT_TIME_PHASES = [
  { maxMinutes: 6 * 60, title: 'NIGHT', desc: 'Rest & recharge' },
  { maxMinutes: 12 * 60, title: 'MORNING', desc: 'Start the day' },
  { maxMinutes: 18 * 60, title: 'AFTERNOON', desc: 'Midday focus' },
  { maxMinutes: 24 * 60, title: 'EVENING', desc: 'Wind down' }
];

function padNumber(n) {
  return String(n).padStart(2, '0');
}

function getTimePhase(hours, minutes, phases = DEFAULT_TIME_PHASES) {
  const totalMinutes = hours * 60 + minutes;
  for (const phase of phases) {
    if (totalMinutes < phase.maxMinutes) {
      return phase;
    }
  }
  return phases[phases.length - 1];
}

function calculateDayProgression(now = new Date(), phases = DEFAULT_TIME_PHASES) {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();

  const totalSecondsPassed = (h * 3600) + (m * 60) + s + (ms / 1000);
  const totalSecondsInDay = 86400;

  const percent = Math.min(100, Math.max(0, (totalSecondsPassed / totalSecondsInDay) * 100));
  const formattedPercent = percent.toFixed(1);

  const remainingSeconds = Math.max(0, totalSecondsInDay - totalSecondsPassed);
  const remHours = Math.floor(remainingSeconds / 3600);
  const remMinutes = Math.floor((remainingSeconds % 3600) / 60);
  const remSeconds = Math.floor(remainingSeconds % 60);
  const msPassed = Math.round(totalSecondsPassed * 1000);

  const phase = getTimePhase(h, m, phases);
  const timeString = `${padNumber(h)}:${padNumber(m)}:${padNumber(s)}`;

  return {
    hours: h,
    minutes: m,
    seconds: s,
    msPassed,
    timeString,
    clockString: timeString,
    percent,
    formattedPercent,
    remainingHours: remHours,
    remainingMinutes: remMinutes,
    remainingSeconds: remSeconds,
    remainingTimeString: `${padNumber(remHours)}H ${padNumber(remMinutes)}M`,
    remainingString: `${padNumber(remHours)}H ${padNumber(remMinutes)}M ${padNumber(remSeconds)}S`,
    phase
  };
}

const DayProgressionService = {
  DEFAULT_TIME_PHASES,
  padNumber,
  getTimePhase,
  calculateDayProgression
};

if (typeof window !== 'undefined') {
  window.DayProgressionService = DayProgressionService;
  window.calculateDayProgression = calculateDayProgression;

  // Auto-bind to standard day-progression layout elements if present in DOM
  function autoBindDayProgression() {
    const timeDisplay = document.getElementById('timeDisplay');
    const phaseText = document.getElementById('phaseText');
    const percentageDisplay = document.getElementById('percentageDisplay');
    const progressionFill = document.getElementById('progressionFill');
    const progressionThumb = document.getElementById('progressionThumb');

    if (timeDisplay || phaseText || percentageDisplay || progressionFill) {
      function update() {
        const data = calculateDayProgression();
        if (timeDisplay) timeDisplay.textContent = data.timeString;
        if (phaseText) phaseText.textContent = `${data.phase.title} · ${data.phase.desc}`;
        if (percentageDisplay) percentageDisplay.textContent = `${data.formattedPercent}%`;
        if (progressionFill) progressionFill.style.width = `${data.percent}%`;
        if (progressionThumb) progressionThumb.style.left = `${data.percent}%`;
      }

      update();
      let timerId = setInterval(update, 1000);

      // Deep Sleep guard
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (timerId) {
            clearInterval(timerId);
            timerId = null;
          }
        } else if (!timerId) {
          update();
          timerId = setInterval(update, 1000);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBindDayProgression);
  } else {
    autoBindDayProgression();
  }
}
