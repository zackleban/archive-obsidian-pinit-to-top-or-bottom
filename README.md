# Pin to Bottom

An Obsidian plugin that pins folders to the bottom of the file explorer.

## Use

- Right-click a folder in the file explorer and choose **Pin to bottom**. Choose **Unpin from bottom** to undo.
- A pinned folder stays at the bottom of its parent folder, whatever sort order is picked.
- When several folders in the same parent are pinned, the last one pinned sits lowest.
- Pins follow a folder when it or a folder above it is renamed or moved inside Obsidian. Deleting a folder drops its pin.
- Settings, Pin to Bottom lists the pinned folders, with an Unpin button for each.

## Install by hand

Copy `main.js` and `manifest.json` into `<your vault>/.obsidian/plugins/pin-to-bottom/`, then turn it on under
Settings, Community plugins.

## Build

```
npm install
npm run build
```

`npm run dev` rebuilds on every save.

## How it works

Obsidian's file explorer sorts each folder's children with an internal method, `getSortedFolderItems`. The plugin
wraps it (with `monkey-around`, so other plugins that wrap it keep working) and moves pinned folders to the end. This
is not public API: it was checked against Obsidian 1.14.5 and exists from 1.6.0. If a later Obsidian removes it, the
plugin shows a notice and does nothing.
