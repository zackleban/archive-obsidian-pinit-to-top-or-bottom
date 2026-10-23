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
  default: () => PinToBottomPlugin
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
var PinToBottomPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { pinnedPaths: [] };
    this.unpatch = null;
    this.unsupported = false;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new PinToBottomSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof import_obsidian.TFolder) || file.isRoot()) return;
        const pinned = this.isPinned(file.path);
        menu.addItem(
          (item) => item.setTitle(pinned ? "Unpin from bottom" : "Pin to bottom").setIcon(pinned ? "pin-off" : "pin").onClick(() => pinned ? this.unpin(file.path) : this.pin(file.path))
        );
      })
    );
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file, oldPath)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.onDelete(file)));
    this.app.workspace.onLayoutReady(() => {
      this.patchFileExplorer();
      this.registerEvent(this.app.workspace.on("layout-change", () => this.patchFileExplorer()));
    });
  }
  onunload() {
    var _a;
    (_a = this.unpatch) == null ? void 0 : _a.call(this);
    this.unpatch = null;
    this.refreshFileExplorers();
  }
  isPinned(path) {
    return this.settings.pinnedPaths.includes(path);
  }
  async pin(path) {
    this.settings.pinnedPaths = this.settings.pinnedPaths.filter((p) => p !== path).concat(path);
    await this.saveSettings();
  }
  async unpin(path) {
    this.settings.pinnedPaths = this.settings.pinnedPaths.filter((p) => p !== path);
    await this.saveSettings();
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = { pinnedPaths: Array.isArray(data == null ? void 0 : data.pinnedPaths) ? [...data.pinnedPaths] : [] };
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.refreshFileExplorers();
  }
  patchFileExplorer() {
    if (this.unpatch || this.unsupported) return;
    const leaf = this.app.workspace.getLeavesOfType(FILE_EXPLORER).find((l) => !l.isDeferred);
    if (!leaf) return;
    const proto = Object.getPrototypeOf(leaf.view);
    if (typeof proto.getSortedFolderItems !== "function") {
      this.unsupported = true;
      new import_obsidian.Notice("Pin to Bottom: this version of Obsidian's file explorer is not supported.");
      return;
    }
    const plugin = this;
    this.unpatch = around(proto, {
      getSortedFolderItems(original) {
        return function(folder) {
          return plugin.movePinnedDown(original.call(this, folder));
        };
      }
    });
    this.refreshFileExplorers();
  }
  movePinnedDown(items) {
    const pinned = this.settings.pinnedPaths;
    if (pinned.length === 0) return items;
    const rest = items.filter((item) => !pinned.includes(item.file.path));
    if (rest.length === items.length) return items;
    const bottom = items.filter((item) => pinned.includes(item.file.path)).sort((a, b) => pinned.indexOf(a.file.path) - pinned.indexOf(b.file.path));
    return rest.concat(bottom);
  }
  refreshFileExplorers() {
    var _a, _b;
    for (const leaf of this.app.workspace.getLeavesOfType(FILE_EXPLORER)) {
      if (leaf.isDeferred) continue;
      (_b = (_a = leaf.view).requestSort) == null ? void 0 : _b.call(_a);
    }
  }
  // Renaming or moving a folder (or any folder above it) keeps its pin.
  onRename(file, oldPath) {
    if (!(file instanceof import_obsidian.TFolder)) return;
    let changed = false;
    this.settings.pinnedPaths = this.settings.pinnedPaths.map((path) => {
      if (path !== oldPath && !path.startsWith(oldPath + "/")) return path;
      changed = true;
      return file.path + path.slice(oldPath.length);
    });
    if (changed) void this.saveSettings();
  }
  onDelete(file) {
    if (!(file instanceof import_obsidian.TFolder)) return;
    const kept = this.settings.pinnedPaths.filter((path) => path !== file.path && !path.startsWith(file.path + "/"));
    if (kept.length === this.settings.pinnedPaths.length) return;
    this.settings.pinnedPaths = kept;
    void this.saveSettings();
  }
};
var PinToBottomSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const pinned = this.plugin.settings.pinnedPaths;
    if (pinned.length === 0) {
      containerEl.createEl("p", {
        cls: "setting-item-description",
        text: 'No folders are pinned. Right-click a folder in the file explorer and choose "Pin to bottom".'
      });
      return;
    }
    new import_obsidian.Setting(containerEl).setName("Pinned folders").setDesc("Pinned folders that share a parent keep this order, the last one lowest.").setHeading();
    for (const path of pinned) {
      new import_obsidian.Setting(containerEl).setName(path).addButton(
        (button) => button.setButtonText("Unpin").onClick(async () => {
          await this.plugin.unpin(path);
          this.display();
        })
      );
    }
  }
};
