import { ChartConfig } from "./parseChartParams";

export function buildSqlQuery(config: ChartConfig) {
    let query, params = [];
    
    if (config.groupBy) {
        query = `
            SELECT 
                ${config.xColumn},
                ${config.groupBy},
                ${config.yColumns.join(', ')}
            FROM "${config.table}"
        `;
    } else {
        query = `
            SELECT 
                ${config.xColumn},
                ${config.yColumns.join(', ')}
            FROM "${config.table}"
        `;
    }

    if (config.startDate && config.endDate) {
        query += ` WHERE ${config.xColumn} BETWEEN ? AND ?`;
        params.push(config.startDate, config.endDate);
    }

    query += ` ORDER BY ${config.xColumn}`;
    if (config.groupBy) {
        query += `, ${config.groupBy}`;
    }

    return { query, params };
}