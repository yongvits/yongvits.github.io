# WebGL Ferrofluid Speaker

Interactive audio-reactive ferrofluid visualizer built with Three.js and Vite.

## Features

- Real-time WebGL particle visualizer
- Audio reactive movement from microphone or uploaded audio files
- Gyroscope / mouse parallax camera
- Multiple room modes including HDRI sphere mode
- Color presets and random aura generator
- Mobile-first UI
- Ready for GitHub, Vercel, Netlify, Cloudflare Pages, or GitHub Pages

## Project structure

```txt
webgl-ferrofluid-speaker/
├── index.html
├── package.json
├── src/
│   ├── main.js
│   └── styles.css
├── public/
│   └── hdri/
│       ├── hdri01.jpg
│       ├── hdri02.jpg
│       ├── hdri03.jpg
│       └── hdri04.jpg
└── .github/workflows/deploy-github-pages.yml
```

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build

```bash
npm run build
```

The production files will be created in `dist/`.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload or push this project.
3. Go to **Settings → Pages**.
4. Set source to **GitHub Actions**.
5. Push to the `main` branch.

The included workflow will build and publish the app automatically.

## HDRI files

Put your own panoramic images here:

```txt
public/hdri/hdri01.jpg
public/hdri/hdri02.jpg
public/hdri/hdri03.jpg
public/hdri/hdri04.jpg
```

The app also supports uploading a custom image at runtime.

## Recommended next upgrades

- GPU particle simulation
- Custom ShaderMaterial particles
- UnrealBloomPass postprocessing
- Beat detection and BPM sync
- Reflection floor
- WebGPU version

## Notes

Microphone and gyroscope access usually require HTTPS. GitHub Pages, Vercel, Netlify, and Cloudflare Pages all provide HTTPS by default.
