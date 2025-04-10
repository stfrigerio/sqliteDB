import { App, Notice, TFile } from 'obsidian';

// Regex patterns are specific to this module's responsibility
const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
const updatedAtRegexLine = /^(updatedAt:\s*)(.*)$/m; // Find existing line
const closingDashRegex = /^\s*---\s*$/; // To find the closing dashes

interface UpdateResult {
    success: boolean;
    message: string;
}

/**
 * Reads the file, updates the 'updatedAt' timestamp in the frontmatter manually,
 * and saves the file back.
 *
 * @param app Obsidian App instance
 * @param file The TFile to modify
 * @returns Promise resolving to an UpdateResult object
 */
export async function updateTimestampInFile(app: App, file: TFile): Promise<UpdateResult> {
    try {
        const content = await app.vault.read(file);
        const match = content.match(frontmatterRegex);

        if (!match || !match[0]) {
            return { success: false, message: 'No frontmatter found in this file.' };
        }

        const fullFrontmatterBlock = match[0];
        const frontmatterContent = match[1];
        const body = content.substring(fullFrontmatterBlock.length);
        const newTimestamp = new Date().toISOString();

        let existingTimestamp: string | null = null;
        let updatedFrontmatterBlock: string;

        const updatedAtMatch = frontmatterContent.match(updatedAtRegexLine);
        if (updatedAtMatch && updatedAtMatch[2]) {
            existingTimestamp = updatedAtMatch[2].trim();
        }

        if (existingTimestamp === newTimestamp) {
            return { success: true, message: `Timestamp already up-to-date (${newTimestamp.split('T')[1].substring(0, 8)}).` };
        }

        // Manual Update Logic
        if (updatedAtMatch) {
            // Found existing line: replace the value part
            updatedFrontmatterBlock = fullFrontmatterBlock.replace(
                updatedAtRegexLine,
                `$1${newTimestamp}`
            );
        } else {
            // Didn't find the line: Append it before the closing '---'
            const lines = fullFrontmatterBlock.trimEnd().split('\n');
            // Find the index of the closing '---' line
            const closingDashIndex = lines.findIndex(line => closingDashRegex.test(line));

            if (closingDashIndex > 0) { // Ensure closing dashes are found and not the first line
                lines.splice(closingDashIndex, 0, `updatedAt: ${newTimestamp}`); // Insert before closing dashes
                updatedFrontmatterBlock = lines.join('\n');
                // Add back potential trailing newline if original block had one
                if (fullFrontmatterBlock.endsWith('\n') && !updatedFrontmatterBlock.endsWith('\n')) {
                    updatedFrontmatterBlock += '\n';
                }
            } else {
                console.warn(`FileUpdater: Could not find closing '---' to append timestamp in ${file.basename}`);
                return { success: false, message: 'Could not reliably update frontmatter (structure error?).' };
            }
        }

        // Reconstruct the full content
        const newContent = updatedFrontmatterBlock + body;

        // Check if content actually changed before writing (prevents unnecessary file modifications)
        if (newContent === content) {
            return { success: true, message: `Timestamp already effectively up-to-date.` };
        }

        await app.vault.modify(file, newContent);
        return { success: true, message: `Updated timestamp for ${file.basename}` };

    } catch (error: any) {
        console.error(`FileUpdater: Error processing file ${file.basename}`, error);
        return { success: false, message: `Error updating timestamp: ${error.message}` };
    }
}