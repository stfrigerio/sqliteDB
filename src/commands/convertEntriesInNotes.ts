import { App, Notice, TFile, TFolder, normalizePath, FileSystemAdapter } from "obsidian";
import { DBService } from "../dbService";
import { ColumnPickerModal } from "../components/ColumnPickerModal";

/**
 * Convert every row in the given table into a separate note.
 * - Prompts the user to pick a column for filenames.
 * - Creates a folder "<tableName>-dump" at the root of the vault.
 * - For each row, creates a .md file whose name is the chosen column's value.
 * - Inserts frontmatter with key:value pairs for each column.
 *
 * Usage:
 *   await convertEntriesInNotes(dbService, "MyTable", this.app);
 */
export async function convertEntriesInNotes(dbService: DBService, tableName: string, app: App) {
	const db = dbService.getDB();
	if (!db) {
		new Notice("No DB loaded. Please open the DB first.");
		return;
	}

	// 1) Get list of columns from the table
	//    PRAGMA table_info(tableName) gives columns metadata:  cid, name, type, etc.
	const colResult = db.exec(`PRAGMA table_info('${tableName}');`);
	if (!colResult || colResult.length === 0) {
		new Notice(`Could not read columns for table '${tableName}'.`);
		return;
	}
	// colResult[0].values => array of rows, where row = [cid, name, type, ...]
	const columns: string[] = colResult[0].values.map(row => row[1] as string);
	if (!columns.length) {
		new Notice(`No columns found in table '${tableName}'.`);
		return;
	}

	// 2) Prompt user to pick which column is used for the note filenames
	const pickColumn = async (): Promise<string | null> => {
		return new Promise((resolve) => {
			const modal = new ColumnPickerModal(app, columns, (col) => {
				resolve(col);
			});
			modal.open();
		});
	};

	const chosenColumn = await pickColumn();
	if (!chosenColumn) {
		new Notice("No column chosen. Aborting.");
		return;
	}

	// 3) Create or get the folder at the root: "<tableName>-dump"
	const folderName = `${tableName}-dump`;
	const targetFolderPath = normalizePath(folderName);

	// Check if folder already exists; if not, create it
	let folder = app.vault.getAbstractFileByPath(targetFolderPath);
	if (folder && !(folder instanceof TFolder)) {
		new Notice(`A file named "${folderName}" already exists and is not a folder.`);
		return;
	}
	if (!folder) {
		folder = await app.vault.createFolder(targetFolderPath);
	}

	// 4) Query *all* rows from the table
	const allRowsResult = db.exec(`SELECT * FROM "${tableName}";`);
	if (!allRowsResult || allRowsResult.length === 0) {
		new Notice(`No rows found in table "${tableName}".`);
		return;
	}

	const rowObj = allRowsResult[0];  // { columns: string[], values: any[][] }
	const allCols = rowObj.columns;   // e.g. ["id", "title", "content", ...]
	const rows = rowObj.values;       // array of arrays

	// 5) Figure out which index corresponds to the "chosenColumn"
	const columnIndex = allCols.indexOf(chosenColumn);
	if (columnIndex < 0) {
		new Notice(`Chosen column '${chosenColumn}' not found in table.`);
		return;
	}

	// 6) Loop each row, create a note
	let createdCount = 0;
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		// The chosen column's value for the filename
		let rawFileName = String(row[columnIndex]) || `Untitled_${i}`;
		let safeFileName = sanitizeFilename(rawFileName) || `Untitled_${i}`;
		let notePath = `${targetFolderPath}/${safeFileName}.md`;

		// If file already exists, append a suffix
		let suffix = 1;
		let existingFile = app.vault.getAbstractFileByPath(notePath);
		while (existingFile && existingFile instanceof TFile) {
			suffix++;
			notePath = `${targetFolderPath}/${safeFileName}_${suffix}.md`;
			existingFile = app.vault.getAbstractFileByPath(notePath);
		}

		// Build frontmatter with all columns
		const frontmatterLines = ["---"];
		for (let c = 0; c < allCols.length; c++) {
			const colName = allCols[c];
			const val = row[c] == null ? "" : String(row[c]);
			// Escape special newlines or quotes if you want
			frontmatterLines.push(`${colName}: ${val.replace(/\n/g, "\\n")}`);
		}
		frontmatterLines.push("---\n");

		const fileContent = frontmatterLines.join("\n");

		try {
			await app.vault.create(notePath, fileContent);
			createdCount++;
		} catch (err) {
			console.error(`Failed to create file at ${notePath}:`, err);
		}
	}

	new Notice(`Created ${createdCount} notes in folder "${folderName}".`);
}

/**
 * A quick utility to remove forbidden filename characters on Windows, etc.
 */
function sanitizeFilename(name: string): string {
	// Replace slashes, backslashes, colons, etc.
	return name.replace(/[\\\/:*?"<>|]/g, "_").trim();
}
