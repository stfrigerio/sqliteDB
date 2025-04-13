import { App, Notice, TFile, TFolder, normalizePath, stringifyYaml } from "obsidian";
import { DBService } from "../DBService"; // Adjust path

// Define an interface for your Journal structure (optional but helpful)
interface JournalData {
    uuid?: string;
    date: string; // ISO Format
    place?: string;
    text: string;
    createdAt?: string; // ISO Format
    updatedAt?: string; // ISO Format
}

/**
 * Syncs notes from a specified folder to a database table.
 * - Finds notes in the folder.
 * - Parses frontmatter and content.
 * - Uses 'db_id' frontmatter key to link to DB rows.
 * - Performs UPSERT (UPDATE or INSERT) based on db_id and timestamps.
 * - Updates note frontmatter with db_id and timestamps after INSERT.
 */
export async function syncJournalsToDB(dbService: DBService, folderPath: string, tableName: string, app: App) {
    const { vault, metadataCache } = app;
    const db = dbService.getDB(); // Assuming local for now, adapt for remote
    if (!db && dbService.mode === "local") {
        new Notice("Local DB not loaded.");
        return;
    }

    const folder = vault.getAbstractFileByPath(normalizePath(folderPath));
    if (!folder || !(folder instanceof TFolder)) {
        new Notice(`Folder "${folderPath}" not found.`);
        return;
    }

    const notes = folder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
    let updatedCount = 0;
    let insertedCount = 0;
    let errorCount = 0;

    for (const note of notes) {
        try {
            const fileContent = await vault.cachedRead(note);
            const frontmatter = metadataCache.getFileCache(note)?.frontmatter || {};
            const noteMtime = note.stat.mtime; // Note's last modified time

            // --- Extract data from note ---
            const journalData: Partial<JournalData> = {
                uuid: frontmatter.uuid,
                date: frontmatter.date,
                place: frontmatter.place,
                // Extract content AFTER frontmatter
                text: extractNoteContent(fileContent),
                createdAt: frontmatter.createdAt,
                updatedAt: frontmatter.updatedAt,
            };

            // Basic validation
            if (!journalData.date) {
                // Try to extract date from filename if not in frontmatter
                const dateFromFilename = extractDateFromFilename(note.name);
                if (dateFromFilename) {
                    journalData.date = dateFromFilename;
                    console.log(`Extracted date from filename for "${note.path}": ${dateFromFilename}`);
                } else {
                    console.warn(`Skipping note "${note.path}" - missing 'date' in frontmatter and filename.`);
                    continue;
                }
            }

            // --- Sync Logic ---
            let syncAction: 'skip' | 'update' | 'insert' = 'skip';
            let dbUpdatedAt: string | null = null;

            if (journalData.uuid) {
                 // Note has an ID - check DB and timestamps
                const checkQuery = `SELECT updatedAt FROM "${tableName}" WHERE uuid = ?`; // Use your actual ID column name
                const existingRow = await dbService.getQuery(checkQuery, [journalData.uuid]); // Adapt for local/remote

                if (existingRow && existingRow.length > 0) {
                    dbUpdatedAt = existingRow[0].updatedAt;
                    // Compare note mtime with DB updated_at timestamp
                    // If note is newer than DB record, update DB.
                    // (More robust: compare note mtime > frontmatter.updated_at)
                    if (noteMtime > (new Date(dbUpdatedAt!)).getTime()) {
                        syncAction = 'update';
                        console.log(`Note "${note.path}" is newer than DB record. Scheduling UPDATE.`);
                    } else {
                        console.log(`Note "${note.path}" is up-to-date with DB record. Skipping.`);
                    }
                } else {
                    // Note has ID, but not found in DB (maybe deleted in DB?) -> Re-insert
                    console.warn(`Note "${note.path}" has uuid ${journalData.uuid} but not found in DB. Scheduling INSERT.`);
                    syncAction = 'insert';
                    journalData.uuid = dbService.generateUuid();
                }
            } else {
                // Note has no ID - it's new -> Insert
                syncAction = 'insert';
                journalData.uuid = dbService.generateUuid(); // Generate new UUID for insertion
                console.log(`Note "${note.path}" has no uuid. Scheduling INSERT with new ID ${journalData.uuid}.`);
            }

            // --- Perform DB Action ---
            if (syncAction === 'insert') {
                const now = new Date().toISOString();
                journalData.createdAt = now;
                journalData.updatedAt = now;

                // Adapt column names and parameter order!
                const insertSql = `INSERT INTO "${tableName}" (uuid, date, place, text, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`;
                const params = [
                    journalData.uuid,
                    journalData.date,
                    journalData.place || null, // Handle optional fields
                    journalData.text,
                    journalData.createdAt,
                    journalData.updatedAt,
                ];
                await dbService.runQuery(insertSql, params); // Adapt for local/remote

                // --- IMPORTANT: Update Note Frontmatter with new ID and timestamps ---
                await updateNoteFrontmatter(note, {
                    uuid: journalData.uuid,
                    createdAt: journalData.createdAt,
                    updatedAt: journalData.updatedAt,
                    // Keep other existing frontmatter
                    ...frontmatter,
                    date: journalData.date, // Ensure date is saved back if defaulted
                    place: journalData.place, // Ensure location is saved back
                }, fileContent, app);

                insertedCount++;

            } else if (syncAction === 'update') {
                const now = new Date().toISOString();
                journalData.updatedAt = now; // Update timestamp

                // Adapt column names and parameter order!
                const updateSql = `UPDATE "${tableName}" SET date = ?, place = ?, text = ?, updatedAt = ? WHERE uuid = ?`;
                const params = [
                    journalData.date,
                    journalData.place || null,
                    journalData.text,
                    journalData.updatedAt,
                    journalData.uuid, // WHERE clause parameter
                ];
                 await dbService.runQuery(updateSql, params); // Adapt for local/remote

                 // --- IMPORTANT: Update Note Frontmatter with new updated_at ---
                await updateNoteFrontmatter(note, {
                    updatedAt: journalData.updatedAt,
                    // Keep other existing frontmatter
                    ...frontmatter,
                    date: journalData.date,
                    place: journalData.place,
                }, fileContent, app);

                updatedCount++;
            }

        } catch (error) {
            console.error(`Error processing note "${note.path}":`, error);
            new Notice(`Error syncing note "${note.name}". Check console.`);
            errorCount++;
        }
    }

    new Notice(`Sync Notes to DB complete. Inserted: ${insertedCount}, Updated: ${updatedCount}, Errors: ${errorCount}.`);
}


// Helper to extract content after frontmatter
function extractNoteContent(fileContent: string): string {
    const match = fileContent.match(/^---\s*([\s\S]*?)\s*---(\s*[\s\S]*)$/);
    return match ? (match[2] || '').trim() : fileContent.trim();
}

// Helper to update note frontmatter non-destructively
async function updateNoteFrontmatter(file: TFile, newData: Record<string, any>, currentContent: string, app: App) {
    const contentOnly = extractNoteContent(currentContent);
    const newFrontmatter = stringifyYaml(newData); // Use Obsidian's YAML stringifier
    const newFileContent = `---\n${newFrontmatter}---\n\n${contentOnly}`;

    // Avoid triggering another update immediately by comparing content
    if (newFileContent !== currentContent) {
        await app.vault.modify(file, newFileContent);
        console.log(`Updated frontmatter for "${file.path}"`);
    }
}

// Helper to extract date from filename (format "Journal YYYY-MM-DD")
function extractDateFromFilename(filename: string): string | null {
    // Match "Journal YYYY-MM-DD" pattern
    const match = filename.match(/Journal\s+(\d{4}-\d{2}-\d{2})/i);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}