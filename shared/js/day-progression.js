/**
 * Day Progression Service
 * Shared module for calculating daily progression, remaining time, and time phases.
 */

const DEFAULT_TIME_PHASES = [
  {
    maxMinutes: 6 * 60, // 00:00 - 05:59
    title: 'LATE NIGHT',
    desc: 'DARK HOUR // REST WELL'
  },
  {
    maxMinutes: 8 * 60 + 30, // 06:00 - 08:29
    title: 'EARLY MORNING',
    desc: 'MORNING COMMUTE // READY UP'
  },
  {
    maxMinutes: 12 * 60 + 30, // 08:30 - 12:29
    title: 'DAYTIME',
    desc: 'CLASS IN SESSION // STAY SHARP'
  },
  {
    maxMinutes: 15 * 60 + 30, // 12:30 - 15:29
    title: 'AFTERNOON',
    desc: 'AFTERNOON CLASS // STAY ALERT'
  },
  {
    maxMinutes: 19 * 60, // 15:30 - 18:59
    title: 'AFTER SCHOOL',
    desc: 'FREE TIME // INFILTRATE PALACE'
  },
  {
    maxMinutes: 24 * 60, // 19:00 - 23:59
    title: 'EVENING',
    desc: 'NIGHT LIFE // CHILL AT LEBLANC'
  }
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
  const totalSecondsInDay = 86400; // 24 * 3600

  const percent = (totalSecondsPassed / totalSecondsInDay) * 100;
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

function initDayProgressionWidget(config = {}) {
  const elements = {
    phaseTitle: document.getElementById(config.phaseTitleId || 'phaseTitle'),
    phaseDesc: document.getElementById(config.phaseDescId || 'phaseDesc'),
    liveTime: document.getElementById(config.liveTimeId || 'liveTime'),
    percentNum: document.getElementById(config.percentNumId || 'percentNum'),
    progFill: document.getElementById(config.progFillId || 'progFill'),
    timeLeft: document.getElementById(config.timeLeftId || 'timeLeft'),
  };

  function update() {
    const data = calculateDayProgression(new Date(), config.phases || DEFAULT_TIME_PHASES);

    if (elements.phaseTitle) elements.phaseTitle.textContent = data.phase.title;
    if (elements.phaseDesc) elements.phaseDesc.textContent = data.phase.desc;
    if (elements.liveTime) elements.liveTime.textContent = data.timeString;
    if (elements.percentNum) elements.percentNum.textContent = data.formattedPercent;
    if (elements.progFill) elements.progFill.style.width = `${data.percent}%`;
    if (elements.timeLeft) elements.timeLeft.textContent = data.remainingTimeString;

    if (typeof config.onUpdate === 'function') {
      config.onUpdate(data);
    }
  }

  update();
  return setInterval(update, config.interval || 1000);
}
