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

  const phase = getTimePhase(h, m, phases);

  return {
    hours: h,
    minutes: m,
    seconds: s,
    timeString: `${padNumber(h)}:${padNumber(m)}:${padNumber(s)}`,
    percent,
    formattedPercent,
    remainingHours: remHours,
    remainingMinutes: remMinutes,
    remainingTimeString: `${padNumber(remHours)}H ${padNumber(remMinutes)}M`,
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
}
