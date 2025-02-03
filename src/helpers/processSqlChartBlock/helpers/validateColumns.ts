import { ChartConfig } from "./parseChartParams";

export async function validateColumns(db: any, config: ChartConfig) {
    const tableInfo = db.exec(`PRAGMA table_info("${config.table}");`);
    const availableColumns = tableInfo[0].values.map((row: any[]) => row[1]);

    let requestedColumns = [];
    
    if (config.chartType === 'pie') {
        requestedColumns = [config.categoryColumn, config.valueColumn];
    } else {
        requestedColumns = [config.xColumn, ...config.yColumns];
        if (config.categoryColumn) {
            requestedColumns.push(config.categoryColumn);
        }
    }
    
    const invalidColumns = requestedColumns.filter(col => !availableColumns.includes(col));
    if (invalidColumns.length > 0) {
        return {
            message: `The following columns do not exist: ${invalidColumns.join(", ")}`,
            availableColumns
        };
    }

    return null;
}