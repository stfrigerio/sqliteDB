import { ChartConfig } from "./parseChartParams";

export function buildSqlQuery(config: ChartConfig) {
    let query, params = [];
    
    switch (config.chartType) {
        case 'pie':
            query = `
                SELECT 
                    ${config.categoryColumn},
                    SUM(${config.valueColumn}) as value
                FROM "${config.table}"
            `;
            
            if (config.startDate && config.endDate) {
                query += ` WHERE ${config.dateColumn} BETWEEN ? AND ?`;
                params.push(config.startDate, config.endDate);
            }
            
            query += ` GROUP BY ${config.categoryColumn}`;
            query += ` ORDER BY value DESC`;
            break;

        case 'line':
        case 'bar':
            if (config.categoryColumn) {
                query = `
                    SELECT 
                        ${config.xColumn},
                        ${config.categoryColumn},
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
                query += ` WHERE ${config.dateColumn} BETWEEN ? AND ?`;
                params.push(config.startDate, config.endDate);
            }

            query += ` ORDER BY ${config.xColumn}`;
            if (config.categoryColumn) {
                query += `, ${config.categoryColumn}`;
            }
            break;
    }

    return { query, params };
}