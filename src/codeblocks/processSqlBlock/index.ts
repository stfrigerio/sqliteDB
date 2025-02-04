import { Notice } from "obsidian";
import { DBService } from "../../dbService";
import { parseSqlParams, validateTable, buildSqlQuery, renderResults } from "./helpers";

export async function processSqlBlock(dbService: DBService, source: string, el: HTMLElement) {
    const db = dbService.getDB();
    if (!db) {
        new Notice("No DB loaded. Please open the DB first.");
        el.createEl("p", { text: "Database not loaded." });
        return;
    }

    const params = parseSqlParams(source);
    if (!params) {
        el.createEl("p", { text: "Missing required parameter: table" });
        el.createEl("p", { text: "Example usage:" });
        el.createEl("pre", { 
            text: `table: tasks
    columns: title, status
    filterColumn: status, priority
    filterValue: active, high
    dateColumn: dueDate
    startDate: 2024-01-01
    endDate: 2024-12-31
    limit: 10
    orderBy: dueDate
    orderDirection: asc`
        });
        return;
    }

    try {
        const validationError = await validateTable(db, params);
        if (validationError) {
            el.createEl("p", { text: validationError.message });
            if (validationError.availableColumns) {
                el.createEl("p", { text: `Available columns are: ${validationError.availableColumns.join(", ")}` });
            }
            return;
        }

        const { query, queryParams } = buildSqlQuery(params);
        const result = db.exec(query, queryParams);

        if (!result || result.length === 0 || result[0].values.length === 0) {
            el.createEl("p", {
                text: `No rows found in table "${params.table}"`,
            });
            
            // Show the applied filters to help debug
            if (params.keyColumn && params.value) {
                el.createEl("p", { text: `Filter: ${params.keyColumn} = ${params.value}` });
            }
            if (params.dateColumn && (params.startDate || params.endDate)) {
                el.createEl("p", { 
                    text: `Date range: ${params.dateColumn} from ${params.startDate || 'start'} to ${params.endDate || 'end'}` 
                });
            }
            if (params.filterColumn && params.filterValue) {
                el.createEl("p", { text: `Additional filter: ${params.filterColumn} = ${params.filterValue}` });
            }
            
            el.createEl("p", {
                text: "Try adjusting your filters or date range.",
            });
            return;
        }

        renderResults(result[0], el);

    } catch (error) {
        el.createEl("p", { text: "An error occurred while processing the SQL block." });
        el.createEl("p", { text: String(error) });
        // Optionally show the query that caused the error in development
        if (process.env.NODE_ENV === 'development') {
            const { query, queryParams } = buildSqlQuery(params);
            el.createEl("pre", { text: `Query: ${query}\nParams: ${JSON.stringify(queryParams)}` });
        }
    }
}