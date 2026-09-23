/**
 * Song Viewer (Now Playing) Service
 * Shared module supporting Discord Lanyard (WebSocket/REST) and Last.fm (REST with duration fetching).
 */

const STORAGE_KEYS = {
  PROVIDER: "vcw_music_provider",
  DISCORD: "vcw_lanyard_discord_id",
  LASTFM_USER: "vcw_lastfm_username",
  LASTFM_KEY: "vcw_lastfm_api_key",

  LASTFM_CURRENT_TRACK: "vcw_lastfm_current_track",
  LASTFM_START_TIME: "vcw_lastfm_start_time",
  LASTFM_PAUSED_ELAPSED: "vcw_lastfm_paused_elapsed",

  LASTFM_TRACK_NAME: "vcw_lastfm_track_name",
  LASTFM_TRACK_ARTIST: "vcw_lastfm_track_artist",
  LASTFM_TRACK_ALBUM: "vcw_lastfm_track_album",
  LASTFM_TRACK_ART: "vcw_lastfm_track_art",

  LEGACY_PROVIDER: "p5_music_provider",
  LEGACY_DISCORD: "p5_lanyard_discord_id",
  LEGACY_LASTFM_USER: "p5_lastfm_username",
  LEGACY_LASTFM_KEY: "p5_lastfm_api_key",
};

const DEFAULT_LASTFM_API_KEY = "b25b959554ed76058ac220b7b2e0a026";

function getStorage(key, legacyKey) {
  return (localStorage.getItem(key) || (legacyKey ? localStorage.getItem(legacyKey) : null) ||"");
}

function setStorage(key, legacyKey, value) {
  localStorage.setItem(key, value);
  if (legacyKey) {
    localStorage.setItem(legacyKey, value);
  }
}

function formatTimeMs(ms) {
  if (isNaN(ms) || ms < 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

class SongViewerService {
  constructor(options = {}) {
    this.options = options;

    this.provider = getStorage(STORAGE_KEYS.PROVIDER, STORAGE_KEYS.LEGACY_PROVIDER) || "discord";
    this.discordId = getStorage(STORAGE_KEYS.DISCORD, STORAGE_KEYS.LEGACY_DISCORD,);
    this.lastfmUser = getStorage(STORAGE_KEYS.LASTFM_USER, STORAGE_KEYS.LEGACY_LASTFM_USER,);
    this.lastfmApiKey = getStorage(STORAGE_KEYS.LASTFM_KEY, STORAGE_KEYS.LEGACY_LASTFM_KEY,);

    this.socket = null;
    this.pollInterval = null;
    this.heartbeatInterval = null;
    this.progressTimer = null;

    this.trackStartTime = 0;
    this.trackEndTime = 0;
    this.pausedElapsed = 0;
    this.isDemoMode = false;
    this.isPaused = false;
    this.currentTrackId = null;

    this.trackInfoCache = new Map();
    this._lanyardRetryCount = 0;
    this._lanyardRetryTimer = null;
    this._lastfmRetryCount = 0;
    this.bindVisibilityHandler();
    this.bindOnlineHandlers();
  }

  bindVisibilityHandler() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseProgressTimer();
        this.pausePolling();
      } else {
        this.resumeProgressTimer();
        this.resumePolling();
        if (!this.isDemoMode) {
          if (this.provider === "lastfm") {
            this.fetchLastfmData();
          } else if (this.provider === "discord") {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
              this.connectLanyard();
            }
          }
        }
        this.updateProgress();
      }
    });
    // Fallback for file:// iframes where visibilitychange may not fire reliably
    window.addEventListener("blur", () => {
      this.pauseProgressTimer();
    });
    window.addEventListener("focus", () => {
      this.resumeProgressTimer();
      this.updateProgress();
    });
  }

  isOnline() {
    return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  }

  bindOnlineHandlers() {
    window.addEventListener('online', () => {
      this._lanyardRetryCount = 0;
      this._lastfmRetryCount = 0;
      if (!this.isDemoMode) {
        if (this.provider === 'lastfm' && this.lastfmUser) this.connectLastfm();
        else if (this.provider === 'discord' && this.discordId) this.connectLanyard();
        this.updateProgress();
      }
    });
    window.addEventListener('offline', () => {
      if (this.socket) {
        try { 
          this.socket.onclose = null; this.socket.close(); 
        } 
        catch(e){}
        this.socket = null;
      }

      if (this._lanyardRetryTimer) {
        clearTimeout(this._lanyardRetryTimer); 
        this._lanyardRetryTimer = null;
      }
    });
  }

  getBackoffDelay(baseMs, retryCount, maxMs=60000) {
    return Math.min(maxMs, Math.round(baseMs * Math.pow(1.5, retryCount)));
  }

  pauseProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  resumeProgressTimer() {
    if (!this.progressTimer) {
      this.startProgressTimer();
    }
  }

  pausePolling() {
    // Pause Last.fm / Discord REST polling while hidden to save CPU/battery
    if (this._pollingPaused) return;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this._pausedPollInterval = this.pollInterval;
      this.pollInterval = null;
      this._pollingPaused = true;
    }
  }

  resumePolling() {
    if (!this._pollingPaused) return;
    this._pollingPaused = false;
    this._pausedPollInterval = null;
    // Re-establish correct polling for current provider
    if (this.isDemoMode) return;
    if (this.provider === "lastfm" && this.lastfmUser) {
      this.fetchLastfmData();
      this.pollInterval = setInterval(() => this.fetchLastfmData(), 8000);
    } else if (this.provider === "discord" && this.discordId && !this.socket) {
      // Discord primarily uses WebSocket; fallback polling will be re-created on demand
      this.fallbackRestPolling();
    }
  }

  saveConfig({ provider, discordId, lastfmUser, lastfmApiKey }) {
    this.provider = provider || "discord";
    this.discordId = (discordId || "").trim();
    this.lastfmUser = (lastfmUser || "").trim();
    this.lastfmApiKey = (lastfmApiKey || "").trim();

    setStorage(STORAGE_KEYS.PROVIDER, STORAGE_KEYS.LEGACY_PROVIDER, this.provider,);
    setStorage(STORAGE_KEYS.DISCORD, STORAGE_KEYS.LEGACY_DISCORD, this.discordId,);
    setStorage(STORAGE_KEYS.LASTFM_USER, STORAGE_KEYS.LEGACY_LASTFM_USER, this.lastfmUser,);
    setStorage(STORAGE_KEYS.LASTFM_KEY, STORAGE_KEYS.LEGACY_LASTFM_KEY, this.lastfmApiKey,);

    this.isDemoMode = false;
    this.init();
  }

  init() {
    this.cleanup();

    if (this.isDemoMode) {
      this.runDemoMode();
      return;
    }

    if (this.provider === "discord") {
      if (this.discordId) {
        this.connectLanyard();
      } else {
        this.runDemoMode();
      }
    } else if (this.provider === "lastfm") {
      if (this.lastfmUser) {
        this.connectLastfm();
      } else {
        this.runDemoMode();
      }
    }

    this.startProgressTimer();
  }

  cleanup() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this._lanyardRetryTimer) {
      clearTimeout(this._lanyardRetryTimer);
      this._lanyardRetryTimer = null;
    }
    this._pollingPaused = false;
    this._pausedPollInterval = null;
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.socket) {
      try {
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }
  }

  startProgressTimer() {
    if (this.progressTimer) clearInterval(this.progressTimer);
    // Throttled from 500ms -> 800ms: 37.5% fewer wakeups, still smooth for MM:SS + tonearm/progress bar
    // 1000ms would be max saving (50%) but 800ms keeps per-second tick visually in sync without visible 1s stutter on vinyl needle / progress bar
    this.progressTimer = setInterval(() => this.updateProgress(), 800);
  }

  updateProgress() {
    if (!this.options.onProgressUpdate) return;

    if (!this.trackEndTime) {
      this.options.onProgressUpdate({
        isStreaming: true,
        percentage: 0,
        currentFormatted: "--:--",
        durationFormatted: "--:--",
      });
      return;
    }

    const totalDuration = this.trackEndTime - this.trackStartTime;
    let currentElapsed = 0;

    if (this.isPaused) {
      currentElapsed = Math.min(totalDuration, Math.max(0, this.pausedElapsed));
    } else {
      currentElapsed = Math.min(
        totalDuration,
        Math.max(0, Date.now() - this.trackStartTime),
      );
    }

    const percentage = Math.min(
      100,
      Math.max(0, (currentElapsed / totalDuration) * 100),
    );

    this.options.onProgressUpdate({
      isStreaming: false,
      percentage,
      currentFormatted: formatTimeMs(currentElapsed),
      durationFormatted: formatTimeMs(totalDuration),
      currentMs: currentElapsed,
      totalMs: totalDuration,
    });

    if (currentElapsed >= totalDuration && !this.isDemoMode) {
      this.setPaused(true);
    }
  }

  setPaused(isPaused) {
    this.isPaused = isPaused;
    if (typeof this.options.onStateChange === "function") {
      this.options.onStateChange({
        isPaused: this.isPaused,
        provider: this.provider,
      });
    }
  }

  notifyData(track) {
    if (!track || !track.song) {
      if (typeof this.options.onStandby === "function") {
        this.options.onStandby(this.provider);
      }
      return;
    }

    const trackId = `${track.song}-${track.artist}`;
    if (this.currentTrackId !== trackId) {
      this.currentTrackId = trackId;
    }

    this.trackStartTime = track.timestamps ? track.timestamps.start || 0 : 0;
    this.trackEndTime = track.timestamps ? track.timestamps.end || 0 : 0;
    this.pausedElapsed = track.pausedElapsed || 0;
    this.setPaused(Boolean(track.isPaused));

    if (typeof this.options.onTrackUpdate === "function") {
      this.options.onTrackUpdate(track);
    }

    this.updateProgress();
  }

  connectLanyard() {
    if (!this.discordId || this.isDemoMode) return;
    if (!this.isOnline()) {
      if (typeof this.options.onStandby === 'function') {
        this.options.onStandby('discord', 'OFFLINE - WAITING FOR CONNECTION');
      }

      const delay = this.getBackoffDelay(8000, this._lanyardRetryCount);
      this._lanyardRetryCount++;
      if (this._lanyardRetryTimer) clearTimeout(this._lanyardRetryTimer);
      this._lanyardRetryTimer = setTimeout(()=> this.connectLanyard(), delay);

      return;
    }
    this.cleanup();

    try {
      this.socket = new WebSocket("wss://api.lanyard.rest/socket");

      this.socket.onopen = () => {
        this._lanyardRetryCount = 0;
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ op:2, d:{ subscribe_to_id: this.discordId}}));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.op === 1) {
            const interval = data.d.heartbeat_interval;
            if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = setInterval(() => {
              if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ op: 3 }));
              }
            }, interval);
          }

          if (data.t === "INIT_STATE" || data.t === "PRESENCE_UPDATE") {
            const spotify = data.d?.spotify;
            if (spotify) {
              this.notifyData({
                song: spotify.song,
                artist: spotify.artist,
                album: spotify.album,
                album_art_url: spotify.album_art_url,
                timestamps: spotify.timestamps,
                isPaused: false,
              });
            } else {
              if (typeof this.options.onStandby === "function") {
                this.options.onStandby("discord", "NO ACTIVE MUSIC DETECTED");
              }
            }
          }
        } catch (e) {}
      };

      this.socket.onerror = () => {
        if(!this.isOnline()) return;
        this.fallbackRestPolling();
      };

      this.socket.onclose = () => {
        if (this.isDemoMode || this.provider !== 'discord') return;
        if (!this.isOnline()) {
          const delay = this.getBackoffDelay(8000, this._lanyardRetryCount);
          this._lanyardRetryCount++;
          if (this._lanyardRetryTimer) clearTimeout(this._lanyardRetryTimer);
          this._lanyardRetryTimer = setTimeout(()=> this.connectLanyard(), delay);
          return;
        }
        const delay = this.getBackoffDelay(8000, this._lanyardRetryCount);
        this._lanyardRetryCount = Math.min(this._lanyardRetryCount + 1, 6);
        if (this._lanyardRetryTimer) clearTimeout(this._lanyardRetryTimer);
        this._lanyardRetryTimer = setTimeout(() => {
          if (this.provider==='discord' && !this.isDemoMode) this.connectLanyard();
        }, delay);
      };
    } catch (err) {
      this.fallbackRestPolling();
    }
  }

  fallbackRestPolling() {
    if (!this.discordId || this.isDemoMode || this.provider !== "discord") return;
    if (!this.isOnline()) return;
    if (this.pollInterval) clearInterval(this.pollInterval);

    let retryCount = 0;
    const fetchRest = async () => {
      if (this.provider !== "discord" || this.isDemoMode) return;
      if (!this.isOnline()) return;
      const controller = new AbortController();
      const t = setTimeout(()=> controller.abort(), 5500);
      try {
        const res = await fetch(
          `https://api.lanyard.rest/v1/users/${this.discordId}`,
          { signal: controller.signal }
        );
        clearTimeout(t);
        const json = await res.json();
        retryCount = 0;
        if (json.success && json.data) {
          if (json.data.spotify) {
            this.notifyData({
              song: json.data.spotify.song,
              artist: json.data.spotify.artist,
              album: json.data.spotify.album,
              album_art_url: json.data.spotify.album_art_url,
              timestamps: json.data.spotify.timestamps,
              isPaused: false,
            });
          } else {
            if (typeof this.options.onStandby === "function") {
              this.options.onStandby("discord", "NO ACTIVE MUSIC DETECTED");
            }
          }
        } else if (json.error && json.error.code === "USER_NOT_MONITORED") {
          if (typeof this.options.onStandby === "function") {
            this.options.onStandby(
              "discord",
              "JOIN DISCORD.GG/LANYARD TO ENABLE MONITORING",
            );
          }
        }
      } catch (e) {
        clearTimeout(t);
        if (this.pollInterval) {
          clearInterval(this.pollInterval); this.pollInterval=null;
        }
        const delay = this.getBackoffDelay(12000, retryCount);
        retryCount = Math.min(retryCount+1, 5);
        this.pollInterval = setTimeout(()=> {
          this.pollInterval = setInterval(fetchRest, 12000);
          fetchRest();
        }, delay);
      }
    };
    fetchRest();
    this.pollInterval = setInterval(fetchRest, 12000);
  }

  async fetchLastfmTrackDuration(artist, trackName, apiKey) {
    const cacheKey = `${artist}-${trackName}`.toLowerCase();
    if (this.trackInfoCache.has(cacheKey)) {
      return this.trackInfoCache.get(cacheKey);
    }
    if (!this.isOnline()) return 0;

    const controller = new AbortController();
    const t = setTimeout(()=> controller.abort(), 5000);
    try {
      const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(trackName)}&api_key=${apiKey}&format=json`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(t);
      if (res.ok) {
        const json = await res.json();
        if (json.track && json.track.duration) {
          const durationMs = parseInt(json.track.duration, 10);
          if (!isNaN(durationMs) && durationMs > 0) {
            this.trackInfoCache.set(cacheKey, durationMs);
            return durationMs;
          }
        }
      }
    } catch (e) { clearTimeout(t); }
    return 0;
  }

  async fetchLastfmData() {
    if (this.provider !== "lastfm" || this.isDemoMode || !this.lastfmUser)
      return;
    if (!this.isOnline()) {
      const cached = localStorage.getItem(STORAGE_KEYS.LASTFM_CURRENT_TRACK);
      if (cached) {
        const trackName = localStorage.getItem(STORAGE_KEYS.LASTFM_TRACK_NAME) || "Unknown Track";
        const artistStr = localStorage.getItem(STORAGE_KEYS.LASTFM_TRACK_ARTIST) || "Unknown Artist";
        const albumStr = localStorage.getItem(STORAGE_KEYS.LASTFM_TRACK_ALBUM) || "";
        const albumArt = localStorage.getItem(STORAGE_KEYS.LASTFM_TRACK_ART) || "";
        this.notifyData({
          song: trackName,
          artist: artistStr,
          album: albumStr,
          album_art_url: albumArt,
          timestamps: null,
          isPaused: true,
          isLastScrobble: true,
          pausedElapsed: parseInt(localStorage.getItem(STORAGE_KEYS.LASTFM_PAUSED_ELAPSED) || "0", 10)
        });
      } else {
        if (typeof this.options.onStandby === "function") {
          this.options.onStandby("lastfm", "OFFLINE — NO CACHED TRACK");
        }
      }
      return;
    }
    const apiKey = this.lastfmApiKey.trim() || DEFAULT_LASTFM_API_KEY;
    const controller = new AbortController();
    const t = setTimeout(()=> controller.abort(), 6000);

    try {
      const res = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(this.lastfmUser)}&api_key=${apiKey}&format=json&limit=2`,
        { signal: controller.signal }
      );
      clearTimeout(t);

      if (!res.ok) {
        if (typeof this.options.onStandby === "function") {
          this.options.onStandby("lastfm", `LAST.FM ERROR (${res.status})`);
        }
        return;
      }

      const json = await res.json();

      if (json.error) {
        if (typeof this.options.onStandby === "function") {
          this.options.onStandby(
            "lastfm",
            `LAST.FM: ${json.message || "Error " + json.error}`,
          );
        }
        return;
      }

      if (json.recenttracks && json.recenttracks.track) {
        const rawTrack = json.recenttracks.track;
        const tracks = Array.isArray(rawTrack)
          ? rawTrack
          : rawTrack
            ? [rawTrack]
            : [];

        if (tracks.length > 0) {
          const track = tracks[0];
          const isNowPlaying = Boolean(
            track["@attr"] && track["@attr"].nowplaying === "true",
          );

          let albumArt = "";
          if (track.image && Array.isArray(track.image)) {
            const imgObj =
              track.image[3] ||
              track.image[2] ||
              track.image[1] ||
              track.image[0];
            albumArt = imgObj ? imgObj["#text"] : "";
          }

          let artistStr =
            typeof track.artist === "object" && track.artist !== null
              ? track.artist["#text"] || track.artist.name || "Unknown Artist"
              : track.artist || "Unknown Artist";

          let albumStr =
            typeof track.album === "object" && track.album !== null
              ? track.album["#text"] || track.album.title || ""
              : track.album || "";

          let trackName = track.name || "Unknown Track";
          const currentIdentifier = `${artistStr}-${trackName}`;

          let timestamps = null;
          let pausedElapsed = 0;

          if (isNowPlaying) {
            const savedTrack = localStorage.getItem(
              STORAGE_KEYS.LASTFM_CURRENT_TRACK,
            );
            const savedStartTime = parseInt(
              localStorage.getItem(STORAGE_KEYS.LASTFM_START_TIME) || "0",
              10,
            );
            let startTime = 0;

            if (savedTrack === currentIdentifier && savedStartTime > 0) {
              startTime = savedStartTime;
            } else {
              const savedPausedElapsed = parseInt(
                localStorage.getItem(STORAGE_KEYS.LASTFM_PAUSED_ELAPSED) || "0",
                10,
              );
              if (savedTrack === currentIdentifier && savedPausedElapsed > 0) {
                startTime = Date.now() - savedPausedElapsed;
              } else {
                startTime = Date.now();
              }
              localStorage.setItem(
                STORAGE_KEYS.LASTFM_CURRENT_TRACK,
                currentIdentifier,
              );
              localStorage.setItem(
                STORAGE_KEYS.LASTFM_START_TIME,
                String(startTime),
              );
            }

            localStorage.setItem(STORAGE_KEYS.LASTFM_TRACK_NAME, trackName);
            localStorage.setItem(STORAGE_KEYS.LASTFM_TRACK_ARTIST, artistStr);
            localStorage.setItem(STORAGE_KEYS.LASTFM_TRACK_ALBUM, albumStr);
            localStorage.setItem(STORAGE_KEYS.LASTFM_TRACK_ART, albumArt);
            localStorage.removeItem(STORAGE_KEYS.LASTFM_PAUSED_ELAPSED);

            const durationMs = await this.fetchLastfmTrackDuration(
              artistStr,
              trackName,
              apiKey,
            );
            if (durationMs > 0) {
              timestamps = {
                start: startTime,
                end: startTime + durationMs,
              };
            }
          } else {
            const savedTrack = localStorage.getItem(
              STORAGE_KEYS.LASTFM_CURRENT_TRACK,
            );

            if (savedTrack) {
              trackName =
                localStorage.getItem(STORAGE_KEYS.LASTFM_TRACK_NAME) ||
                trackName;
              artistStr =
                localStorage.getItem(STORAGE_KEYS.LASTFM_TRACK_ARTIST) ||
                artistStr;
              albumStr =
                localStorage.getItem(STORAGE_KEYS.LASTFM_TRACK_ALBUM) ||
                albumStr;
              albumArt =
                localStorage.getItem(STORAGE_KEYS.LASTFM_TRACK_ART) || albumArt;

              const savedStartTime = parseInt(
                localStorage.getItem(STORAGE_KEYS.LASTFM_START_TIME) || "0",
                10,
              );
              const savedPausedElapsed = parseInt(
                localStorage.getItem(STORAGE_KEYS.LASTFM_PAUSED_ELAPSED) || "0",
                10,
              );
              const durationMs = await this.fetchLastfmTrackDuration(
                artistStr,
                trackName,
                apiKey,
              );

              if (savedPausedElapsed > 0) {
                pausedElapsed = savedPausedElapsed;
              } else if (savedStartTime > 0) {
                pausedElapsed = Date.now() - savedStartTime;
                if (durationMs > 0 && pausedElapsed > durationMs) {
                  pausedElapsed = durationMs;
                }
                localStorage.setItem(
                  STORAGE_KEYS.LASTFM_PAUSED_ELAPSED,
                  String(pausedElapsed),
                );
              }
              localStorage.removeItem(STORAGE_KEYS.LASTFM_START_TIME);

              if (durationMs > 0) {
                timestamps = {
                  start: 0,
                  end: durationMs,
                };
              }
            } else {
              localStorage.removeItem(STORAGE_KEYS.LASTFM_TRACK_NAME);
              localStorage.removeItem(STORAGE_KEYS.LASTFM_TRACK_ARTIST);
              localStorage.removeItem(STORAGE_KEYS.LASTFM_TRACK_ALBUM);
              localStorage.removeItem(STORAGE_KEYS.LASTFM_TRACK_ART);
              localStorage.removeItem(STORAGE_KEYS.LASTFM_CURRENT_TRACK);
              localStorage.removeItem(STORAGE_KEYS.LASTFM_START_TIME);
              localStorage.removeItem(STORAGE_KEYS.LASTFM_PAUSED_ELAPSED);
            }
          }

          this.notifyData({
            song: trackName,
            artist: artistStr,
            album: albumStr,
            album_art_url: albumArt,
            timestamps,
            isPaused: !isNowPlaying,
            isLastScrobble: !isNowPlaying,
            pausedElapsed: pausedElapsed,
          });
        } else {
          if (typeof this.options.onStandby === "function") {
            this.options.onStandby("lastfm", "NO RECENT SCROBBLES FOUND");
          }
        }
      } else {
        if (typeof this.options.onStandby === "function") {
          this.options.onStandby("lastfm", "NO TRACK CURRENTLY PLAYING");
        }
      }
    } catch (e) {
      clearTimeout(t);
      this._lastfmRetryCount = Math.min((this._lastfmRetryCount||0)+1, 6);
      const msg = e.name === 'AbortError' ? 'LAST.FM TIMEOUT — RETRYING' : 'LAST.FM CONNECTION ERROR';
      if (typeof this.options.onStandby === "function") {
        this.options.onStandby("lastfm", msg);
      }
    }
  }

  connectLastfm() {
    if (!this.lastfmUser || this.isDemoMode) return;
    this.cleanup();

    this.fetchLastfmData();
    this.pollInterval = setInterval(() => this.fetchLastfmData(), 8000);
  }

  runDemoMode(customTrack = null) {
    this.isDemoMode = true;
    this.cleanup();

    const track = customTrack || this.options.demoTrack || {
      song: "Life Will Change",
      artist: "Lyn, Shoji Meguro",
      album: "Persona 5 Original Soundtrack",
      album_art_url: "../assets/p5-demo-cover.png",
      durationMs: 265000,
      elapsedMs: 74000,
    };

    const demoDuration = track.durationMs || 265000;
    const elapsed = track.elapsedMs || 74000;
    const startTime = Date.now() - elapsed;
    const endTime = startTime + demoDuration;

    this.notifyData({
      song: track.song || "Unknown Track",
      artist: track.artist || "Unknown Artist",
      album: track.album || "Unknown Album",
      album_art_url: track.album_art_url || "",
      timestamps: {
        start: startTime,
        end: endTime,
      },
      isPaused: false,
      isDemo: true,
    });
  }
}

const SpotifyService = SongViewerService;

if (typeof window !== 'undefined') {
  window.SongViewerService = SongViewerService;
  window.SpotifyService = SpotifyService;
}

