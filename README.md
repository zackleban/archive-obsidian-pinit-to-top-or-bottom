# Pinit to Top or Bottom

Keep important notes and folders at the top of their folder and archives at the bottom. Reorder pins without renaming or moving your files.

## Requirements and installation

Requires Obsidian **1.7.2 or newer** and the core **Files** plugin. The plugin uses portable Obsidian APIs; real-device mobile checks are still listed in [docs/REVIEW.md](docs/REVIEW.md).

This is a local submission candidate, not a published community release. To install in a test vault:

1. Run `npm ci` and `npm run qa` in this repository (Node.js 22.13+ or 24 recommended for development).
2. Create `<vault>/<config-dir>/plugins/pinit-to-top-or-bottom/`. The config directory is normally `.obsidian`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into it.
4. Reload Obsidian and enable **Pinit to Top or Bottom** under **Settings → Community plugins**.

## Use

- Open a note or folder's context menu in the file explorer, then **Pinit → Pin to top** or **Pin to bottom**. If submenus are unavailable, these actions appear directly in the menu.
- New top pins follow existing top pins. New bottom pins go below existing bottom pins.
- Use **Move up** and **Move down** to reorder pins on the same side in the same folder.
- Choose **Unpin from top/bottom** to return an item to normal sorting. Switching sides removes its previous pin.
- Pins show a small pin beside their name and follow notes and folders renamed or moved within Obsidian. Deleting an item removes its pin.
- The plugin settings list every pin with an **Unpin** button.

The command palette also offers **Pin current note to top**, **Pin current note to bottom**, **Unpin current note**, **Move current note's pin up**, and **Move current note's pin down**. Commands appear only when applicable. No hotkeys are assigned automatically.

Pins work at every folder depth and override the file explorer's normal sort. Unpinned items retain that normal ordering. File Placer respects these pins.

## Import existing pins

On the first run only, the plugin reads saved pins from **Pinit** and **Pin to Bottom** in the vault's configured plugin directory. Top wins when an item appears on both sides, and duplicates are removed. Missing source settings are ignored. Disable the older plugins to avoid competing sorts and duplicate menu items.

This plugin is independent of Pinit by Habit Labs. It does not modify those plugins' settings.

## Data and privacy

Pins are stored in this plugin's `data.json`. No note contents are edited. No accounts, network calls, telemetry, or paid services are used. Disabling the plugin removes pin styling and restores normal sorting; saved pins remain for the next enable.

## Development and review

- `npm run dev`: rebuild while editing.
- `npm run lint`: official Obsidian ESLint rules and TypeScript-aware checks.
- `npm test`: duplicate/conflicting pins, sibling ordering, renames, deletion, migration, and unload regressions.
- `npm run build`: strict TypeScript check and production bundle.
- `npm run qa`: all checks plus manifest/package/version and artifact validation.

Sorting wraps the internal `getSortedFolderItems` method with monkey-around. The wrapper is removed on unload, and unsupported explorer APIs produce a notice. Public API usage is checked against the declared minimum version; the real-app compatibility checklist is in [docs/REVIEW.md](docs/REVIEW.md). Other file-explorer sorting plugins may conflict.

## License

MIT; see [LICENSE](LICENSE). Bundled monkey-around is ISC; its attribution and terms are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and embedded in `main.js`.
