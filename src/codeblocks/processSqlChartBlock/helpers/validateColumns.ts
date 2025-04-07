import { ChartConfig } from "./parseChartParams";
import { DBService } from "../../../DBService";

export async function validateColumns(dbService: DBService, config: ChartConfig) {
	const tableName = config.table;
	
	let columns: string[] = [];

	try {
		const result = await dbService.getQuery<{ name: string }>(
			`PRAGMA table_info("${tableName}")`
		);

		columns = result.map((row: { name: string }) => row.name);
	} catch (error) {
		console.error(`[validateColumns] Failed to fetch columns for table "${tableName}"`, error);
		return {
			message: `Unable to fetch column info for table "${tableName}".`,
			availableColumns: []
		};
	}

	let requestedColumns: string[] = [];

	if (config.chartType === "pie") {
		requestedColumns = [config.categoryColumn, config.valueColumn];
		if (config.dateColumn && (config.startDate || config.endDate)) {
			requestedColumns.push(config.dateColumn);
		}
	} else {
		requestedColumns = [config.xColumn, ...config.yColumns];
		if (config.categoryColumn) {
			requestedColumns.push(config.categoryColumn);
		}
		if (config.dateColumn && (config.startDate || config.endDate)) {
			requestedColumns.push(config.dateColumn);
		}
	}

	const invalidColumns = requestedColumns.filter(col => !columns.includes(col));

	if (invalidColumns.length > 0) {
		return {
			message: `The following columns do not exist: ${invalidColumns.join(", ")}`,
			availableColumns: columns
		};
	}

	return null;
}
