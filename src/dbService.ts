import { Notice, FileSystemAdapter } from "obsidian";
import initSqlJs, { Database } from "sql.js";
import { readFileSync } from "fs";
import { SqliteDBSettings } from "./types";

/**
 * This class manages loading/reloading the SQLite DB using sql.js
 */
export class DBService {
	private db: Database | null = null;

	/**
	 * Ensure the DB is loaded. If it's not loaded yet, load it from disk.
	 * If it is already loaded, do nothing.
	 *
	 * If `forceReload` is true, always reload from disk.
	 */
	async ensureDBLoaded(settings: SqliteDBSettings, basePath: string, forceReload = false) {
		if (!settings.dbFilePath) {
			new Notice("No DB path set in plugin settings.");
			return;
		}
		if (!this.db || forceReload) {
			try {
				const SQL = await initSqlJs({
					locateFile: (file) => `${basePath}/.obsidian/plugins/sqliteDB/${file}`,
				});
				const fileBuffer = readFileSync(settings.dbFilePath);
				const uint8Array = new Uint8Array(fileBuffer);
				this.db = new SQL.Database(uint8Array);

				// Check if we have at least one table
				const result = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;");
				if (result?.[0]?.values?.[0]?.[0]) {
					new Notice(`DB Loaded.`);
				} else {
					new Notice("DB Loaded, but found no tables.");
				}
			} catch (err) {
				console.error(err);
				new Notice("Error reading DB: " + (err as Error).message);
			}
		}
	}

	/**
	 * Returns the current Database instance, or null if not loaded.
	 */
	getDB(): Database | null {
		return this.db;
	}
}
