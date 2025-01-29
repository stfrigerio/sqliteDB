import { 
	App, 
	Plugin, 
	PluginSettingTab, 
	Setting, 
	Modal, 
	Notice,
	FileSystemAdapter   // <-- Import FileSystemAdapter
} from "obsidian";

import initSqlJs, { Database } from "sql.js";
import { readFileSync, writeFileSync } from "fs";

interface MyWasmDBSettings {
	dbFilePath: string;
}

const DEFAULT_SETTINGS: MyWasmDBSettings = {
	dbFilePath: "",
};

export default class MyWasmDBPlugin extends Plugin {
	settings: MyWasmDBSettings;
	private db: Database | null = null;

	async onload() {
		console.log("Loading MyWasmDBPlugin...");
		await this.loadSettings();

		this.addCommand({
			id: "open-wasm-db",
			name: "Open SQLite (WASM) DB and read a table",
			callback: async () => {
				await this.readDatabase();
			},
		});

		this.addSettingTab(new MyWasmDBSettingTab(this.app, this));
	}

	onunload() {
		console.log("Unloading MyWasmDBPlugin...");
		this.db = null;
	}

	private async readDatabase() {
		const { dbFilePath } = this.settings;
		if (!dbFilePath) {
			new Notice("No DB path set in plugin settings.");
			return;
		}

		try {
			// 1) Get the actual base path of the local vault, if we have a FileSystemAdapter
			let basePath: string | null = null;
			const adapter = this.app.vault.adapter;
			if (adapter instanceof FileSystemAdapter) {
				basePath = adapter.getBasePath(); // Now we can call getBasePath()
			}

			if (!basePath) {
				new Notice("This plugin only works with a local vault (FileSystemAdapter).");
				return;
			}

			// 2) Load the sql.js WASM module, telling it exactly where to find sql-wasm.wasm
			//    Suppose we've placed sql-wasm.wasm in the same folder as main.js, i.e.
			//    <Vault>/.obsidian/plugins/sqliteDB/sql-wasm.wasm
			const SQL = await initSqlJs({
				locateFile: (file) => {
					// "file" will typically be "sql-wasm.wasm"
					return `${basePath}/.obsidian/plugins/sqliteDB/${file}`;
				},
			});

			// 3) Read file from disk
			const fileBuffer = readFileSync(dbFilePath);
			const uint8Array = new Uint8Array(fileBuffer);

			// 4) Create the in-memory DB
			this.db = new SQL.Database(uint8Array);

			// 5) Run a sample query
			const result = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;");

			if (result?.[0]?.values?.[0]?.[0]) {
				new Notice(`Found table: ${result[0].values[0][0]}`);
			} else {
				new Notice("Connected, but found no tables.");
			}

			/* If you want to write changes back:
				this.db.run("CREATE TABLE test (col1 int);");
				const data = this.db.export(); // Uint8Array
				writeFileSync(dbFilePath, Buffer.from(data));
			*/
		} catch (err) {
			console.error(err);
			new Notice("Error reading DB: " + (err as Error).message);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MyWasmDBSettingTab extends PluginSettingTab {
	plugin: MyWasmDBPlugin;

	constructor(app: App, plugin: MyWasmDBPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "WASM DB Plugin Settings" });

		new Setting(containerEl)
			.setName("Database File Path")
			.setDesc("Absolute path to the .db file on disk.")
			.addText((text) =>
				text
					.setPlaceholder("C:\\path\\to\\your.db")
					.setValue(this.plugin.settings.dbFilePath)
					.onChange(async (value) => {
						this.plugin.settings.dbFilePath = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
