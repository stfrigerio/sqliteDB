import {
	Plugin,
	FileSystemAdapter,
	Editor,
	MarkdownView,
	MarkdownPostProcessorContext,
	Notice,
} from "obsidian";

import { DBService } from "./src/DBService";
import { SQLiteDBSettingTab } from "./src/settingTab";
import { inspectTableStructure, convertEntriesInNotes, syncDBToJournals, syncJournalsToDB } from "./src/commands";
import { processSqlBlock, processSqlChartBlock, DateNavigatorRenderer } from "./src/codeblocks";
import { pickTableName, replacePlaceholders } from "./src/helpers";
import { injectDatePickerStyles, injectDateNavigatorStyles, injectTimePickerStyles, removeDateNavigatorStyles } from "src/styles";
import { 
	registerHabitCounter, 
	registerBooleanSwitch, 
	registerTextInput, 
	registerTimestampUpdaterButton, 
	registerSqlChartRenderer, 
	registerSqlRenderer,
	registerMoodNoteButtonProcessor,
	registerAddTextSupport
} from "./src/webcomponents";
import { SQLiteDBSettings, DEFAULT_SETTINGS } from "./src/types";
import { pluginState } from "src/pluginState";

export default class SQLiteDBPlugin extends Plugin {
	settings: SQLiteDBSettings;
	private dbService: DBService;
	
	async onload() {
		// init
		await this.loadSettings();
		this.dbService = new DBService(this.app);
		await this.openDatabase();

		pluginState.initialize(this.app);

		injectDatePickerStyles();
        injectDateNavigatorStyles(); 
		injectTimePickerStyles();

		//? Components
		this.registerMarkdownPostProcessor((el, ctx) => {
			registerHabitCounter(el, this.dbService);
			registerBooleanSwitch(el, this.dbService);
			registerTextInput(el, this.app, this.dbService);
		});

		registerSqlChartRenderer(this, this.dbService);
		registerSqlRenderer(this, this.dbService);
        registerTimestampUpdaterButton(this);
        registerMoodNoteButtonProcessor(this, this.dbService);
		registerAddTextSupport(this, this.dbService);

		
		//? Codeblocks
		this.registerMarkdownCodeBlockProcessor(
			"sql",
			async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				const processedSource = replacePlaceholders(source);
				await processSqlBlock(this.dbService, processedSource, el);
			}
		);

		this.registerMarkdownCodeBlockProcessor(
			"sql-chart",
			async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				const processedSource = replacePlaceholders(source);
				await processSqlChartBlock(this.dbService, processedSource, el);
			}
		);

        this.registerMarkdownCodeBlockProcessor(
            "date-header",
            (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				const processedSource = replacePlaceholders(source);
                ctx.addChild(new DateNavigatorRenderer(el, this.app, processedSource));

            }
        );

		//? Commands
		this.addCommand({
			id: "inspect-table-structure",
			name: "Inspect table structure",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await inspectTableStructure(this.dbService, editor, this.app);
			},
		});
		
		this.addCommand({
			id: "dump-table-to-notes",
			name: "Dump table to notes",
			callback: async () => {			
				// 1) pick a table
				const chosenTable = await pickTableName(this.dbService, this.app);
				if (!chosenTable) {
					return; // user canceled or no tables
				}
			
				// 2) Call the dump function with the chosen table
				await convertEntriesInNotes(this.dbService, chosenTable, this.app);
			},
		});

		this.addCommand({
			id: 'sync-journal-notes-to-db',
			name: 'Sync Journal Notes -> Database',
			callback: async () => {
				if (!this.settings.journalFolderPath || !this.settings.journalTableName) {
					new Notice("Please configure Journal folder path and table name in settings.");
					return;
				}
				new Notice("Starting sync: Notes -> DB...");
				await syncJournalsToDB(this.dbService, this.settings.journalFolderPath, this.settings.journalTableName, this.app);
			}
		});

		this.addCommand({
			id: 'sync-journal-db-to-notes',
			name: 'Sync Database -> Journal Notes',
			callback: async () => {
					if (!this.settings.journalFolderPath || !this.settings.journalTableName) {
					new Notice("Please configure Journal folder path and table name in settings.");
					return;
				}
				new Notice("Starting sync: DB -> Notes...");
				await syncDBToJournals(this.dbService, this.settings.journalTableName, this.settings.journalFolderPath, this.app);
			}
		});

		this.addSettingTab(new SQLiteDBSettingTab(this.app, this));
	}

	onunload() {
		removeDateNavigatorStyles();
	}

	private async openDatabase(forceReload = true) {
		const adapter = this.app.vault.adapter;
		let basePath: string;
	
		if (adapter instanceof FileSystemAdapter) {
			basePath = adapter.getBasePath();
		} else {
			basePath = (adapter as any).getFullPath("");
		}
	
		if (this.settings.mode === "local") {
			await this.dbService.ensureDBLoaded(this.settings, basePath, forceReload);
		} else {
			await this.dbService.ensureDBLoaded(this.settings, basePath, false);
		}
	}	

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

