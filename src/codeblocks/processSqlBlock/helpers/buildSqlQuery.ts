import { SqlParams } from "../types";

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
        ? columns.split(",").map(c => c.trim()).join(", ")
        : "*";

    const queryParams: any[] = [];
    const conditions: string[] = [];

    // Handle multiple filters
    if (filterColumn && filterValue) {
        const filterColumns = Array.isArray(filterColumn) ? filterColumn : [filterColumn];
        const filterValues = Array.isArray(filterValue) ? filterValue : [filterValue];

        if (filterColumns.length !== filterValues.length) {
            throw new Error('Number of filter columns must match number of filter values');
        }

        filterColumns.forEach((col, index) => {
            conditions.push(`"${col}" = ?`);
            queryParams.push(filterValues[index]);
        });
    }

    // Add date range conditions if provided
    if (dateColumn) {
        if (startDate) {
            conditions.push(`"${dateColumn}" >= ?`);
            queryParams.push(startDate);
        }
        if (endDate) {
            conditions.push(`"${dateColumn}" <= ?`);
            queryParams.push(endDate);
        }
    }
    
    // Build the query
    let query = `SELECT ${selectCols} FROM "${table}"`;
    
    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Add ORDER BY if specified
    if (orderBy) {
        query += ` ORDER BY "${orderBy}" ${orderDirection || 'ASC'}`;
    }

    // Add LIMIT if specified
    if (limit) {
        query += ` LIMIT ?`;
        queryParams.push(limit);
    }

    return {
        query: query + ";",
        queryParams
    };
}