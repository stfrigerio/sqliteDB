export interface SQLiteDBSettings {
	dbFilePath: string;
	mode: "local" | "remote";
	apiBaseUrl: string;
}

export const DEFAULT_SETTINGS: SQLiteDBSettings = {
	dbFilePath: "",
	mode: "local",
	apiBaseUrl: "",
};
