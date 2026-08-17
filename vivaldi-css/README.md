# Vivaldi Custom CSS Modifications

To achieve a borderless, transparent look without default widget titles and background cards, you can enable **CSS Modifications** in Vivaldi Browser.

This configuration also includes a **hover-reveal action menu**: the widget remains completely clean and seamless during normal viewing, but hovering your cursor over the widget will smoothly reveal the 3-dots action button in the top-right corner to reload, resize, edit the URL, or configure settings.

---

## Setup Instructions

### 1. Enable CSS Modifications Experiment
1. Open Vivaldi and navigate to `vivaldi://experiments` in the address bar.
2. Check the box for **"Allow for CSS modifications"**.
3. Restart Vivaldi.

### 2. Set the Custom CSS Directory
1. Open **Settings** (`Ctrl + F12` or click the gear icon in the bottom-left corner).
2. Go to the **Appearance** tab.
3. Scroll down to the **Custom UI Modifications** section.
4. Click **Select Folder...** and choose the `vivaldi-css` directory from this repository (or any custom folder containing `custom-widget.css`).

### 3. Restart Vivaldi
Close and reopen Vivaldi Browser. Webpage widgets on your Start Page will now render transparently without title bars while retaining full access to the 3-dots settings menu on hover.
