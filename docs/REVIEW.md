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

Shared sorting evidence and resumption steps live only in File Placer:
[RUNTIME-SORTING.md](../../obsidian-file-placer/docs/RUNTIME-SORTING.md) in the sibling
checkout. The 2026-10-28 live attempt is **blocked**, not passed: installed bundle
metadata reports 1.14.5, but app launch/control was unavailable. Every live item
below stays open, including minimum-version and mobile coverage.

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

## Runtime follow-up — 2026-10-28

Fresh `npm run qa` passes (six tests), with no tracked build changes. The shared
[integration suite](../../obsidian-file-placer/tests/integration/pinit.test.mjs)
passes all four host-double cases when run from File Placer. No runtime defect was
reproduced and no implementation changed. The shared record above owns the exact
access failures and blocked desktop scenarios; the live deliverable is incomplete.

## Quality review — 2026-10-29

agent decision 2026-10-28: review the four accepted follow-ups before further improvements; retain the established tests and runtime protocols because no new source defect justifies duplicating them.

Fresh `npm run qa` passes **6/6 tests**, zero-warning lint, TypeScript, production build and package checks. The single shared suite in sibling File Placer passes **four** cases when run there with `npm run test:integration`. Both install instructions, version/lock agreement and bundled monkey-around notices were checked. No concrete implementation or packaging regression was found; production assets remain byte-identical.

Shared integration still uses an explorer double, not a running app. The [existing runtime record](../../obsidian-file-placer/docs/RUNTIME-SORTING.md) and open checklist above retain desktop, mobile, popout and minimum-version gates. No duplicate suite, app-access retry or personal-vault installation was added.

`git diff --check` passes. Nothing was pushed, tagged, released or submitted.

Official manifest, submission requirements, developer policies, plugin guidelines and release instructions were rechecked on 2026-10-29. Local metadata, disclosures and licensing checks do not establish minimum-version runtime compatibility, directory name availability or community approval.

## Rename collision repair — 2026-10-29

agent decision 2026-10-28: reuse the existing first-occurrence/top-wins policy after note/folder remapping because rename can collide with a stale destination pin. Normalize synchronously before saving; retain unrelated missing pins. Sorting also consumes each matched path once so duplicate/conflicting stored pins cannot emit a supplied item twice. Persistence scheduling is unchanged.

The persisted actual-source regressions fail against starting source `144b295`: **9 of 16** Pinit cases fail (the six prior cases and ordinary move pass). The original two-item case returns three entries. New coverage includes top/bottom duplicates with either first occurrence, both cross-side directions, folders/descendants, boundary siblings, unaffected order, missing pins, exact item identities/multiplicity, saved/reloaded settings and defensive sorting without input/settings mutation. `PINIT_SOURCE` can select an alternate source for baseline replay.

Final `npm run qa` passes **16/16 tests**, zero-warning lint, TypeScript, production build and package checks; `git diff --check` passes. The rebuilt `main.js` contains this fix. File Placer's single shared suite passes **12/12** cases (four existing plus eight rename/lifecycle cases), against both actual plugins with explorer/storage doubles. The eight added cases fail against starting Pinit source. Both load orders, both rename-handler orders, either plugin's disable/re-enable from saved settings, folder placement remapping and final ordinary sorting are covered with identity/multiplicity assertions. File Placer production source/assets are unchanged; its own QA passes 17 tests.

This is local host-double evidence, not a live Obsidian observation or filesystem persistence test. [RUNTIME-SORTING.md](../../obsidian-file-placer/docs/RUNTIME-SORTING.md) remains the single shared runtime record; its blocked live sorting and the mobile/popout/minimum-version gates above remain open. No app-access retry or installation into the personal vault occurred. Nothing was pushed, tagged, released or submitted.
