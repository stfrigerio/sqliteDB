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
