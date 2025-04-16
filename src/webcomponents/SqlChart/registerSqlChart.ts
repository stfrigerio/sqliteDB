import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { DBService } from '../../DBService';
import { processSqlChartBlock } from '../../codeblocks/processSqlChartBlock';
import { replacePlaceholders } from 'src/helpers/replacePlaceholders';

export function registerSqlChartRenderer(plugin: Plugin, dbService: DBService) {

    plugin.registerMarkdownPostProcessor(
        async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

            // Find all divs with the class 'sql-chart-render' inside the rendered element 'el'
            const chartContainers = el.querySelectorAll<HTMLElement>('div.sql-chart-render');

            if (chartContainers.length === 0) {
                return;
            }

            await Promise.all(Array.from(chartContainers).map(async (container) => {
                if (container.dataset.sqlChartProcessed) {
                    return;
                }
                // Mark as processed
                container.dataset.sqlChartProcessed = 'true';

                const source = container.innerHTML.trim();
                const parsedSource = replacePlaceholders(source);
                container.innerHTML = ''; // Clear the container

                if (!source) {
                    container.createEl("p", { text: "Error: SQL Chart configuration block is empty." });
                    console.warn("Empty sql-chart-render block found", container);
                    return;
                }

                const loadingEl = container.createEl("p", { text: "Loading chart..." });

                try {
                    await processSqlChartBlock(dbService, parsedSource, container);
                    loadingEl.remove();
                } catch (error: any) {
                    console.error("Error rendering SQL Chart from div:", error);
                    container.innerHTML = '';
                    container.createEl("p", { text: "Error rendering SQL Chart:" });
                    container.createEl("pre", { text: String(error.message || error) });
                }
            }));
        }
    );
}