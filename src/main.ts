import { App, Menu, MenuItem, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFolder, View, normalizePath } from "obsidian";
import { around } from "monkey-around";

const FILE_EXPLORER = "file-explorer";
const PINNED_CLASS = "pinit-tb-pinned";

type Side = "top" | "bottom";
const SIDES: Side[] = ["top", "bottom"];
const PIN_ICONS: Record<Side, string> = { top: "arrow-up-to-line", bottom: "arrow-down-to-line" };

interface PinitSettings {
	// Pinned paths, each list in the order the pins show inside their folder.
	top: string[];
	bottom: string[];
}

// Obsidian's file explorer internals; not in the public API (checked against 1.14.5).
// Each folder's children are sorted by getSortedFolderItems, so wrapping it places
// pinned items at every level, after whatever sort order the user picked.
interface FileExplorerItem {
	file: TAbstractFile;
	el?: HTMLElement;
}

interface FileExplorerView extends View {
	fileItems: Record<string, FileExplorerItem>;
	getSortedFolderItems(folder: TFolder): FileExplorerItem[];
	requestSort(): void;
}

// Builds Obsidian's own "Copy path" submenu; not in the public API either.
interface SubmenuItem extends MenuItem {
	setSubmenu(): Menu;
}

const parentOf = (path: string) => path.slice(0, Math.max(path.lastIndexOf("/"), 0));
const isAtOrUnder = (path: string, base: string) => path === base || path.startsWith(base + "/");
const strings = (value: unknown): string[] =>
	Array.isArray(value) ? [...new Set(value.filter((p): p is string => typeof p === "string" && p.length > 0 && p !== "/"))] : [];
const normalizePins = (topPaths: unknown, bottomPaths: unknown): PinitSettings => {
	const top = strings(topPaths);
	return { top, bottom: strings(bottomPaths).filter((path) => !top.includes(path)) };
};

export default class PinitToTopOrBottomPlugin extends Plugin {
	settings: PinitSettings = { top: [], bottom: [] };
	private unpatch: (() => void) | null = null;
	private unsupported = false;
	private unloaded = false;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new PinitSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFolder && file.isRoot()) return;
				this.addMenuItems(menu, file.path);
			})
		);
		this.registerCommands();

		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file.path, oldPath)));
		this.registerEvent(this.app.vault.on("delete", (file) => this.onDelete(file.path)));

		this.app.workspace.onLayoutReady(() => {
			if (this.unloaded) return;
			this.patchFileExplorer();
			// The file explorer can load later (a deferred sidebar tab, or re-enabled core plugin).
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

	// Sorting integrations must stop honoring pins as soon as this wrapper is removed,
	// even while the host still has this plugin in its loaded-plugin registry.
	getActivePins(): Readonly<PinitSettings> | null {
		return this.unpatch && !this.unloaded ? this.settings : null;
	}

	sideOf(path: string): Side | null {
		return SIDES.find((side) => this.settings[side].includes(path)) ?? null;
	}

	async pin(path: string, side: Side) {
		this.removePin(path);
		this.settings[side].push(path);
		await this.saveSafely();
	}

	async unpin(path: string) {
		this.removePin(path);
		await this.saveSafely();
	}

	// Swaps a pin with the next pin above (-1) or below (1) it in the same folder.
	async move(path: string, step: -1 | 1) {
		const side = this.sideOf(path);
		if (!side) return;
		const list = this.settings[side];
		const i = list.indexOf(path);
		const j = this.neighbourIndex(list, i, step);
		if (j === -1) return;
		[list[i], list[j]] = [list[j], list[i]];
		await this.saveSafely();
	}

	canMove(path: string, step: -1 | 1): boolean {
		const side = this.sideOf(path);
		if (!side) return false;
		const list = this.settings[side];
		return this.neighbourIndex(list, list.indexOf(path), step) !== -1;
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<PinitSettings> | null;
		if (data) {
			this.settings = normalizePins(data.top, data.bottom);
			return;
		}
		// First run: bring over the pins from Pinit (top) and Pin to Bottom (bottom).
		const pinit = (await this.readPluginData("pinit")) as { pins?: Record<string, unknown> } | null;
		const pinToBottom = (await this.readPluginData("pin-to-bottom")) as { pinnedPaths?: unknown } | null;
		this.settings = normalizePins(Object.values(pinit?.pins ?? {}).flatMap(strings), pinToBottom?.pinnedPaths);
		await this.saveData(this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.forEachExplorer((view) => view.requestSort());
	}

	private async saveSafely() {
		try { await this.saveSettings(); }
		catch (error) {
			console.error("Pinit: could not save pins", error);
			new Notice("Could not save pins. Check that the vault is writable.");
		}
	}

	private removePin(path: string) {
		this.settings.top = this.settings.top.filter((p) => p !== path);
		this.settings.bottom = this.settings.bottom.filter((p) => p !== path);
	}

	private neighbourIndex(list: string[], i: number, step: -1 | 1): number {
		const parent = parentOf(list[i]);
		for (let j = i + step; j >= 0 && j < list.length; j += step) {
			if (parentOf(list[j]) === parent && this.app.vault.getAbstractFileByPath(list[j])) return j;
		}
		return -1;
	}

	// Right-click > Pinit > Pin to top, Pin to bottom, Move up, Move down. Falls back to
	// plain menu items if a later Obsidian drops submenus.
	private addMenuItems(menu: Menu, path: string) {
		let target = menu;
		if (typeof (MenuItem.prototype as SubmenuItem).setSubmenu === "function") {
			menu.addItem((item) => {
				target = (item.setSection("action").setTitle("Pinit").setIcon("pin") as SubmenuItem).setSubmenu();
			});
		}
		const add = (title: string, icon: string, run: () => unknown) =>
			target.addItem((item) => {
				if (target === menu) item.setSection("action");
				item.setTitle(title).setIcon(icon).onClick(run);
			});

		const current = this.sideOf(path);
		for (const side of SIDES) {
			const pinned = current === side;
			add(pinned ? `Unpin from ${side}` : `Pin to ${side}`, pinned ? "pin-off" : PIN_ICONS[side], () =>
				pinned ? this.unpin(path) : this.pin(path, side)
			);
		}
		if (this.canMove(path, -1)) add("Move up", "arrow-up", () => this.move(path, -1));
		if (this.canMove(path, 1)) add("Move down", "arrow-down", () => this.move(path, 1));
	}

	private registerCommands() {
		const command = (id: string, name: string, when: (path: string) => boolean, run: (path: string) => unknown) =>
			this.addCommand({
				id,
				name,
				checkCallback: (checking) => {
					const path = this.app.workspace.getActiveFile()?.path;
					if (!path || !when(path)) return false;
					if (!checking) void run(path);
					return true;
				},
			});
		command("pin-to-top", "Pin current note to top", (p) => this.sideOf(p) !== "top", (p) => this.pin(p, "top"));
		command("pin-to-bottom", "Pin current note to bottom", (p) => this.sideOf(p) !== "bottom", (p) => this.pin(p, "bottom"));
		command("unpin", "Unpin current note", (p) => this.sideOf(p) !== null, (p) => this.unpin(p));
		command("move-up", "Move current note's pin up", (p) => this.canMove(p, -1), (p) => this.move(p, -1));
		command("move-down", "Move current note's pin down", (p) => this.canMove(p, 1), (p) => this.move(p, 1));
	}

	private patchFileExplorer() {
		if (this.unloaded) return;
		if (this.unpatch || this.unsupported) return;
		const leaf = this.app.workspace.getLeavesOfType(FILE_EXPLORER).find((l) => !l.isDeferred);
		if (!leaf) return;

		const proto = Object.getPrototypeOf(leaf.view) as FileExplorerView;
		if (typeof proto.getSortedFolderItems !== "function" || typeof proto.requestSort !== "function") {
			this.unsupported = true;
			new Notice("Pinit to Top or Bottom: this version of Obsidian's file explorer is not supported.");
			return;
		}

		const arrangeItems = this.arrange.bind(this);
		this.unpatch = around(proto, {
			getSortedFolderItems(original) {
				return function (this: FileExplorerView, folder: TFolder) {
					return arrangeItems(original.call(this, folder));
				};
			},
		});
		this.forEachExplorer((view) => view.requestSort());
	}

	private arrange(items: FileExplorerItem[]): FileExplorerItem[] {
		const byPath = new Map(items.map((item) => [item.file.path, item]));
		// Consume each match once, even if saved pins contain duplicates or conflicts.
		const pick = (paths: string[]) => paths.flatMap((path) => {
			const item = byPath.get(path);
			byPath.delete(path);
			return item ? [item] : [];
		});
		const top = pick(this.settings.top);
		const bottom = pick(this.settings.bottom);
		const pinned = new Set([...top, ...bottom]);
		for (const item of items) item.el?.toggleClass(PINNED_CLASS, pinned.has(item));
		if (pinned.size === 0) return items;
		return [...top, ...items.filter((item) => !pinned.has(item)), ...bottom];
	}

	private forEachExplorer(callback: (view: FileExplorerView) => void) {
		for (const leaf of this.app.workspace.getLeavesOfType(FILE_EXPLORER)) {
			if (leaf.isDeferred) continue;
			const view = leaf.view as FileExplorerView;
			if (typeof view.requestSort === "function") callback(view);
		}
	}

	private async readPluginData(id: string): Promise<unknown> {
		try {
			const path = normalizePath(`${this.app.vault.configDir}/plugins/${id}/data.json`);
			return JSON.parse(await this.app.vault.adapter.read(path));
		} catch {
			return null;
		}
	}

	// Renaming or moving a pinned item (or any folder above it) keeps its pin.
	private onRename(path: string, oldPath: string) {
		let changed = false;
		const follow = (p: string) => {
			if (!isAtOrUnder(p, oldPath)) return p;
			changed = true;
			return path + p.slice(oldPath.length);
		};
		const top = this.settings.top.map(follow);
		const bottom = this.settings.bottom.map(follow);
		if (changed) {
			// A stale destination pin can collide with a renamed path. Keep the first
			// occurrence on each side, with top winning, just as when loading pins.
			this.settings = normalizePins(top, bottom);
			void this.saveSafely();
		}
	}

	private onDelete(path: string) {
		const keep = (p: string) => !isAtOrUnder(p, path);
		const top = this.settings.top.filter(keep);
		const bottom = this.settings.bottom.filter(keep);
		if (top.length === this.settings.top.length && bottom.length === this.settings.bottom.length) return;
		this.settings = { top, bottom };
		void this.saveSafely();
	}
}

class PinitSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: PinitToTopOrBottomPlugin) {
		super(app, plugin);
	}

	display() {
		this.renderSettings();
	}

	private renderSettings() {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("p", {
			cls: "setting-item-description",
			text:
				"Right-click any note or folder in the file explorer to pin it to the top or the bottom of its folder. " +
				"Pins in the same folder show in the order listed here; use Move up and Move down on the right-click menu to change it.",
		});
		this.section("Pinned to top", this.plugin.settings.top);
		this.section("Pinned to bottom", this.plugin.settings.bottom);
	}

	private section(name: string, paths: string[]) {
		new Setting(this.containerEl).setName(name).setHeading();
		if (paths.length === 0) {
			this.containerEl.createEl("p", { cls: "setting-item-description", text: "Nothing pinned." });
			return;
		}
		for (const path of paths) {
			new Setting(this.containerEl).setName(path).addButton((button) =>
				button.setButtonText("Unpin").onClick(async () => {
					await this.plugin.unpin(path);
					this.renderSettings();
				})
			);
		}
	}
}
