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
    get enabled() {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      return localStorage.getItem('p5_cal_sound') !== 'false';
    },
    set enabled(val) {
      localStorage.setItem('p5_cal_sound', val ? 'true' : 'false');
    }
  };

  function getAudioContext() {
    if (!audioState.enabled) return null;
    if (document.hidden) return null;
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

  
  const P5_PHASES = [
    { maxMinutes: 6 * 60, title: 'LATE NIGHT', desc: 'DARK HOUR // REST WELL' },
    { maxMinutes: 8 * 60 + 30, title: 'EARLY MORNING', desc: 'MORNING COMMUTE // READY UP' },
    { maxMinutes: 12 * 60 + 30, title: 'DAYTIME', desc: 'CLASS IN SESSION // STAY SHARP' },
    { maxMinutes: 15 * 60 + 30, title: 'AFTERNOON', desc: 'AFTERNOON CLASS // STAY ALERT' },
    { maxMinutes: 19 * 60, title: 'AFTER SCHOOL', desc: 'PALACE INFILTRATION // STEAL THE HEART' },
    { maxMinutes: 24 * 60, title: 'EVENING', desc: 'NIGHT LIFE // CHILL AT LEBLANC' }
  ];

  
  const dom = {
    root: document.getElementById('dayProgRoot'),
    phaseTitle: document.getElementById('phaseTitle'),
    phaseDesc: document.getElementById('phaseDesc'),
    valPctTens: document.getElementById('valPctTens'),
    valPctOnes: document.getElementById('valPctOnes'),
    valPctTenths: document.getElementById('valPctTenths'),
    progFill: document.getElementById('progFill'),
    meterBeacon: document.getElementById('meterBeacon'),
    meterTrackFrame: document.getElementById('meterTrackFrame'),
    percentStage: document.getElementById('percentStage'),
    timeLeft: document.getElementById('timeLeft'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon')
  };

  
  function updateSoundUI() {
    if (dom.soundIcon) {
      dom.soundIcon.textContent = audioState.enabled ? '🔊' : '🔇';
    }
  }

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

    if (dom.phaseTitle) dom.phaseTitle.textContent = phase.title;
    if (dom.phaseDesc) dom.phaseDesc.textContent = phase.desc;

    const wholePart = Math.floor(percent);
    const decimalPart = Math.floor((percent % 1) * 10);
    const tens = Math.floor(wholePart / 10) % 10;
    const ones = wholePart % 10;
    const tenths = decimalPart;

    if (dom.valPctTens) dom.valPctTens.textContent = tens;
    if (dom.valPctOnes) dom.valPctOnes.textContent = ones;
    if (dom.valPctTenths) dom.valPctTenths.textContent = tenths;

    if (dom.progFill) {
      dom.progFill.style.width = `${percent.toFixed(2)}%`;
    }
    if (dom.meterBeacon) {
      dom.meterBeacon.style.left = `${percent.toFixed(2)}%`;
    }

    if (dom.timeLeft) {
      dom.timeLeft.textContent = `${String(remH).padStart(2, '0')}H ${String(remM).padStart(2, '0')}M`;
    }
  }

  
  function initEvents() {

    if (dom.soundToggleBtn) {
      dom.soundToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audioState.enabled = !audioState.enabled;
        if (audioState.enabled) getAudioContext();
        updateSoundUI();
        if (audioState.enabled) {
          playBlipSound();
        }
      });
    }

    if (dom.meterTrackFrame) {
      dom.meterTrackFrame.addEventListener('click', () => {
        playSlashSound();
      });
    }

    if (dom.percentStage) {
      dom.percentStage.addEventListener('click', () => {
        playSlashSound();
      });
    }
  }

  
  randomizeMask();
  updateSoundUI();
  initEvents();
  update();
  setInterval(update, 1000);
})();

