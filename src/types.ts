export interface SQLiteDBSettings {
	dbFilePath: string;
	mode: "local" | "remote";
	apiBaseUrl: string;
	journalFolderPath: string;
	journalTableName: string;
	cfAccessClientId: string;
	cfAccessClientSecret: string;
}

export const DEFAULT_SETTINGS: SQLiteDBSettings = {
	dbFilePath: "",
	mode: "local",
	apiBaseUrl: "",
	journalFolderPath: "",
	journalTableName: "",
	cfAccessClientId: "",
	cfAccessClientSecret: "",
};
