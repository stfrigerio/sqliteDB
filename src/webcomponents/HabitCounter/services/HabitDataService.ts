import { DBService } from "src/dbService";
import { HabitRecord, HabitDataArgs, UpdateHabitDataArgs } from "../HabitCounter.types";
import { quoteSqlIdentifier } from "./utils/quoteSqlIdentifier";
import { validateFetchArgs, validateUpdateArgs } from "./utils/validateHabitArgs";

//? Service for database interactions related to habits.
export class HabitDataService {
    private dbService: DBService;

    constructor(dbService: DBService) {
        if (!dbService) throw new Error("HabitDataService requires a valid DBService instance.");
        this.dbService = dbService;
        //& console.log("[HabitDataService] Initialized.");
    }

    async fetchHabitValue(args: HabitDataArgs): Promise<number> {
        //& console.log(`[HabitDataService] fetchHabitValue called with:`, args);
        try {
            validateFetchArgs(args); //~ Delegate validation
            const safeTable = quoteSqlIdentifier(args.table); //~ Delegate quoting
            const sql = `SELECT value FROM ${safeTable} WHERE habitKey = ? AND date = ?`;
            const params = [args.habitKey, args.date];

            //& console.log(`[HabitDataService] Executing fetch SQL: ${sql} PARAMS:`, params);
            const result = await this.dbService.getQuery<HabitRecord>(sql, params);
            //& console.log(`[HabitDataService] Fetch result:`, result);

            const value = result?.[0]?.value;
            return (typeof value === 'number') ? value : 0; //? Default to 0 if no record or invalid value
        } catch (error) {
            console.error(`[HabitDataService] Error in fetchHabitValue for ${args.habitKey}:`, error);
            throw error; //? Propagate error
        }
    }

    async updateHabitValue(args: UpdateHabitDataArgs): Promise<void> {
        //& console.log(`[HabitDataService] updateHabitValue called with:`, args);
        try {
            validateUpdateArgs(args); //~ Delegate validation
            const safeTable = quoteSqlIdentifier(args.table); //~ Delegate quoting
            const sql = `
                INSERT INTO ${safeTable} (habitKey, date, value) VALUES (?, ?, ?)
                ON CONFLICT(habitKey, date) DO UPDATE SET value = excluded.value;
            `;
             //! Requires UNIQUE constraint on (habitKey, date)
            const params = [args.habitKey, args.date, args.newValue];

            //& console.log(`[HabitDataService] Executing update SQL: ${sql} PARAMS:`, params);
            await this.dbService.runQuery(sql, params);
            //& console.log(`[HabitDataService] Update successful.`);
        } catch (error) {
            console.error(`[HabitDataService] Error in updateHabitValue for ${args.habitKey}:`, error);
            //? Log specific guidance for constraint errors
            if (error instanceof Error && error.message.includes("ON CONFLICT clause does not match")) {
                console.error(`//! DB Constraint Error: Table '${args.table}' needs a UNIQUE index/key on (habitKey, date). Run: CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_date ON ${quoteSqlIdentifier(args.table)} (habitKey, date);`);
                throw new Error(`Missing UNIQUE constraint on (habitKey, date) in table ${args.table}. ${error.message}`);
            }
            throw error; //? Propagate other errors
        }
    }
}