import { SqlParams } from "../types";

/**
 * Builds the date part of a WHERE clause using >= startDate and < nextDay logic.
 * @param dateColumn The name of the date/timestamp column.
 * @param startDate The start date string ('YYYY-MM-DD').
 * @param endDate The end date string ('YYYY-MM-DD').
 * @returns An object { clause: string; params: string[] } or null if no date filtering needed or on error.
 */
export function buildDateWhereClause(
    dateColumn: string | undefined,
    startDate: string | undefined,
    endDate: string | undefined
): { clause: string; params: string[] } | null {

    // Only proceed if all three are provided
    if (!dateColumn || !startDate || !endDate) {
        return null;
    }

    try {
        // --- Calculate the day AFTER the end date ---
        const endDateObj = new Date(endDate + 'T00:00:00Z'); // Parse as UTC midnight
        if (isNaN(endDateObj.getTime())) {
            throw new Error(`Invalid end date format: ${endDate}`);
        }
        endDateObj.setUTCDate(endDateObj.getUTCDate() + 1); // Add 1 day UTC
        const nextDayString = endDateObj.toISOString().split('T')[0]; // Format 'YYYY-MM-DD'

        // --- Build the SQL WHERE Clause ---
        // Quote the column name for safety
        const clause = `"${dateColumn}" >= ? AND "${dateColumn}" < ?`;
        const params = [startDate, nextDayString]; // Use string dates

        // console.log(`buildDateWhereClause: Generated clause="${clause}", params=[${params.join(', ')}]`); // Optional debug log

        return { clause, params };

    } catch (dateError) {
        console.error("Error processing date range for SQL query:", dateError);
        // Returning null effectively skips date filtering on error.
        return null;
    }
}

export function buildSqlQuery(params: SqlParams): { query: string; queryParams: any[] } {
    const {
        table,
        columns,
        dateColumn,
        startDate,
        endDate,
        filterColumn,
        filterValue,
        orderBy,
        orderDirection,
        limit
    } = params;

    const selectCols = columns
        ? columns.split(",").map(c => `"${c.trim()}"`).join(", ") // Quote columns here
        : "*";

    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Handle multiple filters (already quotes columns)
    if (filterColumn && filterValue) {
        const filterColumns = Array.isArray(filterColumn) ? filterColumn : [filterColumn];
        const filterValues = Array.isArray(filterValue) ? filterValue : [filterValue];

        if (filterColumns.length !== filterValues.length) {
            throw new Error('Number of filter columns must match number of filter values');
        }

        filterColumns.forEach((col, index) => {
            // Ensure column name is quoted
            conditions.push(`"${col}" = ?`);
            queryParams.push(filterValues[index]);
        });
    }

    // Add the new logic:
    const dateFilter = buildDateWhereClause(dateColumn, startDate, endDate);
    if (dateFilter) {
        conditions.push(dateFilter.clause); // Add the generated clause (e.g., '"col" >= ? AND "col" < ?')
        queryParams.push(...dateFilter.params); // Add the parameters (e.g., ['2023-10-27', '2023-10-28'])
    }

    // Build the query
    // Quote table name for safety
    let query = `SELECT ${selectCols} FROM "${table}"`;

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Add ORDER BY if specified (already quotes column)
    if (orderBy) {
        // Ensure direction is safe (ASC or DESC)
        const direction = (orderDirection?.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
        query += ` ORDER BY "${orderBy}" ${direction}`;
    }

    // Add LIMIT if specified
    if (limit !== undefined && limit !== null) { // Check explicitly for presence
        query += ` LIMIT ?`;
        queryParams.push(limit);
    }

    // Optional: Remove trailing semicolon if your execution method doesn't require it
    // return { query, queryParams };
    return {
        query: query, // Removed trailing semicolon for broader compatibility
        queryParams
    };
}