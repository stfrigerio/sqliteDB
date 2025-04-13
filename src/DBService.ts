import { Notice, App } from "obsidian";
import initSqlJs, { Database, SqlJsStatic, Statement } from "sql.js";
import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { SQLiteDBSettings } from "./types";

export class DBService {
    public mode: "local" | "remote" = "local";
    private db: Database | null = null;
    private SQL: SqlJsStatic | null = null; // We still need to store the initialized library instance
    private app: App;
    private settings: SQLiteDBSettings | null = null; // Store settings for saving path
    private basePath: string = "";
	private apiBaseUrl: string = "";

    constructor(app: App) {
        this.app = app;
    }

    /**
     * Ensure the DB is loaded. If it's not loaded yet, load it from disk.
     * If it is already loaded, do nothing.
     *
     * If `forceReload` is true, always reload from disk.
     */
    async ensureDBLoaded(settings: SQLiteDBSettings, basePath: string, forceReload = false): Promise<boolean> { // Added return type promise
        this.settings = settings;
        this.basePath = basePath;
		this.mode = settings.mode ?? "local";

        if (this.mode === "remote") {
			if (!settings.apiBaseUrl) {
				new Notice("Remote mode selected, but no API base URL configured.");
				return false;
			}
			this.apiBaseUrl = settings.apiBaseUrl;
			return true;
		}

		if (!settings.dbFilePath) {
			new Notice("No local DB path set in plugin settings.");
			return false;
		}

        // Only reload if forced or not already loaded
        if (!this.db || forceReload) {
            try {
                this.SQL = await initSqlJs({
                    locateFile: (file) => `${basePath}/${this.app.vault.configDir}/plugins/sqlite-db/${file}`,
                });

                const fileBuffer = readFileSync(settings.dbFilePath);
                this.db = new this.SQL.Database(fileBuffer);

                // Check if we have at least one table
                const result = this.db.exec("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1;");
                if (result?.[0]?.values?.[0]?.[0]) {
                    new Notice(`DB Loaded.`);
                } else {
                    new Notice("DB Loaded, but found no tables.");
                }
                return true; // Indicate success
            } catch (err) {
                this.db = null; // Ensure db is null on error
                this.SQL = null;
                console.error("DBService: Error initializing/reading DB:", err);
                new Notice("Error reading DB: " + (err as Error).message);
                return false; // Indicate failure
            }
        } else {
            return true; // Already loaded
        }
    }

    /**
     * Returns the current Database instance, or null if not loaded.
     */
    getDB(): Database | null {
        return this.db;
    }

    /**
     * Executes a query that is expected to return rows (e.g., SELECT).
     * Uses prepared statements for security.
     * @param sql SQL query string with placeholders (?)
     * @param params Array of parameters to bind to placeholders
     * @returns Promise resolving to an array of result objects
     */
	async getQuery<T extends Record<string, any>>(sql: string, params: any[] = []): Promise<T[]> {
		if (this.mode === "remote") {
			const res = await fetch(`${this.apiBaseUrl}/query`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sql, params }),
			});
			if (!res.ok) throw new Error(await res.text());
			return await res.json();
		}

		if (!this.db) throw new Error("Database not loaded (local mode).");

		let stmt: Statement | null = null;
		try {
			stmt = this.db.prepare(sql);
			stmt.bind(params);
			const results: T[] = [];
			while (stmt.step()) {
				results.push(stmt.getAsObject() as T);
			}
			return results;
		} finally {
			if (stmt) stmt.free();
		}
	}

    /**
     * Executes a query that does not return rows (e.g., INSERT, UPDATE, DELETE).
     * Uses prepared statements for security.
     * Saves the database to disk after successful execution.
     * @param sql SQL query string with placeholders (?)
     * @param params Array of parameters to bind to placeholders
     * @returns Promise resolving when execution and save are complete
     */
	async runQuery(sql: string, params: any[] = []): Promise<void> {
		if (this.mode === "remote") {
			const res = await fetch(`${this.apiBaseUrl}/execute`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sql, params }),
			});
			if (!res.ok) throw new Error(await res.text());
			return;
		}

		if (!this.db) throw new Error("Database not loaded (local mode).");

		let stmt: Statement | null = null;
		try {
			stmt = this.db.prepare(sql);
			stmt.bind(params);
			stmt.run();
			await this._saveDBInternal();
		} finally {
			if (stmt) stmt.free();
		}
	}

    /**
     * Internal method to save the current in-memory database back to the file.
     */
    private async _saveDBInternal(): Promise<void> {
        if (!this.db) {
            console.error("DBService._saveDBInternal: Cannot save, database not loaded.");
            return; // Don't throw, just log and return if DB isn't loaded
        }
        if (!this.settings || !this.settings.dbFilePath) {
            console.error("DBService._saveDBInternal: Cannot save, settings or DB path missing.");
            new Notice("Cannot save DB: Path missing.");
            return;
        }

        try {
            const data = this.db.export();
            await writeFile(this.settings.dbFilePath, data);
        } catch (error) {
            console.error(`DBService._saveDBInternal: Error saving database to ${this.settings.dbFilePath}:`, error);
            new Notice("Error saving database changes!");
			throw error;
        }
    }

    public generateUuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Explicitly closes the database connection. Important for unloading.
     */
    closeDB() {
        if (this.db) {
            try {
                console.log("DBService: Closing database connection.");
                this.db.close();
            } catch(closeError) {
				console.error("DBService: Error closing database:", closeError);
            } finally {
                this.db = null;
                this.SQL = null;
                this.settings = null;
                this.basePath = "";
            }
        } else {
			this.SQL = null;
        }
    }
}