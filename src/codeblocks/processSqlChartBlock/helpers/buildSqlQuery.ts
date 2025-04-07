import { ChartConfig, PieChartConfig } from "./parseChartParams";

function isPieConfig(config: ChartConfig): config is PieChartConfig {
	return config.chartType === "pie";
}

export function buildSqlQuery(config: ChartConfig) {
	let query, params = [];

	// Check for special case: Time table and duration field
	const isTimeDuration =
		config.table.toLowerCase() === "time" &&
		config.chartType === "pie" &&
		config.valueColumn === "duration";

        const valueExpr = isTimeDuration
            ? `SUM(strftime('%s', '1970-01-01T' || ${config.valueColumn}) - strftime('%s', '1970-01-01T00:00:00'))`
            : isPieConfig(config)
            ? `SUM(${config.valueColumn})`
            : "";

	switch (config.chartType) {
		case 'pie':
			query = `
                SELECT 
                    ${config.categoryColumn},
                    ${valueExpr} as value
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
