import { BooleanSwitchDataArgs, UpsertBooleanSwitchArgs } from "../../BooleanSwitch/BooleanSwitch.types";

const IDENTIFIER_REGEX = /^[a-zA-Z0-9_]+$/;

/** Validates base arguments required for identifying boolean switch data and columns. */
export function validateBaseBooleanArgs(args: BooleanSwitchDataArgs): void {
    if (!args.table || !args.habitKey || !args.date) {
        throw new Error(`Missing required identifying arguments: table='${args.table}', key='${args.habitKey}', date='${args.date}'`);
    }
    if (!args.habitIdCol || !IDENTIFIER_REGEX.test(args.habitIdCol)) {
        throw new Error(`Invalid or missing key ID column name: '${args.habitIdCol}'`);
    }
    if (!args.valueCol || !IDENTIFIER_REGEX.test(args.valueCol)) {
        throw new Error(`Invalid or missing value column name: '${args.valueCol}'`);
    }
    if (!args.dateCol || !IDENTIFIER_REGEX.test(args.dateCol)) {
        throw new Error(`Invalid or missing date column name: '${args.dateCol}'`);
    }
}

/** Validates arguments required for upserting boolean switch data. */
export function validateUpsertBooleanArgs(args: UpsertBooleanSwitchArgs): void {
    validateBaseBooleanArgs(args); // Includes conditional uuidCol validation
    if (args.newValue !== 0 && args.newValue !== 1) { //^ Check for 0 or 1
        throw new Error(`Invalid newValue for boolean upsert: '${args.newValue}' (must be 0 or 1)`);
    }
}