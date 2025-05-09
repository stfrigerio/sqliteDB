import { App, Notice, TFile, TFolder, normalizePath, stringifyYaml, MetadataCache, Vault } from "obsidian";
import { DBService } from "../DBService"; // Adjust path

/**
 * Syncs database rows from a table to notes in a specified folder.
 * - Queries the DB table.
 * - For each row, tries to find a matching note using 'db_id' in frontmatter.
 * - Creates new notes for DB rows not found in the folder.
 * - Updates existing notes if the DB row is newer (based on updated_at).
 */
export async function syncDBToJournals(dbService: DBService, tableName: string, folderPath: string, app: App) {
    const { vault, metadataCache } = app;
    const db = dbService.getDB(); // Assuming local for now
    if (!db && dbService.mode === "local") {
        new Notice("Local DB not loaded.");
        return;
    }

    // --- Ensure Target Folder Exists ---
    const targetFolder = await ensureFolderExists(folderPath, app.vault);
    if (!targetFolder) {
        new Notice(`Failed to find or create folder "${folderPath}".`);
        return;
    }

    // --- Get All Notes in Target Folder with db_id ---
    const notesInFolder = targetFolder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
    const notesMap = new Map<string, { file: TFile, fmUpdatedAt: string | null, mtime: number }>(); // Map db_id -> note info

    for (const note of notesInFolder) {
        const fm = metadataCache.getFileCache(note)?.frontmatter;
        if (fm && fm.uuid) {
            notesMap.set(fm.uuid, {
                file: note,
                fmUpdatedAt: fm.updatedAt || null,
                mtime: note.stat.mtime
            });
        }
    }

    // --- Query DB ---
    // Adapt column names! Fetch all relevant columns including uuid and updated_at
    const query = `SELECT uuid, date, place, text, createdAt, updatedAt FROM "${tableName}"`;
    const dbRows = await dbService.getQuery(query); // Adapt for local/remote

    if (!dbRows || dbRows.length === 0) {
        new Notice(`No rows found in DB table "${tableName}".`);
        return;
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const row of dbRows) {
        try {
            const uuid = row.uuid; // Adapt column name
            const dbUpdatedAt = row.updatedAt; // Adapt column name

            if (!uuid || !dbUpdatedAt) {
                console.warn("Skipping DB row - missing 'uuid' or 'updatedAt'.", row);
                errorCount++;
                continue;
            }

            const existingNoteInfo = notesMap.get(uuid);

            // --- Decide Action ---
            if (existingNoteInfo) {
                // Note exists - check if update needed
                const noteFile = existingNoteInfo.file;
                const noteMtime = existingNoteInfo.mtime;
                const dbTimestamp = new Date(dbUpdatedAt).getTime();

                // Compare DB timestamp with note modification time.
                // If DB is significantly newer, update the note.
                // Add a small buffer (e.g., 1-2 seconds) to avoid sync loops if timestamps are very close.
                const buffer = 2000; // 2 seconds
                if (dbTimestamp > (noteMtime + buffer)) {
                    console.log(`DB row ${uuid} is newer than note "${noteFile.path}". Updating note.`);
                    await updateOrCreateNoteFromDbRow(row, tableName, targetFolder.path, app, noteFile);
                    updatedCount++;
                } else {
                    // console.log(`Note "${noteFile.path}" is up-to-date with DB row ${dbId}. Skipping.`);
                    skippedCount++;
                }
                // Remove from map so remaining notes can be potentially deleted later (optional)
                notesMap.delete(uuid);
            } else {
                // Note does not exist - create it
                console.log(`DB row ${uuid} not found in notes. Creating new note.`);
                await updateOrCreateNoteFromDbRow(row, tableName, targetFolder.path, app);
                createdCount++;
            }
        } catch (error) {
            console.error(`Error processing DB row with uuid ${row.uuid}:`, error);
            new Notice(`Error processing DB row ${row.uuid}. Check console.`);
            errorCount++;
        }
    }

    new Notice(`Sync DB to Notes complete. Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}.`);
}


// Helper Function to Create/Update a Note from a DB Row
async function updateOrCreateNoteFromDbRow(
    dbRow: any,
    tableName: string,
    folderPath: string,
    app: App,
    existingFile?: TFile | null
) {
    const { vault } = app;

    // --- Map DB columns to Frontmatter keys --- (Adapt these!)
    const frontmatterData: Record<string, any> = {
        uuid: dbRow.uuid,
        db_table: tableName,
        date: dbRow.date,
        place: dbRow.place,
        createdAt: dbRow.createdAt,
        updatedAt: dbRow.updatedAt,
    };
    // Remove null/undefined values from frontmatter if desired
    Object.keys(frontmatterData).forEach(key =>
        (frontmatterData[key] === null || frontmatterData[key] === undefined) && delete frontmatterData[key]
    );

    const noteBody = dbRow.text || ''; // Adapt column name

    // --- Construct File Content ---
    const frontmatterString = stringifyYaml(frontmatterData);
    const fileContent = `---\n${frontmatterString}---\n\n${noteBody}`;

    if (existingFile) {
        // --- Update Existing File ---
        const currentContent = await vault.cachedRead(existingFile);
        if (fileContent !== currentContent) { // Only modify if content changed
            await vault.modify(existingFile, fileContent);
        }
    } else {
        // --- Create New File ---
        const datePart = dbRow.date ? new Date(dbRow.date).toISOString().split('T')[0] : 'UnknownDate';
        const safeBaseName = sanitizeFilename(`Journal ${datePart}`);
        let notePath = normalizePath(`${folderPath}/${safeBaseName}.md`);

        // Handle filename collisions
        let suffix = 1;
        while (vault.getAbstractFileByPath(notePath)) {
            suffix++;
            notePath = normalizePath(`${folderPath}/${safeBaseName}_${suffix}.md`);
        }
        await vault.create(notePath, fileContent);
    }
}


// Helper to ensure folder exists
async function ensureFolderExists(folderPath: string, vault: Vault): Promise<TFolder | null> {
	const normPath = normalizePath(folderPath);
	let folder = vault.getAbstractFileByPath(normPath);

	if (folder && !(folder instanceof TFolder)) {
		new Notice(`"${normPath}" exists but is not a folder.`);
		return null;
	}
	if (!folder) {
		try {
			folder = await vault.createFolder(normPath);
		} catch (err) {
			console.error(`Error creating folder "${normPath}":`, err);
			return null;
		}
	}
	return folder as TFolder;
}

// Re-use sanitizeFilename function from your original code
function sanitizeFilename(name: string): string {
	return name.replace(/[\\\/:*?"<>|]/g, "_").trim();
}