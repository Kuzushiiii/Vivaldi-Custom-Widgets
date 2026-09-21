/**
 * FRIEREN: BEYOND JOURNEY'S END — SONG VIEWER CONTROLLER
 * Theme Concept: "The Elven Staff Crystal"
 * Aesthetic: Serene Fantasy, Elven Magic, & Eternal Time
 *
 * Architecture:
 * - Album Art (The Staff Crystal): Dual-line gold framed crystal lens with peaceful 4.8s breathing mana glow.
 * - Typography (The Spell & The Caster): Grand serif track title & scribed italic artist notes.
 * - Progress Bar (The Mana Thread): 1px dotted cartographic line with glowing cyan particle beacon.
 * - Shared SongViewerService: Bridges Discord Lanyard (WebSocket/REST) & Last.fm API.
 * - Zero Browser Tooltips: Strictly removes native OS title attributes to preserve ancient manuscript immersion.
 * - Shared Theme Persistence: Syncs 'frieren_day_theme' via localStorage & storage event.
 */

(function () {
  'use strict';

  // --- DOM REFERENCES ---
  const elements = {
    root: document.getElementById('frierenSongRoot'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),

    statusBadge: document.getElementById('statusBadge'),
    openConfigBtn: document.getElementById('openConfigBtn'),
    standbyConfigBtn: document.getElementById('standbyConfigBtn'),
    closeConfigBtn: document.getElementById('closeConfigBtn'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    demoBtn: document.getElementById('demoBtn'),

    trackInfoSection: document.getElementById('trackInfoSection'),
    standbySection: document.getElementById('standbySection'),
    standbyHint: document.getElementById('standbyHint'),

    songTitle: document.getElementById('songTitle'),
    artistName: document.getElementById('artistName'),
    albumName: document.getElementById('albumName'),

    albumImg: document.getElementById('albumImg'),
    crystalFallback: document.getElementById('crystalFallback'),

    manaThreadFill: document.getElementById('manaThreadFill'),
    manaParticleBeacon: document.getElementById('manaParticleBeacon'),
    timeCurrent: document.getElementById('timeCurrent'),
    timeDuration: document.getElementById('timeDuration'),

    configModal: document.getElementById('configModal'),
    tabDiscord: document.getElementById('tabDiscord'),
    tabLastfm: document.getElementById('tabLastfm'),
    discordTabContent: document.getElementById('discordTabContent'),
    lastfmTabContent: document.getElementById('lastfmTabContent'),

    discordIdInput: document.getElementById('discordIdInput'),
    lastfmUsernameInput: document.getElementById('lastfmUsernameInput'),
    lastfmApiKeyInput: document.getElementById('lastfmApiKeyInput'),
  };

  // --- FRIEREN DEMO TRACK DEFINITION ---
  const FRIEREN_DEMO_TRACK = {
    song: "Anytime Anywhere",
    artist: "milet",
    album: "Sousou no Frieren Ending Theme",
    album_art_url: "", // triggers the elven staff crystal gem fallback by default
    durationMs: 230000,
    elapsedMs: 65000,
  };

  let activeTabProvider = 'discord';

  // --- SERVICE INITIALIZATION ---
  const SongServiceClass = window.SongViewerService || window.SpotifyService;
  if (!SongServiceClass) {
    console.error('[Frieren Song Viewer] SongViewerService not found.');
    return;
  }

  const songViewerService = new SongServiceClass({
    demoTrack: FRIEREN_DEMO_TRACK,

    onTrackUpdate: (track) => {
      const isPaused = Boolean(track.isPaused);

      if (elements.trackInfoSection) elements.trackInfoSection.style.display = 'flex';
      if (elements.standbySection) elements.standbySection.style.display = 'none';

      // 1. Pillar 2: Typography (The Spell & The Caster)
      // Strictly NO element.title attribute to kill native browser tooltips!
      if (elements.songTitle) {
        elements.songTitle.textContent = track.song || 'Untitled Spell';
      }
      if (elements.artistName) {
        elements.artistName.textContent = (track.artist || 'Unknown Mage').replace(/;/g, ', ');
      }
      if (elements.albumName) {
        elements.albumName.textContent = track.album || "Flamme's Grimoire";
      }

      // 2. Pillar 1: Album Art (The Staff Crystal)
      if (track.album_art_url && elements.albumImg && elements.crystalFallback) {
        elements.albumImg.src = track.album_art_url;
        elements.albumImg.style.display = 'block';
        elements.crystalFallback.style.display = 'none';

        elements.albumImg.onerror = () => {
          elements.albumImg.style.display = 'none';
          elements.crystalFallback.style.display = 'flex';
        };
      } else if (elements.albumImg && elements.crystalFallback) {
        elements.albumImg.style.display = 'none';
        elements.crystalFallback.style.display = 'flex';
      }

      // 3. Mana Status Tag
      if (elements.statusBadge) {
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

    // 4. Pillar 3: Progress Bar (The Mana Thread)
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
      if (elements.statusBadge && !songViewerService.isLastScrobble) {
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
      if (elements.albumImg && elements.crystalFallback) {
        elements.albumImg.style.display = 'none';
        elements.crystalFallback.style.display = 'flex';
      }

      if (elements.trackInfoSection) elements.trackInfoSection.style.display = 'none';
      if (elements.standbySection) elements.standbySection.style.display = 'flex';

      if (elements.statusBadge) {
        elements.statusBadge.textContent = 'STANDBY';
        elements.statusBadge.className = 'mana-status-tag';
      }

      if (elements.manaThreadFill) elements.manaThreadFill.style.width = '0%';
      if (elements.manaParticleBeacon) elements.manaParticleBeacon.style.left = '0%';

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

  // --- CONFIG MODAL MANAGEMENT ---
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

  // --- PILLAR 4: SHARED THEME SYNCHRONIZATION ---
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

    // Synchronize across widgets if Calendar or Day Progression changes theme
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

  // --- INITIALIZATION ---
  initTheme();
  songViewerService.init();

})();
