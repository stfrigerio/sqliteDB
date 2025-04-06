import { DBService } from "../../DBService";
import { BooleanRecord, BooleanSwitchDataArgs, UpsertBooleanSwitchArgs } from "../BooleanSwitch/BooleanSwitch.types";
import { quoteSqlIdentifier } from "./utils/quoteSqlIdentifier";
import { validateBaseBooleanArgs, validateUpsertBooleanArgs } from "./utils/validateBooleanArgs";

export class BooleanSwitchDataService {
    private dbService: DBService;
    constructor(dbService: DBService) {
        if (!dbService) throw new Error("BooleanSwitchDataService requires a valid DBService instance.");
        this.dbService = dbService;
    }

    /** Fetches the current 0/1 value for a specific key/date. Returns 0 if not found. */
    async fetchBooleanValue(args: BooleanSwitchDataArgs): Promise<0 | 1> {
        try {
            validateBaseBooleanArgs(args);
            const safeTable = quoteSqlIdentifier(args.table);
            const safeKeyIdCol = quoteSqlIdentifier(args.habitIdCol);
            const safeValueCol = quoteSqlIdentifier(args.valueCol);
            const safeDateCol = quoteSqlIdentifier(args.dateCol);

            const sql = `SELECT ${safeValueCol} AS value FROM ${safeTable} WHERE ${safeKeyIdCol} = ? AND ${safeDateCol} = ?`;
            const params = [args.habitKey, args.date];

            const result = await this.dbService.getQuery<BooleanRecord>(sql, params);

            const value = result?.[0]?.value;
            //^ Return 1 if value is 1, otherwise default to 0
            return value === 1 ? 1 : 0;

        } catch (error) {
            console.error(`[BoolDataService] Error in fetchBooleanValue for ${args.habitKey}:`, error);
            throw error;
        }
    }

    /** Upserts the 0/1 value. Handles optional UUID column logic. */
    async upsertBooleanValue(args: UpsertBooleanSwitchArgs): Promise<void> {
        try {
            validateUpsertBooleanArgs(args);

            const safeTable = quoteSqlIdentifier(args.table);
            const safeHabitIdCol = quoteSqlIdentifier(args.habitIdCol);
            const safeValueCol = quoteSqlIdentifier(args.valueCol);
            const safeDateCol = quoteSqlIdentifier(args.dateCol);
            const updatedAtCol = quoteSqlIdentifier("updatedAt"); //! 🔒 Hardcoded

            const now = new Date().toISOString(); //~ Current timestamp for updatedAt

            let existingUuid: string | undefined;

            try {
                //^ Attempt to fetch UUID. Assumes the column is named 'uuid' if used.
                const fetchUuidSql = `SELECT uuid FROM ${safeTable} WHERE ${safeHabitIdCol} = ? AND ${safeDateCol} = ?`;
                const uuidResult = await this.dbService.getQuery<{ uuid: string }>(fetchUuidSql, [args.habitKey, args.date]);
                existingUuid = uuidResult?.[0]?.uuid;
            } catch (error) {
                if (error instanceof Error && /no such column|does not exist/i.test(error.message) && error.message.includes('uuid')) {
                    console.log(`[BoolDataService] Info: Optional 'uuid' column not found in table '${args.table}'. Proceeding with standard upsert.`);
                    existingUuid = undefined; // Ensure it's undefined so the INSERT path is taken
                } else {
                    console.error(`[BoolDataService] Error fetching potential UUID for ${args.habitKey} on ${args.date}:`, error);
                    throw error; // Re-throw unexpected errors
                }
            }

            if (existingUuid) {
                const updateSql = `UPDATE ${safeTable} SET ${safeValueCol} = ?, ${updatedAtCol} = ? WHERE uuid = ?`;
                const updateParams = [args.newValue, now, existingUuid];
                await this.dbService.runQuery(updateSql, updateParams);
            } else {
                const insertSql = `
                    INSERT INTO ${safeTable} (${safeHabitIdCol}, ${safeDateCol}, ${safeValueCol}, ${updatedAtCol})
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(${safeHabitIdCol}, ${safeDateCol}) DO UPDATE
                    SET ${safeValueCol} = excluded.${safeValueCol},
                        ${updatedAtCol} = excluded.${updatedAtCol};
                `;
                const insertParams = [args.habitKey, args.date, args.newValue, now];
                await this.dbService.runQuery(insertSql, insertParams);
            }

        } catch (error) { 
            console.error(`[BoolDataService] Error in upsertBooleanValue for ${args.habitKey}:`, error);
            if (error instanceof Error && error.message.includes("ON CONFLICT clause does not match")) {
                //^ Provide more specific guidance mentioning the user-provided columns
                console.error(`//! DB Constraint Error: Table '${args.table}' needs a UNIQUE index/key on (${args.habitIdCol}, ${args.dateCol}). Run: CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_date ON ${quoteSqlIdentifier(args.table)} (${quoteSqlIdentifier(args.habitIdCol)}, ${quoteSqlIdentifier(args.dateCol)});`);
                throw new Error(`Missing UNIQUE constraint on (${args.habitIdCol}, ${args.dateCol}) in table ${args.table}. ${error.message}`);
            }
            throw error;
        }
    }
}