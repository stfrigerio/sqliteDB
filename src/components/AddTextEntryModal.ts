import { App, Modal, Notice, TextAreaComponent, Setting } from 'obsidian';
import { DBService } from '../DBService'; // Adjust path
import { AddTextButtonConfig } from '../webcomponents/AddTextButton/AddTextButton'; // Import config type

export class AddTextEntryModal extends Modal {
    private dbService: DBService;
    private config: AddTextButtonConfig;
    private inputText: string = '';
    private textArea: TextAreaComponent | null = null;

    constructor(app: App, dbService: DBService, config: AddTextButtonConfig) {
        super(app);
        this.dbService = dbService;
        this.config = config; // Store the received configuration
        this.modalEl.addClass('add-text-entry-modal');
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('add-text-modal-content');

        // Use button text or a generic title
        contentEl.createEl('h2', { text: this.config.buttonText || 'Add Text Entry' });

        // Display the target table/column for clarity (optional)
        contentEl.createEl('p', {
            text: `Adding to table "${this.config.dbTable}", column "${this.config.textColumn}".`,
            cls: 'add-text-modal-info'
        });
        // Display extra data being added (optional)
        if (Object.keys(this.config.extraData).length > 0) {
            const extraDataStr = Object.entries(this.config.extraData)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ');
            contentEl.createEl('p', {
                text: `With fixed data: ${extraDataStr}`,
                cls: 'add-text-modal-info'
            });
        }

        // --- Text Input Area ---
        // Create a container div for the text area to center it
        const textAreaContainer = contentEl.createDiv({ cls: 'text-area-container' });
        textAreaContainer.style.display = 'flex';
        textAreaContainer.style.justifyContent = 'center';
        textAreaContainer.style.width = '100%';
        textAreaContainer.style.margin = '1rem 0';

        // Create the text area directly instead of using a Setting
        this.textArea = new TextAreaComponent(textAreaContainer);
        this.textArea.setPlaceholder("Type your text here...")
            .setValue(this.inputText)
            .onChange((value) => {
                this.inputText = value;
            });
        
        // Style the text area
        this.textArea.inputEl.style.width = '90%';
        this.textArea.inputEl.style.height = '150px';
        this.textArea.inputEl.style.margin = '0 auto';
        this.textArea.inputEl.style.display = 'block';
        this.textArea.inputEl.addClass('add-text-entry-input');

        // --- Action Buttons ---
        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Save Entry')
                    .setCta()
                    .onClick(() => {
                        this.handleSave();
                    })
            )
            .addButton((btn) =>
                btn
                    .setButtonText('Cancel')
                    .onClick(() => {
                        this.close();
                    })
            );

        // Focus the textarea when the modal opens
        this.textArea?.inputEl.focus();
    }

    private async handleSave() {
        const textToSave = this.inputText.trim();

        if (!textToSave) {
            new Notice("Please enter some text.");
            this.textArea?.inputEl.focus(); // Focus back
            return;
        }

        // --- Prepare SQL ---
        const columnsToInsert = [this.config.textColumn];
        const valuesToInsert = [textToSave];
        const placeholders = ['?'];

        // Add extra data columns and values
        for (const [key, value] of Object.entries(this.config.extraData)) {
            columnsToInsert.push(key); // Use key directly (e.g., 'period', 'key')
            valuesToInsert.push(value);
            placeholders.push('?');
        }

        // generate a random uuid for the entry
        const uuid = this.dbService.generateUuid();
        const createdAt = new Date().toISOString();
        // Add the uuid to the columns and values
        columnsToInsert.push("uuid");
        valuesToInsert.push(uuid);
        placeholders.push('?');
        columnsToInsert.push("createdAt");
        columnsToInsert.push("updatedAt");
        valuesToInsert.push(createdAt);
        valuesToInsert.push(createdAt);
        placeholders.push('?');
        placeholders.push('?');

        // Quote table and column names
        const quotedTable = `"${this.config.dbTable}"`;
        const quotedColumns = columnsToInsert.map(col => `"${col}"`).join(', ');
        const placeholderString = placeholders.join(', ');

        const sql = `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES (${placeholderString});`;
        const params = valuesToInsert;

        // --- Execute Query ---
        try {
            await this.dbService.runQuery(sql, params); // Assumes runQuery for INSERT
            new Notice(`Entry added to "${this.config.dbTable}"!`);
            this.close();
            // Optionally trigger a refresh or callback here if needed
        } catch (error) {
            console.error(`Error saving text entry to ${this.config.dbTable}:`, error);
            new Notice(`Failed to save entry. Check console. Error: ${error.message}`);
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}