import SQLiteDBPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class SQLiteDBSettingTab extends PluginSettingTab {
	plugin: SQLiteDBPlugin;

	constructor(app: App, plugin: SQLiteDBPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
	
		new Setting(containerEl)
			.setName("Database mode")
			.setDesc("Choose between local file or remote API")
			.addDropdown(drop => drop
				.addOptions({ local: "Local", remote: "Remote" })
				.setValue(this.plugin.settings.mode)
				.onChange(async (value) => {
					this.plugin.settings.mode = value as "local" | "remote";
					await this.plugin.saveSettings();
				}));
	
		new Setting(containerEl)
			.setName("Database file path (local mode)")
			.setDesc("Absolute path to your local SQLite .db file")
			.addText(text =>
				text
					.setPlaceholder("/home/user/file.db")
					.setValue(this.plugin.settings.dbFilePath)
					.onChange(async (value) => {
						this.plugin.settings.dbFilePath = value;
						await this.plugin.saveSettings();
					}));
	
		new Setting(containerEl)
			.setName("API base URL (remote mode)")
			.setDesc("Full base URL to your remote API (e.g., http://localhost:3000/api)")
			.addText(text =>
				text
					.setPlaceholder("http://localhost:3000/api")
					.setValue(this.plugin.settings.apiBaseUrl)
					.onChange(async (value) => {
						this.plugin.settings.apiBaseUrl = value;
						await this.plugin.saveSettings();
					}));

		new Setting(containerEl)
		.setName('Journal Folder Path')
		.setDesc('Path to the folder containing your journal notes (relative to vault root).')
		.addText(text => text
			.setPlaceholder('e.g., Journals or Notes/Daily')
			.setValue(this.plugin.settings.journalFolderPath)
			.onChange(async (value) => {
				this.plugin.settings.journalFolderPath = value;
				await this.plugin.saveSettings();
			}));
		
		new Setting(containerEl)
			.setName('Journal Table Name')
			.setDesc('The name of the database table for journal entries.')
			.addText(text => text
				.setPlaceholder('e.g., Journals')
				.setValue(this.plugin.settings.journalTableName)
				.onChange(async (value) => {
					this.plugin.settings.journalTableName = value;
					await this.plugin.saveSettings();
				}));
	}
}
