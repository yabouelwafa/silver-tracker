# Silver Tracker

A simple Progressive Web App (PWA) to track your silver holdings. It shows total silver in troy ounces, current spot price in CAD and USD, total value, and gain/loss based on your average buy price. All data is stored locally on your device. Prices are loaded from [Alpha Vantage](https://www.alphavantage.co/documentation/) (free tier).

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get a free API key

1. Go to [alphavantage.co](https://www.alphavantage.co/support/#api-key).
2. Claim your free API key (takes under 20 seconds).
3. The first time you open the app, you’ll be asked to enter this key. It is saved only in your browser (localStorage) and never sent anywhere except to Alpha Vantage to fetch prices.

### 3. Run locally

```bash
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`). Enter your API key when prompted, then add your silver amount and average buy price (CAD per troy oz) via **Edit** → **Edit holdings**.

### 4. Build for production

```bash
npm run build
```

The built files are in `dist/`. Serve that folder with any static host (e.g. Vercel, Netlify, GitHub Pages).

## Install on iPhone (no App Store)

1. Deploy the app so it’s available at a public URL (e.g. `https://your-app.vercel.app`).
2. On your iPhone, open **Safari** and go to that URL.
3. Tap the **Share** button (square with arrow).
4. Scroll and tap **Add to Home Screen**.
5. Name it (e.g. “Silver”) and tap **Add**.

The app will open full-screen like a native app. Your holdings and API key stay on the device.

## Features

- **Home:** Total silver (troy oz), spot price (CAD primary, USD secondary), total value, gain/loss in CAD and %.
- **Edit holdings:** Set total troy ounces and average buy price (CAD per oz). Leave buy price blank if you don’t want gain/loss.
- **Refresh:** Button to refetch current prices. Prices are cached for 5 minutes to respect API limits.
- **Dark mode:** Follows your system preference (light/dark).
- **Offline:** The app shell works offline; prices update when you’re back online and tap Refresh.

## Tech

- Vite + React
- Local storage only (no server database)
- PWA with service worker and web app manifest
- Alpha Vantage for silver spot (USD) and USD/CAD rate
