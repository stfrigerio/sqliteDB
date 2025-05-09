import { MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { DBService } from '../../DBService';
import { processSqlBlock } from '../../codeblocks/processSqlBlock';
import { replacePlaceholders } from 'src/helpers/replacePlaceholders';

export function registerSqlRenderer(plugin: Plugin, dbService: DBService) {

    plugin.registerMarkdownPostProcessor(
        async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

            // Find all divs with the class 'sql-render' inside the rendered element 'el'
            const chartContainers = el.querySelectorAll<HTMLElement>('div.sql-render');

            if (chartContainers.length === 0) {
                return;
            }

            await Promise.all(Array.from(chartContainers).map(async (container) => {
                if (container.dataset.sqlProcessed) {
                    return;
                }
                // Mark as processed
                container.dataset.sqlProcessed = 'true';

                const source = container.innerHTML.trim();
                const parsedSource = replacePlaceholders(source);
                container.innerHTML = ''; // Clear the container

                if (!source) {
                    container.createEl("p", { text: "Error: SQL Chart configuration block is empty." });
                    console.warn("Empty sql-render block found", container);
                    return;
                }

                const loadingEl = container.createEl("p", { text: "Loading SQL..." });

                try {
                    await processSqlBlock(dbService, parsedSource, container);
                    loadingEl.remove();
                } catch (error: any) {
                    console.error("Error rendering SQL from div:", error);
                    container.innerHTML = '';
                    container.createEl("p", { text: "Error rendering SQL:" });
                    container.createEl("pre", { text: String(error.message || error) });
                }
            }));
        }
    );
}