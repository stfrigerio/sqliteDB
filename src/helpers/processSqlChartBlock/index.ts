import { Notice } from "obsidian";
import { DBService } from "../../dbService";
import { parseChartParams, validateColumns, buildSqlQuery, processChartData } from "./helpers";
import { ChartType, createChart } from "./charts";

export async function processSqlChartBlock(dbService: DBService, source: string, el: HTMLElement) {
    const db = dbService.getDB();
    if (!db) {
        new Notice("No DB loaded. Please open the DB first.");
        el.createEl("p", { text: "Database not loaded." });
        return;
    }

    const config = parseChartParams(source);
    if (!config) {
        el.createEl("p", { text: "Required parameters are: table, xColumn, yColumns" });
        return;
    }

    try {
        const validationError = await validateColumns(db, config);
        if (validationError) {
            el.createEl("p", { text: validationError.message });
            if (validationError.availableColumns) {
                el.createEl("p", { text: `Available columns are: ${validationError.availableColumns.join(", ")}` });
            }
            return;
        }

        const { query, params } = buildSqlQuery(config);
        const result = db.exec(query, params);

        if (!result || result.length === 0 || result[0].values.length === 0) {
            el.createEl("p", { text: "No data found for the specified parameters." });
            return;
        }

        const { labels, datasets } = processChartData(result[0], config);

        const chartData = createChart(
            config.chartType as ChartType,
            labels,
            datasets,
            config.chartOptions
        );
        
        // @ts-ignore
        window.renderChart(chartData, el);

    } catch (error) {
        el.createEl("p", { text: "An error occurred while processing the chart." });
        el.createEl("p", { text: String(error) });
        console.error(error);
    }
}