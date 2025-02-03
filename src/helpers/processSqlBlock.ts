import { Notice } from "obsidian";
import { DBService } from "../dbService";

/**
 * Processes a code block of the form:
 * 
 * ```sqlite
 * table: MyTable
 * keyColumn: id
 * value: 5
 * columns: col1, col2, col3
 * ```
 * 
 * - If `columns` is specified, we only select those columns.
 * - Otherwise, we select all columns (*).
 * - If multiple rows match, we create one table per row.
 */
export async function processSqlBlock(dbService: DBService, source: string, el: HTMLElement) {
    const db = dbService.getDB();
    if (!db) {
        new Notice("No DB loaded. Please open the DB first.");
        el.createEl("p", { text: "Database not loaded." });
        return;
    }

    // Parse code block params
    const params = parseSqlParams(source);
    const { table, keyColumn, value, columns } = params;

    if (!table || !keyColumn || !value) {
        el.createEl("p", { text: "Missing required parameters (table, keyColumn, value)." });
        return;
    }

    // Verify table exists
    try {
        const tableCheck = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name=?;`, [table]);
        if (!tableCheck || tableCheck.length === 0 || tableCheck[0].values.length === 0) {
            el.createEl("p", { text: `Table "${table}" does not exist in the database.` });
            return;
        }

        // Get available columns for the table
        const tableInfo = db.exec(`PRAGMA table_info("${table}");`);
        const availableColumns = tableInfo[0].values.map((row: any[]) => row[1]);

        // Verify keyColumn exists
        if (!availableColumns.includes(keyColumn)) {
            el.createEl("p", { text: `Column "${keyColumn}" does not exist in table "${table}". Available columns are: ${availableColumns.join(", ")}` });
            return;
        }

        // Build query based on columns
        // If columns was provided, we split on commas, else use "*".
        let selectCols = "*";
        if (columns) {
            const requestedColumns = columns.split(",").map(c => c.trim());
            const invalidColumns = requestedColumns.filter(col => !availableColumns.includes(col));
            
            if (invalidColumns.length > 0) {
                el.createEl("p", { text: `The following columns do not exist in table "${table}": ${invalidColumns.join(", ")}` });
                el.createEl("p", { text: `Available columns are: ${availableColumns.join(", ")}` });
                return;
            }
            selectCols = requestedColumns.join(", ");
        }

        const query = `SELECT ${selectCols} FROM "${table}" WHERE "${keyColumn}" = ?;`;
        const result = db.exec(query, [value]);

        if (!result || result.length === 0 || result[0].values.length === 0) {
            el.createEl("p", {
                text: `No rows found in table "${table}" where ${keyColumn} = ${value}`,
            });
            el.createEl("p", {
                text: "Try checking the value or using a different key column.",
            });
            return;
        }

        // result[0] => { columns: string[], values: any[][] }
        const rowObj = result[0];
        const columnsReturned = rowObj.columns; 
        const rows = rowObj.values;           

        // For each row, create a separate table
        rows.forEach((rowValues, rowIndex) => {
            // Optional heading
            el.createEl("h4", { text: `Row #${rowIndex + 1}` });

            // Build the table for this row
            const tableEl = el.createEl("table");
            columnsReturned.forEach((colName, colIndex) => {
                const tr = tableEl.createEl("tr");
                tr.createEl("th", { text: colName });
                tr.createEl("td", { text: String(rowValues[colIndex] ?? "") });
            });

            el.createEl("hr");
        });
    } catch (error) {
        el.createEl("p", { text: "An error occurred while processing the SQL block." });
        el.createEl("p", { text: String(error) });
    }
}

/** 
 * Parses the code block parameters line by line for:
 *   table: <string>
 *   keyColumn: <string>
 *   value: <string>
 *   columns: <string> (e.g. "col1, col2, col3")
 */
function parseSqlParams(source: string): {
    table?: string;
    keyColumn?: string;
    value?: string;
    columns?: string;
} {
    const lines = source.split("\n");
    const params: any = {};

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(":").map((p) => p.trim());
        if (parts.length >= 2) {
            const key = parts[0];
            const val = parts.slice(1).join(":"); // re-join in case there's a colon
            if (["table", "keyColumn", "value", "columns"].includes(key)) {
                params[key] = val;
            }
        }
    }
    return params;
}
