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

  const P5_PHASES = [
    { maxMinutes: 6 * 60, title: 'LATE NIGHT', desc: 'DARK HOUR // REST WELL' },
    { maxMinutes: 8 * 60 + 30, title: 'EARLY MORNING', desc: 'MORNING COMMUTE // READY UP' },
    { maxMinutes: 12 * 60 + 30, title: 'DAYTIME', desc: 'CLASS IN SESSION // STAY SHARP' },
    { maxMinutes: 15 * 60 + 30, title: 'AFTERNOON', desc: 'AFTERNOON CLASS // STAY ALERT' },
    { maxMinutes: 19 * 60, title: 'AFTER SCHOOL', desc: 'FREE TIME // INFILTRATE PALACE' },
    { maxMinutes: 24 * 60, title: 'EVENING', desc: 'NIGHT LIFE // CHILL AT LEBLANC' }
  ];

  const elements = {
    phaseTitle: document.getElementById('phaseTitle'),
    phaseDesc: document.getElementById('phaseDesc'),
    percentNum: document.getElementById('percentNum'),
    progFill: document.getElementById('progFill'),
    timeLeft: document.getElementById('timeLeft')
  };

  function update() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    const totalSecPassed = (h * 3600) + (m * 60) + s + (ms / 1000);
    const percent = Math.min(100, Math.max(0, (totalSecPassed / 86400) * 100));

    const totalRemainingSec = Math.max(0, 86400 - Math.floor(totalSecPassed));
    const remH = Math.floor(totalRemainingSec / 3600);
    const remM = Math.floor((totalRemainingSec % 3600) / 60);

    const curMinutes = h * 60 + m;
    let phase = P5_PHASES[P5_PHASES.length - 1];
    for (let i = 0; i < P5_PHASES.length; i++) {
      if (curMinutes < P5_PHASES[i].maxMinutes) {
        phase = P5_PHASES[i];
        break;
      }
    }

    if (elements.phaseTitle) elements.phaseTitle.textContent = phase.title;
    if (elements.phaseDesc) elements.phaseDesc.textContent = phase.desc;
    if (elements.percentNum) elements.percentNum.textContent = percent.toFixed(1);
    if (elements.progFill) elements.progFill.style.width = `${percent}%`;
    if (elements.timeLeft) {
      elements.timeLeft.textContent = `${String(remH).padStart(2, '0')}H ${String(remM).padStart(2, '0')}M`;
    }
  }

  randomizeMask();
  update();
  setInterval(update, 1000);
})();
