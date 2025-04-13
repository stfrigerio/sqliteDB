export interface SQLiteDBSettings {
	dbFilePath: string;
	mode: "local" | "remote";
	apiBaseUrl: string;
	journalFolderPath: string;
	journalTableName: string;
}

export const DEFAULT_SETTINGS: SQLiteDBSettings = {
	dbFilePath: "",
	mode: "local",
	apiBaseUrl: "",
	journalFolderPath: "",
	journalTableName: "",
};
