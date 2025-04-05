import { HabitDataArgs, UpdateHabitDataArgs } from "../../HabitCounter.types";

/** Validates arguments required for fetching habit data. */
export function validateFetchArgs(args: HabitDataArgs): void {
    if (!args.table || !args.habitKey || !args.date) {
        throw new Error(`Missing required arguments for fetch: table='${args.table}', habitKey='${args.habitKey}', date='${args.date}'`);
    }
}

/** Validates arguments required for updating habit data. */
export function validateUpdateArgs(args: UpdateHabitDataArgs): void {
    if (!args.table || !args.habitKey || !args.date || typeof args.newValue !== 'number' || args.newValue < 0) {
        throw new Error(`Invalid or missing arguments for update: table='${args.table}', habitKey='${args.habitKey}', date='${args.date}', newValue='${args.newValue}'`);
    }
}