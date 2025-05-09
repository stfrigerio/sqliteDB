import { App, Modal, Notice, TextAreaComponent, Setting } from 'obsidian';
import { DBService } from '../../DBService';
import { getContrastYIQ } from './helpers/getContrastYIQ';

interface MoodTag {
    text: string;
    type: string;
    color: string;
}

export class MoodNoteEntryModal extends Modal {
    private dbService: DBService;
    private availableTags: MoodTag[] = [];
    private selectedTags: Set<string> = new Set(); // Store names of selected tags
    private comment: string = '';
    private commentComponent: TextAreaComponent | null = null;
    private tagContainerEl: HTMLElement | null = null;
    private rating: number = 5; // Default rating value
    private ratingComponent: HTMLElement | null = null;

    private onSaveCallback?: () => void;

    constructor(app: App, dbService: DBService, onSave?: () => void) {
        super(app);
        this.dbService = dbService;
        this.onSaveCallback = onSave;
        this.modalEl.addClass('mood-note-entry-modal');
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('mood-note-modal-content');

        contentEl.createEl('h2', { text: 'Add Mood Note 💭' });

        // --- Fetch Available Tags ---
        await this.fetchTags();

        // --- Tag Selection Area ---
        contentEl.createEl('h4', { text: 'Select Tags:' });
        this.tagContainerEl = contentEl.createDiv({ cls: 'mood-tag-selection-area' });
        this.renderTags();

        // --- Comment Area ---
        contentEl.createEl('h4', { text: 'Comment' });
        contentEl.createEl('p', { text: 'Add any details about your current mood.', cls: 'setting-item-description' });
        
        const commentContainer = contentEl.createDiv({ cls: 'mood-note-comment-container' });
        const textArea = new TextAreaComponent(commentContainer);
        this.commentComponent = textArea;
        textArea.setPlaceholder("How are you feeling?")
            .setValue(this.comment)
            .onChange((value) => {
                this.comment = value;
            });
        textArea.inputEl.rows = 6;
        textArea.inputEl.style.width = '100%';
        textArea.inputEl.addClass('mood-note-comment-input');

        // --- Rating Area ---
        contentEl.createEl('h4', { text: 'Rating' });
        contentEl.createEl('p', { text: 'How would you rate your mood from 1 to 10?', cls: 'setting-item-description' });
        
        const ratingContainer = contentEl.createDiv({ cls: 'mood-note-rating-container' });
        
        // Create slider container
        const sliderContainer = ratingContainer.createDiv({ cls: 'mood-note-slider-container' });
        
        // Create slider
        const slider = sliderContainer.createEl('input', {
            type: 'range',
            attr: {
                min: '1',
                max: '10',
                value: this.rating.toString(),
                step: '1'
            },
            cls: 'mood-note-slider'
        });
        
        // Create value display
        const valueDisplay = sliderContainer.createEl('span', {
            text: this.rating.toString(),
            cls: 'mood-note-rating-value'
        });
        
        // Update value display when slider changes
        slider.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            this.rating = parseInt(value);
            valueDisplay.setText(value);
        });
        
        this.ratingComponent = ratingContainer;

        // --- Action Buttons ---
        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Save Mood Note')
                    .setCta() // Makes it visually prominent
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
    }

    private async fetchTags() {
        try {
            // Adjust query based on your schema
            const query = `SELECT DISTINCT text, color FROM Tags WHERE type = 'moodTag' ORDER BY text ASC;`;

            const results = await this.dbService.getQuery(query);

            if (results && Array.isArray(results)) {
                this.availableTags = results.map(row => ({ text: row.text, type: 'moodTag', color: row.color }));
            } else {
                console.warn("Could not fetch mood tags or no tags found.");
                this.availableTags = [];
            }
        } catch (error) {
            console.error("Error fetching mood tags:", error);
            new Notice("Error fetching tags. Check console.");
            this.availableTags = [];
        }
    }

    private renderTags() {
        if (!this.tagContainerEl) return;
        this.tagContainerEl.empty();
        this.tagContainerEl.addClass('tag-checkbox-container');

        if (this.availableTags.length === 0) {
            this.tagContainerEl.setText('No mood tags found or configured.');
            return;
        }

        this.availableTags.forEach(tag => {
            const tagId = `mood-tag-${tag.text.replace(/[^a-zA-Z0-9]/g, '-')}`; 
            const isChecked = this.selectedTags.has(tag.text);

            const label = this.tagContainerEl?.createEl('label', {
                cls: `mood-tag-label ${isChecked ? 'is-checked' : ''}`,
                attr: { for: tagId }
            });

            if (!label) {
                console.error("Failed to create label for tag:", tag);
                return;
            }

            // --- Apply Color Styling ---
            if (tag.color) {
                try {
                    const textColor = getContrastYIQ(tag.color);
                    label.style.backgroundColor = tag.color;
                    label.style.color = textColor;
                    // Make border slightly darker or use the same color initially
                    label.style.borderColor = tag.color;

                    // Ensure checkbox contrast might need specific styling if colors are very light/dark
                    // but usually browsers handle this okay.
                } catch (e) {
                    console.error(`Failed to apply color ${tag.color} for tag ${tag.text}:`, e);
                    // Apply default styles if color fails
                    label.style.backgroundColor = '';
                    label.style.color = '';
                    label.style.borderColor = '';
                }
            } else {
                // Reset styles if no color defined for this tag
                label.style.backgroundColor = '';
                label.style.color = '';
                label.style.borderColor = '';
            }

            const checkbox = label.createEl('input', {
                type: 'checkbox',
                attr: { id: tagId }
            });
            checkbox.checked = isChecked;

            label.appendText(tag.text);

            checkbox.onchange = (e) => {
                if ((e.target as HTMLInputElement).checked) {
                    this.selectedTags.add(tag.text);
                    label.addClass('is-checked'); // Update style immediately
                } else {
                    this.selectedTags.delete(tag.text);
                    label.removeClass('is-checked'); // Update style immediately
                }
            };

        });
    }

    private async handleSave() {
        const tagsString = Array.from(this.selectedTags).join(',');
        const comment = this.comment.trim();
        const timestamp = new Date().toISOString();
        const uuid = this.dbService.generateUuid();
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();

        const sql = `
            INSERT INTO Mood (uuid, date, tag, comment, rating, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
        
        const params = [uuid, timestamp, tagsString, comment, this.rating, createdAt, updatedAt];

        try {
            await this.dbService.runQuery(sql, params); // Use runQuery or appropriate method for INSERT
            new Notice(`Mood Note saved: ${tagsString || 'No tags'} - ${comment.substring(0, 20)}...`);
            this.close(); // Close modal on success
            if (this.onSaveCallback) {
                this.onSaveCallback(); // Trigger refresh if provided
            }
        } catch (error) {
            console.error("Error saving mood note:", error);
            new Notice("Failed to save mood note. Check console.");
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}