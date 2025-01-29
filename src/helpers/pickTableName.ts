import { App, Notice } from "obsidian";
import { DBService } from "../dbService";
import { TablePickerModal } from "../components/TablePickerModal";

/**
 * Prompt the user to pick a table from sqlite_master.
 * Returns the chosen table name, or null if none.
 */
export async function pickTableName(dbService: DBService, app: App): Promise<string | null> {
    const db = dbService.getDB();
    if (!db) {
        new Notice("No DB loaded. Please open the DB first.");
        return null;
    }

    // 1) Get all tables
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
    if (!result || result.length === 0) {
        new Notice("No tables found in the DB.");
        return null;
    }

    // each row is [tableName]
    const tableNames = result[0].values.map((row) => row[0] as string);

    if (!tableNames.length) {
        new Notice("No tables found in the DB.");
        return null;
    }

    // 2) Show a fuzzy modal to let the user pick one
    return new Promise((resolve) => {
        const modal = new TablePickerModal(app, tableNames, (chosen) => {
            resolve(chosen);
        });
        modal.open();
    });
}
