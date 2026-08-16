# 🌟 Vivaldi Startpage Custom Widgets

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vivaldi](https://img.shields.io/badge/Vivaldi-EF3939?style=for-the-badge&logo=vivaldi&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A curated collection of beautiful, aesthetic, and interactive custom webpage widgets designed specifically for **Vivaldi Browser Start Page Dashboard**.

[Panduan Pemasangan](#-panduan-pemasangan-cepat) • [Koleksi Tema](#-koleksi-tema--widget) • [Roadmap](#-roadmap)

</div>

---

## ✨ Fitur Utama

- 🎭 **Aesthetic Themes**: Desain terinspirasi dari game dan anime populer (Persona 5, Violet Evergarden, dll.).
- ⚡ **Ringan & Cepat**: Dibangun dengan *pure* HTML5, CSS3, dan Vanilla JavaScript tanpa *framework* berat.
- 🕒 **Real-Time & Dinamis**: Jam live detik demi detik, kalender bulan berjalan otomatis, dan indikator tanggal hari ini.
- 🎨 **Tampilan Bersih**: Dilengkapi dengan CSS modifikasi Vivaldi untuk menyembunyikan header/title bar widget bawaan.
- 📂 **100% Offline / Local**: Berjalan langsung dari penyimpanan lokal komputer Anda menggunakan protokol `file:///`.

---

## 🎭 Koleksi Tema & Widget

### 🔴 Persona 5 Theme (`themes/persona-5/`)

| Widget | File Path | Deskripsi |
|---|---|---|
| **Calendar & Clock** | `themes/persona-5/calendar-widget/index.html` | Jam digital bergaya komik P5, hari, kalender bulanan, bintang, dan topeng Phantom Thieves. |
| **GIF Cut-in Banner** | `themes/persona-5/gif-widget/index.html` | Animasi cut-in karakter Persona 5 Royal yang dinamis. |
| **Day Progression** | `themes/persona-5/day-progression/index.html` | Progress bar persentase hari berjalan dengan fase waktu ala Persona (*Morning, After School, Evening*). |
| **Spotify Now Playing** *(Coming Soon)* | `themes/persona-5/spotify-widget/index.html` | Widget lagu yang sedang diputar secara real-time via Discord / Lanyard API. |

---

## 🚀 Panduan Pemasangan Cepat

### Langkah 1: Pasang CSS Modifikasi Vivaldi *(Opsional tapi Sangat Direkomendasikan)*
Agar widget tidak terganggu oleh tulisan judul bawaan Vivaldi:
1. Buka URL `vivaldi://experiments` di browser Vivaldi.
2. Centang **"Allow for CSS modifications"** lalu restart browser.
3. Buka **Settings** (`Ctrl + F12`) > **Appearance** > scroll ke bagian **Custom UI Modifications**.
4. Klik **Select Folder...** lalu pilih folder `vivaldi-css` dari repositori ini.
5. Restart Vivaldi. *(Detail lengkap lihat di [vivaldi-css/README.md](vivaldi-css/README.md))*

---

### Langkah 2: Tambahkan Widget ke Start Page Vivaldi

1. Buka file widget yang kamu inginkan di browser Vivaldi:
   - Klik kanan pada file `index.html` (contoh: `themes/persona-5/calendar-widget/index.html`) > **Open with** > **Vivaldi**.
2. Salin URL lokal di *address bar* (formatnya seperti: `file:///D:/Vivaldi-Widgets-Windows/themes/persona-5/calendar-widget/index.html`).
3. Buka **Start Page (Tab Baru)** di Vivaldi.
4. Tambahkan widget baru tipe **Webpage**:
   - Tempel (*paste*) URL `file:///...` tadi ke kolom URL widget.
   - Hilangkan centang *Share Theme Colors* jika ingin mempertahankan warna tema widget asli.
   - Klik **Done**.
5. Sesuaikan ukuran grid widget di Start Page sesuai seleramu! 🎉

---

## 🗺️ Roadmap Pengembangan

- [x] Persona 5 Royal: Calendar & Clock Widget
- [x] Persona 5 Royal: Animated GIF Banner Widget
- [x] Persona 5 Royal: Day Progression Widget (% hari & time phases)
- [x] Vivaldi Custom CSS mod (transparan & sembunyikan title bar)
- [ ] Spotify Now Playing Widget (Real-time Lanyard Discord API)
- [ ] Violet Evergarden Theme Pack
- [ ] Dokumentasi video / GIF tutorial interaktif

---

## 📄 Lisensi

Proyek ini didistribusikan di bawah lisensi [MIT](LICENSE). Silakan gunakan, modifikasi, dan kembangkan sesuai kebutuhanmu!
