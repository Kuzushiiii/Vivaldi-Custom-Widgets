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

  const elements = {
    p5Banner: document.querySelector('.p5-banner'),
    badgePrefix: document.getElementById('badgePrefix'),
    statusBadge: document.getElementById('statusBadge'),
    songTitle: document.getElementById('songTitle'),
    artistName: document.getElementById('artistName'),
    albumName: document.getElementById('albumName'),
    albumImg: document.getElementById('albumImg'),
    artFallback: document.getElementById('artFallback'),
    artWrap: document.getElementById('artWrap'),
    infoBot: document.querySelector('.info-bot-centered'),
    trackProgress: document.getElementById('trackProgress'),
    timeCurrent: document.getElementById('timeCurrent'),
    timeDuration: document.getElementById('timeDuration'),
    visOverlay: document.getElementById('visOverlay'),
    visBars: document.querySelectorAll('.vis-bar'),
    trackInfoSection: document.getElementById('trackInfoSection'),
    standbySection: document.getElementById('standbySection'),
    standbyHint: document.getElementById('standbyHint'),

    configModal: document.getElementById('configModal'),
    openConfigBtn: document.getElementById('openConfigBtn'),
    standbyConfigBtn: document.getElementById('standbyConfigBtn'),
    closeConfigBtn: document.getElementById('closeConfigBtn'),
    saveConfigBtn: document.getElementById('saveConfigBtn'),
    demoBtn: document.getElementById('demoBtn'),
    discordIdInput: document.getElementById('discordIdInput'),
    lastfmUsernameInput: document.getElementById('lastfmUsernameInput'),
    lastfmApiKeyInput: document.getElementById('lastfmApiKeyInput'),
    tabDiscord: document.getElementById('tabDiscord'),
    tabLastfm: document.getElementById('tabLastfm'),
    discordTabContent: document.getElementById('discordTabContent'),
    lastfmTabContent: document.getElementById('lastfmTabContent')
  };

  if (elements.albumImg && elements.artFallback) {
    elements.albumImg.onerror = () => {
      elements.albumImg.style.display = 'none';
      elements.artFallback.style.display = 'flex';
    };
  }

  let activeTabProvider = 'discord';

  const spotifyService = new SpotifyService({
    onTrackUpdate: (track) => {
      spotifyService.isLastScrobble = Boolean(track.isLastScrobble);
      if (elements.p5Banner) elements.p5Banner.classList.add('is-playing');
      if (elements.infoBot) elements.infoBot.style.display = 'flex';
      if (elements.artWrap) elements.artWrap.style.display = 'flex';
      if (elements.trackInfoSection) elements.trackInfoSection.style.display = 'flex';
      if (elements.standbySection) elements.standbySection.style.display = 'none';
      if (elements.visOverlay) elements.visOverlay.style.display = 'flex';

      if (elements.songTitle) elements.songTitle.textContent = track.song || 'Unknown Title';
      if (elements.artistName) elements.artistName.textContent = (track.artist || 'Unknown Artist').replace(/;/g, ',');
      if (elements.albumName) elements.albumName.textContent = track.album || '';

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
        elements.statusBadge.textContent = track.isLastScrobble
          ? 'LAST SCROBBLE'
          : (track.isPaused ? 'PAUSED' : 'ON AIR');
      }
    },

    onProgressUpdate: ({ isStreaming, percentage, currentFormatted, durationFormatted }) => {
      if (!elements.trackProgress) return;

      if (isStreaming) {
        elements.trackProgress.classList.add('streaming');
        if (elements.timeCurrent) elements.timeCurrent.textContent = '--:--';
        if (elements.timeDuration) elements.timeDuration.textContent = '--:--';
      } else {
        elements.trackProgress.classList.remove('streaming');
        elements.trackProgress.style.width = `${percentage}%`;
        if (elements.timeCurrent) elements.timeCurrent.textContent = currentFormatted;
        if (elements.timeDuration) elements.timeDuration.textContent = durationFormatted;
      }
    },

    onStateChange: ({ isPaused }) => {
      if (elements.visBars) {
        elements.visBars.forEach((bar) => {
          if (isPaused) bar.classList.add('paused');
          else bar.classList.remove('paused');
        });
      }
      if (elements.statusBadge && !spotifyService.isLastScrobble) {
        elements.statusBadge.textContent = isPaused ? 'PAUSED' : 'ON AIR';
        if (isPaused) elements.statusBadge.classList.add('paused');
        else elements.statusBadge.classList.remove('paused');
      }
    },

    onStandby: (provider, hintText) => {
      spotifyService.isLastScrobble = false;
      if (elements.p5Banner) elements.p5Banner.classList.remove('is-playing');
      if (elements.infoBot) elements.infoBot.style.display = 'none';
      if (elements.artWrap) elements.artWrap.style.display = 'none';
      if (elements.trackInfoSection) elements.trackInfoSection.style.display = 'none';
      if (elements.standbySection) elements.standbySection.style.display = 'flex';
      if (elements.visOverlay) elements.visOverlay.style.display = 'none';

      if (elements.visBars) {
        elements.visBars.forEach((bar) => bar.classList.add('paused'));
      }

      if (elements.standbyHint) {
        if (hintText) {
          elements.standbyHint.textContent = hintText;
        } else if (provider === 'discord') {
          elements.standbyHint.textContent = 'If not detected, make sure you joined discord.gg/lanyard';
        } else {
          elements.standbyHint.textContent = 'Play a track on Spotify to display';
        }
      }
    }
  });

  function switchTab(prov) {
    activeTabProvider = prov;
    if (!elements.tabDiscord || !elements.tabLastfm) return;

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
    if (elements.discordIdInput) elements.discordIdInput.value = spotifyService.discordId;
    if (elements.lastfmUsernameInput) elements.lastfmUsernameInput.value = spotifyService.lastfmUser;
    if (elements.lastfmApiKeyInput) elements.lastfmApiKeyInput.value = spotifyService.lastfmApiKey;

    switchTab(spotifyService.provider);
    if (elements.configModal) elements.configModal.style.display = 'flex';
  }

  function closeModal() {
    if (elements.configModal) elements.configModal.style.display = 'none';
  }

  if (elements.tabDiscord) elements.tabDiscord.addEventListener('click', () => switchTab('discord'));
  if (elements.tabLastfm) elements.tabLastfm.addEventListener('click', () => switchTab('lastfm'));
  if (elements.openConfigBtn) elements.openConfigBtn.addEventListener('click', openModal);
  if (elements.standbyConfigBtn) elements.standbyConfigBtn.addEventListener('click', openModal);
  if (elements.closeConfigBtn) elements.closeConfigBtn.addEventListener('click', closeModal);

  if (elements.saveConfigBtn) {
    elements.saveConfigBtn.addEventListener('click', () => {
      spotifyService.saveConfig({
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
      closeModal();
      spotifyService.runDemoMode();
    });
  }

  randomizeMask();
  spotifyService.init();
})();
