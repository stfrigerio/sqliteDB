import { ChartConfig, PieChartConfig } from "./parseChartParams";

function isPieConfig(config: ChartConfig): config is PieChartConfig {
    return config.chartType === "pie";
}

// Helper function to build the date part of the WHERE clause
function buildDateWhereClause(
    dateColumn: string | undefined,
    startDate: string | undefined,
    endDate: string | undefined
): { clause: string; params: string[] } | null {

    if (!dateColumn || !startDate || !endDate) {
        return null; // No date filtering needed
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

        return { clause, params };

    } catch (dateError) {
        console.error("Error processing date range for SQL query:", dateError);
        return null;
    }
}


export function buildSqlQuery(config: ChartConfig): { query: string; params: any[] } {
    let selectClause: string;
    const fromClause = `FROM "${config.table}"`;
    let whereClauses: string[] = [];
    let groupByClause: string = "";
    let orderByClause: string = "";
    let queryParams: any[] = []; // Use any[] for params as they can be strings, numbers etc.

    // --- 1. Build Date WHERE Clause (Common Logic) ---
    const dateFilter = buildDateWhereClause(config.dateColumn, config.startDate, config.endDate);
    if (dateFilter) {
        whereClauses.push(dateFilter.clause);
        queryParams.push(...dateFilter.params);
    }


    // --- 2. Build Chart-Type Specific Clauses ---
    switch (config.chartType) {
        case 'pie':
            // Assert config is PieChartConfig for type safety (optional but good)
            const pieConfig = config as PieChartConfig;

            // Handle special duration calculation
            const isTimeDuration =
                pieConfig.table.toLowerCase() === "time" &&
                pieConfig.valueColumn === "duration";

            const valueExpr = isTimeDuration
                // Ensure valueColumn is quoted if it might contain special chars
                ? `SUM(strftime('%s', '1970-01-01T' || "${pieConfig.valueColumn}") - strftime('%s', '1970-01-01T00:00:00'))`
                : `SUM("${pieConfig.valueColumn}")`; // Quote value column

            // Quote category column
            selectClause = `SELECT "${pieConfig.categoryColumn}", ${valueExpr} as value`;
            groupByClause = `GROUP BY "${pieConfig.categoryColumn}"`;
            orderByClause = `ORDER BY value DESC`;
            break;

        case 'line':
        case 'bar':
            // Quote columns
            const quotedYColumns = config.yColumns.map(col => `"${col}"`).join(', ');
            const quotedXColumn = `"${config.xColumn}"`;

            if (config.categoryColumn) {
				const quotedCategoryColumn = `"${config.categoryColumn}"`;
				selectClause = `SELECT ${quotedXColumn}, ${quotedCategoryColumn}, ${quotedYColumns}`;
				// Line/bar charts often don't need explicit GROUP BY if not aggregating in SQL
				// ORDER BY xColumn first, then category for consistent multi-series ordering
				orderByClause = `ORDER BY ${quotedXColumn}, ${quotedCategoryColumn}`;
            } else {
				selectClause = `SELECT ${quotedXColumn}, ${quotedYColumns}`;
				orderByClause = `ORDER BY ${quotedXColumn}`;
            }
            break;

        default:
			// Handle unknown chart type if necessary
			throw new Error(`Unsupported chart type`);
    }

    // --- 3. Assemble the Final Query ---
    let query = selectClause + "\n" + fromClause; // Add newline for readability

    if (whereClauses.length > 0) {
        query += "\nWHERE " + whereClauses.join(" AND ");
    }

    if (groupByClause) {
        query += "\n" + groupByClause;
    }

    if (orderByClause) {
        query += "\n" + orderByClause;
    }

    return { query, params: queryParams };
}