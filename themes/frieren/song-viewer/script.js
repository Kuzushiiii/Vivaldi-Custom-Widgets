/**
 * Frieren song viewer controller.
 */

(function () {
  'use strict';

  const elements = {
    root: document.getElementById('songViewerWidget') || document.getElementById('frierenSongRoot'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),

    statusBadge: document.getElementById('statusIcon') || document.getElementById('statusBadge'),
    openConfigBtn: document.getElementById('openConfigBtn'),
    standbyConfigBtn: document.getElementById('standbyConfigBtn'),
    closeConfigBtn: document.getElementById('closeConfigBtn'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    demoBtn: document.getElementById('demoBtn'),

    trackInfoSection: document.querySelector('.track-details-stage') || document.getElementById('trackInfoSection'),
    standbySection: document.getElementById('standbySection'),
    standbyHint: document.getElementById('standbyHint'),

    songTitle: document.getElementById('trackTitle') || document.getElementById('songTitle'),
    artistName: document.getElementById('trackArtist') || document.getElementById('artistName'),
    albumName: document.getElementById('trackAlbum') || document.getElementById('albumName'),

    albumImg: document.getElementById('albumArt') || document.getElementById('albumImg'),
    crystalFallback: document.getElementById('crystalFallback'),

    manaThreadFill: document.getElementById('progressFill') || document.getElementById('manaThreadFill'),
    manaParticleBeacon: document.getElementById('progressThumb') || document.getElementById('manaParticleBeacon'),
    timeCurrent: document.getElementById('currentTime') || document.getElementById('timeCurrent'),
    timeDuration: document.getElementById('totalTime') || document.getElementById('timeDuration'),

    configModal: document.getElementById('configModal'),
    tabDiscord: document.getElementById('tabDiscord'),
    tabLastfm: document.getElementById('tabLastfm'),
    discordTabContent: document.getElementById('discordTabContent'),
    lastfmTabContent: document.getElementById('lastfmTabContent'),

    discordIdInput: document.getElementById('discordIdInput'),
    lastfmUsernameInput: document.getElementById('lastfmUsernameInput'),
    lastfmApiKeyInput: document.getElementById('lastfmApiKeyInput'),
  };

  const FRIEREN_DEMO_TRACK = {
    song: "Anytime Anywhere",
    artist: "milet",
    album: "Sousou no Frieren Ending Theme",
    album_art_url: "",
    durationMs: 230000,
    elapsedMs: 65000,
  };

  let activeTabProvider = 'discord';

  const SongServiceClass = window.SongViewerService || window.SpotifyService;
  if (!SongServiceClass) {
    console.error('[Frieren Song Viewer] SongViewerService not found.');
    return;
  }

  const songViewerService = new SongServiceClass({
    demoTrack: FRIEREN_DEMO_TRACK,

    onTrackUpdate: (track) => {
      const isPaused = Boolean(track.isPaused);

      if (elements.root) {
        elements.root.setAttribute('data-status', isPaused ? 'paused' : 'playing');
      }

      if (elements.trackInfoSection) elements.trackInfoSection.style.display = 'flex';
      if (elements.standbySection) elements.standbySection.style.display = 'none';

      if (elements.songTitle) {
        elements.songTitle.textContent = track.song || 'Awaiting Melody';
      }
      if (elements.artistName) {
        elements.artistName.textContent = (track.artist || 'Fern · Ordinary Offensive Magic').replace(/;/g, ', ');
      }
      if (elements.albumName) {
        elements.albumName.textContent = track.album || "Fern's Grimoire";
      }

      if (track.album_art_url && elements.albumImg) {
        elements.albumImg.src = track.album_art_url;
        elements.albumImg.style.display = 'block';
        if (elements.crystalFallback) elements.crystalFallback.style.display = 'none';

        elements.albumImg.onerror = () => {
          elements.albumImg.style.display = 'none';
          if (elements.crystalFallback) elements.crystalFallback.style.display = 'flex';
        };
      } else {
        if (elements.albumImg) elements.albumImg.style.display = 'none';
        if (elements.crystalFallback) elements.crystalFallback.style.display = 'flex';
      }

      if (elements.statusBadge && elements.statusBadge.classList.contains('mana-status-tag')) {
        if (track.isLastScrobble) {
          elements.statusBadge.textContent = 'LAST ECHO';
          elements.statusBadge.className = 'mana-status-tag is-paused';
        } else if (isPaused) {
          elements.statusBadge.textContent = 'STILLED';
          elements.statusBadge.className = 'mana-status-tag is-paused';
        } else {
          elements.statusBadge.textContent = 'CHANNELED';
          elements.statusBadge.className = 'mana-status-tag is-playing';
        }
      }
    },

    onProgressUpdate: ({ isStreaming, percentage, currentFormatted, durationFormatted }) => {
      const pct = Math.min(100, Math.max(0, percentage || 0));

      if (elements.timeCurrent) {
        elements.timeCurrent.textContent = isStreaming ? '--:--' : currentFormatted;
      }
      if (elements.timeDuration) {
        elements.timeDuration.textContent = isStreaming ? '--:--' : durationFormatted;
      }

      if (elements.manaThreadFill) {
        elements.manaThreadFill.style.width = isStreaming ? '0%' : `${pct}%`;
      }
      if (elements.manaParticleBeacon) {
        elements.manaParticleBeacon.style.left = isStreaming ? '0%' : `${pct}%`;
      }
    },

    onStateChange: ({ isPaused }) => {
      if (elements.root) {
        elements.root.setAttribute('data-status', isPaused ? 'paused' : 'playing');
      }

      if (elements.statusBadge && !songViewerService.isLastScrobble && elements.statusBadge.classList.contains('mana-status-tag')) {
        if (isPaused) {
          elements.statusBadge.textContent = 'STILLED';
          elements.statusBadge.className = 'mana-status-tag is-paused';
        } else {
          elements.statusBadge.textContent = 'CHANNELED';
          elements.statusBadge.className = 'mana-status-tag is-playing';
        }
      }
    },

    onStandby: (provider, hintText) => {
      if (elements.albumImg) elements.albumImg.style.display = 'none';
      if (elements.crystalFallback) elements.crystalFallback.style.display = 'flex';

      if (elements.root) elements.root.setAttribute('data-status', 'paused');

      if (elements.trackInfoSection && elements.standbySection) {
        elements.trackInfoSection.style.display = 'none';
        elements.standbySection.style.display = 'flex';
      }

      if (elements.statusBadge && elements.statusBadge.classList.contains('mana-status-tag')) {
        elements.statusBadge.textContent = 'STANDBY';
        elements.statusBadge.className = 'mana-status-tag';
      }

      if (elements.manaThreadFill) elements.manaThreadFill.style.width = '0%';
      if (elements.manaParticleBeacon) elements.manaParticleBeacon.style.left = '0%';

      if (elements.songTitle) elements.songTitle.textContent = 'Awaiting Melody';
      if (elements.artistName) elements.artistName.textContent = hintText || 'Fern · Ordinary Offensive Magic';

      if (elements.standbyHint) {
        if (hintText) {
          elements.standbyHint.textContent = hintText;
        } else if (provider === 'discord') {
          elements.standbyHint.textContent = 'Ensure Spotify is active and Discord Lanyard is joined.';
        } else {
          elements.standbyHint.textContent = 'Play a melody on Last.fm to channel sound.';
        }
      }
    },

    onError: (err) => {
      console.warn('[Frieren Staff Crystal]', err);
    }
  });

  function switchTab(prov) {
    activeTabProvider = prov;
    if (prov === 'discord') {
      if (elements.tabDiscord) elements.tabDiscord.classList.add('active');
      if (elements.tabLastfm) elements.tabLastfm.classList.remove('active');
      if (elements.discordTabContent) elements.discordTabContent.style.display = 'flex';
      if (elements.lastfmTabContent) elements.lastfmTabContent.style.display = 'none';
    } else {
      if (elements.tabLastfm) elements.tabLastfm.classList.add('active');
      if (elements.tabDiscord) elements.tabDiscord.classList.remove('active');
      if (elements.lastfmTabContent) elements.lastfmTabContent.style.display = 'flex';
      if (elements.discordTabContent) elements.discordTabContent.style.display = 'none';
    }
  }

  function openConfigModal() {
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
      closeConfigModal();
      songViewerService.runDemoMode(FRIEREN_DEMO_TRACK);
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

  function initTheme() {
    const savedTheme = localStorage.getItem('frieren_day_theme') || 'parchment';
    setTheme(savedTheme);

    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', () => {
        const currentTheme = elements.root.getAttribute('data-theme') || 'parchment';
        const nextTheme = (currentTheme === 'parchment' || currentTheme === 'day') ? 'night' : 'parchment';
        setTheme(nextTheme);
      });
    }

    // Synchronize across widgets if Calendar or Day Progression changes theme.
    window.addEventListener('storage', (e) => {
      if (e.key === 'frieren_day_theme' && e.newValue) {
        setTheme(e.newValue);
      }
    });
  }

  function setTheme(theme) {
    const normalized = (theme === 'night') ? 'night' : 'parchment';
    if (elements.root) {
      elements.root.setAttribute('data-theme', normalized);
    }
    localStorage.setItem('frieren_day_theme', normalized);

    if (elements.themeIcon) {
      elements.themeIcon.textContent = normalized === 'night' ? '☀' : '☽';
    }
  }

  function initManaConcealment() {
    const rootEl = elements.root;
    if (!rootEl) return;

    const interactiveSelectors = 'button, input, select, textarea, a, #progressBar, .progress-bar, [role="slider"], [role="button"]';

    let isConcealed = false;

    function concealMana(e) {
      if (e.button !== 0) return;

      if (e.target && e.target.closest(interactiveSelectors)) {
        return;
      }

      isConcealed = true;
      rootEl.classList.add('mana-concealed');
    }

    function revealMana() {
      if (!isConcealed) return;
      isConcealed = false;
      rootEl.classList.remove('mana-concealed');
    }

    rootEl.addEventListener('mousedown', concealMana);

    rootEl.addEventListener('mouseup', revealMana);
    document.body.addEventListener('mouseup', revealMana);
    document.addEventListener('mouseup', revealMana);
    window.addEventListener('mouseup', revealMana);

    // Reset concealment state if cursor leaves or window blurs.
    window.addEventListener('blur', revealMana);
    document.addEventListener('mouseleave', revealMana);
    document.addEventListener('dragend', revealMana);
  }

  initTheme();
  initManaConcealment();
  songViewerService.init();

})();
