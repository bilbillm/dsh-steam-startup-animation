# Validation

Version: 1.0.0. Validated on 2026-10-27, Windows, DeepSeek Harness Desktop 0.2.1-rc.3.

## Installed Desktop

- Installed the prebuilt tarball through Desktop's own Add plugin dialog and activated its bundle.
- Confirmed the bundle and its single component report running.
- Opened the plugin's own configuration page and played its preview inside the real application.
- Exited the application and launched the installed executable again. The startup overlay appeared automatically.
- Inspected the live HTML audio instance during startup: playing, unmuted, volume 0.7, duration 6 seconds. The playback position advanced normally.
- Confirmed completion removes the overlay, restores the underlying application's focusability and leaves the host usable.
- Confirmed the existing dependencies and user Cordis configuration files were preserved.

## Automated browser checks

- Animation remains visible at 5.999 seconds and is removed at 6.000 seconds.
- The host draft and previously focused element survive playback.
- Audio is stopped and reset on completion and Escape.
- Plugin disposal removes the overlay and restores inert state.
- HMR does not replay the startup in the same document.
- System reduced motion skips automatic playback.
- The settings entry registers at the plugin's own `plugins.bundle.config` key.

## Packaging

- The package declares `dsh.bundle` and `dsh.client`, exports both halves, and includes prebuilt files.
- Build uses Node built-ins; installation runs no lifecycle scripts.
- Media is bundled locally. Playback makes no network requests.
- Preferences recover from malformed or unavailable storage, and audio volume is clamped to 0–1.

Desktop screenshots exported for local verification contain the animation canvas only. Repository screenshots are captured from the same renderer in the isolated browser check.
