import { SqlParams } from "../types";

export function buildSqlQuery(params: SqlParams): { query: string; queryParams: any[] } {
    const { 
        table, 
        columns,
        keyColumn,
        value,
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

    // Add key-value condition if provided
    if (keyColumn && value !== undefined) {
        conditions.push(`"${keyColumn}" = ?`);
        queryParams.push(value);
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

    // Add filter condition if provided
    if (filterColumn && filterValue !== undefined) {
        conditions.push(`"${filterColumn}" = ?`);
        queryParams.push(filterValue);
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