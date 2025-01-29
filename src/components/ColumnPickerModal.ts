import { App, Notice } from "obsidian";

/**
 * A simple fuzzy modal to pick which column to use for filenames.
 */
import { FuzzySuggestModal } from "obsidian";

class ColumnPickerModal extends FuzzySuggestModal<string> {
	private columns: string[];
	private onChoose: (col: string) => void;

	constructor(app: App, columns: string[], onChoose: (col: string) => void) {
		super(app);
		this.columns = columns;
		this.onChoose = onChoose;
		this.setPlaceholder("Pick a column to use as filenames...");
	}

	getItems(): string[] {
		return this.columns;
	}

	getItemText(item: string): string {
		return item;
	}

	onChooseItem(item: string): void {
		new Notice(`Selected column: ${item}`);
		this.onChoose(item);
	}
}

export { ColumnPickerModal };