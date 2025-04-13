import { Notice } from "obsidian";
import { DBService } from "../../DBService";
import { parseSqlParams, validateTable, buildSqlQuery, renderResults } from "./helpers";
import { renderResultsAsTable } from "./helpers/renderResultsAsTable";

export async function processSqlBlock(dbService: DBService, source: string, el: HTMLElement) {
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
        const validationError = await validateTable(dbService, params);
        if (validationError) {
            el.createEl("p", { text: validationError.message });
            if (validationError.availableColumns) {
                el.createEl("p", { text: `Available columns are: ${validationError.availableColumns.join(", ")}` });
            }
            return;
        }

        const { query, queryParams } = buildSqlQuery(params);

        let resultsToRender: { columns: string[], values: any[][] } | null = null;

        // Handle remote vs local DB
        if (dbService.mode === "remote") {
            const rows = await dbService.getQuery(query, queryParams);
            if (!rows || rows.length === 0) {
                // Keep existing no-rows message logic
            } else {
                // Convert remote result (array of objects) to the format renderResults expects
                const columns = Object.keys(rows[0]);
                const values = rows.map(obj => columns.map(col => obj[col]));
                resultsToRender = { columns, values };
            }
        } else {
            // Local mode logic
            const db = dbService.getDB();
            if (!db) {
                new Notice("No DB loaded. Please open the DB first.");
                el.createEl("p", { text: "Database not loaded." });
                return; // Exit renderSqlBlock early
            }
            const result = db.exec(query, queryParams);
            if (!result || result.length === 0 || result[0].values.length === 0) {
                    // Keep existing no-rows message logic
            } else {
                resultsToRender = result[0];
            }
        }

        //? Check if we have results to render
        if (!resultsToRender) {
            el.createEl("p", { text: `No rows found matching the criteria.` });
            // Optionally display the specific criteria used from 'params' object
            let criteriaMsg = `Table: "${params.table}"`;
            if(params.startDate || params.endDate) criteriaMsg += ` | Dates: ${params.startDate} to ${params.endDate}`;
            if(params.filterColumn) criteriaMsg += ` | Filter: ${params.filterColumn}=${params.filterValue}`;
            el.createEl("p", { text: `Criteria: ${criteriaMsg}`, cls: 'sql-block-criteria-summary'}); // Add a class for styling
            return;
        }

        // --- Choose Renderer based on displayFormat ---
        el.empty(); // Clear loading message or previous content
        if (params.displayFormat === 'table') {
            console.log("Rendering SQL block as table");
            renderResultsAsTable(resultsToRender, el);
        } else { // Default to 'list'
            console.log("Rendering SQL block as list");
            renderResults(resultsToRender, el); // Assuming renderResults is the list renderer
        }
        
    } catch (error) {
        el.empty(); // Clear before showing error
        el.createEl("p", { text: "An error occurred processing the SQL block." });
        el.createEl("p", { text: String(error) });
        console.error("SQL Block Error:", error);
        // Optionally show query info on error
        try {
            const { query, queryParams } = buildSqlQuery(params); // Try building query again for error display
            el.createEl("pre", { text: `Query: ${query}\nParams: ${JSON.stringify(queryParams)}` });
        } catch (buildError) { /* Ignore if query build fails */ }
    }
}