# Validation

Versions: 1.0.0 and 1.0.1. Validated on 2026-10-27, Windows, DeepSeek Harness Desktop 0.2.1-rc.3.

## Startup performance regression

Version 1.0.0 was correct on a settled preview, but shared the main thread with host startup work. One real Desktop startup recorded a 188.9 ms animation frame gap alongside a 178 ms host long task. The animation's 95th-percentile drawing cost was 0.6 ms and hardware acceleration was enabled.

The regression fixture in `tests/startup-contention.cjs` reproduces this scheduling pattern with the actual plugin client and a controlled 180 ms host task:

| Renderer | Longest frame gap | Gaps over 50 ms |
| --- | ---: | ---: |
| 1.0.0 main thread | 172.1 ms | 2 |
| 1.0.1 dedicated worker | 33.3 ms | 0 |

These are measured runs on the test machine, not a frame-rate guarantee for all hardware. Worker playback, failure recovery, Escape, reduced motion, audio cleanup and focus restoration pass. Nine sampled artwork frames from 0.15 to 5.55 seconds match 1.0.0 exactly, with zero changed pixels.

After installing the 1.0.1 package, the user confirmed that startup playback no longer stuttered.

The worker uses the standard [OffscreenCanvas animation-frame path](https://html.spec.whatwg.org/dev/imagebitmap-and-animations.html#animation-frames). The final opacity transition follows the compositor path described in [Chromium's rendering architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture).

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
