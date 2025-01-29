import { FuzzySuggestModal, Notice } from "obsidian";

/**
 * A modal that shows a list of table names. On choose, calls a callback.
 */
export class TablePickerModal extends FuzzySuggestModal<string> {
	private tables: string[];
	private onChoose: (tableName: string) => void;

	constructor(app: any, tables: string[], onChoose: (tableName: string) => void) {
		super(app);
		this.tables = tables;
		this.onChoose = onChoose;
		this.setPlaceholder("Pick a table...");
	}

	// The items to show in the modal
	getItems(): string[] {
		return this.tables;
	}

	// How to display each item
	getItemText(item: string): string {
		return item;
	}

	// Called when user selects an item
	onChooseItem(item: string, evt: MouseEvent | KeyboardEvent) {
		new Notice(`Selected table: ${item}`);
		this.onChoose(item);
	}
}
