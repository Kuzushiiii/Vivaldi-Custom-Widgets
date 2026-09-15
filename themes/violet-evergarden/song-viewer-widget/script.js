/**
 * Violet Evergarden — The CH Postal Phonograph Controller
 * Bridges shared SongViewerService with vintage gramophone animations,
 * physical tonearm mechanics, vinyl needle-drop audio synthesis, and Victorian ledger modal.
 */

(function () {
  'use strict';

  // Tonearm geometry angles
  const TONEARM_ANGLES = {
    REST: -12,
    TRACK_START: 10,
    TRACK_END: 36,
  };

  const elements = {
    widget: document.getElementById('gramophoneWidget'),
    vinylDisc: document.getElementById('vinylDisc'),
    albumImg: document.getElementById('albumImg'),
    broochFallback: document.getElementById('broochFallback'),
    tonearmRod: document.getElementById('tonearmRod'),

    statusBadge: document.getElementById('statusBadge'),
    providerLabel: document.getElementById('providerLabel'),
    trackInfoSection: document.getElementById('trackInfoSection'),
    songTitle: document.getElementById('songTitle'),
    artistName: document.getElementById('artistName'),
    albumName: document.getElementById('albumName'),
    timeCurrent: document.getElementById('timeCurrent'),
    timeDuration: document.getElementById('timeDuration'),
    analogFill: document.getElementById('analogFill'),

    standbySection: document.getElementById('standbySection'),
    standbyHint: document.getElementById('standbyHint'),

    configModal: document.getElementById('configModal'),
    openConfigBtn: document.getElementById('openConfigBtn'),
    standbyConfigBtn: document.getElementById('standbyConfigBtn'),
    closeConfigBtn: document.getElementById('closeConfigBtn'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    demoBtn: document.getElementById('demoBtn'),

    tabDiscord: document.getElementById('tabDiscord'),
    tabLastfm: document.getElementById('tabLastfm'),
    discordTabContent: document.getElementById('discordTabContent'),
    lastfmTabContent: document.getElementById('lastfmTabContent'),

    discordIdInput: document.getElementById('discordIdInput'),
    lastfmUsernameInput: document.getElementById('lastfmUsernameInput'),
    lastfmApiKeyInput: document.getElementById('lastfmApiKeyInput'),

    needleAudio: document.getElementById('needleDropAudio'),
  };

  // Procedural Web Audio: Needle drop & vinyl crackle synthesizer
  let audioCtx = null;
  let hasPlayedNeedleDrop = false;

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

  function playNeedleDropAudio() {

    if (elements.needleAudio && elements.needleAudio.src) {
      elements.needleAudio.currentTime = 0;
      elements.needleAudio.play().catch(() => {});
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      oscGain.gain.setValueAtTime(0.22, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);

      const bufferSize = ctx.sampleRate * 0.45;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2400, now);
      bandpass.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noiseSource.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);

      const popCount = 5;
      for (let p = 0; p < popCount; p++) {
        const popTime = now + 0.05 + Math.random() * 0.7;
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(1200 + Math.random() * 1800, popTime);

        popGain.gain.setValueAtTime(0.06 + Math.random() * 0.04, popTime);
        popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.015);

        popOsc.connect(popGain);
        popGain.connect(ctx.destination);
        popOsc.start(popTime);
        popOsc.stop(popTime + 0.02);
      }
    } catch (err) {
      console.warn('Needle drop audio synthesis:', err);
    }
  }

  // Tonearm & vinyl state
  let isCurrentlyPlaying = false;
  let activeTabProvider = 'discord';

  function setTonearmAngle(angle) {
    if (elements.tonearmRod) {
      elements.tonearmRod.style.transform = `rotate(${angle}deg)`;
    }
  }

  function setVinylSpinning(playing) {
    if (!elements.vinylDisc) return;

    if (playing) {
      elements.vinylDisc.classList.add('is-playing');
      elements.vinylDisc.classList.remove('is-paused');
    } else {
      elements.vinylDisc.classList.remove('is-playing');
      elements.vinylDisc.classList.remove('is-paused');
    }
  }

  function setVinylPaused(paused) {
    if (!elements.vinylDisc) return;

    if (paused) {
      elements.vinylDisc.classList.add('is-paused');
    } else {
      elements.vinylDisc.classList.remove('is-paused');
    }
  }

  const VE_DEMO_TRACK = {
    song: "Sincerely",
    artist: "TRUE",
    album: "VIOLET EVERGARDEN: Automemories",
    album_art_url: "../assets/ve-demo-cover.jpg",
    durationMs: 280000,
    elapsedMs: 68000,
  };

  const songViewerService = new (window.SongViewerService || window.SpotifyService)({
    demoTrack: VE_DEMO_TRACK,

    onTrackUpdate: (track) => {
      const isPaused = Boolean(track.isPaused);
      isCurrentlyPlaying = !isPaused;

      if (elements.trackInfoSection) elements.trackInfoSection.style.display = 'flex';
      if (elements.standbySection) elements.standbySection.style.display = 'none';

      if (elements.songTitle) {
        elements.songTitle.textContent = track.song || 'Untitled Melody';
        elements.songTitle.title = track.song || '';
      }
      if (elements.artistName) {
        elements.artistName.textContent = (track.artist || 'Unknown Artist').replace(/;/g, ',');
      }
      if (elements.albumName) {
        elements.albumName.textContent = track.album || 'Gramophone Master';
      }

      if (track.album_art_url && elements.albumImg && elements.broochFallback) {
        elements.albumImg.src = track.album_art_url;
        elements.albumImg.style.display = 'block';
        elements.broochFallback.style.display = 'none';

        elements.albumImg.onerror = () => {
          elements.albumImg.style.display = 'none';
          elements.broochFallback.style.display = 'flex';
        };
      } else if (elements.albumImg && elements.broochFallback) {
        elements.albumImg.style.display = 'none';
        elements.broochFallback.style.display = 'flex';
      }

      if (elements.statusBadge) {
        if (track.isLastScrobble) {
          elements.statusBadge.textContent = 'LAST SCROBBLE';
          elements.statusBadge.className = 'status-seal is-paused';
        } else if (isPaused) {
          elements.statusBadge.textContent = 'PAUSED';
          elements.statusBadge.className = 'status-seal is-paused';
        } else {
          elements.statusBadge.textContent = 'ON AIR';
          elements.statusBadge.className = 'status-seal is-playing';
        }
      }

      if (elements.providerLabel) {
        elements.providerLabel.textContent = (songViewerService.provider === 'discord' ? 'LANYARD' : 'LAST.FM');
      }

  // Mechanical Tonearm & Vinyl Physical State
      if (!isPaused) {
        setVinylSpinning(true);
        if (!hasPlayedNeedleDrop) {
          playNeedleDropAudio();
          hasPlayedNeedleDrop = true;
        }
      } else {
        setVinylPaused(true);
      }
    },

    onProgressUpdate: ({ isStreaming, percentage, currentFormatted, durationFormatted }) => {

      if (elements.timeCurrent) {
        elements.timeCurrent.textContent = isStreaming ? '--:--' : currentFormatted;
      }
      if (elements.timeDuration) {
        elements.timeDuration.textContent = isStreaming ? '--:--' : durationFormatted;
      }

      if (elements.analogFill) {
        elements.analogFill.style.width = isStreaming ? '0%' : `${percentage}%`;
      }

  // Physical Tonearm Needle Tracking
      if (!isStreaming && isCurrentlyPlaying) {
        const clampedPct = Math.min(100, Math.max(0, percentage));
        const tonearmAngle = TONEARM_ANGLES.TRACK_START + (clampedPct / 100) * (TONEARM_ANGLES.TRACK_END - TONEARM_ANGLES.TRACK_START);
        setTonearmAngle(tonearmAngle);
      }
    },

    onStateChange: ({ isPaused }) => {
      isCurrentlyPlaying = !isPaused;

      if (isPaused) {
        setVinylPaused(true);
        if (elements.statusBadge && !songViewerService.isLastScrobble) {
          elements.statusBadge.textContent = 'PAUSED';
          elements.statusBadge.className = 'status-seal is-paused';
        }
      } else {
        setVinylPaused(false);
        setVinylSpinning(true);
        if (elements.statusBadge && !songViewerService.isLastScrobble) {
          elements.statusBadge.textContent = 'ON AIR';
          elements.statusBadge.className = 'status-seal is-playing';
        }
        playNeedleDropAudio();
      }
    },

    onStandby: (provider, hintText) => {
      isCurrentlyPlaying = false;
      hasPlayedNeedleDrop = false;

  // Stop Vinyl Rotation & Return Tonearm to Rest Cradle
      setVinylSpinning(false);
      setTonearmAngle(TONEARM_ANGLES.REST);

      if (elements.albumImg && elements.broochFallback) {
        elements.albumImg.style.display = 'none';
        elements.broochFallback.style.display = 'flex';
      }

      if (elements.trackInfoSection) elements.trackInfoSection.style.display = 'none';
      if (elements.standbySection) elements.standbySection.style.display = 'flex';

      if (elements.statusBadge) {
        elements.statusBadge.textContent = 'STANDBY';
        elements.statusBadge.className = 'status-seal';
      }

      if (elements.standbyHint) {
        if (hintText) {
          elements.standbyHint.textContent = hintText;
        } else if (provider === 'discord') {
          elements.standbyHint.textContent = 'Ensure music playback is active and Discord Lanyard is joined.';
        } else {
          elements.standbyHint.textContent = 'Play a song to begin recording.';
        }
      }
    },

    onError: (err) => {
      console.warn('[Phonograph Widget]', err);
    },
  });

  function switchTab(prov) {
    activeTabProvider = prov;
    if (prov === 'discord') {
      elements.tabDiscord.classList.add('active');
      elements.tabLastfm.classList.remove('active');
      elements.discordTabContent.style.display = 'block';
      elements.lastfmTabContent.style.display = 'none';
    } else {
      elements.tabLastfm.classList.add('active');
      elements.tabDiscord.classList.remove('active');
      elements.lastfmTabContent.style.display = 'block';
      elements.discordTabContent.style.display = 'none';
    }
  }

  function openConfigModal() {
    getAudioContext(); // User gesture unlocks audio context if locked

    if (elements.discordIdInput) {
      elements.discordIdInput.value = songViewerService.discordId || '';
    }
    if (elements.lastfmUsernameInput) {
      elements.lastfmUsernameInput.value = songViewerService.lastfmUser || '';
    }
    if (elements.lastfmApiKeyInput) {
      elements.lastfmApiKeyInput.value = songViewerService.lastfmApiKey || '';
    }

    switchTab(songViewerService.provider || 'discord');

    if (elements.configModal) {
      elements.configModal.style.display = 'flex';
      elements.configModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeConfigModal() {
    if (elements.configModal) {
      elements.configModal.style.display = 'none';
      elements.configModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (elements.openConfigBtn) {
    elements.openConfigBtn.addEventListener('click', openConfigModal);
  }
  if (elements.standbyConfigBtn) {
    elements.standbyConfigBtn.addEventListener('click', openConfigModal);
  }
  if (elements.closeConfigBtn) {
    elements.closeConfigBtn.addEventListener('click', closeConfigModal);
  }

  if (elements.tabDiscord) {
    elements.tabDiscord.addEventListener('click', () => switchTab('discord'));
  }
  if (elements.tabLastfm) {
    elements.tabLastfm.addEventListener('click', () => switchTab('lastfm'));
  }

  if (elements.saveConfigBtn) {
    elements.saveConfigBtn.addEventListener('click', () => {
      hasPlayedNeedleDrop = false;
      songViewerService.saveConfig({
        provider: activeTabProvider,
        discordId: elements.discordIdInput ? elements.discordIdInput.value.trim() : '',
        lastfmUser: elements.lastfmUsernameInput ? elements.lastfmUsernameInput.value.trim() : '',
        lastfmApiKey: elements.lastfmApiKeyInput ? elements.lastfmApiKeyInput.value.trim() : '',
      });
      closeConfigModal();
    });
  }

  if (elements.demoBtn) {
    elements.demoBtn.addEventListener('click', () => {
      hasPlayedNeedleDrop = false;
      closeConfigModal();
      songViewerService.runDemoMode(VE_DEMO_TRACK);
    });
  }

  if (elements.configModal) {
    elements.configModal.addEventListener('click', (e) => {
      if (e.target === elements.configModal) {
        closeConfigModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.configModal && elements.configModal.style.display === 'flex') {
      closeConfigModal();
    }
  });

  if (elements.vinylDisc) {
    elements.vinylDisc.addEventListener('click', () => {
      playNeedleDropAudio();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
  // Start in resting tonearm position
    setTonearmAngle(TONEARM_ANGLES.REST);

    songViewerService.init();
  });

})();
