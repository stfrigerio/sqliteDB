import { Plugin, MarkdownPostProcessorContext, ButtonComponent, Notice } from 'obsidian';
import { MoodNoteEntryModal } from '../../components/MoodNoteModal/MoodNoteEntryModal';
import { DBService } from '../../DBService'; // Adjust path if needed

/**
 * Registers a MarkdownPostProcessor to create mood note buttons
 * AND registers the global event listener to open the modal.
 */
export function registerMoodNoteButtonProcessor(plugin: Plugin, dbService: DBService) {

    // --- Register the Post Processor (finds placeholders, creates buttons) ---
    plugin.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        const placeholders = el.querySelectorAll<HTMLDivElement>('div.mood-note-button-placeholder');
        placeholders.forEach(placeholder => {
            if (placeholder.dataset.processed) return;
            placeholder.dataset.processed = 'true';

            const buttonText = placeholder.dataset.buttonText || 'Add Mood Note 💭';
            placeholder.innerHTML = '';
            placeholder.addClass('mood-note-button-container');

            const button = new ButtonComponent(placeholder)
                .setButtonText(buttonText)
                .setClass('mood-note-trigger-button');
            button.buttonEl.style.margin = '0.5em 0';

            button.onClick(() => {
                console.log("Mood Note Button (from div) Clicked - Dispatching Event");
                placeholder.dispatchEvent(new CustomEvent('request-mood-modal', {
                    bubbles: true,
                    composed: true
                }));
            });
        });
    });

    // --- Register the Global Event Listener (catches event, opens modal) ---
    // Use plugin.registerDomEvent for automatic cleanup on unload
    plugin.registerDomEvent(document, 'request-mood-modal' as keyof DocumentEventMap, (evt: CustomEvent) => {
        if (!dbService) {
            new Notice("Database service is not ready.");
            console.error("DBService not initialized/ready when trying to open mood modal via custom event.");
            return;
        }

        // Access app via the plugin instance
        const appInstance = plugin.app;

        // Open the modal, passing app and dbService
        new MoodNoteEntryModal(appInstance, dbService, () => {
            new Notice("Mood note saved.");
        }).open();
    });
}