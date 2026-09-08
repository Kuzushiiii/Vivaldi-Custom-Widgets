# Vivaldi Startpage Custom Widgets

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vivaldi](https://img.shields.io/badge/Vivaldi-EF3939?style=for-the-badge&logo=vivaldi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A curated collection of aesthetic, lightweight, and interactive custom webpage widgets designed specifically for the **Vivaldi Browser Start Page Dashboard**.

[Installation Guide](#installation-guide) • [Theme Collection](#theme-collection)

</div>

---

## Features

- **Thematic Designs**: Visual styles inspired by popular games and anime (Persona 5, Violet Evergarden, and more).
- **Lightweight & Fast**: Built with vanilla HTML5, CSS3, and JavaScript with zero external frameworks.
- **Dynamic & Real-Time**: Live digital clocks, dynamic month calendars, and active time-phase trackers.
- **Clean Vivaldi Integration**: Includes custom CSS to hide intrusive default widget titles while preserving full access to the 3-dots context menu on hover.
- **100% Local & Offline**: Runs directly from your local filesystem using the `file:///` protocol.

---

## Theme Collection

### Persona 5 Theme (`themes/persona-5/`)

| Widget | Path | Description |
|---|---|---|
| **Calendar & Clock** | `themes/persona-5/calendar-widget/index.html` | Comic-style digital clock, day indicator, interactive month calendar, stars, and Phantom Thieves mask. |
| **Day Progression** | `themes/persona-5/day-progression/index.html` | Real-time percentage meter tracking the progression of the day with Persona 5 time-of-day phases. |
| **GIF Cut-in Banner** | `themes/persona-5/gif-widget/index.html` | Dynamic Persona 5 Royal cut-in character animation banner. |
| **Spotify Now Playing** | `themes/persona-5/spotify-widget/index.html` | Real-time Spotify music playback widget powered by Discord & Lanyard API. |

---

### Violet Evergarden Theme (`themes/violet-evergarden/`)

| Widget | Path | Description |
|---|---|---|
| **Auto Memory Doll Calendar** | `themes/violet-evergarden/calendar-widget/index.html` | Victorian letterhead stationery calendar, cursive & typewriter typography, sealing wax current date indicator, emerald brooch event indicators, and typewriter torn note popover. |
| **Day Progression** | `themes/violet-evergarden/day-progression/index.html` | "The Typewriter Carriage" real-time 24-hour day progression meter with platen roller, dual-tone inked ribbon, brass margin scale, and midnight carriage return animation. |
| **Typing GIF Banner** | `themes/violet-evergarden/gif-widget/index.html` | Atmospheric animated banner featuring Violet typing at her vintage typewriter. |
| **Flowers GIF Banner** | `themes/violet-evergarden/gif-widget-2/index.html` | Aesthetic animated floral banner inspired by Violet's bougainvillea motifs. |

---

## Installation Guide

### Step 1: Apply Vivaldi Custom CSS (Recommended)
To remove default white card backgrounds and title bars while keeping access to the 3-dots settings menu on hover:
1. Open `vivaldi://experiments` or `vivaldi://flags` in your Vivaldi address bar.
<p align="center">
   <img src="docs/assets/installation-step1.png" alt="Vivaldi Experiments menu" width="600">
</p>

2. Search **"Allow CSS modifications"** on the search bar, enable it and then restart Vivaldi.
<p align="center">
   <img src="docs/assets/installation-step2.png" alt="Enable CSS modifications" width="600">
</p>

3. Open **Settings** (`Ctrl + F12`) > **Appearance** > scroll to **Custom UI Modifications**.
<p align="center">
   <img src="docs/assets/installation-step3.png" alt="Vivaldi Settings menu" width="600">
</p>

4. Click **Select Folder...** and select the `vivaldi-css` folder from this repository.
<p align="center">
   <img src="docs/assets/installation-step4.png" alt="Selecting vivaldi-css folder" width="600">
</p>

5. Restart Vivaldi, and then the white card backgrounds and the title bars should be removed, but the access to the 3-dots still exist on hover.

---

### Step 2: Add Widgets to Vivaldi Start Page

1. Open the widget file you want to use in Vivaldi:
   - Right-click the widget's `index.html` file (e.g. `themes/persona-5/calendar-widget/index.html`) > **Open with** > **Vivaldi**.
<p align="center">
   <img src="docs/assets/add-widgets-step1.png" alt="Opening widget through Vivaldi" width="600">
</p>

2. Copy the local file URL from the address bar (e.g. `file:///D:/Vivaldi-Widgets-Windows/themes/persona-5/calendar-widget/index.html`).
<p align="center">
   <img src="docs/assets/add-widgets-step2.png" alt="Copy URL" width="600">
</p>

3. Open a **New Tab (Start Page)** in Vivaldi.
4. Add a new **Webpage** widget:
   - Paste the `file:///...` URL into the URL field.
   - Uncheck *Share Theme Colors* to retain the authentic widget styling.
   - Click **Done**.
<p align="center">
   <img src="docs/assets/add-widgets-step3.png" alt="New tab -> New widget -> Paste URL" width="600">
</p>

5. Resize and position the widget on your Start Page grid as desired.
<p align="center">
   <img src="docs/assets/add-widgets-step4.png" alt="Resize and position widget" width="600">
</p>

---

### Spotify Widget Setup

The Spotify widget displays your currently playing track in real-time. You can choose either **Discord (Lanyard)** or **Last.fm** as the data provider.

---

#### Option A: Discord (Lanyard API)

> **Prerequisite :** You must join the [Lanyard Discord Server](https://discord.gg/lanyard) first. The Lanyard API requires you to share a mutual server with their bot to read your activity status.

1. Connect your Spotify account to Discord (**Discord Settings > Connections > Spotify** and toggle *"Display Spotify as your status"*).
<p align="center">
   <img src="docs/assets/spotify-wid-step1.jpeg" alt="Connect Spotify" width="600">
</p>

2. Get your Discord User ID (**Discord Settings > Developer > Enable Developer Mode** > open your profile > **Copy User ID**).
<p align="center">
   <img src="docs/assets/spotify-wid-step2.jpeg" alt="Enable dev" width="600">
</p>
<p align="center">
   <img src="docs/assets/spotify-wid-step3.png" alt="Copy User ID" width="600">
</p>

3. Click the **CONFIG** button on the widget, select the **DISCORD (LANYARD)** tab, paste your Discord User ID, and click **SAVE**.
<p align="center">
   <img src="docs/assets/spotify-wid-step4.png" alt="Paste User ID" width="600">
</p>

---

#### Option B: Last.fm (No Discord Required)

If you don't use Discord or prefer scrobbling, you can integrate via Last.fm:

1. Make **Last.fm** account if you dont have it in the first place  
2. Connect your Spotify account to Last.fm via [Last.fm Settings > Applications](https://www.last.fm/settings/applications) (under **Spotify Scrobbling**, click **Connect**).
<p align="center">
   <img src="docs/assets/last.fm-step1.jpeg" alt="Connect Spotify Last.fm" width="600">
</p>

3. Click the **CONFIG** button on the top right in Spotify Widget in Vivaldi.
4. Switch to the **LAST.FM** tab.
5. Enter your **Last.fm Username**.
<p align="center">
   <img src="docs/assets/last.fm-step2.png" alt="Paste User ID" width="600">
</p>

6. *(Optional)* Leave the **Custom API Key** field blank to use the built-in default API key, or provide your own from [Last.fm API Accounts](https://www.last.fm/api/account/create).
7. Click **SAVE**.

> ⚠️ **Important Note on Last.fm Experience:** 
> Unlike Discord (Lanyard) which uses real-time WebSockets and directly reads active desktop app states (instantly knowing when you pause, buffer, or play ads), Last.fm is a web-based scrobbling service. Because of this technical limitation:
> - The widget estimates track progression locally and may occasionally drift by a few seconds if your Spotify buffers, encounters lag, or plays Spotify Free ads.
> - The widget automatically resynchronizes to `00:00` as soon as the next track begins.

---

### Notes

For Calendar, Day Progression and the Gif widget i suggest resize it to regular and tall only for the Spotify widget, like mine :
<p align="center">
   <img src="docs/assets/P5-preview.png" alt="The final preview" width="600">
</p>
but keep in mind this is my personal preference soo you can resize & position it however you like xD, if its looks kinda lame you can just change the style in the css file

---

### License

Distributed under the [MIT](LICENSE) License. Feel free to use, modify, and customize for your own setup.
