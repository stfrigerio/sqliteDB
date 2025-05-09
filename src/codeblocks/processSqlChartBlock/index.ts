import { DBService } from "../../DBService";
import { parseChartParams, validateColumns, buildSqlQuery, processChartData } from "./helpers";
import { ChartType, createChart } from "./charts";
import { Notice } from "obsidian";

export async function processSqlChartBlock(dbService: DBService, source: string, el: HTMLElement) {
    await renderChartBlock();

    async function renderChartBlock() {
        const config = parseChartParams(source);

        if (!config) {
            // @ts-ignore
            const message = config?.chartType === 'pie' 
                ? "Required parameters for pie chart are: table, categoryColumn, valueColumn"
                : "Required parameters are: table, xColumn, yColumns";
            el.createEl("p", { text: message });
            return;
        }

        try {
            const validationError = await validateColumns(dbService, config);
            if (validationError) {
                el.createEl("p", { text: validationError.message });
                if (validationError.availableColumns) {
                    el.createEl("p", { text: `Available columns are: ${validationError.availableColumns.join(", ")}` });
                }
                return;
            }

            const { query, params } = buildSqlQuery(config);

            let rows: any[];
            let labels, datasets;

            if (dbService.mode === "remote") {
                // Use remote query
                rows = await dbService.getQuery(query, params);
                if (!rows || rows.length === 0) {
                    el.createEl("p", { text: "No data found for the specified parameters." });
                    return;
                }

                const columns = Object.keys(rows[0]);
                const values = rows.map(obj => columns.map(col => obj[col]));
                const execStyleResult = { columns, values };

                ({ labels, datasets } = processChartData(execStyleResult, config));
            } else {
                // Local mode: use exec
                const db = dbService.getDB();
                if (!db) {
                    new Notice("No DB loaded. Please open the DB first.");
                    el.createEl("p", { text: "Database not loaded." });
                    return;
                }
                const result = db.exec(query, params as any);
                if (!result || result.length === 0 || result[0].values.length === 0) {
                    el.createEl("p", { text: "No data found for the specified parameters." });
                    return;
                }

                const columns = result[0].columns;
                const values = result[0].values;
                rows = values.map(rowArr =>
                    Object.fromEntries(rowArr.map((val, idx) => [columns[idx], val]))
                );

                ({ labels, datasets } = processChartData(rows, config));
            }

            const chartData = createChart(
                config.chartType as ChartType,
                labels,
                datasets,
                config.chartOptions
            );

            const wrapper = el.createDiv({ cls: 'obsidian-sql-chart' });
            // @ts-ignore
            window.renderChart(chartData, wrapper);
        } catch (error) {
            el.createEl("p", { text: "An error occurred while processing the chart." });
            el.createEl("p", { text: String(error) });
            console.error(error);
        }
    }
}