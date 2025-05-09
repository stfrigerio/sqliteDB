import { DBService } from "../../DBService";
import { HabitRecord, HabitDataArgs, UpdateHabitDataArgs } from "../HabitCounter/HabitCounter.types";
import { quoteSqlIdentifier } from "./utils/quoteSqlIdentifier";
import { validateFetchArgs, validateUpdateArgs } from "./utils/validateHabitArgs";

export class HabitDataService {
    private dbService: DBService;

    constructor(dbService: DBService) {
        if (!dbService) throw new Error("HabitDataService requires a valid DBService instance.");
        this.dbService = dbService;
    }

    async fetchHabitValue(args: HabitDataArgs): Promise<number> {
        try {
            validateFetchArgs(args); //~ Validate all args including column names

            //~ Quote all identifiers safely
            const safeTable = quoteSqlIdentifier(args.table);
            const safeHabitIdCol = quoteSqlIdentifier(args.habitIdCol);
            const safeValueCol = quoteSqlIdentifier(args.valueCol);
            const safeDateCol = quoteSqlIdentifier(args.dateCol);

            //^ Use specified columns. SELECT valueCol AS value to simplify return processing.
            const sql = `SELECT ${safeValueCol} AS value FROM ${safeTable} WHERE ${safeHabitIdCol} = ? AND ${safeDateCol} = ?`;
            const params = [args.habitKey, args.date];

            //? Use HabitRecord type directly because we aliased the column to 'value'
            const result = await this.dbService.getQuery<HabitRecord>(sql, params);

            //? Check the 'value' property returned from the aliased select
            const value = result?.[0]?.value;
            return (typeof value === 'number') ? value : 0;

        } catch (error) {
            console.error(`[HabitDataService] Error in fetchHabitValue for ${args.habitKey}:`, error);
            throw error;
        }
    }

    async updateHabitValue(args: UpdateHabitDataArgs): Promise<void> {
        try {
            validateUpdateArgs(args); //~ Validate all args

            //~ Quote all identifiers safely
            const safeTable = quoteSqlIdentifier(args.table);
            const safeHabitIdCol = quoteSqlIdentifier(args.habitIdCol);
            const safeValueCol = quoteSqlIdentifier(args.valueCol);
            const safeDateCol = quoteSqlIdentifier(args.dateCol);
            const updatedAtCol = quoteSqlIdentifier("updatedAt"); //! 🔒 Hardcoded

            const now = new Date().toISOString(); //~ Current timestamp for updatedAt

            let existingUuid: string | undefined;

            //? Attempt to fetch existing UUID
            try {
                //^ Attempt to fetch UUID. Assumes the column is named 'uuid' if used.
                const fetchUuidSql = `SELECT uuid FROM ${safeTable} WHERE ${safeHabitIdCol} = ? AND ${safeDateCol} = ?`;
                const uuidResult = await this.dbService.getQuery<{ uuid: string }>(fetchUuidSql, [args.habitKey, args.date]);
                existingUuid = uuidResult?.[0]?.uuid;
            } catch (error) {
                if (error instanceof Error && /no such column|does not exist/i.test(error.message) && error.message.includes('uuid')) {
                    console.log(`[HabitDataService] Info: Optional 'uuid' column not found in table '${args.table}'. Proceeding with standard upsert.`);
                    existingUuid = undefined; // Ensure it's undefined so the INSERT path is taken
                } else {
                    console.error(`[HabitDataService] Error fetching potential UUID for ${args.habitKey} on ${args.date}:`, error);
                    throw error; // Re-throw unexpected errors
                }
            }

            if (existingUuid && typeof existingUuid === 'string') {
                const updateSql = `UPDATE ${safeTable} SET ${safeValueCol} = ?, ${updatedAtCol} = ? WHERE uuid = ?`;
                const updateParams = [args.newValue, now, existingUuid];
                await this.dbService.runQuery(updateSql, updateParams);
            } else {
                const insertSql = `
                    INSERT INTO ${safeTable} (${safeHabitIdCol}, ${safeDateCol}, ${safeValueCol}, ${updatedAtCol})
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(${safeHabitIdCol}, ${safeDateCol}) DO UPDATE SET
                        ${safeValueCol} = excluded.${safeValueCol},
                        ${updatedAtCol} = excluded.${updatedAtCol};
                `;
                const insertParams = [args.habitKey, args.date, args.newValue, now];
                await this.dbService.runQuery(insertSql, insertParams);
            }

        } catch (error) {
            console.error(`[HabitDataService] Error in updateHabitValue for ${args.habitKey}:`, error);
            if (error instanceof Error && error.message.includes("ON CONFLICT clause does not match")) {
                //^ Provide more specific guidance mentioning the user-provided columns
                console.error(`//! DB Constraint Error: Table '${args.table}' needs a UNIQUE index/key on (${args.habitIdCol}, ${args.dateCol}). Run: CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_date ON ${quoteSqlIdentifier(args.table)} (${quoteSqlIdentifier(args.habitIdCol)}, ${quoteSqlIdentifier(args.dateCol)});`);
                throw new Error(`Missing UNIQUE constraint on (${args.habitIdCol}, ${args.dateCol}) in table ${args.table}. ${error.message}`);
            }
            throw error;
        }
    }
}