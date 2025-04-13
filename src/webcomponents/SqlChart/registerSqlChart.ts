import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { DBService } from '../../DBService'; // Adjust path as needed
import { processSqlChartBlock } from '../../codeblocks/processSqlChartBlock'; // Adjust path as needed
import { replacePlaceholders } from 'src/helpers/replacePlaceholders';

// This function sets up the post-processor
export function registerSqlChartRenderer(plugin: Plugin, dbService: DBService) {

    plugin.registerMarkdownPostProcessor(
        async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

            // Find all divs with the class 'sql-chart-render' inside the rendered element 'el'
            const chartContainers = el.querySelectorAll<HTMLElement>('div.sql-chart-render');

            if (chartContainers.length === 0) {
                return; // No charts found in this section
            }

            // Use Promise.all to process charts potentially in parallel (optional)
            // Or a simple loop if preferred: for (const container of chartContainers) { ... }
            await Promise.all(Array.from(chartContainers).map(async (container) => {
                // Check if already processed (important if post-processor runs multiple times)
                if (container.dataset.sqlChartProcessed) {
                    return;
                }
                // Mark as processed
                container.dataset.sqlChartProcessed = 'true';

                const source = container.innerHTML.trim();
                const parsedSource = replacePlaceholders(source);

                // Clear the original config text before rendering
                container.innerHTML = ''; // Clear the container

                if (!source) {
                    container.createEl("p", { text: "Error: SQL Chart configuration block is empty." });
                    console.warn("Empty sql-chart-render block found", container);
                    return;
                }

                // Add a loading indicator (optional)
                const loadingEl = container.createEl("p", { text: "Loading chart..." });

                try {
                    // Call your existing core logic directly on the container
                    await processSqlChartBlock(dbService, parsedSource, container);
                    // Remove loading indicator if processSqlChartBlock doesn't clear the container itself
                    loadingEl.remove();
                } catch (error: any) {
                    console.error("Error rendering SQL Chart from div:", error);
                    // Clear potential loading message or partial render
                    container.innerHTML = '';
                    container.createEl("p", { text: "Error rendering SQL Chart:" });
                    // Display the error message safely
                    container.createEl("pre", { text: String(error.message || error) });
                }
            }));
        }
    );

    console.log("SQL Chart Renderer registered.");
}