/*!
# Third-party notices

The following libraries are bundled in main.js. Obsidian itself is supplied by the host app.

## monkey-around 3.0.0 (ISC)

Author: PJ Eby. Source: https://github.com/pjeby/monkey-around
The upstream package declares the ISC license in package.json.

Copyright PJ Eby

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.

*/
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PinitToTopOrBottomPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// node_modules/monkey-around/dist/index.mjs
function around(obj, factories) {
  const removers = Object.keys(factories).map((key) => around1(obj, key, factories[key]));
  return removers.length === 1 ? removers[0] : function() {
    removers.forEach((r) => r());
  };
}
function around1(obj, method, createWrapper) {
  const inherited = obj[method], hadOwn = obj.hasOwnProperty(method), original = hadOwn ? inherited : function() {
    return Object.getPrototypeOf(obj)[method].apply(this, arguments);
  };
  let current = createWrapper(original);
  if (inherited)
    Object.setPrototypeOf(current, inherited);
  Object.setPrototypeOf(wrapper, current);
  obj[method] = wrapper;
  return remove;
  function wrapper(...args) {
    if (current === original && obj[method] === wrapper)
      remove();
    return current.apply(this, args);
  }
  function remove() {
    if (obj[method] === wrapper) {
      if (hadOwn)
        obj[method] = original;
      else
        delete obj[method];
    }
    if (current === original)
      return;
    current = original;
    Object.setPrototypeOf(wrapper, inherited || Function);
  }
}

// src/main.ts
var FILE_EXPLORER = "file-explorer";
var PINNED_CLASS = "pinit-tb-pinned";
var SIDES = ["top", "bottom"];
var PIN_ICONS = { top: "arrow-up-to-line", bottom: "arrow-down-to-line" };
var parentOf = (path) => path.slice(0, Math.max(path.lastIndexOf("/"), 0));
var isAtOrUnder = (path, base) => path === base || path.startsWith(base + "/");
var strings = (value) => Array.isArray(value) ? [...new Set(value.filter((p) => typeof p === "string" && p.length > 0 && p !== "/"))] : [];
var PinitToTopOrBottomPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { top: [], bottom: [] };
    this.unpatch = null;
    this.unsupported = false;
    this.unloaded = false;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new PinitSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof import_obsidian.TFolder && file.isRoot()) return;
        this.addMenuItems(menu, file.path);
      })
    );
    this.registerCommands();
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file.path, oldPath)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.onDelete(file.path)));
    this.app.workspace.onLayoutReady(() => {
      if (this.unloaded) return;
      this.patchFileExplorer();
      this.registerEvent(this.app.workspace.on("layout-change", () => this.patchFileExplorer()));
    });
  }
  onunload() {
    this.unloaded = true;
    this.unpatch?.();
    this.unpatch = null;
    this.forEachExplorer((view) => {
      for (const item of Object.values(view.fileItems ?? {})) item.el?.removeClass(PINNED_CLASS);
      view.requestSort();
    });
  }
  sideOf(path) {
    return SIDES.find((side) => this.settings[side].includes(path)) ?? null;
  }
  async pin(path, side) {
    this.removePin(path);
    this.settings[side].push(path);
    await this.saveSafely();
  }
  async unpin(path) {
    this.removePin(path);
    await this.saveSafely();
  }
  // Swaps a pin with the next pin above (-1) or below (1) it in the same folder.
  async move(path, step) {
    const side = this.sideOf(path);
    if (!side) return;
    const list = this.settings[side];
    const i = list.indexOf(path);
    const j = this.neighbourIndex(list, i, step);
    if (j === -1) return;
    [list[i], list[j]] = [list[j], list[i]];
    await this.saveSafely();
  }
  canMove(path, step) {
    const side = this.sideOf(path);
    if (!side) return false;
    const list = this.settings[side];
    return this.neighbourIndex(list, list.indexOf(path), step) !== -1;
  }
  async loadSettings() {
    const data = await this.loadData();
    if (data) {
      const top2 = strings(data.top);
      this.settings = { top: top2, bottom: strings(data.bottom).filter((path) => !top2.includes(path)) };
      return;
    }
    const pinit = await this.readPluginData("pinit");
    const pinToBottom = await this.readPluginData("pin-to-bottom");
    const top = strings(Object.values(pinit?.pins ?? {}).flatMap(strings));
    const bottom = strings(pinToBottom?.pinnedPaths).filter((p) => !top.includes(p));
    this.settings = { top, bottom };
    await this.saveData(this.settings);
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.forEachExplorer((view) => view.requestSort());
  }
  async saveSafely() {
    try {
      await this.saveSettings();
    } catch (error) {
      console.error("Pinit: could not save pins", error);
      new import_obsidian.Notice("Could not save pins. Check that the vault is writable.");
    }
  }
  removePin(path) {
    this.settings.top = this.settings.top.filter((p) => p !== path);
    this.settings.bottom = this.settings.bottom.filter((p) => p !== path);
  }
  neighbourIndex(list, i, step) {
    const parent = parentOf(list[i]);
    for (let j = i + step; j >= 0 && j < list.length; j += step) {
      if (parentOf(list[j]) === parent && this.app.vault.getAbstractFileByPath(list[j])) return j;
    }
    return -1;
  }
  // Right-click > Pinit > Pin to top, Pin to bottom, Move up, Move down. Falls back to
  // plain menu items if a later Obsidian drops submenus.
  addMenuItems(menu, path) {
    let target = menu;
    if (typeof import_obsidian.MenuItem.prototype.setSubmenu === "function") {
      menu.addItem((item) => {
        target = item.setSection("action").setTitle("Pinit").setIcon("pin").setSubmenu();
      });
    }
    const add = (title, icon, run) => target.addItem((item) => {
      if (target === menu) item.setSection("action");
      item.setTitle(title).setIcon(icon).onClick(run);
    });
    const current = this.sideOf(path);
    for (const side of SIDES) {
      const pinned = current === side;
      add(
        pinned ? `Unpin from ${side}` : `Pin to ${side}`,
        pinned ? "pin-off" : PIN_ICONS[side],
        () => pinned ? this.unpin(path) : this.pin(path, side)
      );
    }
    if (this.canMove(path, -1)) add("Move up", "arrow-up", () => this.move(path, -1));
    if (this.canMove(path, 1)) add("Move down", "arrow-down", () => this.move(path, 1));
  }
  registerCommands() {
    const command = (id, name, when, run) => this.addCommand({
      id,
      name,
      checkCallback: (checking) => {
        const path = this.app.workspace.getActiveFile()?.path;
        if (!path || !when(path)) return false;
        if (!checking) void run(path);
        return true;
      }
    });
    command("pin-to-top", "Pin current note to top", (p) => this.sideOf(p) !== "top", (p) => this.pin(p, "top"));
    command("pin-to-bottom", "Pin current note to bottom", (p) => this.sideOf(p) !== "bottom", (p) => this.pin(p, "bottom"));
    command("unpin", "Unpin current note", (p) => this.sideOf(p) !== null, (p) => this.unpin(p));
    command("move-up", "Move current note's pin up", (p) => this.canMove(p, -1), (p) => this.move(p, -1));
    command("move-down", "Move current note's pin down", (p) => this.canMove(p, 1), (p) => this.move(p, 1));
  }
  patchFileExplorer() {
    if (this.unloaded) return;
    if (this.unpatch || this.unsupported) return;
    const leaf = this.app.workspace.getLeavesOfType(FILE_EXPLORER).find((l) => !l.isDeferred);
    if (!leaf) return;
    const proto = Object.getPrototypeOf(leaf.view);
    if (typeof proto.getSortedFolderItems !== "function" || typeof proto.requestSort !== "function") {
      this.unsupported = true;
      new import_obsidian.Notice("Pinit to Top or Bottom: this version of Obsidian's file explorer is not supported.");
      return;
    }
    const arrangeItems = this.arrange.bind(this);
    this.unpatch = around(proto, {
      getSortedFolderItems(original) {
        return function(folder) {
          return arrangeItems(original.call(this, folder));
        };
      }
    });
    this.forEachExplorer((view) => view.requestSort());
  }
  arrange(items) {
    const byPath = new Map(items.map((item) => [item.file.path, item]));
    const pick = (paths) => paths.map((p) => byPath.get(p)).filter((item) => item !== void 0);
    const top = pick(this.settings.top);
    const bottom = pick(this.settings.bottom).filter((item) => !top.includes(item));
    const pinned = /* @__PURE__ */ new Set([...top, ...bottom]);
    for (const item of items) item.el?.toggleClass(PINNED_CLASS, pinned.has(item));
    if (pinned.size === 0) return items;
    return [...top, ...items.filter((item) => !pinned.has(item)), ...bottom];
  }
  forEachExplorer(callback) {
    for (const leaf of this.app.workspace.getLeavesOfType(FILE_EXPLORER)) {
      if (leaf.isDeferred) continue;
      const view = leaf.view;
      if (typeof view.requestSort === "function") callback(view);
    }
  }
  async readPluginData(id) {
    try {
      const path = (0, import_obsidian.normalizePath)(`${this.app.vault.configDir}/plugins/${id}/data.json`);
      return JSON.parse(await this.app.vault.adapter.read(path));
    } catch {
      return null;
    }
  }
  // Renaming or moving a pinned item (or any folder above it) keeps its pin.
  onRename(path, oldPath) {
    let changed = false;
    const follow = (p) => {
      if (!isAtOrUnder(p, oldPath)) return p;
      changed = true;
      return path + p.slice(oldPath.length);
    };
    this.settings.top = this.settings.top.map(follow);
    this.settings.bottom = this.settings.bottom.map(follow);
    if (changed) void this.saveSafely();
  }
  onDelete(path) {
    const keep = (p) => !isAtOrUnder(p, path);
    const top = this.settings.top.filter(keep);
    const bottom = this.settings.bottom.filter(keep);
    if (top.length === this.settings.top.length && bottom.length === this.settings.bottom.length) return;
    this.settings = { top, bottom };
    void this.saveSafely();
  }
};
var PinitSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.renderSettings();
  }
  renderSettings() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Right-click any note or folder in the file explorer to pin it to the top or the bottom of its folder. Pins in the same folder show in the order listed here; use Move up and Move down on the right-click menu to change it."
    });
    this.section("Pinned to top", this.plugin.settings.top);
    this.section("Pinned to bottom", this.plugin.settings.bottom);
  }
  section(name, paths) {
    new import_obsidian.Setting(this.containerEl).setName(name).setHeading();
    if (paths.length === 0) {
      this.containerEl.createEl("p", { cls: "setting-item-description", text: "Nothing pinned." });
      return;
    }
    for (const path of paths) {
      new import_obsidian.Setting(this.containerEl).setName(path).addButton(
        (button) => button.setButtonText("Unpin").onClick(async () => {
          await this.plugin.unpin(path);
          this.renderSettings();
        })
      );
    }
  }
};
