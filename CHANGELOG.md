# Changelog

## 1.0.1

- Fix startup stutter caused by the Canvas loop sharing Harness's busy UI thread. The same renderer now runs in an OffscreenCanvas worker, with the final fade handled by the compositor.
- Preserve the six-second timeline and all approved artwork and motion curves. Nine sampled frames match version 1.0.0 pixel for pixel.
- Reuse canvas dimensions when unchanged and precompute the official whale outline outside playback.
- Add worker lifecycle, failure recovery and main-thread contention checks.
- Use a Chinese package description and rename the repository to `dsh-steam-startup-animation`.
- Keep the installed package identity and preferences compatible with 1.0.0.

## 1.0.0

- Initial six-second terminal-to-whale startup animation with optional stereo Steam startup audio, volume controls, preview and Escape skip.
