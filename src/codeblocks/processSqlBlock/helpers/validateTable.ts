import { SqlParams, ValidationError } from "../types";

export async function validateTable(db: any, params: SqlParams) {
    // Get table info
    const tableInfo = db.exec(`PRAGMA table_info("${params.table}")`);
    if (!tableInfo || tableInfo.length === 0) {
        return {
            message: `Table "${params.table}" does not exist.`
        };
    }

    const availableColumns = tableInfo[0].values.map((row: any) => row[1] as string);

    // Validate columns if specified
    if (params.columns) {
        const requestedColumns = params.columns.split(',').map(c => c.trim());
        for (const col of requestedColumns) {
            if (!availableColumns.includes(col)) {
                return {
                    message: `Column "${col}" does not exist in table "${params.table}".`,
                    availableColumns
                };
            }
        }
    }

    // Validate dateColumn if specified
    if (params.dateColumn && !availableColumns.includes(params.dateColumn)) {
        return {
            message: `Date column "${params.dateColumn}" does not exist in table "${params.table}".`,
            availableColumns
        };
    }

    // Validate filterColumn if specified
    if (params.filterColumn && !availableColumns.includes(params.filterColumn)) {
        return {
            message: `Filter column "${params.filterColumn}" does not exist in table "${params.table}".`,
            availableColumns
        };
    }

    // Validate orderBy if specified
    if (params.orderBy && !availableColumns.includes(params.orderBy)) {
        return {
            message: `Order by column "${params.orderBy}" does not exist in table "${params.table}".`,
            availableColumns
        };
    }

    return null;
}