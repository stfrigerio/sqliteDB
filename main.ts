import {
	Plugin,
	FileSystemAdapter,
	Editor,
	MarkdownView,
	MarkdownPostProcessorContext
} from "obsidian";

import { DBService } from "./src/DBService";
import { SQLiteDBSettingTab } from "./src/settingTab";
import { inspectTableStructure, convertEntriesInNotes } from "./src/commands";
import { processSqlBlock, processSqlChartBlock, DateNavigatorRenderer } from "./src/codeblocks";
import { pickTableName } from "./src/helpers";
import { SQLiteDBSettings, DEFAULT_SETTINGS } from "./src/types";

import { injectDatePickerStyles } from "src/styles/datePickerInject";
import { injectDateNavigatorStyles, removeDateNavigatorStyles } from './src/styles/dateNavigationInject';

import { registerHabitCounter } from "./src/webcomponents/HabitCounter/registerHabitCounter";

export default class SQLiteDBPlugin extends Plugin {
	settings: SQLiteDBSettings;
	private dbService: DBService;

	async onload() {
		// init
		await this.loadSettings();
		this.dbService = new DBService(this.app);
		await this.openDatabase();

		injectDatePickerStyles();
        injectDateNavigatorStyles(); 

		this.registerMarkdownPostProcessor((el, ctx) => {
			registerHabitCounter(el, this.dbService);
		});

		this.addCommand({
			id: "inspect-table-structure",
			name: "Inspect table structure",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
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
            "date-header",
            (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
                ctx.addChild(new DateNavigatorRenderer(el, this.app));

            }
        );

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
		
		await this.dbService.ensureDBLoaded(this.settings, basePath, forceReload);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

