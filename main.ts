import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	FileSystemAdapter,
	Editor,
	MarkdownView,
	MarkdownPostProcessorContext
} from "obsidian";

import { DBService } from "./src/dbService";
import { inspectTableStructure, convertEntriesInNotes } from "./src/commands";
import { processSqlBlock, processSqlChartBlock, renderDatePicker } from "./src/codeblocks";
import { pickTableName } from "./src/helpers";
import { SQLiteDBSettings, DEFAULT_SETTINGS } from "./src/types";
import { injectDatePickerStyles } from "src/styles/datePickerInject";
import "./src/webcomponents/habitCounter";

export default class SQLiteDBPlugin extends Plugin {
	settings: SQLiteDBSettings;
	private dbService: DBService;

	async onload() {
		// init
		await this.loadSettings();
		this.dbService = new DBService(this.app);
		await this.openDatabase();

		injectDatePickerStyles();

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
			name: "Dump table to notes",
			callback: async () => {
				await this.openDatabase();
			
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
			"sql",
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

		this.registerMarkdownCodeBlockProcessor(
			"date-picker",
			async (source: string, el: HTMLElement) => {
				renderDatePicker(el, this.app);
			}
		);

		this.addSettingTab(new SQLiteDBSettingTab(this.app, this));
	}

	onunload() {
		console.log("Unloading SQLiteDBPlugin...");
	}

	private async openDatabase(forceReload = true) {
		const adapter = this.app.vault.adapter;
		let basePath: string;
		
		if (adapter instanceof FileSystemAdapter) {
			basePath = adapter.getBasePath();
		} else {
			basePath = (adapter as any).getFullPath("");
		}
		
		await this.dbService.ensureDBLoaded(this.settings, basePath, forceReload);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SQLiteDBSettingTab extends PluginSettingTab {
	plugin: SQLiteDBPlugin;

	constructor(app: App, plugin: SQLiteDBPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Database file path")
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
