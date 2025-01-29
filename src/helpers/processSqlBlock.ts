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

    // 1) Parse code block params
    const params = parseSqlParams(source);
    const { table, keyColumn, value, columns } = params;

    if (!table || !keyColumn || !value) {
        el.createEl("p", { text: "Missing required parameters (table, keyColumn, value)." });
        return;
    }

    // 2) Build query based on columns
    // If columns was provided, we split on commas, else use "*".
    let selectCols = "*";
    if (columns) {
        // e.g. "col1, col2" => "col1, col2"
        const colList = columns.split(",").map((c) => c.trim()).join(", ");
        selectCols = colList;
    }

    const query = `SELECT ${selectCols} FROM "${table}" WHERE "${keyColumn}" = ?;`;
    const result = db.exec(query, [value]);

    if (!result || result.length === 0 || result[0].values.length === 0) {
        el.createEl("p", {
            text: `No rows found in ${table} where ${keyColumn} = ${value}`,
        });
        return;
    }

    // result[0] => { columns: string[], values: any[][] }
    const rowObj = result[0];
    const columnsReturned = rowObj.columns; 
    const rows = rowObj.values;           

    // 3) For each row, create a separate table
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
