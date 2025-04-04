import { Notice } from "obsidian";
import { DBService } from "../../dbService";
import { parseChartParams, validateColumns, buildSqlQuery, processChartData } from "./helpers";
import { ChartType, createChart } from "./charts";
import { pluginState } from "../../pluginState";

export async function processSqlChartBlock(dbService: DBService, source: string, el: HTMLElement) {
    const db = dbService.getDB();
    if (!db) {
        new Notice("No DB loaded. Please open the DB first.");
        el.createEl("p", { text: "Database not loaded." });
        return;
    }

    // replace @date with the selected date
    const injectedSource = source.replace(/@date/g, pluginState.selectedDate);
    const config = parseChartParams(injectedSource);

    if (!config) {
        // @ts-ignore
        const message = config?.chartType === 'pie' 
            ? "Required parameters for pie chart are: table, categoryColumn, valueColumn"
            : "Required parameters are: table, xColumn, yColumns";
        el.createEl("p", { text: message });
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