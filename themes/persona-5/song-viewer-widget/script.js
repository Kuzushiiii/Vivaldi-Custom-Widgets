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

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch (_) {}
  }

  
  const elements = {
    musicRoot: document.getElementById('musicRoot'),
    badgePrefix: document.getElementById('badgePrefix'),
    statusBadge: document.getElementById('statusBadge'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    openConfigBtn: document.getElementById('openConfigBtn'),

    heroAlbumStage: document.getElementById('heroAlbumStage'),
    albumArtCard: document.getElementById('albumArtCard'),
    albumImg: document.getElementById('albumImg'),
    artFallback: document.getElementById('artFallback'),
    visOverlay: document.getElementById('visOverlay'),
    visBars: document.querySelectorAll('.vis-bar'),

    trackDetailsBlock: document.getElementById('trackDetailsBlock'),
    titleMarqueeWindow: document.getElementById('titleMarqueeWindow'),
    songTitle: document.getElementById('songTitle'),
    artistRibbon: document.getElementById('artistRibbon'),
    artistName: document.getElementById('artistName'),
    albumName: document.getElementById('albumName'),

    progressSection: document.getElementById('progressSection'),
    barTrack: document.getElementById('barTrack'),
    trackProgress: document.getElementById('trackProgress'),
    meterBeacon: document.getElementById('meterBeacon'),
    timeCurrent: document.getElementById('timeCurrent'),
    timeDuration: document.getElementById('timeDuration'),

    standbySection: document.getElementById('standbySection'),
    standbyHint: document.getElementById('standbyHint'),
    standbyDemoBtn: document.getElementById('standbyDemoBtn'),
    standbyConfigBtn: document.getElementById('standbyConfigBtn'),

    configModal: document.getElementById('configModal'),
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
    phoneClock: document.getElementById('phoneClock')
  };

  if (elements.albumImg && elements.artFallback) {
    elements.albumImg.onerror = () => {
      elements.albumImg.style.display = 'none';
      elements.artFallback.style.display = 'flex';
    };
  }

  
  function updatePhoneClock() {
    if (!elements.phoneClock) return;
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    elements.phoneClock.textContent = `${hrs}:${mins}`;
  }

  function updateSoundIcon() {
    if (!elements.soundIcon) return;
    elements.soundIcon.textContent = audioState.enabled ? '🔊' : '🔇';
  }

  if (elements.soundToggleBtn) {
    updateSoundIcon();
    elements.soundToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audioState.enabled = !audioState.enabled;
      localStorage.setItem('p5_cal_sound', audioState.enabled ? 'true' : 'false');
      updateSoundIcon();
      if (audioState.enabled) playBlipSound();
    });
  }

  
  let currentRawTitle = '';
  function updateSongTitle(title) {
    if (!elements.songTitle || !elements.titleMarqueeWindow) return;
    const cleanTitle = (title || 'Unknown Title').trim().toUpperCase();
    if (cleanTitle === currentRawTitle && elements.songTitle.classList.contains('is-marquee')) {
      return;
    }
    currentRawTitle = cleanTitle;

    elements.songTitle.classList.remove('is-marquee');
    elements.songTitle.textContent = cleanTitle;

    requestAnimationFrame(() => {
      const windowWidth = elements.titleMarqueeWindow.clientWidth;
      const titleWidth = elements.songTitle.scrollWidth;
      if (titleWidth > windowWidth + 6) {
        elements.songTitle.textContent = `${cleanTitle}   ///   ${cleanTitle}   ///   `;
        elements.songTitle.classList.add('is-marquee');
      }
    });
  }

  
  let activeTabProvider = 'discord';

  const P5_DEMO_TRACK = {
    song: "Life Will Change",
    artist: "Lyn, Shoji Meguro",
    album: "Persona 5 Original Soundtrack",
    album_art_url:
      "https://t2.genius.com/unsafe/344x344/https%3A%2F%2Fimages.genius.com%2F29fe123938b00fe1522ca7a8c04ff9b5.1000x1000x1.png",
    durationMs: 265000,
    elapsedMs: 74000,
  };

  const songViewerService = new (window.SongViewerService || window.SpotifyService)({
    demoTrack: P5_DEMO_TRACK,
    onTrackUpdate: (track) => {
      songViewerService.isLastScrobble = Boolean(track.isLastScrobble);

      if (elements.musicRoot) elements.musicRoot.classList.add('is-playing');
      if (elements.heroAlbumStage) elements.heroAlbumStage.style.display = 'flex';
      if (elements.trackDetailsBlock) elements.trackDetailsBlock.style.display = 'flex';
      if (elements.progressSection) elements.progressSection.style.display = 'flex';
      if (elements.standbySection) elements.standbySection.style.display = 'none';
      if (elements.visOverlay) elements.visOverlay.style.display = 'flex';

      updateSongTitle(track.song);
      if (elements.artistName) {
        elements.artistName.textContent = (track.artist || 'Unknown Artist').replace(/;/g, ',');
      }
      if (elements.albumName) {
        elements.albumName.textContent = track.album || 'Persona 5 OST';
      }

      if (track.album_art_url && elements.albumImg && elements.artFallback) {
        elements.albumImg.src = track.album_art_url;
        elements.albumImg.style.display = 'block';
        elements.artFallback.style.display = 'none';
      } else if (elements.albumImg && elements.artFallback) {
        elements.albumImg.style.display = 'none';
        elements.artFallback.style.display = 'flex';
      }

      if (elements.badgePrefix) {
        elements.badgePrefix.textContent = track.isDemo ? 'DEMO //' : 'BGM //';
      }

      if (elements.statusBadge) {
        if (track.isLastScrobble) {
          elements.statusBadge.textContent = 'LAST SCROBBLE';
          elements.statusBadge.classList.add('paused');
        } else if (track.isPaused) {
          elements.statusBadge.textContent = 'PAUSED';
          elements.statusBadge.classList.add('paused');
        } else {
          elements.statusBadge.textContent = track.isDemo ? 'TAKEOVER' : 'NOW HIJACKING';
          elements.statusBadge.classList.remove('paused');
        }
      }
    },

    onProgressUpdate: ({ isStreaming, percentage, currentFormatted, durationFormatted }) => {
      const clampedPct = Math.max(0, Math.min(100, Number(percentage) || 0));

      if (isStreaming) {
        if (elements.trackProgress) elements.trackProgress.classList.add('streaming');
        if (elements.meterBeacon) elements.meterBeacon.style.left = '100%';
        if (elements.timeCurrent) elements.timeCurrent.textContent = '--:--';
        if (elements.timeDuration) elements.timeDuration.textContent = '--:--';
      } else {
        if (elements.trackProgress) {
          elements.trackProgress.classList.remove('streaming');
          elements.trackProgress.style.width = `${clampedPct}%`;
        }
        if (elements.meterBeacon) {
          elements.meterBeacon.style.left = `${clampedPct}%`;
        }
        if (elements.timeCurrent) elements.timeCurrent.textContent = currentFormatted || '00:00';
        if (elements.timeDuration) elements.timeDuration.textContent = durationFormatted || '00:00';
      }
    },

    onStateChange: ({ isPaused }) => {
      if (elements.musicRoot) {
        if (isPaused) elements.musicRoot.classList.remove('is-playing');
        else elements.musicRoot.classList.add('is-playing');
      }

      if (elements.visBars) {
        elements.visBars.forEach((bar) => {
          if (isPaused) bar.classList.add('paused');
          else bar.classList.remove('paused');
        });
      }

      if (elements.statusBadge && !songViewerService.isLastScrobble) {
        if (isPaused) {
          elements.statusBadge.textContent = 'PAUSED';
          elements.statusBadge.classList.add('paused');
        } else {
          elements.statusBadge.textContent = 'NOW HIJACKING';
          elements.statusBadge.classList.remove('paused');
        }
      }
    },

    onStandby: (provider, hintText) => {
      songViewerService.isLastScrobble = false;

      if (elements.musicRoot) elements.musicRoot.classList.remove('is-playing');
      if (elements.heroAlbumStage) elements.heroAlbumStage.style.display = 'none';
      if (elements.trackDetailsBlock) elements.trackDetailsBlock.style.display = 'none';
      if (elements.progressSection) elements.progressSection.style.display = 'none';
      if (elements.standbySection) elements.standbySection.style.display = 'flex';
      if (elements.visOverlay) elements.visOverlay.style.display = 'none';

      if (elements.badgePrefix) elements.badgePrefix.textContent = 'SIGNAL //';
      if (elements.statusBadge) {
        elements.statusBadge.textContent = 'STANDBY';
        elements.statusBadge.classList.add('paused');
      }

      if (elements.visBars) {
        elements.visBars.forEach((bar) => bar.classList.add('paused'));
      }

      if (elements.standbyHint) {
        if (hintText) {
          elements.standbyHint.textContent = hintText;
        } else if (provider === 'discord') {
          elements.standbyHint.textContent = 'Ensure music playback is active on Discord (must join discord.gg/lanyard)';
        } else {
          elements.standbyHint.textContent = 'Play a track to begin infiltration';
        }
      }
    }
  });

  
  function switchTab(prov) {
    activeTabProvider = prov;
    if (!elements.tabDiscord || !elements.tabLastfm) return;
    playBlipSound();

    if (prov === 'discord') {
      elements.tabDiscord.classList.add('active');
      elements.tabLastfm.classList.remove('active');
      if (elements.discordTabContent) elements.discordTabContent.style.display = 'block';
      if (elements.lastfmTabContent) elements.lastfmTabContent.style.display = 'none';
    } else {
      elements.tabLastfm.classList.add('active');
      elements.tabDiscord.classList.remove('active');
      if (elements.lastfmTabContent) elements.lastfmTabContent.style.display = 'block';
      if (elements.discordTabContent) elements.discordTabContent.style.display = 'none';
    }
  }

  function openModal() {
    playSlashSound();
    updatePhoneClock();
    if (elements.discordIdInput) elements.discordIdInput.value = songViewerService.discordId || '';
    if (elements.lastfmUsernameInput) elements.lastfmUsernameInput.value = songViewerService.lastfmUser || '';
    if (elements.lastfmApiKeyInput) elements.lastfmApiKeyInput.value = songViewerService.lastfmApiKey || '';

    switchTab(songViewerService.provider);
    if (elements.configModal) elements.configModal.style.display = 'flex';
  }

  function closeModal() {
    playBlipSound();
    if (elements.configModal) elements.configModal.style.display = 'none';
  }

  if (elements.tabDiscord) elements.tabDiscord.addEventListener('click', () => switchTab('discord'));
  if (elements.tabLastfm) elements.tabLastfm.addEventListener('click', () => switchTab('lastfm'));
  if (elements.openConfigBtn) elements.openConfigBtn.addEventListener('click', openModal);
  if (elements.standbyConfigBtn) elements.standbyConfigBtn.addEventListener('click', openModal);
  if (elements.closeConfigBtn) elements.closeConfigBtn.addEventListener('click', closeModal);

  if (elements.saveConfigBtn) {
    elements.saveConfigBtn.addEventListener('click', () => {
      playSlashSound();
      songViewerService.saveConfig({
        provider: activeTabProvider,
        discordId: elements.discordIdInput ? elements.discordIdInput.value : '',
        lastfmUser: elements.lastfmUsernameInput ? elements.lastfmUsernameInput.value : '',
        lastfmApiKey: elements.lastfmApiKeyInput ? elements.lastfmApiKeyInput.value : ''
      });
      closeModal();
    });
  }

  if (elements.demoBtn) {
    elements.demoBtn.addEventListener('click', () => {
      playSlashSound();
      closeModal();
      songViewerService.runDemoMode(P5_DEMO_TRACK);
    });
  }

  if (elements.standbyDemoBtn) {
    elements.standbyDemoBtn.addEventListener('click', () => {
      playSlashSound();
      songViewerService.runDemoMode(P5_DEMO_TRACK);
    });
  }

  
  randomizeMask();
  updatePhoneClock();
  songViewerService.init();

  setInterval(updatePhoneClock, 30000);

  window.addEventListener('resize', () => {
    if (currentRawTitle) updateSongTitle(currentRawTitle);
  });
})();
