import { App, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFolder, View } from "obsidian";
import { around } from "monkey-around";

const FILE_EXPLORER = "file-explorer";

interface PinToBottomSettings {
	// Folder paths, in pin order: the last one pinned sits lowest.
	pinnedPaths: string[];
}

// Obsidian's file explorer internals; not in the public API (checked against 1.14.5).
// Each folder's children are sorted by getSortedFolderItems, so wrapping it moves
// pinned folders down at every level, after whatever sort order the user picked.
interface FileExplorerItem {
	file: TAbstractFile;
}

interface FileExplorerView extends View {
	getSortedFolderItems(folder: TFolder): FileExplorerItem[];
	requestSort(): void;
}

export default class PinToBottomPlugin extends Plugin {
	settings: PinToBottomSettings = { pinnedPaths: [] };
	private unpatch: (() => void) | null = null;
	private unsupported = false;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new PinToBottomSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!(file instanceof TFolder) || file.isRoot()) return;
				const pinned = this.isPinned(file.path);
				menu.addItem((item) =>
					item
						.setTitle(pinned ? "Unpin from bottom" : "Pin to bottom")
						.setIcon(pinned ? "pin-off" : "pin")
						.onClick(() => (pinned ? this.unpin(file.path) : this.pin(file.path)))
				);
			})
		);

		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.onRename(file, oldPath)));
		this.registerEvent(this.app.vault.on("delete", (file) => this.onDelete(file)));

		this.app.workspace.onLayoutReady(() => {
			this.patchFileExplorer();
			// The file explorer can load later (a deferred sidebar tab, or re-enabled core plugin).
			this.registerEvent(this.app.workspace.on("layout-change", () => this.patchFileExplorer()));
		});
	}

	onunload() {
		this.unpatch?.();
		this.unpatch = null;
		this.refreshFileExplorers();
	}

	isPinned(path: string): boolean {
		return this.settings.pinnedPaths.includes(path);
	}

	async pin(path: string) {
		this.settings.pinnedPaths = this.settings.pinnedPaths.filter((p) => p !== path).concat(path);
		await this.saveSettings();
	}

	async unpin(path: string) {
		this.settings.pinnedPaths = this.settings.pinnedPaths.filter((p) => p !== path);
		await this.saveSettings();
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<PinToBottomSettings> | null;
		this.settings = { pinnedPaths: Array.isArray(data?.pinnedPaths) ? [...data.pinnedPaths] : [] };
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.refreshFileExplorers();
	}

	private patchFileExplorer() {
		if (this.unpatch || this.unsupported) return;
		const leaf = this.app.workspace.getLeavesOfType(FILE_EXPLORER).find((l) => !l.isDeferred);
		if (!leaf) return;

		const proto = Object.getPrototypeOf(leaf.view) as FileExplorerView;
		if (typeof proto.getSortedFolderItems !== "function") {
			this.unsupported = true;
			new Notice("Pin to Bottom: this version of Obsidian's file explorer is not supported.");
			return;
		}

		const plugin = this;
		this.unpatch = around(proto, {
			getSortedFolderItems(original) {
				return function (this: FileExplorerView, folder: TFolder) {
					return plugin.movePinnedDown(original.call(this, folder));
				};
			},
		});
		this.refreshFileExplorers();
	}

	private movePinnedDown(items: FileExplorerItem[]): FileExplorerItem[] {
		const pinned = this.settings.pinnedPaths;
		if (pinned.length === 0) return items;
		const rest = items.filter((item) => !pinned.includes(item.file.path));
		if (rest.length === items.length) return items;
		const bottom = items
			.filter((item) => pinned.includes(item.file.path))
			.sort((a, b) => pinned.indexOf(a.file.path) - pinned.indexOf(b.file.path));
		return rest.concat(bottom);
	}

	private refreshFileExplorers() {
		for (const leaf of this.app.workspace.getLeavesOfType(FILE_EXPLORER)) {
			if (leaf.isDeferred) continue;
			(leaf.view as FileExplorerView).requestSort?.();
		}
	}

	// Renaming or moving a folder (or any folder above it) keeps its pin.
	private onRename(file: TAbstractFile, oldPath: string) {
		if (!(file instanceof TFolder)) return;
		let changed = false;
		this.settings.pinnedPaths = this.settings.pinnedPaths.map((path) => {
			if (path !== oldPath && !path.startsWith(oldPath + "/")) return path;
			changed = true;
			return file.path + path.slice(oldPath.length);
		});
		if (changed) void this.saveSettings();
	}

	private onDelete(file: TAbstractFile) {
		if (!(file instanceof TFolder)) return;
		const kept = this.settings.pinnedPaths.filter((path) => path !== file.path && !path.startsWith(file.path + "/"));
		if (kept.length === this.settings.pinnedPaths.length) return;
		this.settings.pinnedPaths = kept;
		void this.saveSettings();
	}
}

class PinToBottomSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: PinToBottomPlugin) {
		super(app, plugin);
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		const pinned = this.plugin.settings.pinnedPaths;
		if (pinned.length === 0) {
			containerEl.createEl("p", {
				cls: "setting-item-description",
				text: "No folders are pinned. Right-click a folder in the file explorer and choose \"Pin to bottom\".",
			});
			return;
		}

		new Setting(containerEl)
			.setName("Pinned folders")
			.setDesc("Pinned folders that share a parent keep this order, the last one lowest.")
			.setHeading();
		for (const path of pinned) {
			new Setting(containerEl).setName(path).addButton((button) =>
				button.setButtonText("Unpin").onClick(async () => {
					await this.plugin.unpin(path);
					this.display();
				})
			);
		}
	}
}
