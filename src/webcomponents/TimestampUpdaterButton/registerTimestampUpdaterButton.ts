import { App, MarkdownPostProcessorContext, Notice, Plugin, TFile } from 'obsidian';
import { updateTimestampInFile } from './timestampFileUpdater';
import { createTimestampButtonElement } from './createTimestampButtonElement';

/**
 * Registers the Markdown postprocessor to find <timestamp-updater-button>
 * tags and replace them with functional buttons.
 *
 * @param plugin The Obsidian Plugin instance.
 */
export function registerTimestampUpdaterButton(plugin: Plugin): void {

    plugin.registerMarkdownPostProcessor((element, context: MarkdownPostProcessorContext) => {
        const { app } = plugin;
        console.log(`Timestamp PostProcessor running for section in: ${context.sourcePath}`);

        const placeholderElements = element.querySelectorAll('.timestamp-updater-placeholder');

        if (placeholderElements.length === 0) {
            return;
        }

        placeholderElements.forEach((placeholderEl) => {
            const handleClick = async () => {
                const activeFile = app.workspace.getActiveFile();

                if (!activeFile || !(activeFile instanceof TFile)) {
                    new Notice('No active file selected.', 3000);
                    return;
                }

                const result = await updateTimestampInFile(app, activeFile);
                new Notice(result.message, result.success ? 2000 : 5000);
            };

            const buttonElement = createTimestampButtonElement(handleClick);
            try {
                placeholderEl.replaceWith(buttonElement);
            } catch (e) {
                console.error("Error during replaceWith:", e);
            }
        });
    });
}