import { SqlParams } from "../types";

export function parseSqlParams(source: string): SqlParams | null {
    const lines = source.split("\n");
    const params: Partial<SqlParams> = {};

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split(":").map((p) => p.trim());
        if (parts.length >= 2) {
            const key = parts[0];
            const val = parts.slice(1).join(":").trim(); // re-join in case there's a colon

            switch (key) {
                case 'columns':
                    params.columns = val.split(',').map(c => c.trim()).join(', ');
                    break;
                case 'filterColumn':
                case 'filterValue':
                    params[key] = val.split(',').map(v => v.trim());
                    break;
                case 'limit':
                    const limitNum = parseInt(val);
                    if (!isNaN(limitNum)) params.limit = limitNum;
                    break;
                case 'orderDirection':
                    if (val.toLowerCase() === 'asc' || val.toLowerCase() === 'desc') {
                        params.orderDirection = val.toLowerCase() as 'asc' | 'desc';
                    }
                    break;
                case 'table':
                    params.table = val;
                    break;
                case 'dateColumn':
                    params.dateColumn = val;
                    break;
                case 'startDate':
                    params.startDate = val;
                    break;
                case 'endDate':
                    params.endDate = val;
                    break;
                case 'orderBy':
                    params.orderBy = val;
                    break;
                case 'displayFormat':
                    const format = val.toLowerCase();
                    if (format === 'list' || format === 'table') {
                        params.displayFormat = format;
                    } else {
                        console.warn(`Invalid displayFormat "${val}", defaulting to 'list'.`);
                        params.displayFormat = 'list'; // Default if invalid value
                    }
                    break;
            }
        }
    }

    // --- Validation for required 'table' ---
    if (!params.table) {
        // Indicate parsing failure specifically because 'table' is missing
        // The calling function will handle displaying the error message.
        return null;
    }

    // --- Set Default displayFormat if not provided ---
    if (!params.displayFormat) {
        params.displayFormat = 'list';
    }

    // Check consistency if multiple filters were provided
    if (Array.isArray(params.filterColumn) || Array.isArray(params.filterValue)) {
        if (!Array.isArray(params.filterColumn) || !Array.isArray(params.filterValue) || params.filterColumn.length !== params.filterValue.length) {
            console.error("Mismatch between number of filterColumn and filterValue entries. Filtering might be incorrect.");
             // Decide how to handle: throw error, ignore filters, return null?
             // Returning null might be safest if config is invalid
             return null; // Indicate parsing failure due to inconsistent filters
        }
    }


    return params as SqlParams;
}