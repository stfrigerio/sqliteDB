import { DBService } from "../../../DBService";
import { SqlParams, ValidationError } from "../types";

export async function validateTable(dbService: DBService, params: SqlParams): Promise<ValidationError | null> {
    const tableName = params.table;
    let availableColumns: string[] = [];

    try {
        // Fetch column info based on DB mode
        if (dbService.mode === "remote") {
            const result = await dbService.getQuery<{ name: string }>(
                `PRAGMA table_info("${tableName}")`
            );
            if (!result || result.length === 0) {
                // Handle case where table might exist but PRAGMA returns empty (less likely)
                // Or if getQuery returns null/empty for other reasons
                return {
                    message: `Unable to fetch column info for table "${tableName}". It might not exist or there was an issue.`,
                    availableColumns: []
                };
            }
            availableColumns = result.map((row: { name: string }) => row.name);
        } else {
            // Local mode
            const db = dbService.getDB();
            if (!db) {
                // Should ideally not happen if processSqlBlock checks first, but good practice
                return { message: "Database not loaded." };
            }
            const tableInfo = db.exec(`PRAGMA table_info("${tableName}")`);
            // Check if table exists based on PRAGMA result
            if (!tableInfo || tableInfo.length === 0 || !tableInfo[0].values || tableInfo[0].values.length === 0) {
                return {
                    message: `Table "${tableName}" does not exist or is empty.`
                };
            }
            // Column name is typically the second item (index 1) in the PRAGMA result row
            availableColumns = tableInfo[0].values.map((row: any) => row[1] as string);
        }

    } catch (error) {
        console.error(`[validateTable] Failed to fetch columns for table "${tableName}"`, error);
        // Return a generic error if PRAGMA fails
        return {
            message: `Error fetching column info for table "${tableName}".`,
            availableColumns: []
        };
    }

    // Validate columns if specified
    if (params.columns) {
        const requestedColumns = params.columns.split(',').map(c => c.trim());
        const invalidColumns = requestedColumns.filter(col => !availableColumns.includes(col));
        if (invalidColumns.length > 0) {
            return {
                message: `The following columns do not exist in table "${tableName}": ${invalidColumns.join(", ")}.`,
                availableColumns
            };
        }
    }

    // Validate dateColumn if specified
    if (params.dateColumn && !availableColumns.includes(params.dateColumn)) {
        return {
            message: `Date column "${params.dateColumn}" does not exist in table "${tableName}".`,
            availableColumns
        };
    }

    // Validate filterColumn if specified
    if (params.filterColumn) {
        const filterColumns = Array.isArray(params.filterColumn)
            ? params.filterColumn
            : params.filterColumn.split(',').map(c => c.trim()); // Handle comma-separated string too

        const invalidFilterCols = filterColumns.filter(col => !availableColumns.includes(col));
        if (invalidFilterCols.length > 0) {
            return {
                message: `The following filter columns do not exist in table "${tableName}": ${invalidFilterCols.join(", ")}.`,
                availableColumns
            };
        }
    }

    // Validate orderBy if specified
    if (params.orderBy && !availableColumns.includes(params.orderBy)) {
        return {
            message: `Order by column "${params.orderBy}" does not exist in table "${tableName}".`,
            availableColumns
        };
    }

    // All checks passed
    return null;
}