import { DBService } from "src/DBService";
import { TextDataArgs, UpsertTextArgs } from "../TextInput/TextInput.types";
import { quoteSqlIdentifier } from "./utils/quoteSqlIdentifier";
import { validateBaseTextArgs, validateUpsertTextArgs } from "./utils/validateTextInputArgs";

interface RawTextRecord {
    value: string | number | null;
}

export class TextInputDataService {
    private dbService: DBService;
    constructor(dbService: DBService) {
        if (!dbService) throw new Error("TextInputDataService requires a valid DBService instance.");
        this.dbService = dbService;
    }

    /** Fetches the current text value for a specific key/date. Returns empty string if not found. */
    async fetchTextValue(args: TextDataArgs): Promise<string> {
        try {
            validateBaseTextArgs(args);
            const safeTable = quoteSqlIdentifier(args.table);
            const safeValueCol = quoteSqlIdentifier(args.valueCol);
            const safeDateCol = quoteSqlIdentifier(args.dateCol);

            const sql = `SELECT ${safeValueCol} AS value FROM ${safeTable} WHERE ${safeDateCol} = ?`;
            const params = [args.date];

            const result = await this.dbService.getQuery<RawTextRecord>(sql, params);
            const value = result?.[0]?.value;

            if (value !== null && value !== undefined) {
                const stringValue = String(value); // Convert number or string using String()
                return stringValue;
            } else {
                return ""; // Return empty string for null/undefined/not found
            }

        } catch (error) {
            console.error(`[TextInputDataService] Error in fetchTextValue for ${args.table}:`, error);
            throw error;
        }
    }

    /** Upserts the text value. Handles optional UUID column logic. */
    async upsertTextValue(args: UpsertTextArgs): Promise<void> {
        try {
            validateUpsertTextArgs(args);

            const safeTable = quoteSqlIdentifier(args.table);
            const safeValueCol = quoteSqlIdentifier(args.valueCol);
            const safeDateCol = quoteSqlIdentifier(args.dateCol);
            const updatedAtCol = quoteSqlIdentifier("updatedAt"); //! 🔒 Hardcoded

            const now = new Date().toISOString(); //~ Current timestamp for updatedAt

            let sql = "";
            let params: (string | number | null)[] = []; // Allow null for value
            //? Ensure newValue is null if it's an empty string, if desired by DB schema
            const valueToSave = args.newValue === "" ? null : args.newValue;

            const fetchUuidSql = `SELECT uuid FROM ${safeTable} WHERE ${safeDateCol} = ?`;
            const uuidResult = await this.dbService.getQuery<{ uuid: string }>(fetchUuidSql, [args.date]);
            const existingUuid = uuidResult?.[0]?.uuid;

            if (existingUuid) {
                sql = `UPDATE ${safeTable} SET ${safeValueCol} = ?, ${updatedAtCol} = ? WHERE uuid = ?`;
                params = [valueToSave, now, existingUuid];
            } else {
                // Standard UPSERT Path
                sql = `
                    INSERT INTO ${safeTable} (${safeDateCol}, ${safeValueCol}, ${updatedAtCol})
                    VALUES (?, ?, ?)
                    ON CONFLICT(${safeDateCol}) DO UPDATE
                    SET ${safeValueCol} = excluded.${safeValueCol}, ${updatedAtCol} = excluded.${updatedAtCol};
                `;
                 //! Requires UNIQUE constraint on (keyIdCol, dateCol)
                params = [args.date, valueToSave, now];
            }

            await this.dbService.runQuery(sql, params);

        } catch (error) {
            console.error(`[TextInputDataService] Error in upsertTextValue for ${args.table}:`, error);
            if (error instanceof Error && error.message.includes("ON CONFLICT clause does not match")) {
                //^ Provide more specific guidance mentioning the user-provided columns
                console.error(`//! DB Constraint Error: Table '${args.table}' needs a UNIQUE index/key on (${args.dateCol}). Run: CREATE UNIQUE INDEX IF NOT EXISTS idx_key_date ON ${quoteSqlIdentifier(args.table)} (${quoteSqlIdentifier(args.dateCol)});`);
                throw new Error(`Missing UNIQUE constraint on (${args.dateCol}) in table ${args.table}. ${error.message}`);
            }
            throw error;
        }
    }
}