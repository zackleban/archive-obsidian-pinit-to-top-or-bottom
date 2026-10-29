# Local review checklist

Prepared on 2026-10-28. Nothing was submitted, tagged, pushed, or released.

## Automated checks

Run `npm ci`, then `npm run qa` from this repository. QA runs the official Obsidian ESLint recommendations with zero warnings, regression tests, the TypeScript/production build, and metadata/artifact validation. The optional recommendation to adopt the newer declarative settings API is disabled to retain Obsidian 1.7.2 compatibility; imperative settings remain supported there.

The tracked `main.js`, `manifest.json`, and `styles.css` are the local installation files. The build embeds bundled dependency licenses. `versions.json` preserves prior entries and records this candidate's minimum app version.

## Before a later submission

Perform the real-app checks below in a disposable vault on the declared minimum version and the current stable version. Automated host mocks cannot verify Obsidian's private explorer/graph implementation or physical input devices. Then, when separately authorized, publish a GitHub release whose tag exactly matches `manifest.json` (no `v` prefix), attach the three installation files, and use the official submission workflow. Directory name/ID availability and the hosted review are checked at that time. No release or submission was part of this work.

References checked:

- [Manifest](https://docs.obsidian.md/Reference/Manifest)
- [Submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)
- [Developer policies](https://docs.obsidian.md/community-directory/developer-policies)
- [Official local lint rules](https://github.com/obsidianmd/eslint-plugin)
- [Submit your plugin](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin)

## Real-app smoke checks still to run

- Pin a note and folder to each side, reorder sibling pins, reload, and unpin.
- Rename/move a pinned folder containing pinned children; delete a test item and check its pin disappears.
- Try the command palette, context menu, and settings buttons, including mobile long-press menus.
- Open/close/defer the Files pane and test a detached window. Disable the plugin and confirm ordinary sorting and no pin styling.
- Enable File Placer in both load orders, place unpinned items, then disable either plugin; pin priority and ordinary placement must remain correct.
- In a disposable vault with old Pinit settings, verify one-time import without changing the source settings.

## Review — 2026-10-28

Agent decision, 2026-10-28: review the seven completed local preparations before adding features, because their shared explorer behavior and remaining host checks need validation.

Fresh `npm run qa` passed: 6 tests, TypeScript, production build, and package checks. Added `getActivePins()` so sorting integrations can distinguish saved settings from currently applied pins. File Placer uses it to stop applying pins immediately during teardown. Saved settings are unchanged. The shared four-case integration suite is in the sibling File Placer repository (`npm run test:integration` there); both load orders and either disable/re-enable sequence pass. Install both updated local candidates for this fix.

This is automated local evidence, not a live Obsidian or minimum-version certification. The real-app checklist above remains open. Nothing was installed into the personal vault, pushed, released, or submitted.
