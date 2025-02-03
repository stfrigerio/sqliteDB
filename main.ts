import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	Modal,
	Notice,
	FileSystemAdapter,
	Editor,
	MarkdownView,
	MarkdownPostProcessorContext
} from "obsidian";

import { DBService } from "./src/dbService";
import { inspectTableStructure, convertEntriesInNotes } from "./src/commands";
import { pickTableName, processSqlBlock, processSqlChartBlock } from "./src/helpers";
import { SqliteDBSettings, DEFAULT_SETTINGS } from "./src/types";

export default class SqliteDBPlugin extends Plugin {
	settings: SqliteDBSettings;
	private dbService: DBService;

	async onload() {
		console.log("Loading SqliteDBPlugin...");
		await this.loadSettings();

		this.dbService = new DBService();

		await this.openDatabase();

		this.addCommand({
			id: "inspect-table-structure",
			name: "Inspect table structure",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				// ensure DB is loaded (if not, load)
				await this.openDatabase();
				await inspectTableStructure(this.dbService, editor, this.app);
			},
		});
		
		this.addCommand({
			id: "dump-table-to-notes",
			name: "Dump Table to Notes",
			callback: async () => {
				await this.openDatabase(); // ensure DB is loaded
			
				// 1) pick a table
				const chosenTable = await pickTableName(this.dbService, this.app);
				if (!chosenTable) {
					return; // user canceled or no tables
				}
			
				// 2) Call the dump function with the chosen table
				await convertEntriesInNotes(this.dbService, chosenTable, this.app);
			},
		});

		this.registerMarkdownCodeBlockProcessor(
			"sql", // <-- the name of your code block (```sql)
			async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				await processSqlBlock(this.dbService, source, el);
			}
		);

		this.registerMarkdownCodeBlockProcessor(
			"sql-chart",
			async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				await processSqlChartBlock(this.dbService, source, el);
			}
		);

		this.addSettingTab(new SqliteDBSettingTab(this.app, this));
	}

	onunload() {
		console.log("Unloading SqliteDBPlugin...");
	}

	private async openDatabase(forceReload = true) {
		const adapter = this.app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			new Notice("This plugin only works with a local vault (FileSystemAdapter).");
			return;
		}
		const basePath = adapter.getBasePath();
		await this.dbService.ensureDBLoaded(this.settings, basePath, forceReload);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SqliteDBSettingTab extends PluginSettingTab {
	plugin: SqliteDBPlugin;

	constructor(app: App, plugin: SqliteDBPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "SQLite DB Plugin Settings" });

		new Setting(containerEl)
			.setName("Database File Path")
			.setDesc("Absolute path to the .db file on disk.")
			.addText((text) =>
				text
					.setPlaceholder("/home/user/path/to/your.db")
					.setValue(this.plugin.settings.dbFilePath)
					.onChange(async (value) => {
						this.plugin.settings.dbFilePath = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
