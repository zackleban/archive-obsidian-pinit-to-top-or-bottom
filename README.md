# Pinit to Top or Bottom

Pin to the top or the bottom. Created the bottom because it's great to get the archive out of the way.

## Use

- Right-click any note or folder in the file explorer and choose **Pin to top** or **Pin to bottom**.
- A pinned item's menu shows **Unpin** for its side, the option to switch sides, and **Move up** / **Move down** when
  another pin in the same folder sits on that side.
- Pins keep their place in their folder whatever sort order is picked, at every level of folders.
- A new top pin goes under the existing top pins; a new bottom pin goes to the very bottom.
- Pinned items show a small pin before their name.
- Commands for the open note: Pin current note to top, Pin current note to bottom, Unpin current note, Move current
  note's pin up, Move current note's pin down.
- Pins follow an item when it or a folder above it is renamed or moved inside Obsidian. Deleting it drops its pin.
- Settings, Pinit to Top or Bottom lists every pin, with an Unpin button for each.

## Coming from Pinit or Pin to Bottom

The first time it runs in a vault, the plugin copies the pins from Pinit (to top) and from Pin to Bottom (to bottom).
Turn those two plugins off afterwards, or their menu items show up twice.

## Install by hand

Copy `main.js`, `manifest.json` and `styles.css` into `<your vault>/.obsidian/plugins/pinit-to-top-or-bottom/`, then
turn it on under Settings, Community plugins.

## Build

```
npm install
npm run build
```

`npm run dev` rebuilds on every save.

## How it works

Obsidian's file explorer sorts each folder's children with an internal method, `getSortedFolderItems`. The plugin
wraps it (with `monkey-around`, so other plugins that wrap it keep working), puts the top pins first and the bottom
pins last. This is not public API: it was checked against Obsidian 1.14.5 and exists from 1.6.0. If a later Obsidian
removes it, the plugin shows a notice and does nothing.
