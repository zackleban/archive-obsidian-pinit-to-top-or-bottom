# Local review checklist

Latest local checkpoint: [Content and saved ordering REVIEW — 2026-10-29](#content-and-saved-ordering-review--2026-10-29). Earlier entries below remain dated history.

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

## Follow-up quality review — 2026-10-29

agent decision 2026-10-28: retain the accepted implementations and existing fault matrices because independent read-only review found no concrete regression; reconcile evidence and correct documentation against source and locked dependencies.

Reviewed `144b295` → `dadd361` with sibling File Placer `dc7507f`. Stable first-occurrence/top-wins normalization follows boundary-aware rename mapping before saving; unrelated missing paths remain. Consuming each pin match once preserves supplied item identity/multiplicity. Active-pin lifecycle state and installed monkey-around teardown agree with both wrapper orders. No concrete implementation regression was found; persistence scheduling is unchanged.

Fresh `npm run qa` passes **16/16 tests**, zero-warning lint, TypeScript, production build and package checks. The single shared File Placer suite passes **12/12 cases** (four lifecycle plus eight rename/lifecycle cases), with both load/handler orders, either disable/re-enable and cloned saved-state reload. Removed the ambiguous historical source-comment parenthetical “checked against 1.14.5” and pointed to this open checklist; available records do not establish that comment's inspection method. Executable behavior is unchanged.

These are explorer/storage doubles, not full host lifecycle dispatch or filesystem durability. The existing shared [runtime record](../../obsidian-file-placer/docs/RUNTIME-SORTING.md) remains the sole live sorting protocol; mobile/popout/minimum-version gates stay open.

Rechecked current official manifest, submission requirements, developer policies, plugin guidelines and submission instructions linked in this record. Local metadata, licensing and automated checks do not establish directory availability, minimum-version runtime compatibility or community approval. Production assets match the reviewed source and remain byte-identical to this review's starting candidate; `git diff --check` passes. No tests were added because no new implementation defect was reproduced. No app-access retry, installation, push, tag, release or submission occurred.

## Four-fix quality REVIEW — 2026-10-29

agent decision 2026-10-28: accept this bounded local REVIEW only after independent source/contract review and fresh checks; preserve live/community gates because synthetic hosts and local packaging cannot establish them.

Reviewed active-pin lifecycle, normalization, exact sorting identities and installed monkey-around removal semantics with File Placer. No new defect found. A fresh npm run test:integration in sibling File Placer passes 12/12; this remains the sole shared suite. Source/assets unchanged; live sorting, mobile, popout and minimum-version gates remain open.

Fresh `npm run qa` passed **16/16 tests**, TypeScript, production build and package checks. Configured official lint passed with zero warnings. This QA ran once for this REVIEW; standalone results across all seven are **382 tests**, plus **12 shared cases**. The preceding 365-plus-12 figure was an arithmetic intake expectation; the 17 new graph cases account for the difference.

README installation/development requirements, manifest/package/lock/root-lock/version-map agreement, licenses/notices, dependency classification and production artifacts were checked against actual configuration. Current official [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin%20guidelines), [developer policies](https://docs.obsidian.md/community-directory/developer-policies), [submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins), [manifest schema](https://docs.obsidian.md/Reference/Manifest) and [submission instructions](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) were rechecked. Declared minimums remain unverified runtime gates; local consistency is not hosted-scanner or community approval.

Existing live checklists and recovery protocols above remain their sole homes; no app-access retry, personal-vault installation, push, tag, release or submission occurred. Production assets are byte-identical to the starting candidate.

## Confirmation and ownership REVIEW — 2026-10-29

agent decision 2026-10-28: accept only the bounded local REVIEW after independent source/contract review, fresh checks and local commits; keep existing live/community gates open because local evidence cannot establish them.

Independent read-only review retained `8d53743` active lifecycle, rename normalization and sorting identities. Installed monkey-around 3.0.0 supports either teardown order by delegating removed buried wrappers to their original implementation. No new defect found. The sole shared suite ran in sibling File Placer: **12/12** cases pass against this unchanged Pinit implementation. Synthetic wrapper/host evidence does not certify live explorer, popout, mobile or minimum-version behavior.

Fresh `npm run qa` passed **16/16 tests**, TypeScript, production build and package checks. Configured lint passed with zero warnings. Each of the seven QA commands ran once for this REVIEW; the fresh aggregate is **543 standalone tests plus 12 shared cases**. Five new graph cases account for the increase from the historical 538-plus-12 intake arithmetic. No final QA failed.

README installation/development instructions, manifest/package/lock/root-lock/version agreement, desktop flags, dependency classification, licenses/notices and assets were checked against source/build configuration. Current official [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin%20guidelines), [developer policies](https://docs.obsidian.md/community-directory/developer-policies), [submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins), [manifest](https://docs.obsidian.md/Reference/Manifest) and [submission instructions](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin) were rechecked. Local consistency does not establish minimum-version compatibility, directory availability, hosted-review success or community approval.

Production assets are byte-identical to this REVIEW's starting candidate. Diff checks pass. Existing readiness/live protocols remain their sole homes, including explorer/modal/WebGL/xterm, popout, mobile where advertised, Linux and minimum versions as applicable. The three older live sorting/recovery deliverables remain blocked. No app-access retry, personal-vault installation, push, tag, release or submission occurred.

## Content and saved ordering REVIEW — 2026-10-29

agent decision 2026-10-28: accept the bounded local REVIEW only after independent read-only contract review, final verification and local commits; preserve live gates because local evidence cannot establish them.

Reviewed active lifecycle, top-wins rename normalization, unique sorting output and both installed monkey-around 3.0.0 wrapper teardown orders. No new implementation defect found. File Placer's accepted source-relative collision policy differs intentionally from pin first-occurrence/top-wins policy. Each retains its documented behavior.

The sole shared suite in sibling File Placer now freshly passes **28/28** via `npm run test:integration`, covering File Placer's own stale destinations in both positions as well as retained Pinit collisions, both load/handler orders and either plugin reload. No duplicate integration suite or runtime record was created. [The shared sorting protocol](../../obsidian-file-placer/docs/RUNTIME-SORTING.md) retains blocked live checks. Cloned saved-state and host doubles do not establish real explorer event ordering or filesystem persistence.

Fresh `npm run qa`: **16/16 tests**, zero-warning lint, TypeScript, production build and package checks, exit 0. Production assets rebuild byte-identically to this REVIEW’s starting candidate, with an independent in-memory comparison against actual production build options.

README install/build instructions, manifest/package/lock/root-lock/version-map agreement, desktop flags, runtime/development dependency classification, licenses/notices and production assets were checked against the existing locked toolchain. Node 24.22.0, npm 11.19.1; no installation or dependency update. Each QA command ran once; all seven total **746 standalone tests plus the sole 28-case shared integration suite**. The historical 734-test intake arithmetic is not a fresh pass; twelve new graph gesture cases explain the difference.

Current official [plugin guidelines](https://raw.githubusercontent.com/obsidianmd/obsidian-developer-docs/main/en/Plugins/Releasing/Plugin%20guidelines.md), [developer policies](https://docs.obsidian.md/community-directory/developer-policies), [submission requirements](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins), [manifest](https://raw.githubusercontent.com/obsidianmd/obsidian-developer-docs/main/en/Reference/Manifest.md) and [submission instructions](https://raw.githubusercontent.com/obsidianmd/obsidian-developer-docs/main/en/Plugins/Releasing/Submit%20your%20plugin.md) were rechecked. Local metadata/artifact/disclosure consistency is not blanket compliance, minimum-version compatibility, hosted-review success, name/ID availability or community approval.

Existing explorer/modal/WebGL/xterm, popout, mobile where advertised, Linux and minimum/current-version gates remain open as applicable. The three older live sorting/recovery deliverables remain blocked in their original records. No blocked app-access attempt, personal-vault installation, push, tag, release or submission occurred. Working/staged/committed diff checks are part of final acceptance; commits remain local on `agent/2026-10-28`.
