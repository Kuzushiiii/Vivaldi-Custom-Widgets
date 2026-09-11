/**
 * Spotify Now Playing Service
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

  // Fallback / legacy keys for backward compatibility
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

class SpotifyService {
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
    this.bindVisibilityHandler();
  }

  bindVisibilityHandler() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !this.isDemoMode) {
        if (this.provider === "lastfm") {
          this.fetchLastfmData();
        } else if (this.provider === "discord") {
          if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.connectLanyard();
          }
        }
        this.updateProgress();
      }
    });
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
    this.progressTimer = setInterval(() => this.updateProgress(), 500);
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

  // Discord Lanyard connection
  connectLanyard() {
    if (!this.discordId || this.isDemoMode) return;
    this.cleanup();

    try {
      this.socket = new WebSocket("wss://api.lanyard.rest/socket");

      this.socket.onopen = () => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
              op: 2,
              d: { subscribe_to_id: this.discordId },
            }),
          );
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
                this.options.onStandby("discord", "SPOTIFY IS IDLE OR PAUSED");
              }
            }
          }
        } catch (e) {}
      };

      this.socket.onerror = () => {
        this.fallbackRestPolling();
      };

      this.socket.onclose = () => {
        setTimeout(() => {
          if (this.provider === "discord" && !this.isDemoMode)
            this.connectLanyard();
        }, 8000);
      };
    } catch (err) {
      this.fallbackRestPolling();
    }
  }

  fallbackRestPolling() {
    if (!this.discordId || this.isDemoMode || this.provider !== "discord")
      return;
    if (this.pollInterval) clearInterval(this.pollInterval);

    const fetchRest = async () => {
      if (this.provider !== "discord" || this.isDemoMode) return;
      try {
        const res = await fetch(
          `https://api.lanyard.rest/v1/users/${this.discordId}`,
        );
        const json = await res.json();
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
              this.options.onStandby("discord", "SPOTIFY IS IDLE OR PAUSED");
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
      } catch (e) {}
    };

    fetchRest();
    this.pollInterval = setInterval(fetchRest, 12000);
  }

  // Last.fm connection & duration fetching
  async fetchLastfmTrackDuration(artist, trackName, apiKey) {
    const cacheKey = `${artist}-${trackName}`.toLowerCase();
    if (this.trackInfoCache.has(cacheKey)) {
      return this.trackInfoCache.get(cacheKey);
    }

    try {
      const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(trackName)}&api_key=${apiKey}&format=json`;
      const res = await fetch(url);
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
    } catch (e) {}
    return 0;
  }

  async fetchLastfmData() {
    if (this.provider !== "lastfm" || this.isDemoMode || !this.lastfmUser)
      return;
    const apiKey = this.lastfmApiKey.trim() || DEFAULT_LASTFM_API_KEY;

    try {
      const res = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(this.lastfmUser)}&api_key=${apiKey}&format=json&limit=2`,
      );

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
      if (typeof this.options.onStandby === "function") {
        this.options.onStandby("lastfm", "LAST.FM CONNECTION ERROR");
      }
    }
  }

  connectLastfm() {
    if (!this.lastfmUser || this.isDemoMode) return;
    this.cleanup();

    this.fetchLastfmData();
    this.pollInterval = setInterval(() => this.fetchLastfmData(), 8000);
  }

  runDemoMode() {
    this.isDemoMode = true;
    this.cleanup();

    const demoDuration = 265000;
    const startTime = Date.now() - 74000;
    const endTime = startTime + demoDuration;

    this.notifyData({
      song: "Life Will Change",
      artist: "Lyn, Shoji Meguro",
      album: "Persona 5 Original Soundtrack",
      album_art_url:
        "https://t2.genius.com/unsafe/344x344/https%3A%2F%2Fimages.genius.com%2F29fe123938b00fe1522ca7a8c04ff9b5.1000x1000x1.png",
      timestamps: {
        start: startTime,
        end: endTime,
      },
      isPaused: false,
      isDemo: true,
    });
  }
}

if (typeof window !== 'undefined') {
  window.SpotifyService = SpotifyService;
}

