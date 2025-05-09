import { HabitDataArgs, UpdateHabitDataArgs } from "src/webcomponents/HabitCounter/HabitCounter.types";

const IDENTIFIER_REGEX = /^[a-zA-Z0-9_]+$/; //? Basic check for valid SQL identifiers

/** Validates arguments required for fetching habit data. */
export function validateFetchArgs(args: HabitDataArgs): void {
    if (!args.table || !args.habitKey || !args.date) {
        throw new Error(`Missing required identifying arguments: table='${args.table}', habitKey='${args.habitKey}', date='${args.date}'`);
    }
    //^ Validate column names
    if (!args.habitIdCol || !IDENTIFIER_REGEX.test(args.habitIdCol)) {
        throw new Error(`Invalid or missing habit ID column name: '${args.habitIdCol}'`);
    }
    if (!args.valueCol || !IDENTIFIER_REGEX.test(args.valueCol)) {
        throw new Error(`Invalid or missing value column name: '${args.valueCol}'`);
    }
    if (!args.dateCol || !IDENTIFIER_REGEX.test(args.dateCol)) {
        throw new Error(`Invalid or missing date column name: '${args.dateCol}'`);
    }
}

/** Validates arguments required for updating habit data. */
export function validateUpdateArgs(args: UpdateHabitDataArgs): void {
    validateFetchArgs(args); //? First validate base identifying args and columns
    if (typeof args.newValue !== 'number' || args.newValue < 0) {
        throw new Error(`Invalid newValue for update: '${args.newValue}' (must be a non-negative number)`);
    }
}