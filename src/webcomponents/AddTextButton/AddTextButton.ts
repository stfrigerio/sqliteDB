import { Plugin, Notice, App, ButtonComponent, MarkdownPostProcessorContext } from 'obsidian';
import { DBService } from '../../DBService'; // Adjust path
import { AddTextEntryModal } from '../../components/AddTextEntryModal'; // Adjust path
import { replacePlaceholders } from '../../helpers/replacePlaceholders'; // Import your placeholder function - ADJUST PATH

// Re-define or import the config interface if not imported from component
export interface AddTextButtonConfig {
    buttonText: string;
    dbTable: string;
    textColumn: string;
    extraData: Record<string, any>;
}

/**
 * Registers the post-processor for add-text buttons and the global event listener.
 */
export function registerAddTextSupport(plugin: Plugin, dbService: DBService) {

    // --- 1. Register the Post Processor ---
    plugin.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        const placeholders = el.querySelectorAll<HTMLDivElement>('div.add-text-button-placeholder');

        placeholders.forEach(placeholder => {
            if (placeholder.dataset.processed) return;
            placeholder.dataset.processed = 'true';

            // --- Read Raw Configuration from Attributes ---
            const rawDataTable = placeholder.dataset.table;
            const rawTextColumn = placeholder.dataset.column;
            const rawButtonText = placeholder.dataset.buttonText || `Add Entry to ${rawDataTable || 'Table'}`;

            // --- Basic Validation (on raw attributes) ---
            if (!rawDataTable || !rawTextColumn) {
                placeholder.textContent = '[Error: add-text-button-placeholder requires data-table and data-column attributes]';
                placeholder.style.color = 'var(--text-error)';
                placeholder.style.fontFamily = 'monospace';
                console.error('AddTextProcessor: Missing required attributes data-table or data-column', placeholder);
                return;
            }

            // --- Collect Raw Extra Data ---
            const rawExtraData: Record<string, string | undefined> = {};
            // Iterate over dataset keys
            for (const key in placeholder.dataset) {
                 // Include keys other than the standard ones and 'processed'
                if (key !== 'table' && key !== 'column' && key !== 'buttonText' && key !== 'processed') {
                    rawExtraData[key] = placeholder.dataset[key];
                }
            }

            // --- Render the Button ---
            placeholder.innerHTML = ''; // Clear placeholder content
            placeholder.addClass('add-text-button-container');

            // Use Obsidian's ButtonComponent for styling
            const button = new ButtonComponent(placeholder)
                // Set initial text (placeholders will be resolved onClick)
                .setButtonText(replacePlaceholders(rawButtonText)) // Resolve button text once for display
                .setClass('add-text-trigger-button');
            button.buttonEl.style.margin = '0.5em 0';

            // --- Attach Click Handler ---
            button.onClick(() => {
                // --- Apply Placeholders NOW (inside onClick) ---
                const processedExtraData: Record<string, any> = {};
                for (const [key, rawValue] of Object.entries(rawExtraData)) {
                    // Only process if the raw value exists
                    processedExtraData[key] = rawValue !== undefined ? replacePlaceholders(rawValue) : undefined;
                }
                const processedButtonText = replacePlaceholders(rawButtonText);

                // --- Construct Final Config ---
                const finalConfig: AddTextButtonConfig = {
                    buttonText: processedButtonText,
                    dbTable: rawDataTable, // Table/Column names usually don't need placeholder replacement
                    textColumn: rawTextColumn,
                    extraData: processedExtraData
                };

                // --- Dispatch Event with *processed* config ---
                placeholder.dispatchEvent(new CustomEvent('request-add-text-modal', {
                    bubbles: true,
                    composed: true,
                    detail: finalConfig // Pass the processed config
                }));
            });
        });
    });

    // --- 2. Register the Global Event Listener (Remains the Same) ---
    plugin.registerDomEvent(
        document,
        'request-add-text-modal' as keyof DocumentEventMap,
        (evt: Event) => {
            if (!(evt instanceof CustomEvent) || !evt.detail) return;

            const config = evt.detail as AddTextButtonConfig;

            if (!dbService) {
                new Notice("Database service is not ready.");
                return;
            }

            const appInstance = plugin.app;
            new AddTextEntryModal(appInstance, dbService, config).open();
        }
    );
}