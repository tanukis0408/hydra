<div align="center">

  <h1 align="center">Kraken Launcher</h1>

  <p align="center">
    <strong>The Beast from the Depths.</strong><br>
    Kraken is a modern fork of Hydra Launcher focused on a refined Material You interface,
    faster flows, and a cleaner architecture. Built with Electron, React, TypeScript, and Python.
  </p>

  [![build](https://img.shields.io/github/actions/workflow/status/tanukis0408/hydra/build.yml)](https://github.com/tanukis0408/hydra/actions)
  [![release](https://img.shields.io/github/package-json/v/tanukis0408/hydra)](https://github.com/tanukis0408/hydra/releases)
  [![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

  ![Kraken Launcher Preview](./docs/screenshot.png)

</div>

## Why Kraken

- Material You inspired UI with layered surfaces, motion, and strong contrast.
- Smarter downloads with queue control, seeding, and cleanup.
- Rich game pages with achievements, playtime, reviews, and media.
- Theme editor and custom sources for power users.
- Built on a modular Electron + Node architecture.

## Status

Kraken is under active development. Expect breaking changes between versions.
Current release: 1.0.0 Aqua.

## Build from source

1. Clone the repo.
   ```bash
   git clone git@github.com:tanukis0408/hydra.git
   cd hydra
   ```
2. Install dependencies with `yarn`.
3. Run `yarn dev` for the desktop app.

## Build artifacts

1. Run `yarn build`.
2. Use `yarn build:win`, `yarn build:mac`, or `yarn build:linux`.

## License

MIT. See `LICENSE`.
