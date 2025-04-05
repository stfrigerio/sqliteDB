import { Notice, Editor } from "obsidian";
import { DBService } from "../DBService";
import { TablePickerModal } from "../components/TablePickerModal";

/**
 * Show a table picker. On picking a table, query the first 10 rows and insert into the editor.
 */
export async function inspectTableStructure(
	dbService: DBService,
	editor: Editor,
	app: any
) {
	const db = dbService.getDB();
	if (!db) {
		new Notice("No DB loaded. Please open the DB first.");
		return;
	}

	// 1) get all table names
	const result = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
	if (!result || result.length === 0) {
		new Notice("No tables found in the DB.");
		return;
	}
	const tableNames = result[0].values.map((row) => row[0] as string);

	// 2) show a modal to pick one
	const modal = new TablePickerModal(app, tableNames, (selectedTable) => {
		// 3) query first 10 rows from that table
		const rowResult = db.exec(`SELECT * FROM "${selectedTable}" LIMIT 10;`);
		if (!rowResult || rowResult.length === 0) {
			editor.replaceSelection(`\nNo rows found in table ${selectedTable}.\n`);
			return;
		}

		// rowResult[0].columns -> array of column names
		// rowResult[0].values -> array of row arrays
		const columns = rowResult[0].columns;
		const rows = rowResult[0].values;

        let output = `\n**Columns in "${selectedTable}"**\n`;
        output += columns.join(", ");
        output += "\n\n**First row**\n";
        output += rows[0].join(", ");
		editor.replaceSelection(output + "\n");
	});

	modal.open();
}
